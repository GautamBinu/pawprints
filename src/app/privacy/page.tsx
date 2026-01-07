import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  const lastUpdated = "January 7, 2026";

  return (
    <div className="min-h-screen text-foreground bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-primary font-bold text-4xl mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last Updated: {lastUpdated}
        </p>

        <div className="space-y-8 text-lg leading-relaxed">
          <section>
            <p>
              Hello! We want to be upfront about how PawPrints works. We are
              students building tools for students, and we treat your data the
              way we would want our own data treated—with respect and
              minimalism.
            </p>
            <p className="mt-4">
              We don't sell your data. We don't track you across the web. We
              just want to make sure your voice is heard on campus.
            </p>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">
              What We Collect
            </h2>
            <p className="mb-4">
              To keep PawPrints running fairly and securely, we store the
              following information:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Identity:</strong> Your
                Name, Email, and Google Account ID. We use{" "}
                <strong>Google Login</strong> to verify your identity as part of
                the RIT community.
              </li>
              <li>
                <strong className="text-foreground">Your Voice:</strong>{" "}
                Petitions you create, sign, or subscribe to.
              </li>
              <li>
                <strong className="text-foreground">Preferences:</strong> Your
                notification settings (e.g., whether you want emails or in-app
                alerts when a petition is updated).
              </li>
              <li>
                <strong className="text-foreground">Timestamps:</strong> When
                you joined, when you signed a petition, or when you posted an
                update. This helps us ensure signatures are gathered within the
                valid one-year timeframe.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">
              How Your Data is Used
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Publicly Visible</h3>
                <p className="text-muted-foreground">
                  When you <strong>create</strong> a petition, your name and the
                  petition content are public. This accountability is key to the
                  process.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Kept Private</h3>
                <p className="text-muted-foreground">
                  When you <strong>sign</strong> a petition, we count your vote,
                  but we do not display a public list of signers to other users.
                  Your individual vote is stored securely to prevent duplicates.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">
              Cookies & Analytics
            </h2>
            <p className="mb-4">
              We use secure, HTTP-only cookies to maintain your session after
              you log in with Google.
            </p>
            <p className="mb-4">
              For analytics, we use <strong>Umami</strong>. It is a
              privacy-focused, open-source alternative to tools like Google
              Analytics. We use this data solely to understand site usage trends
              (like which petitions are popular) so we can improve the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">
              Data Removal
            </h2>
            <p>
              If you wish to have your account and data completely removed from
              PawPrints, please contact the Student Government directly. Note
              that removing your account will also remove your signatures from
              active petitions, which may affect their total count.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="text-sm text-muted-foreground">
            <p>
              PawPrints is an open-source project maintained by the RIT Dubai
              Student Government. You can inspect exactly how we handle data by
              viewing our source code on{" "}
              <a
                href="https://github.com/ritstudentgovernment/PawPrints"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
