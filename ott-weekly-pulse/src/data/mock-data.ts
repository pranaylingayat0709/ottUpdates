// Real, verified OTT release catalog for the current Friday->Thursday
// release week (28 Aug - 3 Sep 2026), compiled from published streaming
// release-calendar coverage across Indian OTT trade press. Titles, cast,
// directors, and platforms are real; synopses below are original summaries
// written from scratch (not copied from any source) and any rating shown
// is this app's own editorial score, not a scraped IMDb/RT figure — swap
// in a live TMDB/JustWatch feed for production to keep this current
// automatically (see README's "Automated data-fetching strategy" section).
//
// Sourced from weekly release-calendar coverage (BingeBaaz, IWMBuzz,
// OTTweek, Wikipedia) as of 29 Aug 2026. Re-run this file's contents
// through the same research process each week to keep it current, or
// wire src/lib/data-source.ts to a live TMDB/JustWatch feed.

export type MockGenre =
  | "THRILLER" | "COMEDY" | "DRAMA" | "ACTION" | "SCI_FI" | "ROMANCE"
  | "HORROR" | "CRIME" | "MYSTERY" | "FAMILY" | "BIOPIC" | "FANTASY"
  | "SPORTS" | "MUSICAL";

export interface MockTitleSeed {
  title: string;
  type: "MOVIE" | "SERIES" | "DOCUMENTARY";
  dayOffset: number; // 0 = Friday ... 6 = Thursday
  originalLanguage: "ENGLISH" | "HINDI" | "MARATHI" | "OTHER";
  availableAudioLanguages: string[];
  subtitleLanguages: string[];
  isHindiDubbed: boolean;
  platforms: ("NETFLIX" | "PRIME_VIDEO" | "DISNEY_HOTSTAR" | "JIOHOTSTAR" | "JIOCINEMA" | "SONYLIV" | "ZEE5" | "APPLE_TV" | "MUBI" | "AHA" | "SUNNXT")[];
  genres: MockGenre[];
  runtimeMinutes?: number;
  totalEpisodes?: number;
  seasonNumber?: number;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  synopsis: string;
  director?: string;
  cast: string[];
  imdbRating?: number;
  rottenTomatoesScore?: number;
  internalCriticRating?: number;
  communityScore?: number;
  communityVotes?: number;
  editorialBadges: ("CRITIC_PICK" | "TRENDING" | "BINGE_WORTHY" | "HIDDEN_GEM" | "FAMILY_WATCH" | "EDITORS_CHOICE")[];
  isMustWatch: boolean;
  heroRank?: number;
}

const poster = (seed: string, w = 500, h = 750) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
const backdrop = (seed: string) => `https://picsum.photos/seed/${seed}-bd/1280/720`;

// NOTE: posterUrl/backdropUrl below use placeholder art (this environment
// has no image-licensing pipeline). Point these at TMDB's image CDN
// (image.tmdb.org, already whitelisted in next.config.js) once wired to
// a real TMDB API key for production-accurate poster art.

