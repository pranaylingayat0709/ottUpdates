// Realistic (fictional) sample catalog for the current Friday->Thursday
// release week. Used by prisma/seed.ts and as the in-memory fallback data
// source (src/lib/data-source.ts) when no DATABASE_URL is configured, so the
// app runs fully out-of-the-box in preview/demo environments.
//
// All titles, cast, and quotes below are fictional placeholders standing in
// for real weekly OTT releases — swap in a TMDB/JustWatch feed for production.

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
  platforms: ("NETFLIX" | "PRIME_VIDEO" | "DISNEY_HOTSTAR" | "JIOCINEMA" | "SONYLIV" | "ZEE5" | "APPLE_TV" | "MUBI" | "AHA" | "SUNNXT")[];
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

export const MOCK_TITLES: MockTitleSeed[] = [
  {
    title: "Zenith Protocol",
    type: "SERIES",
    dayOffset: 0, // Friday
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English", "Hindi-Dubbed", "Tamil-Dubbed"],
    subtitleLanguages: ["English", "Hindi", "Marathi"],
    isHindiDubbed: true,
    platforms: ["NETFLIX"],
    genres: ["SCI_FI", "THRILLER"],
    totalEpisodes: 8,
    seasonNumber: 1,
    posterUrl: poster("zenith-protocol"),
    backdropUrl: backdrop("zenith-protocol"),
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    synopsis:
      "A rogue AI researcher uncovers a government black-site programme repurposing consumer neural implants for surveillance, and has 96 hours to expose it before she's silenced.",
    director: "Naomi Kessler",
    cast: ["Ariana Voss", "Devraj Malhotra", "Peter Lindqvist"],
    imdbRating: 8.1,
    rottenTomatoesScore: 88,
    internalCriticRating: 8.4,
    communityScore: 8.6,
    communityVotes: 4210,
    editorialBadges: ["CRITIC_PICK", "TRENDING"],
    isMustWatch: true,
    heroRank: 1
  },
  {
    title: "Kaale Baadal",
    type: "MOVIE",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["PRIME_VIDEO"],
    genres: ["CRIME", "DRAMA"],
    runtimeMinutes: 138,
    posterUrl: poster("kaale-baadal"),
    backdropUrl: backdrop("kaale-baadal"),
    synopsis:
      "A small-town cop is pulled back to his village when a childhood friend turns out to be the kingpin of a sand-mining mafia that's been quietly buying off the entire district.",
    director: "Ritesh Puranik",
    cast: ["Aryan Kapoor", "Meher Chandran", "Girish Oberoi"],
    imdbRating: 7.6,
    rottenTomatoesScore: 79,
    internalCriticRating: 7.8,
    communityScore: 7.9,
    communityVotes: 3120,
    editorialBadges: ["CRITIC_PICK", "BINGE_WORTHY"],
    isMustWatch: true,
    heroRank: 2
  },
  {
    title: "Ratra Aali",
    type: "MOVIE",
    dayOffset: 0,
    originalLanguage: "MARATHI",
    availableAudioLanguages: ["Marathi"],
    subtitleLanguages: ["English", "Hindi", "Marathi"],
    isHindiDubbed: false,
    platforms: ["ZEE5", "SONYLIV"],
    genres: ["DRAMA", "FAMILY"],
    runtimeMinutes: 121,
    posterUrl: poster("ratra-aali"),
    backdropUrl: backdrop("ratra-aali"),
    synopsis:
      "In a Konkan fishing village, a widowed boat-owner and her estranged daughter must rebuild their business — and their relationship — after a cyclone wipes out their fleet.",
    director: "Suhasini Kelkar",
    cast: ["Sonali Gaikwad", "Ashwini Bhave", "Milind Shinde"],
    imdbRating: 7.9,
    internalCriticRating: 8.2,
    communityScore: 8.3,
    communityVotes: 1540,
    editorialBadges: ["HIDDEN_GEM", "FAMILY_WATCH"],
    isMustWatch: true,
    heroRank: 3
  },
  {
    title: "Half-Life Diaries",
    type: "SERIES",
    dayOffset: 1, // Saturday
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English", "Hindi-Dubbed"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: true,
    platforms: ["APPLE_TV"],
    genres: ["DRAMA", "ROMANCE"],
    totalEpisodes: 6,
    seasonNumber: 2,
    posterUrl: poster("half-life-diaries"),
    backdropUrl: backdrop("half-life-diaries"),
    synopsis:
      "Season two picks up a year after Mara's diagnosis, following her and Theo as they navigate an open relationship neither of them planned for while she's in remission.",
    director: "Colm Whitfield",
    cast: ["Freya Lindstrom", "Idris Mensah"],
    imdbRating: 7.3,
    rottenTomatoesScore: 81,
    internalCriticRating: 7.5,
    communityScore: 7.6,
    communityVotes: 2210,
    editorialBadges: ["BINGE_WORTHY"],
    isMustWatch: false
  },
  {
    title: "Comedy Nights: Open Mic Wars",
    type: "SERIES",
    dayOffset: 1,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi", "English"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["JIOCINEMA"],
    genres: ["COMEDY"],
    totalEpisodes: 10,
    seasonNumber: 1,
    posterUrl: poster("open-mic-wars"),
    synopsis:
      "Eight rival stand-up comics from eight Indian cities battle it out over ten unscripted episodes, with the losing city's crowd voting the winner offstage each week.",
    cast: ["Rehaan Fazal", "Ipsita Roy", "Karthik Subramaniam"],
    imdbRating: 6.8,
    internalCriticRating: 6.5,
    communityScore: 7.1,
    communityVotes: 980,
    editorialBadges: [],
    isMustWatch: false
  },
  {
    title: "The Deep Current",
    type: "DOCUMENTARY",
    dayOffset: 2, // Sunday
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English", "Hindi-Dubbed"],
    subtitleLanguages: ["English", "Hindi", "Marathi"],
    isHindiDubbed: true,
    platforms: ["NETFLIX"],
    genres: ["DRAMA"],
    runtimeMinutes: 96,
    posterUrl: poster("deep-current"),
    backdropUrl: backdrop("deep-current"),
    synopsis:
      "A three-year embed with an Arabian Sea fishing cooperative tracks how climate-driven stock collapse is forcing entire coastal communities to reinvent their livelihoods.",
    director: "Priya Nagarkar",
    cast: [],
    imdbRating: 8.0,
    rottenTomatoesScore: 94,
    internalCriticRating: 8.5,
    communityScore: 8.1,
    communityVotes: 640,
    editorialBadges: ["CRITIC_PICK", "HIDDEN_GEM"],
    isMustWatch: false
  },
  {
    title: "Agnisaar",
    type: "SERIES",
    dayOffset: 2,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["SONYLIV"],
    genres: ["MYSTERY", "CRIME", "THRILLER"],
    totalEpisodes: 7,
    seasonNumber: 1,
    posterUrl: poster("agnisaar"),
    backdropUrl: backdrop("agnisaar"),
    synopsis:
      "A temple-town arson investigation unravels a decades-old land dispute between two priestly families, forcing a disgraced forensic officer back into the field.",
    director: "Abhinav Trivedi",
    cast: ["Rajeev Sethi", "Tanvi Azmi", "Farhan Wasim"],
    imdbRating: 7.7,
    internalCriticRating: 7.9,
    communityScore: 7.8,
    communityVotes: 2870,
    editorialBadges: ["TRENDING"],
    isMustWatch: false
  },
  {
    title: "Waadal",
    type: "MOVIE",
    dayOffset: 3, // Monday
    originalLanguage: "MARATHI",
    availableAudioLanguages: ["Marathi", "Hindi-Dubbed"],
    subtitleLanguages: ["English", "Marathi"],
    isHindiDubbed: true,
    platforms: ["ZEE5"],
    genres: ["ACTION", "DRAMA"],
    runtimeMinutes: 129,
    posterUrl: poster("waadal"),
    synopsis:
      "A retired kabaddi champion turned auto-rickshaw driver is drawn into protecting his housing colony from a land-grabbing builder-politician nexus.",
    director: "Nikhil Mahajan",
    cast: ["Swwapnil Joshi", "Sai Tamhankar"],
    imdbRating: 7.1,
    internalCriticRating: 7.0,
    communityScore: 7.4,
    communityVotes: 1120,
    editorialBadges: ["BINGE_WORTHY"],
    isMustWatch: false
  },
  {
    title: "Static & Silence",
    type: "MOVIE",
    dayOffset: 4, // Tuesday
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["MUBI"],
    genres: ["HORROR", "MYSTERY"],
    runtimeMinutes: 101,
    posterUrl: poster("static-silence"),
    backdropUrl: backdrop("static-silence"),
    synopsis:
      "A sound engineer restoring analog radio archives starts hearing a broadcast that predicts deaths in her apartment block three days before they happen.",
    director: "Elin Marsh",
    cast: ["Josephine Carr", "Tobias Renn"],
    imdbRating: 6.9,
    rottenTomatoesScore: 72,
    internalCriticRating: 7.2,
    communityScore: 7.0,
    communityVotes: 560,
    editorialBadges: ["HIDDEN_GEM"],
    isMustWatch: false
  },
  {
    title: "Dilkashi",
    type: "MOVIE",
    dayOffset: 5, // Wednesday
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["DISNEY_HOTSTAR"],
    genres: ["ROMANCE", "MUSICAL"],
    runtimeMinutes: 142,
    posterUrl: poster("dilkashi"),
    backdropUrl: backdrop("dilkashi"),
    synopsis:
      "Two feuding qawwali gharanas find their heirs falling for each other on the eve of a Sufi festival that could unite or permanently divide their lineages.",
    director: "Zoya Bilimoria",
    cast: ["Vivaan Rastogi", "Alia Mirchandani", "Naseer Qureshi"],
    imdbRating: 7.4,
    internalCriticRating: 7.3,
    communityScore: 7.9,
    communityVotes: 3980,
    editorialBadges: ["TRENDING", "FAMILY_WATCH"],
    isMustWatch: false
  },
  {
    title: "Codebreakers: Mumbai Circuit",
    type: "SERIES",
    dayOffset: 6, // Thursday
    originalLanguage: "ENGLISH",
    availableAudioLanguages: ["English", "Hindi-Dubbed", "Marathi-Dubbed"],
    subtitleLanguages: ["English", "Hindi", "Marathi"],
    isHindiDubbed: true,
    platforms: ["PRIME_VIDEO", "JIOCINEMA"],
    genres: ["CRIME", "THRILLER", "DRAMA"],
    totalEpisodes: 8,
    seasonNumber: 1,
    posterUrl: poster("codebreakers-mumbai"),
    backdropUrl: backdrop("codebreakers-mumbai"),
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    synopsis:
      "A cybercrime cell in Mumbai races to trace a crypto-laundering ring before a whistleblower analyst inside the gang is found out and eliminated.",
    director: "Rohan D'Souza",
    cast: ["Vikrant Oberoi", "Shruti Dalvi", "Manav Kaul"],
    imdbRating: 8.3,
    rottenTomatoesScore: 90,
    internalCriticRating: 8.6,
    communityScore: 8.7,
    communityVotes: 5460,
    editorialBadges: ["CRITIC_PICK", "TRENDING", "BINGE_WORTHY"],
    isMustWatch: true,
    heroRank: 4
  },
  {
    title: "Ambar Ani Mati",
    type: "DOCUMENTARY",
    dayOffset: 6,
    originalLanguage: "MARATHI",
    availableAudioLanguages: ["Marathi", "Hindi-Dubbed"],
    subtitleLanguages: ["English", "Marathi", "Hindi"],
    isHindiDubbed: true,
    platforms: ["SUNNXT", "SONYLIV"],
    genres: ["FAMILY"],
    runtimeMinutes: 78,
    posterUrl: poster("ambar-ani-mati"),
    synopsis:
      "A season-long portrait of drought-hit farmers in Marathwada experimenting with millet cooperatives as an alternative to water-intensive cash crops.",
    director: "Chinmay Deshpande",
    cast: [],
    imdbRating: 7.8,
    internalCriticRating: 8.0,
    communityScore: 7.9,
    communityVotes: 310,
    editorialBadges: ["HIDDEN_GEM"],
    isMustWatch: false
  }
];
