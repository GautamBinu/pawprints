"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { getFirebaseAuth } from "@/app/auth/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface LoginPageProps {
  loginAction: (idToken: string) => Promise<void>;
}

export default function LoginPage({ loginAction }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  async function handleEmailLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const idToken = await user.getIdToken();
      await loginAction(idToken);
    } catch (error: any) {
      if (error?.message === "NEXT_REDIRECT") {
        return;
      }
      console.error("Login error:", error);
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();

      // Configure Google Auth provider
      provider.setCustomParameters({
        prompt: "select_account",
      });

      // Note: its either this or signInWithRedirect
      // signInWithPopup has issues with some browsers, especially on mobile
      // But signInWithRedirect requires additional handling after redirect
      // Especially on storage partitioned browsers
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user?.getIdToken();
      await loginAction(idToken!);
    } catch (error: any) {
      console.log(error.message);
      console.log(typeof error);

      if (error?.message === "NEXT_REDIRECT") {
        // Ignore, this is expected for Next.js redirects
        return;
      } else {
        console.error("Login error:", error);
        setError(error.message || "An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-4 flex flex-col items-center text-center pb-2">
          <div className="hidden relative w-24 h-16">
            <Image
              src="/RIT-00070A_RGB_TM.svg"
              alt="RIT Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-[#F76902]">
              PawPrints
            </CardTitle>
            <CardDescription>Your voice matters at RIT Dubai</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showEmailLogin ? (
            <div className="space-y-4">
              <div className="space-y-4">
                <Label className="text-left w-full text-xs text-muted-foreground">
                  Sign in with your RIT Google account to continue, <br />
                  or sign in with your provided email (for faculty)
                </Label>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium relative"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Login with Google
                </Button>
              </div>
              <div>
                <Label className="text-center w-full text-xs text-muted-foreground"></Label>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium relative"
                  onClick={() => setShowEmailLogin(true)}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Login with Email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="flex mb-2">
                <Button
                  variant="link"
                  className="!p-0 mb-4 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() => setShowEmailLogin(false)}
                >
                  <ArrowLeft />
                  Back to sign in options
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          )}

          <div className="text-sm text-semibold text-muted-foreground text-center space-y-4 pt-4">
            <p>
              By signing in, you agree to use PawPrints responsibly. You also
              agree to the{" "}
              <a
                href="https://www.rit.edu/academicaffairs/policiesmanual/c082"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                RIT Code of Conduct for Computer and Network Use
              </a>
              .
            </p>

            <Separator className="my-4 mt-12" />

            <p className="text-xs text-gray-400">
              This site is protected by reCAPTCHA and the Google{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Terms of Service
              </a>{" "}
              apply.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