export const MOCK_TITLES: MockTitleSeed[] = [
  // ---------- Friday 28 Aug — Bollywood ----------
  {
    title: "Bandar",
    type: "MOVIE",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["ZEE5"],
    genres: ["CRIME", "DRAMA"],
    runtimeMinutes: 128,
    posterUrl: poster("bandar-2026"),
    backdropUrl: backdrop("bandar-2026"),
    synopsis:
      "A fading former star is publicly accused of a crime he denies, and director Anurag Kashyap turns the ensuing legal limbo into a study of how media coverage and public judgment can outrun the truth long before a verdict arrives.",
    director: "Anurag Kashyap",
    cast: ["Bobby Deol"],
    internalCriticRating: 6.5,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["TRENDING", "CRITIC_PICK"],
    isMustWatch: true,
    heroRank: 1
  },
  {
    title: "Babita Singh Reporting",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["PRIME_VIDEO"],
    genres: ["CRIME", "MYSTERY", "DRAMA"],
    totalEpisodes: 6,
    seasonNumber: 1,
    posterUrl: poster("babita-singh-reporting"),
    backdropUrl: backdrop("babita-singh-reporting"),
    synopsis:
      "A conflict-averse police officer visiting her in-laws is pulled into a quiet, unofficial investigation after her childhood friend is murdered, forcing long-buried memories and unfinished relationships back into the open.",
    cast: ["Nimisha Sajayan", "Barun Sobti", "Anshumaan Pushkar"],
    internalCriticRating: 6.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["CRITIC_PICK"],
    isMustWatch: true,
    heroRank: 2
  },
  {
    title: "Chumbak",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["NETFLIX"],
    genres: ["COMEDY", "FAMILY"],
    totalEpisodes: 8,
    seasonNumber: 1,
    posterUrl: poster("chumbak-2026"),
    synopsis:
      "Everyday life across a cluster of neighbouring Mumbai households turns into shared community drama, with an ensemble cast (from the creative team behind Sarabhai vs Sarabhai and Khichdi) mining warmth and comedy from small domestic ups and downs.",
    cast: [],
    internalCriticRating: 6.2,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["FAMILY_WATCH"],
    isMustWatch: false
  },

  // ---------- Friday 28 Aug — Hollywood / International ----------
  {
    title: "Dark Matter",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English", "Hindi-Dubbed"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: true,
    platforms: ["APPLE_TV"],
    genres: ["SCI_FI", "THRILLER"],
    totalEpisodes: 8,
    seasonNumber: 2,
    posterUrl: poster("dark-matter-s2"),
    backdropUrl: backdrop("dark-matter-s2"),
    synopsis:
      "The fragile peace a family found across alternate versions of their own lives starts to crack as one of them is pulled back into the multiverse-hopping Box, and every version of \"home\" starts to look like a different kind of trap.",
    cast: ["Joel Edgerton", "Jennifer Connelly"],
    internalCriticRating: 8.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["CRITIC_PICK", "TRENDING"],
    isMustWatch: true,
    heroRank: 3
  },
  {
    title: "The Whisper Man",
    type: "MOVIE",
    dayOffset: 0,
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English", "Hindi-Dubbed"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: true,
    platforms: ["NETFLIX"],
    genres: ["THRILLER", "CRIME"],
    runtimeMinutes: 112,
    posterUrl: poster("whisper-man-2026"),
    backdropUrl: backdrop("whisper-man-2026"),
    synopsis:
      "A recently widowed writer and his estranged detective father are forced into an uneasy partnership when a boy's disappearance echoes a decades-old serial-killer case neither of them ever fully closed.",
    cast: ["Robert De Niro", "Adam Scott", "Michelle Monaghan"],
    internalCriticRating: 5.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["TRENDING"],
    isMustWatch: false
  },
  {
    title: "Adults",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["JIOHOTSTAR"],
    genres: ["COMEDY", "DRAMA"],
    totalEpisodes: 8,
    seasonNumber: 2,
    posterUrl: poster("adults-s2-2026"),
    synopsis:
      "Two months after an unexpected kiss upends a tight-knit group of friends, a new love triangle and pointed questions about fertility, growing up, and reclaiming lost time reshape the household all over again.",
    cast: [],
    internalCriticRating: 6.8,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["TRENDING"],
    isMustWatch: false
  },
  {
    title: "Mousetrap",
    type: "MOVIE",
    dayOffset: 0,
    originalLanguage: "OTHER",
    availableAudioLanguages: ["Korean", "English-Dubbed", "Hindi-Dubbed"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: true,
    platforms: ["NETFLIX"],
    genres: ["THRILLER", "MYSTERY"],
    runtimeMinutes: 104,
    posterUrl: poster("mousetrap-2026"),
    synopsis:
      "Inspired by a Korean folktale about a rat that assumes a man's identity, an isolated novelist wakes to find his life stolen by an impostor, and must strike an uneasy alliance with a loan shark and a detective to take it back.",
    cast: [],
    internalCriticRating: 6.3,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["HIDDEN_GEM"],
    isMustWatch: false
  },
  {
    title: "Graveyard",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "OTHER",
    availableAudioLanguages: ["Turkish", "English-Dubbed"],
    subtitleLanguages: ["English"],
    isHindiDubbed: false,
    platforms: ["NETFLIX"],
    genres: ["CRIME", "DRAMA"],
    totalEpisodes: 8,
    seasonNumber: 3,
    posterUrl: poster("graveyard-s3"),
    synopsis:
      "An Istanbul police unit built around crimes against women pushes deeper into organised crime in its third season, as mounting internal pressure makes every new case land harder on the investigators themselves.",
    cast: [],
    internalCriticRating: 6.6,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: [],
    isMustWatch: false
  },
  {
    title: "Barreda",
    type: "MOVIE",
    dayOffset: 0,
    originalLanguage: "OTHER",
    availableAudioLanguages: ["Spanish", "English-Dubbed"],
    subtitleLanguages: ["English"],
    isHindiDubbed: false,
    platforms: ["PRIME_VIDEO"],
    genres: ["CRIME", "DRAMA"],
    runtimeMinutes: 118,
    posterUrl: poster("barreda-2026"),
    synopsis:
      "A dramatisation of a notorious real quadruple killing pushes back against the version of events that once cast the perpetrator sympathetically, refocusing the story on the four women whose lives were overwhelmed by sensational coverage.",
    cast: [],
    internalCriticRating: 6.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: [],
    isMustWatch: false
  },

  // ---------- Saturday 29 Aug ----------
  {
    title: "Michael",
    type: "MOVIE",
    dayOffset: 1,
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English", "Hindi-Dubbed"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: true,
    platforms: ["JIOHOTSTAR"],
    genres: ["BIOPIC", "MUSICAL", "DRAMA"],
    runtimeMinutes: 144,
    posterUrl: poster("michael-biopic-2026"),
    backdropUrl: backdrop("michael-biopic-2026"),
    synopsis:
      "A biographical drama traces the extraordinary rise and deeply complicated life of pop icon Michael Jackson, with his own nephew stepping into the role — a real family connection that gives the film's most difficult chapters unusual weight.",
    cast: ["Jaafar Jackson"],
    internalCriticRating: 7.4,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["CRITIC_PICK", "TRENDING"],
    isMustWatch: true,
    heroRank: 4
  },
  {
    title: "Four Hands, Two Sonatas",
    type: "SERIES",
    dayOffset: 1,
    originalLanguage: "OTHER",
    availableAudioLanguages: ["Spanish", "English-Dubbed"],
    subtitleLanguages: ["English"],
    isHindiDubbed: false,
    platforms: ["NETFLIX"],
    genres: ["DRAMA", "MUSICAL", "ROMANCE"],
    totalEpisodes: 6,
    seasonNumber: 1,
    posterUrl: poster("four-hands-two-sonatas"),
    synopsis:
      "Two young pianists from sharply different backgrounds — a polished prodigy and a late-blooming talent — meet at an elite music school, where rivalry slowly gives way to a bond that reshapes both of their futures.",
    cast: [],
    internalCriticRating: 6.4,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: [],
    isMustWatch: false
  },
  {
    title: "Aata Hou De Dhingana",
    type: "SERIES",
    dayOffset: 1,
    originalLanguage: "MARATHI",
    availableAudioLanguages: ["Marathi"],
    subtitleLanguages: ["English", "Marathi"],
    isHindiDubbed: false,
    platforms: ["JIOHOTSTAR"],
    genres: ["COMEDY", "FAMILY"],
    totalEpisodes: 44,
    seasonNumber: 5,
    posterUrl: poster("aata-hou-de-dhingana-s5"),
    synopsis:
      "The long-running Marathi weekend game show returns for a fifth season, pitting popular Star Pravah show casts against each other in music-and-comedy challenges for a family-friendly weekend watch.",
    cast: ["Siddharth Jadhav"],
    internalCriticRating: 5.8,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["FAMILY_WATCH"],
    isMustWatch: false
  }
];
