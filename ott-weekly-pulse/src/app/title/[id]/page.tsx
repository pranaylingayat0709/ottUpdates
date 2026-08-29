import { getTitleById } from "@/lib/data-source";
import { TitleDetailContent } from "@/components/TitleDetailContent";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const title = getTitleById(params.id);
  if (!title) return { title: "Title not found — OTT Weekly Pulse" };
  return {
    title: `${title.title} — OTT Weekly Pulse`,
    description: title.synopsis
  };
}

export default function TitlePage({ params }: { params: { id: string } }) {
  const title = getTitleById(params.id);
  if (!title) return notFound();

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
      <Link href="/" className="mx-5 mb-2 mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:mx-8">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Weekly Pulse
      </Link>
      <div className="glass-card mx-4 overflow-hidden sm:mx-6 lg:mx-8">
        <TitleDetailContent title={title} />
      </div>
    </div>
  );
}
