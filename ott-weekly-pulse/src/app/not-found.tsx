import Link from "next/link";
import { Clapperboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Clapperboard className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Title not found</h1>
      <p className="text-sm text-muted-foreground">It may have rotated out of this week's lineup.</p>
      <Link href="/" className="chip chip-active">Back to Weekly Pulse</Link>
    </div>
  );
}
