// NVIDIA NIM client for generating the "Quick AI Verdict" — same integration
// pattern used in the SatiCast / SanghaStatus apps (OpenAI-compatible /v1
// endpoint, single bearer key from env).
import "server-only";

const NIM_BASE_URL = process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const NIM_MODEL = process.env.NVIDIA_NIM_MODEL ?? "meta/llama-3.1-70b-instruct";

export interface AiVerdict {
  watch: string; // "Why you should watch" — one crisp line
  skip: string; // "Who should skip" — one crisp line
}

interface VerdictInput {
  title: string;
  type: string;
  synopsis: string;
  genres: string[];
  imdbRating?: number | null;
}

/**
 * Calls NVIDIA NIM (OpenAI-compatible chat completions) to produce a 2-line
 * editorial verdict. Falls back to a deterministic heuristic summary if the
 * API key is missing or the call fails, so the UI never breaks without it.
 */
export async function generateAiVerdict(input: VerdictInput): Promise<AiVerdict> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return heuristicVerdict(input);

  try {
    const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        temperature: 0.4,
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content:
              "You are a sharp OTT film/series critic writing for an Indian streaming-guide app called OTT Weekly Pulse. " +
              "Given a title's metadata, respond ONLY with strict JSON: {\"watch\": string, \"skip\": string}. " +
              "\"watch\" = one punchy sentence (max 22 words) on why someone should watch it. " +
              "\"skip\" = one punchy sentence (max 22 words) on who should skip it / what might not land. " +
              "No markdown, no preamble, JSON only."
          },
          {
            role: "user",
            content: JSON.stringify({
              title: input.title,
              type: input.type,
              genres: input.genres,
              imdbRating: input.imdbRating ?? null,
              synopsis: input.synopsis
            })
          }
        ]
      }),
      // Keep verdict generation snappy; fall back rather than block the page.
      signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) return heuristicVerdict(input);

    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.watch === "string" && typeof parsed.skip === "string") {
      return { watch: parsed.watch, skip: parsed.skip };
    }
    return heuristicVerdict(input);
  } catch {
    return heuristicVerdict(input);
  }
}

function heuristicVerdict({ title, genres, imdbRating }: VerdictInput): AiVerdict {
  const genreText = genres[0]?.toLowerCase().replace("_", "-") ?? "story";
  const ratingText = imdbRating && imdbRating >= 7.5 ? "critically strong" : "solidly watchable";
  return {
    watch: `${title} delivers a ${ratingText} ${genreText} ride that's easy to recommend this week.`,
    skip: `If ${genreText} isn't your genre or you want something lighter, this one can wait.`
  };
}

export interface CriticsTake {
  paragraph: string; // 3-4 sentence editorial-style take
}

/**
 * A longer-form editorial take (distinct from the 2-line Quick AI Verdict)
 * — what worked, what didn't, and who it's worth it for. IMPORTANT: this
 * is AI-generated analysis based on the title's own metadata, not sourced
 * from real critic reviews (no such data source is integrated). It's
 * labeled clearly as an "AI Critic's Take" in the UI for exactly this
 * reason — never represent it as aggregating real critical opinion.
 */
export async function generateCriticsTake(input: VerdictInput): Promise<CriticsTake> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return heuristicCriticsTake(input);

  try {
    const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        temperature: 0.5,
        max_tokens: 260,
        messages: [
          {
            role: "system",
            content:
              "You are an editorial film/series critic writing a short analytical take for an Indian streaming-guide app. " +
              "Given a title's metadata, respond ONLY with strict JSON: {\"paragraph\": string}. " +
              "\"paragraph\" = 3-4 sentences (60-90 words) covering: what generally works about a title like this, " +
              "one honest caveat or limitation, and who it's ultimately worth it for. Write with critical nuance, not just praise. " +
              "No markdown, no preamble, JSON only."
          },
          {
            role: "user",
            content: JSON.stringify({
              title: input.title,
              type: input.type,
              genres: input.genres,
              imdbRating: input.imdbRating ?? null,
              synopsis: input.synopsis
            })
          }
        ]
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) return heuristicCriticsTake(input);

    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.paragraph === "string") return { paragraph: parsed.paragraph };
    return heuristicCriticsTake(input);
  } catch {
    return heuristicCriticsTake(input);
  }
}

function heuristicCriticsTake({ title, type, genres, imdbRating }: VerdictInput): CriticsTake {
  const genreText = genres[0]?.toLowerCase().replace("_", "-") ?? "story";
  const kind = type === "MOVIE" ? "film" : type === "SERIES" ? "series" : "documentary";
  const ratingNote = imdbRating ? `holding a ${imdbRating}/10 audience score` : "still building an audience track record";
  return {
    paragraph: `${title} leans into familiar ${genreText} beats, ${ratingNote}. It won't reinvent the genre, and pacing may test patience in the middle stretch, but the craft holds up well enough for genre fans. Worth it if you're already drawn to ${genreText} ${kind}s; less essential if you're looking for something that breaks new ground.`
  };
}
