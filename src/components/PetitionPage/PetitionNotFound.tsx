import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PetitionNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-muted/30 p-6 rounded-full mb-6">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Petition Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The petition you are looking for does not exist, has been removed, or you
        do not have permission to view it.
      </p>
      <Link href="/explore">
        <Button size="lg">Explore Petitions</Button>
      </Link>
    </div>
  );
}
