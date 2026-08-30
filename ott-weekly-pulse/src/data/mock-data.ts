// Real, verified OTT release catalog for the current Friday->Thursday
// release week (28 Aug - 3 Sep 2026), weighted toward Hindi and Marathi
// content per product direction. Compiled from published streaming
// release-calendar coverage (IWMBuzz, FilmiBeat, OTTweek/TMDB) as of
// 29-30 Aug 2026. Titles, cast, directors, platforms, and — where noted —
// poster images are real; synopses are original summaries written from
// scratch (not copied from any source).
//
// Poster art: most posters below use real TMDB CDN URLs (image.tmdb.org)
// captured from legitimate TMDB-sourced listings during research for this
// catalog — not AI-generated or placeholder images. A handful of English-
// language titles (marked below) don't have a verified TMDB image path on
// hand, so those still fall back to a placeholder until wired to a live
// TMDB/Watchmode key (see src/lib/tmdb.ts / src/lib/watchmode.ts), which
// pulls real poster art automatically for every title, not just these.
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

// Real TMDB poster art (verified paths). Same path serves both poster
// (w500) and backdrop (w1280) crops since only one image was captured per
// title — the official art, just reused at two sizes.
const tmdbImg = (path: string, size: "w500" | "w1280" = "w500") => `https://image.tmdb.org/t/p/${size}${path}`;

// Fallback for the small number of titles without a verified TMDB path yet.
// Honest "no art yet" placeholder — a plain graphic, not a random stock
// photo that could be mistaken for an actual (wrong) poster.
const placeholderPoster = (label: string) => `https://placehold.co/500x750/1a1a24/6a6a7a?text=${encodeURIComponent(label)}`;
const placeholderBackdrop = (label: string) => `https://placehold.co/1280x720/1a1a24/6a6a7a?text=${encodeURIComponent(label)}`;

