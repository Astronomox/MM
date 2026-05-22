import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ActionItem {
  task: string;
  owner?: string;
  dueDate?: string;
  priority: "high" | "medium" | "low";
}

export interface SummaryResult {
  tldr: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
}

const SYSTEM_PROMPT = `You are a highly skilled meeting analyst. Given a meeting transcript, extract structured intelligence from it.

Always respond with valid JSON matching exactly this structure:
{
  "tldr": "2-3 sentence executive summary of the meeting",
  "keyPoints": ["array of 3-6 key discussion points"],
  "actionItems": [
    {
      "task": "specific action to be taken",
      "owner": "person responsible (if mentioned)",
      "dueDate": "deadline if mentioned (ISO date string or natural language)",
      "priority": "high | medium | low"
    }
  ],
  "decisions": ["array of concrete decisions made in the meeting"],
  "sentiment": "positive | neutral | negative",
  "topics": ["array of main topic tags, 2-4 words each"]
}

Be precise. Extract only what was actually discussed. If something is unclear, omit it rather than guess.`;

export async function summarizeMeeting(
  transcript: string,
  meetingTitle: string,
  duration: number
): Promise<SummaryResult> {
  const durationStr = formatDuration(duration);

  const userPrompt = `Meeting title: "${meetingTitle}"
Duration: ${durationStr}

Transcript:
${transcript}

Extract the structured summary from this meeting.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("Empty response from OpenAI");

  const result = JSON.parse(content) as SummaryResult;
  return validateSummary(result);
}

function validateSummary(raw: any): SummaryResult {
  return {
    tldr: raw.tldr || "No summary available.",
    keyPoints: Array.isArray(raw.keyPoints) ? raw.keyPoints : [],
    actionItems: Array.isArray(raw.actionItems)
      ? raw.actionItems.map((item: any) => ({
          task: item.task || "",
          owner: item.owner || undefined,
          dueDate: item.dueDate || undefined,
          priority: ["high", "medium", "low"].includes(item.priority)
            ? item.priority
            : "medium",
        }))
      : [],
    decisions: Array.isArray(raw.decisions) ? raw.decisions : [],
    sentiment: ["positive", "neutral", "negative"].includes(raw.sentiment)
      ? raw.sentiment
      : "neutral",
    topics: Array.isArray(raw.topics) ? raw.topics : [],
  };
}

function formatDuration(seconds: number): string {
  if (!seconds) return "unknown";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function countTokensApprox(text: string): number {
  // Rough approximation: 1 token ≈ 4 chars
  return Math.ceil(text.length / 4);
}
