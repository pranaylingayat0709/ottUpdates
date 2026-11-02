import { getTitleById } from "@/lib/data-source";
import { TitleDetailContent } from "@/components/TitleDetailContent";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const title = await getTitleById(params.id);
  if (!title) return { title: "Title not found — OTT Weekly Pulse" };
  return {
    title: `${title.title} — OTT Weekly Pulse`,
    description: title.synopsis
  };
}

export default async function TitlePage({ params }: { params: { id: string } }) {
  const title = await getTitleById(params.id);
  if (!title) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": title.type === "MOVIE" ? "Movie" : "TVSeries",
    name: title.title,
    description: title.synopsis,
    datePublished: title.releaseDate.slice(0, 10),
    inLanguage: title.originalLanguage.toLowerCase(),
    genre: title.genres,
    ...(title.posterUrl ? { image: title.posterUrl } : {}),
    ...(title.director ? { director: { "@type": "Person", name: title.director } } : {}),
    ...(title.cast.length ? { actor: title.cast.slice(0, 6).map((n) => ({ "@type": "Person", name: n })) } : {}),
    ...(title.contentRating ? { contentRating: title.contentRating } : {})
  };

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="mx-5 mb-2 mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:mx-8">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Weekly Pulse
      </Link>
      <div className="glass-card mx-4 overflow-hidden sm:mx-6 lg:mx-8">
        <TitleDetailContent title={title} />
      </div>
    </div>
  );
}
