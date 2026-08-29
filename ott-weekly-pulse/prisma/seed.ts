// Seeds the current Friday->Thursday release week (plus the prior 2 weeks
// and next week's preview) with realistic sample titles across English,
// Hindi, and Marathi. Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";
import { MOCK_TITLES } from "../src/data/mock-data";
import { getAdjacentWeek, getCurrentWeekRange } from "../src/lib/week";

const prisma = new PrismaClient();

async function seedWeek(weekStartDate: Date, weekEndDate: Date, label: string, isCurrent: boolean, titleSubset = MOCK_TITLES) {
  const week = await prisma.week.upsert({
    where: { weekStartDate_weekEndDate: { weekStartDate, weekEndDate } },
    update: { isCurrent, label },
    create: { weekStartDate, weekEndDate, label, isCurrent }
  });

  for (const seed of titleSubset) {
    const releaseDate = addDays(weekStartDate, seed.dayOffset);
    await prisma.title.create({
      data: {
        title: seed.title,
        type: seed.type,
        releaseDate,
        weekStartDate,
        weekEndDate,
        weekId: week.id,
        originalLanguage: seed.originalLanguage,
        availableAudioLanguages: seed.availableAudioLanguages,
        subtitleLanguages: seed.subtitleLanguages,
        isHindiDubbed: seed.isHindiDubbed,
        platforms: seed.platforms,
        platformDeepLinks: Object.fromEntries(
          seed.platforms.map((p) => [p, `https://example-ott.com/${p.toLowerCase()}/${encodeURIComponent(seed.title)}`])
        ),
        genres: seed.genres,
        runtimeMinutes: seed.runtimeMinutes,
        totalEpisodes: seed.totalEpisodes,
        seasonNumber: seed.seasonNumber,
        posterUrl: seed.posterUrl,
        backdropUrl: seed.backdropUrl,
        trailerUrl: seed.trailerUrl,
        synopsis: seed.synopsis,
        director: seed.director,
        cast: seed.cast,
        imdbRating: seed.imdbRating,
        rottenTomatoesScore: seed.rottenTomatoesScore,
        internalCriticRating: seed.internalCriticRating,
        communityScore: seed.communityScore ?? 0,
        communityVotes: seed.communityVotes ?? 0,
        editorialBadges: seed.editorialBadges,
        isMustWatch: seed.isMustWatch,
        heroRank: seed.heroRank
      }
    });
  }

  console.log(`Seeded ${titleSubset.length} titles for week ${label}`);
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.title.deleteMany();
  await prisma.week.deleteMany();

  const current = getCurrentWeekRange();

  // Two prior weeks (archive), current week (full catalog), next week (preview subset)
  const weekMinus2 = getAdjacentWeek(getAdjacentWeek(current.weekStartDate, -1).weekStartDate, -1);
  const weekMinus1 = getAdjacentWeek(current.weekStartDate, -1);
  const weekPlus1 = getAdjacentWeek(current.weekStartDate, 1);

  await seedWeek(weekMinus2.weekStartDate, weekMinus2.weekEndDate, weekMinus2.label, false, MOCK_TITLES);
  await seedWeek(weekMinus1.weekStartDate, weekMinus1.weekEndDate, weekMinus1.label, false, MOCK_TITLES);
  await seedWeek(current.weekStartDate, current.weekEndDate, current.label, true, MOCK_TITLES);
  await seedWeek(weekPlus1.weekStartDate, weekPlus1.weekEndDate, weekPlus1.label, false, MOCK_TITLES.slice(0, 5));

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
