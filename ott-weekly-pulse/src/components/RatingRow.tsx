import { Star, Award, Users } from "lucide-react";
import type { Title } from "@/lib/types";

function RatingChip({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <div className="glass-panel flex flex-1 flex-col items-center gap-1 py-3">
      <Icon className={`h-4 w-4 ${tone}`} />
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

export function RatingRow({ title }: { title: Title }) {
  return (
    <div className="flex gap-2">
      {title.imdbRating != null && (
        <RatingChip icon={Star} label="IMDb" value={`${title.imdbRating}/10`} tone="text-yellow-400 fill-yellow-400" />
      )}
      {title.rottenTomatoesScore != null && (
        <RatingChip icon={Award} label="Rotten Tomatoes" value={`${title.rottenTomatoesScore}%`} tone="text-red-400" />
      )}
      <RatingChip
        icon={Users}
        label="Community"
        value={title.communityVotes > 0 ? `${title.communityScore.toFixed(1)}/10` : "New"}
        tone="text-emerald-400"
      />
    </div>
  );
}
