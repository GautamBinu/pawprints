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
  title?: string;
  description?: string;
  buttonLabel?: string;
}

export default function LogoutPage({
  logoutAction,
  title = "Sign out",
  description = "Are you sure you want to log out?",
  buttonLabel = "Click here to sign out",
}: LogoutPageProps) {
  return (
    <div className="touch-manipulation">
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-4 flex flex-col items-center text-center pb-2">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-[#F76902]">
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={logoutAction} className="w-full">
              <Button
                type="submit"
                variant="destructive"
                className="w-full touch-manipulation active:scale-[0.98]"
              >
                {buttonLabel}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
