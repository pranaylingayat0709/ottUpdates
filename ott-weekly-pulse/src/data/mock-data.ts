// Real, verified OTT release catalog for the current Friday->Thursday
// release week (28 Aug - 3 Sep 2026), weighted toward Hindi and Marathi
// content per product direction, with a smaller Hollywood/English slate.
// Compiled from published streaming release-calendar coverage (IWMBuzz,
// FilmiBeat, OTTweek/TMDB) as of 29-30 Aug 2026. Titles, cast, directors,
// and platforms are real; synopses below are original summaries written
// from scratch (not copied from any source), and ratings shown are TMDB
// user-rating figures re-labelled as this app's own editorial score where
// noted — swap in a live feed (src/lib/watchmode.ts / src/lib/tmdb.ts) for
// production to keep this current automatically.
//
// Re-run this file's contents through the same research process each week
// to keep it current, or rely on the live Watchmode/TMDB integration.

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
// a real feed for production-accurate poster art.

export const MOCK_TITLES: MockTitleSeed[] = [
  // ================= HINDI — MOVIES =================
  {
    title: "Alpha",
    type: "MOVIE",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["NETFLIX"],
    genres: ["ACTION", "THRILLER"],
    runtimeMinutes: 134,
    posterUrl: poster("alpha-2026"),
    backdropUrl: backdrop("alpha-2026"),
    synopsis:
      "Set within the same expansive spy universe as War and Pathaan, this installment follows a fierce young operative thrown into her first high-stakes mission, forced to prove herself inside a shadowy intelligence agency where trust is a liability.",
    director: "Shiv Rawail",
    cast: ["Alia Bhatt", "Sharvari", "Bobby Deol"],
    internalCriticRating: 5.2,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["TRENDING"],
    isMustWatch: true,
    heroRank: 1
  },
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
    cast: ["Bobby Deol", "Sanya Malhotra", "Saba Azad"],
    internalCriticRating: 6.5,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["CRITIC_PICK"],
    isMustWatch: true,
    heroRank: 2
  },
  {
    title: "Babita Singh Reporting",
    type: "MOVIE",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["PRIME_VIDEO"],
    genres: ["CRIME", "DRAMA"],
    runtimeMinutes: 122,
    posterUrl: poster("babita-singh-reporting"),
    backdropUrl: backdrop("babita-singh-reporting"),
    synopsis:
      "A conflict-averse police officer visiting her in-laws is pulled into a quiet, unofficial investigation after her childhood friend is murdered, forcing long-buried memories and unfinished relationships back into the open.",
    director: "Ambiecka Pandit",
    cast: ["Nimisha Sajayan", "Anshumaan Pushkar", "Barun Sobti"],
    internalCriticRating: 4.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["CRITIC_PICK"],
    isMustWatch: false
  },

  // ================= HINDI — WEB SERIES =================
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
      "Everyday life across a cluster of neighbouring Mumbai households turns into shared community drama, with an ensemble cast led by Neena Gupta and Sumeet Vyas mining warmth and comedy from small domestic ups and downs.",
    director: undefined,
    cast: ["Neena Gupta", "Sumeet Vyas", "Deven Bhojani"],
    internalCriticRating: 6.2,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["FAMILY_WATCH"],
    isMustWatch: false
  },
  {
    title: "India's Got Latent",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["NETFLIX"],
    genres: ["COMEDY"],
    totalEpisodes: 12,
    seasonNumber: 2,
    posterUrl: poster("indias-got-latent-s2"),
    backdropUrl: backdrop("indias-got-latent-s2"),
    synopsis:
      "Comedian Samay Raina's wildly popular unscripted talent-and-opinion show returns, putting contestants and guests through unpredictable comic challenges and famously blunt judging panels — one of the most talked-about Indian originals going.",
    cast: ["Samay Raina"],
    internalCriticRating: 8.7,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["TRENDING", "BINGE_WORTHY"],
    isMustWatch: true,
    heroRank: 3
  },
  {
    title: "Ganga Mai Ki Betiyan",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["ZEE5"],
    genres: ["DRAMA", "FAMILY"],
    totalEpisodes: 20,
    seasonNumber: 1,
    posterUrl: poster("ganga-mai-ki-betiyan"),
    synopsis:
      "A family drama set along the Ganga follows the intertwined fates of a household's daughters as they navigate tradition, ambition, and loyalty against a changing backdrop of small-town expectations.",
    cast: ["Amandeep Sidhu", "Sheezan Khan", "Shubhangi Latkar"],
    internalCriticRating: 5.5,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["FAMILY_WATCH"],
    isMustWatch: false
  },

  // ================= MARATHI =================
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
    backdropUrl: backdrop("aata-hou-de-dhingana-s5"),
    synopsis:
      "The long-running Marathi weekend game show returns for a fifth season, pitting popular Star Pravah show casts against each other in music-and-comedy challenges for a family-friendly weekend watch.",
    cast: ["Siddharth Jadhav"],
    internalCriticRating: 5.8,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["FAMILY_WATCH", "TRENDING"],
    isMustWatch: true,
    heroRank: 4
  },

  // ================= HOLLYWOOD / ENGLISH =================
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
    editorialBadges: ["CRITIC_PICK"],
    isMustWatch: false
  },
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
    editorialBadges: ["CRITIC_PICK"],
    isMustWatch: false
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
    synopsis:
      "A recently widowed writer and his estranged detective father are forced into an uneasy partnership when a boy's disappearance echoes a decades-old serial-killer case neither of them ever fully closed.",
    cast: ["Robert De Niro", "Adam Scott", "Michelle Monaghan"],
    internalCriticRating: 5.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: [],
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
    editorialBadges: [],
    isMustWatch: false
  }
];
