import LogoutPage from "../logout/LogoutPage";
import { logoutAction } from "../logout/logout";

export default function Page() {
  return (
    <LogoutPage
      logoutAction={logoutAction}
      title="Session expired"
      description="Your session has expired. Please sign out and log in again to continue."
      buttonLabel="Sign out and log in again"
    />
  );
}