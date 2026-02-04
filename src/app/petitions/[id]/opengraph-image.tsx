import { ImageResponse } from "next/og";

import { prisma } from "@/lib/prisma";
import { PetitionStatus } from "@/types/petition";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const petitionId = parseInt(params.id);

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const domain = process.env.VERCEL_URL || "localhost:3000";
  const baseUrl = `${protocol}://${domain}`;

  // Load Geist fonts from public/fonts directory for reliable production deployment
  const geistSansBold = await fetch(`${baseUrl}/fonts/Geist-Bold.ttf`).then(
    (res) => res.arrayBuffer(),
  );
  const geistSansBlack = await fetch(`${baseUrl}/fonts/Geist-Black.ttf`).then(
    (res) => res.arrayBuffer(),
  );
  const geistMonoSemiBold = await fetch(
    `${baseUrl}/fonts/GeistMono-SemiBold.ttf`,
  ).then((res) => res.arrayBuffer());

  if (isNaN(petitionId)) {
    return new ImageResponse(
      <div
        style={{
          fontSize: 48,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F76902",
          fontFamily: "Geist Sans",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        PAWPRINTS
      </div>,
      {
        ...size,
        fonts: [
          {
            name: "Geist Sans",
            data: geistSansBlack,
            style: "normal",
            weight: 900,
          },
        ],
      },
    );
  }

  const petition = await prisma.petition.findUnique({
    where: { id: petitionId, status: PetitionStatus.Published },
    include: {
      tags: true,
      author: true,
    },
  });

  // Only generate image for published petitions to protect privacy
  if (!petition || petition.status !== PetitionStatus.Published) {
    return new ImageResponse(
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Geist Mono",
          border: "8px solid #F76902",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 900,
            color: "#F76902",
            marginBottom: 24,
            letterSpacing: "-0.03em",
            fontFamily: "Geist Sans",
          }}
        >
          PAWPRINTS
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#666",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Make your voice heard
        </div>
      </div>,
      {
        ...size,
        fonts: [
          {
            name: "Geist Sans",
            data: geistSansBlack,
            style: "normal",
            weight: 900,
          },
          {
            name: "Geist Mono",
            data: geistMonoSemiBold,
            style: "normal",
            weight: 600,
          },
        ],
      },
    );
  }

  const progress = Math.min(
    (petition.signatures / (petition.targetSignatures || 150)) * 100,
    100,
  );

  const isComplete = petition.signatures >= (petition.targetSignatures || 150);

  return new ImageResponse(
    <div
      style={{
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Geist Sans",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          borderTop: "12px solid #000",
          borderLeft: "12px solid #000",
          borderRight: "12px solid #000",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "24px",
            background: "#F76902",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "48px 60px",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#F76902",
                  letterSpacing: "-0.02em",
                  fontFamily: "Geist Sans",
                }}
              >
                PAWPRINTS
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 900,
                color: "#000",
                lineHeight: 1.1,
                marginBottom: 0,
                letterSpacing: "-0.02em",
                fontFamily: "Geist Sans",
              }}
            >
              {petition.title.length > 135
                ? petition.title.slice(0, 135) + "..."
                : petition.title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "3px",
                background: "#000",
                marginBottom: 32,
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 16,
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                    fontFamily: "Geist Mono",
                  }}
                >
                  STARTED BY
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 24,
                    color: "#000",
                    fontWeight: 700,
                    fontFamily: "Geist Sans",
                  }}
                >
                  {petition.author.name || "Anonymous"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 64,
                    fontWeight: 900,
                    color: isComplete ? "#16a34a" : "#F76902",
                    lineHeight: 1,
                    fontFamily: "Geist Mono",
                    letterSpacing: "-0.05em",
                  }}
                >
                  {petition.signatures}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    color: "#666",
                    marginTop: 4,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily: "Geist Mono",
                  }}
                >
                  / {petition.targetSignatures || 150} SIGNATURES
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          height: "32px",
          background: "#e5e5e5",
          borderLeft: "12px solid #000",
          borderRight: "12px solid #000",
          borderBottom: "12px solid #000",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: `${progress}%`,
            height: "100%",
            background: isComplete ? "#16a34a" : "#F76902",
          }}
        />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Geist Sans",
          data: geistSansBlack,
          style: "normal",
          weight: 900,
        },
        {
          name: "Geist Sans",
          data: geistSansBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "Geist Mono",
          data: geistMonoSemiBold,
          style: "normal",
          weight: 600,
        },
      ],
    },
  );
}
