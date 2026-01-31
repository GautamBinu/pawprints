import { redirect } from "next/navigation";

// This route exists to support /profile/settings by redirecting users
// to the main profile page with the settings tab selected.
export default function ProfileSettingsRedirect() {
  // Server-side redirect to /profile with the 'settings' tab active
  redirect("/profile?tab=settings");

  // This return is not reached, but included to satisfy function signature.
  return null;
}
