import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LogoutPageProps {
  logoutAction: () => void;
}

export default function LogoutPage({ logoutAction }: LogoutPageProps) {
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
            <form action={logoutAction}>
              <Button type="submit" variant="destructive" className="w-full">
                Click here to sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
