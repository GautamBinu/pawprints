import LoginPage from "./LoginPage";
import { loginAction } from "./login";
import { ALLOWED_EMAIL_DESCRIPTION } from "@/lib/email-domain";

interface PageProps {
  searchParams: Promise<{ reason?: string }>;
}

/**
 * The middleware sends a torn-down session here with `?reason=rit-only`.
 * Resolved on the server so the client component gets a plain string and
 * never needs useSearchParams (which would want its own Suspense boundary).
 */
const REASONS: Record<string, string> = {
  "rit-only": `That account is not an ${ALLOWED_EMAIL_DESCRIPTION} address, so it was signed out. PawPrints is only open to the RIT community.`,
};

export default async function Page({ searchParams }: PageProps) {
  const { reason } = await searchParams;
  return (
    <LoginPage
      loginAction={loginAction}
      initialError={reason ? (REASONS[reason] ?? null) : null}
    />
  );
}