export const MOCK_TITLES: MockTitleSeed[] = [
  // ================= HINDI — MOVIES (real TMDB posters) =================
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
    posterUrl: tmdbImg("/bPtRt3ajQ0EkyeQ1O6iJwAIi9Py.jpg"),
    backdropUrl: tmdbImg("/bPtRt3ajQ0EkyeQ1O6iJwAIi9Py.jpg", "w1280"),
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
    posterUrl: tmdbImg("/3RRA8UBAdPC08spbDgnU0ykQ2MR.jpg"),
    backdropUrl: tmdbImg("/3RRA8UBAdPC08spbDgnU0ykQ2MR.jpg", "w1280"),
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
    posterUrl: tmdbImg("/owuFDxJOG1nv3J2wMf5f5jQjqHn.jpg"),
    backdropUrl: tmdbImg("/owuFDxJOG1nv3J2wMf5f5jQjqHn.jpg", "w1280"),
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
  {
    title: "Welcome to Sajjanpur",
    type: "MOVIE",
    dayOffset: 6,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["PRIME_VIDEO"],
    genres: ["COMEDY", "DRAMA"],
    runtimeMinutes: 138,
    posterUrl: tmdbImg("/aKutRHnTtuuVJsaX4BHE275871.jpg"),
    backdropUrl: tmdbImg("/aKutRHnTtuuVJsaX4BHE275871.jpg", "w1280"),
    synopsis:
      "A letter-writer in a small north Indian village becomes an unwitting witness to his community's political rivalries, superstitions, and quiet romances, in this gentle satirical comedy from director Shyam Benegal.",
    director: "Shyam Benegal",
    cast: ["Shreyas Talpade", "Amrita Rao", "Kunal Kapoor"],
    internalCriticRating: 5.7,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["HIDDEN_GEM"],
    isMustWatch: false
  },

  // ================= HOLLYWOOD / ENGLISH — MOVIES =================
  // Note: no verified TMDB poster path on hand for these two yet — falls
  // back to placeholder art until a live TMDB/Watchmode key is configured.
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
    posterUrl: placeholderPoster("Michael"),
    backdropUrl: placeholderBackdrop("Michael"),
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
    posterUrl: placeholderPoster("The Whisper Man"),
    backdropUrl: placeholderBackdrop("The Whisper Man"),
    synopsis:
      "A recently widowed writer and his estranged detective father are forced into an uneasy partnership when a boy's disappearance echoes a decades-old serial-killer case neither of them ever fully closed.",
    cast: ["Robert De Niro", "Adam Scott", "Michelle Monaghan"],
    internalCriticRating: 5.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: [],
    isMustWatch: false
  },

  // ================= HINDI — WEB SERIES (real TMDB posters) =================
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
    posterUrl: tmdbImg("/r2TJ9s9uhfxTssar1gBAWcxIXx7.jpg"),
    backdropUrl: tmdbImg("/r2TJ9s9uhfxTssar1gBAWcxIXx7.jpg", "w1280"),
    synopsis:
      "Everyday life across a cluster of neighbouring Mumbai households turns into shared community drama, with an ensemble cast led by Neena Gupta and Sumeet Vyas mining warmth and comedy from small domestic ups and downs.",
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
    posterUrl: tmdbImg("/8jcdd5HqW4nhF2upVGFS0KJ6hdY.jpg"),
    backdropUrl: tmdbImg("/8jcdd5HqW4nhF2upVGFS0KJ6hdY.jpg", "w1280"),
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
    posterUrl: tmdbImg("/1XpmIAEYegkMz52IBJXsRCCekK5.jpg"),
    backdropUrl: tmdbImg("/1XpmIAEYegkMz52IBJXsRCCekK5.jpg", "w1280"),
    synopsis:
      "A family drama set along the Ganga follows the intertwined fates of a household's daughters as they navigate tradition, ambition, and loyalty against a changing backdrop of small-town expectations.",
    cast: ["Amandeep Sidhu", "Sheezan Khan", "Shubhangi Latkar"],
    internalCriticRating: 5.5,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["FAMILY_WATCH"],
    isMustWatch: false
  },
  {
    title: "Anupamaa",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["JIOHOTSTAR"],
    genres: ["DRAMA", "FAMILY"],
    totalEpisodes: 1200,
    seasonNumber: 1,
    posterUrl: tmdbImg("/i3ZcFxUiGr6HV5yv1i6n7uKHyj7.jpg"),
    backdropUrl: tmdbImg("/i3ZcFxUiGr6HV5yv1i6n7uKHyj7.jpg", "w1280"),
    synopsis:
      "India's long-running primetime phenomenon continues to follow Anupamaa's journey of self-reinvention as a mother, entrepreneur, and woman rebuilding her life on her own terms after decades of putting family first.",
    cast: ["Rupali Ganguly", "Adrija Roy", "Shivam Khajuria"],
    internalCriticRating: 4.8,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["TRENDING"],
    isMustWatch: false
  },
  {
    title: "Taarak Mehta Ka Ooltah Chashmah",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["SONYLIV"],
    genres: ["COMEDY", "FAMILY"],
    totalEpisodes: 4200,
    seasonNumber: 1,
    posterUrl: tmdbImg("/3p9EtiZJKV5L8CBYjjL2b4T8cWP.jpg"),
    backdropUrl: tmdbImg("/3p9EtiZJKV5L8CBYjjL2b4T8cWP.jpg", "w1280"),
    synopsis:
      "India's longest-running sitcom keeps mining warm, gentle comedy from the everyday squabbles and camaraderie of the residents of Gokuldham Society — a comfort-watch staple for millions of households.",
    cast: ["Dilip Joshi", "Amit Bhatt", "Nitish Bhaluni"],
    internalCriticRating: 6.1,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["FAMILY_WATCH"],
    isMustWatch: false
  },
  {
    title: "Happu Ki Ultan Paltan",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["ZEE5"],
    genres: ["COMEDY"],
    totalEpisodes: 800,
    seasonNumber: 1,
    posterUrl: tmdbImg("/mQDRiFjJ9rTwv5dmYAqnwovShTn.jpg"),
    backdropUrl: tmdbImg("/mQDRiFjJ9rTwv5dmYAqnwovShTn.jpg", "w1280"),
    synopsis:
      "A bumbling small-town police inspector juggles a chaotic household and an even more chaotic police station in this long-running slapstick comedy, now streaming alongside its television run.",
    cast: [],
    internalCriticRating: 2.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: [],
    isMustWatch: false
  },
  {
    title: "Kyunki Saas Bhi Kabhi Bahu Thi",
    type: "SERIES",
    dayOffset: 1,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["JIOHOTSTAR"],
    genres: ["DRAMA", "FAMILY"],
    totalEpisodes: 60,
    seasonNumber: 2,
    posterUrl: tmdbImg("/rJfoyxt7FOKr7WPB6FPuffarpcn.jpg"),
    backdropUrl: tmdbImg("/rJfoyxt7FOKr7WPB6FPuffarpcn.jpg", "w1280"),
    synopsis:
      "The revival of Indian television's most iconic family saga returns Tulsi Virani to the centre of a sprawling joint family's triumphs and tribulations, reintroducing the show that defined a generation of Hindi soap opera.",
    cast: ["Smriti Irani", "Amar Upadhyay", "Tanisha Mehta"],
    internalCriticRating: 3.4,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["TRENDING"],
    isMustWatch: false
  },
  {
    title: "Seher Hone Ko Hai",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["JIOHOTSTAR"],
    genres: ["DRAMA"],
    totalEpisodes: 40,
    seasonNumber: 2,
    posterUrl: tmdbImg("/thC2dgPsSNYVVvNb2SPAolThndQ.jpg"),
    backdropUrl: tmdbImg("/thC2dgPsSNYVVvNb2SPAolThndQ.jpg", "w1280"),
    synopsis:
      "A slow-burn romantic drama follows two people pulled toward each other across social and familial fault lines, with each episode inching them closer to a dawn ('seher') that keeps slipping out of reach.",
    cast: ["Parth Samthaan", "Bhavika Sharma", "Apurva Agnihotri"],
    internalCriticRating: 8.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["HIDDEN_GEM"],
    isMustWatch: false
  },
  {
    title: "Thukra Ke Mera Pyaar",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["JIOHOTSTAR"],
    genres: ["DRAMA", "ROMANCE"],
    totalEpisodes: 30,
    seasonNumber: 2,
    posterUrl: tmdbImg("/AnWyFmAGQaUdi1kISvXqy20HHoR.jpg"),
    backdropUrl: tmdbImg("/AnWyFmAGQaUdi1kISvXqy20HHoR.jpg", "w1280"),
    synopsis:
      "Season two picks up after a shattering betrayal, following Shanvika's transformation into a sharper, more determined version of herself as she and Kuldeep are pulled into an escalating spiral of guilt, power, and revenge.",
    cast: ["Dhaval Thakur", "Sanchita Bashu", "Sushil Pandey"],
    internalCriticRating: 6.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["TRENDING"],
    isMustWatch: false
  },
  {
    title: "Pushpa Impossible",
    type: "SERIES",
    dayOffset: 0,
    originalLanguage: "HINDI",
    availableAudioLanguages: ["Hindi"],
    subtitleLanguages: ["English", "Hindi"],
    isHindiDubbed: false,
    platforms: ["SONYLIV"],
    genres: ["FAMILY", "DRAMA"],
    totalEpisodes: 900,
    seasonNumber: 1,
    posterUrl: tmdbImg("/jInpgPiN2KnTFAu2mtIbFJtFp7A.jpg"),
    backdropUrl: tmdbImg("/jInpgPiN2KnTFAu2mtIbFJtFp7A.jpg", "w1280"),
    synopsis:
      "A middle-aged woman who never learned to read pursues her education alongside her own children and grandchildren, turning a personal act of defiance into a warm, community-wide inspiration.",
    cast: ["Karuna Pandey", "Naveen Pandit", "Garima Parihar"],
    internalCriticRating: 7.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["FAMILY_WATCH"],
    isMustWatch: false
  },

  // ================= MARATHI =================
  // Note: no verified TMDB poster path on hand for this one yet.
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
    posterUrl: placeholderPoster("Aata Hou De Dhingana"),
    backdropUrl: placeholderBackdrop("Aata Hou De Dhingana"),
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

  // ================= HOLLYWOOD / ENGLISH — SERIES =================
  // Note: no verified TMDB poster path on hand for these two yet.
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
    totalEpisodes: 10,
    seasonNumber: 2,
    posterUrl: placeholderPoster("Dark Matter"),
    backdropUrl: placeholderBackdrop("Dark Matter"),
    synopsis:
      "The fragile peace a family found across alternate versions of their own lives starts to crack as one of them is pulled back into the multiverse-hopping Box, and every version of \"home\" starts to look like a different kind of trap.",
    cast: ["Joel Edgerton", "Jennifer Connelly", "Alice Braga"],
    internalCriticRating: 8.0,
    communityScore: 0,
    communityVotes: 0,
    editorialBadges: ["CRITIC_PICK"],
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
    posterUrl: placeholderPoster("Adults"),
    backdropUrl: placeholderBackdrop("Adults"),
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
