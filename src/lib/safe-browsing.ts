import { prisma } from "@/lib/prisma";

const SAFE_BROWSING_API_URL =
  "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

interface ThreatMatch {
  threatType: string;
  platformType: string;
  threat: {
    url: string;
  };
  cacheDuration: string;
  threatEntryType: string;
}

interface SafeBrowsingResponse {
  matches?: ThreatMatch[];
}

export function extractUrls(text: string): string[] {
  // I hope this works, I had to ask Gemini for this regexp
  const urlRegex = /(https?:\/\/[^\s"<>\']+)/g;
  const matches = text.match(urlRegex);
  return matches
    ? matches.map((url) => url.replace(/[.,!?;:"')\]}<>]+$/, ""))
    : [];
}

export async function containsMaliciousLinks(
  urls: string[],
): Promise<{ isSafe: boolean; maliciousUrls: string[] }> {
  const uniqueUrls = Array.from(new Set(urls));

  if (uniqueUrls.length === 0) {
    return { isSafe: true, maliciousUrls: [] };
  }

  const CACHE_DURATION_HOURS = 24;
  const cacheCutoff = new Date(
    Date.now() - CACHE_DURATION_HOURS * 60 * 60 * 1000,
  );

  // Idk what this monstrosity is but it works, thanks Copilot
  let cachedResults: typeof prisma.linkSafetyCache.findMany extends (
    ...args: any
  ) => Promise<infer R>
    ? R
    : never;
  try {
    cachedResults = await prisma.linkSafetyCache.findMany({
      where: {
        url: { in: uniqueUrls },
        checkedAt: { gt: cacheCutoff },
      },
    });
  } catch (e) {
    console.warn("Failed to check link safety cache, proceeding with API", e);
    cachedResults = [];
  }

  const urlsToRecheck: string[] = [];
  const knownMaliciousUrls: string[] = [];

  for (const url of uniqueUrls) {
    const cached = cachedResults.find((c) => c.url === url);
    if (cached) {
      if (!cached.isSafe) {
        knownMaliciousUrls.push(url);
      }
    } else {
      urlsToRecheck.push(url);
    }
  }

  if (urlsToRecheck.length === 0) {
    if (knownMaliciousUrls.length > 0) {
      return {
        isSafe: false,
        maliciousUrls: Array.from(new Set(knownMaliciousUrls)),
      };
    }
    return { isSafe: true, maliciousUrls: [] };
  }

  if (!apiKey) {
    console.warn(
      "GOOGLE_SAFE_BROWSING_API_KEY is not set. Skipping link check.",
    );
    return {
      isSafe: knownMaliciousUrls.length === 0,
      maliciousUrls: knownMaliciousUrls,
    };
  }

  // Can you believe this API is free?
  try {
    const requestBody = {
      client: {
        clientId: "pawprints",
        clientVersion: "1.0.0",
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: urlsToRecheck.map((url) => ({ url })),
      },
    };

    const response = await fetch(`${SAFE_BROWSING_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(
        "Safe Browsing API error:",
        response.status,
        await response.text(),
      );
      return {
        isSafe: knownMaliciousUrls.length === 0,
        maliciousUrls: knownMaliciousUrls,
      };
    }

    const data: SafeBrowsingResponse = await response.json();

    const apiMaliciousUrls = new Set<string>();
    const threatMap = new Map<string, string>();

    if (data.matches && data.matches.length > 0) {
      data.matches.forEach((match) => {
        apiMaliciousUrls.add(match.threat.url);
        threatMap.set(match.threat.url, match.threatType);
      });
    }

    const cacheUpdates = urlsToRecheck.map((url) => {
      const isMalicious = apiMaliciousUrls.has(url);
      return prisma.linkSafetyCache.upsert({
        where: { url },
        update: {
          isSafe: !isMalicious,
          checkedAt: new Date(),
          threatType: isMalicious ? threatMap.get(url) : null,
        },
        create: {
          url,
          isSafe: !isMalicious,
          checkedAt: new Date(),
          threatType: isMalicious ? threatMap.get(url) : null,
        },
      });
    });

    await Promise.allSettled(cacheUpdates);

    const allMaliciousUrls = [
      ...knownMaliciousUrls,
      ...Array.from(apiMaliciousUrls),
    ];

    if (allMaliciousUrls.length > 0) {
      return {
        isSafe: false,
        maliciousUrls: Array.from(new Set(allMaliciousUrls)),
      };
    }

    return { isSafe: true, maliciousUrls: [] };
  } catch (error) {
    console.error("Error checking Safe Browsing API:", error);
    return {
      isSafe: knownMaliciousUrls.length === 0,
      maliciousUrls: knownMaliciousUrls,
    };
  }
}
