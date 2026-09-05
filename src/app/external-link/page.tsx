"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { verifyExternalLink } from "@/app/actions";

function ExternalLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUrl = searchParams.get("url");
  const [countdown, setCountdown] = useState(5);
  const [isChecking, setIsChecking] = useState(true);
  const [isDangerous, setIsDangerous] = useState(false);

  const isInstagramIOSWebView = () => {
    const userAgent = navigator.userAgent || "";
    return /Instagram/i.test(userAgent) && /iPhone|iPad|iPod/i.test(userAgent);
  };

  const isValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    if (!targetUrl || !isValidUrl(targetUrl)) return;

    if (isInstagramIOSWebView()) {
      const instagramUrl = `instagram://extbrowser/?url=${encodeURIComponent(targetUrl)}`;
      window.location.href = instagramUrl;

      const fallbackTimer = window.setTimeout(() => {
        window.location.href = targetUrl;
      }, 1500);

      return () => window.clearTimeout(fallbackTimer);
    }
  }, [targetUrl]);

  useEffect(() => {
    if (!targetUrl || !isValidUrl(targetUrl)) {
      setIsChecking(false);
      return;
    }

    verifyExternalLink(targetUrl).then((safe) => {
      if (!safe) setIsDangerous(true);
      setIsChecking(false);
    });
  }, [targetUrl]);

  useEffect(() => {
    if (!targetUrl || !isValidUrl(targetUrl) || isChecking || isDangerous)
      return;

    // Can't believe Ali Assi was right about never knowing when you'll have to implement a timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = targetUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetUrl, isChecking, isDangerous]);

  if (!targetUrl || !isValidUrl(targetUrl)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23f76902' fill-opacity='0.15'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <Card className="w-full max-w-sm shadow-lg relative z-10">
          <CardHeader>
            <h2 className="text-4xl font-bold">
              That's not really a valid link.
            </h2>
          </CardHeader>
          <CardContent className="mt-6 mb-6">
            <p className="text-center italic">
              Wherever you go, go with all your heart
            </p>
            <p className="text-center">— Confucius</p>
          </CardContent>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to PawPrints
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hostname = new URL(targetUrl).hostname;

  if (isChecking) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 relative">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isDangerous) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.15'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <Card className="w-full max-w-sm shadow-lg relative z-10 border-destructive/50">
          <CardHeader className="flex flex-col items-center text-center pb-2">
            <CardTitle className="text-destructive text-left text-4xl font-bold">
              That link does not look safe.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base font-semibold">
              <br />
              You are attempting to leave PawPrints, but the link you clicked
              has been flagged as potentially harmful. It may lead to a website
              that could try to steal your information, install malware, or
              engage in other malicious activities.
              <br />
              <br />
            </p>
            <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-center break-all">
              <code className="text-sm font-mono text-destructive">
                {targetUrl}
              </code>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go back to safety
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => (window.location.href = targetUrl)}
              >
                Proceed anyway (Unsafe)
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs mb-2 font-medium">
              Advisory provided by{" "}
              <a href="https://developers.google.com/safe-browsing/v4/advisory">
                Google Safe Browsing
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23f76902' fill-opacity='0.15'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <Card className="w-full max-w-sm shadow-lg relative z-10">
        <CardHeader>
          <h2 className="text-5xl font-bold">You're leaving PawPrints.</h2>
        </CardHeader>
        <CardContent>
          <p className="text-xl text-muted-foreground mt-2 mb-6 text-center">
            <br />
            The link you clicked will take you to
            <br />
            <span className="text-xl font-medium text-foreground font-mono">
              <a href={targetUrl}>{hostname}</a>
            </span>
            <br />
          </p>
          <p className="text-xs text-muted-foreground mt-2 mb-6 text-center">
            We just wanted to make sure you know that PawPrints isn't
            responsible for the content on external sites.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full bg-[#F76902] hover:bg-[#F76902]/90 text-white font-medium relative"
              size="lg"
              onClick={() => (window.location.href = targetUrl)}
            >
              {countdown > 0 ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Auto-redirecting in {countdown}s
                </span>
              ) : (
                `Continue to ${hostname}`
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Stay on PawPrints
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExternalLinkPage() {
  return (
    <Suspense>
      <ExternalLinkContent />
    </Suspense>
  );
}
