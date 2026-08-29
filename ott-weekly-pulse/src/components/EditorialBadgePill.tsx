import { BADGE_LABELS, type EditorialBadge } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Flame, Sparkles, Gem, Award, Users, Popcorn } from "lucide-react";

const BADGE_STYLES: Record<EditorialBadge, string> = {
  CRITIC_PICK: "bg-gradient-to-r from-amber-400 to-orange-500 text-black",
  TRENDING: "bg-gradient-to-r from-rose-500 to-pink-500 text-white",
  BINGE_WORTHY: "bg-gradient-to-r from-violet-500 to-indigo-500 text-white",
  HIDDEN_GEM: "bg-gradient-to-r from-emerald-400 to-teal-500 text-black",
  FAMILY_WATCH: "bg-gradient-to-r from-sky-400 to-blue-500 text-white",
  EDITORS_CHOICE: "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white"
};

const BADGE_ICONS: Record<EditorialBadge, React.ElementType> = {
  CRITIC_PICK: Award,
  TRENDING: Flame,
  BINGE_WORTHY: Popcorn,
  HIDDEN_GEM: Gem,
  FAMILY_WATCH: Users,
  EDITORS_CHOICE: Sparkles
};

export function EditorialBadgePill({ badge, className }: { badge: EditorialBadge; className?: string }) {
  const Icon = BADGE_ICONS[badge];
  return (
    <span className={cn("badge-pill", BADGE_STYLES[badge], className)}>
      <Icon className="h-3 w-3" /> {BADGE_LABELS[badge]}
    </span>
  );
}
