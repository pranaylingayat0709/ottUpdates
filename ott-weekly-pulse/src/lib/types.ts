export type TitleType = "MOVIE" | "SERIES" | "DOCUMENTARY";
export type OriginalLanguage = "ENGLISH" | "HINDI" | "MARATHI" | "OTHER";
export type Platform =
  | "NETFLIX"
  | "PRIME_VIDEO"
  | "DISNEY_HOTSTAR"
  | "JIOCINEMA"
  | "SONYLIV"
  | "ZEE5"
  | "APPLE_TV"
  | "MUBI"
  | "AHA"
  | "SUNNXT";
export type Genre =
  | "THRILLER" | "COMEDY" | "DRAMA" | "ACTION" | "SCI_FI" | "ROMANCE"
  | "HORROR" | "CRIME" | "MYSTERY" | "FAMILY" | "BIOPIC" | "FANTASY"
  | "SPORTS" | "MUSICAL";
export type EditorialBadge =
  | "CRITIC_PICK" | "TRENDING" | "BINGE_WORTHY" | "HIDDEN_GEM"
  | "FAMILY_WATCH" | "EDITORS_CHOICE";

export interface WeekMeta {
  id: string;
  weekStartDate: string; // ISO
  weekEndDate: string; // ISO
  label: string;
  isCurrent: boolean;
}

export interface Title {
  id: string;
  title: string;
  type: TitleType;
  releaseDate: string;
  weekStartDate: string;
  weekEndDate: string;
  weekId: string;

  originalLanguage: OriginalLanguage;
  availableAudioLanguages: string[];
  subtitleLanguages: string[];
  isHindiDubbed: boolean;

  platforms: Platform[];
  platformDeepLinks: Record<string, string>;

  genres: Genre[];
  runtimeMinutes?: number | null;
  totalEpisodes?: number | null;
  seasonNumber?: number | null;

  posterUrl: string;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  synopsis: string;

  director?: string | null;
  cast: string[];

  imdbRating?: number | null;
  rottenTomatoesScore?: number | null;
  internalCriticRating?: number | null;
  communityScore: number;
  communityVotes: number;

  editorialBadges: EditorialBadge[];
  aiVerdictWatch?: string | null;
  aiVerdictSkip?: string | null;

  isMustWatch: boolean;
  heroRank?: number | null;
}

export interface Review {
  id: string;
  titleId: string;
  userName: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface TitleFilters {
  type?: TitleType | "ALL";
  language?: OriginalLanguage | "HINDI_DUBBED" | "ALL";
  platform?: Platform | "ALL";
  genre?: Genre | "ALL";
  minRating?: number;
  search?: string;
  weekId?: string;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  NETFLIX: "Netflix",
  PRIME_VIDEO: "Prime Video",
  DISNEY_HOTSTAR: "Disney+ Hotstar",
  JIOCINEMA: "JioCinema",
  SONYLIV: "SonyLIV",
  ZEE5: "ZEE5",
  APPLE_TV: "Apple TV+",
  MUBI: "MUBI",
  AHA: "aha",
  SUNNXT: "SunNXT"
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  NETFLIX: "#E50914",
  PRIME_VIDEO: "#00A8E1",
  DISNEY_HOTSTAR: "#1F80E0",
  JIOCINEMA: "#8C1AF6",
  SONYLIV: "#00A1E0",
  ZEE5: "#8353E2",
  APPLE_TV: "#A0A0A0",
  MUBI: "#FF3B30",
  AHA: "#EE2E5D",
  SUNNXT: "#F5A623"
};

export const GENRE_LABELS: Record<Genre, string> = {
  THRILLER: "Thriller", COMEDY: "Comedy", DRAMA: "Drama", ACTION: "Action",
  SCI_FI: "Sci-Fi", ROMANCE: "Romance", HORROR: "Horror", CRIME: "Crime",
  MYSTERY: "Mystery", FAMILY: "Family", BIOPIC: "Biopic", FANTASY: "Fantasy",
  SPORTS: "Sports", MUSICAL: "Musical"
};

export const BADGE_LABELS: Record<EditorialBadge, string> = {
  CRITIC_PICK: "Critic Pick",
  TRENDING: "Trending",
  BINGE_WORTHY: "Binge-Worthy",
  HIDDEN_GEM: "Hidden Gem",
  FAMILY_WATCH: "Family Watch",
  EDITORS_CHOICE: "Editor's Choice"
};
