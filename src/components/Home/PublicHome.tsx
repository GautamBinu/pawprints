import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Hero Section with Background Image */}
      <section className="relative w-full py-32 px-6 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/ritdubai.jpg"
            alt="RIT Dubai Campus"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl tracking-tight">
            PawPrints
          </h1>
          <p className="text-xl md:text-2xl text-white max-w-3xl mb-10 drop-shadow-lg font-medium">
            The official petition platform for the RIT Dubai community.
            <br /> Make your voice heard and drive positive change.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold shadow-xl"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl w-full px-6 py-16 space-y-16">
        <div>
          <h2 className="text-3xl font-bold mb-6">About PawPrints</h2>
          <div className="text-lg space-y-4">
            <p>
              Inspired by RIT&apos;s original PawPrints, the RIT Dubai Student
              Government created this platform to improve engagement and create
              a space for the community to converse on important issues.
            </p>
            <p>
              To remain transparent, this site is an{" "}
              <a
                href="https://github.com/ritdubaisg/pawprints"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                open-source project on GitHub
              </a>
              .
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">1. Have an idea</h3>
              <p className="text-muted-foreground">
                Search for existing petitions to support, or start your own if
                your issue hasn&apos;t been raised yet. Reaching the signature
                threshold brings your issue to Student Government.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">2. Write your petition</h3>
              <p className="text-muted-foreground">
                Be clear, concise, and respectful. Explain the problem and your
                proposed solution. A well-written petition attracts more
                support.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">3. Share & Gather Support</h3>
              <p className="text-muted-foreground">
                Share your petition with the community. Once it reaches the
                signature threshold, you will receive an official response.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">
            Ready to make a difference?
          </h3>
          <p className="text-muted-foreground mb-8">
            Log in with your RIT account to start signing and creating
            petitions.
          </p>
          <Link href="/login">
            <Button size="lg">Login with RIT</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
