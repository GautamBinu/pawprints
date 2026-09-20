"use client";

import { Button } from "@/components/ui/button";
import { clientLogout } from "./client-logout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LogoutPage() {
  return (
    <div>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-4 flex flex-col items-center text-center pb-2">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-[#F76902]">
                Sign out
              </CardTitle>
              <CardDescription>
                Are you sure you want to log out?
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => clientLogout()}
            >
              Click here to sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
