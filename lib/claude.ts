import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

const LEVEL_INSTRUCTIONS = [
  "Give a very general conceptual hint. Do NOT mention specific algorithms or data structures by name.",
  "Give a directional hint that suggests the approach category (e.g., 'think about sorting first'). Do not give code.",
  "Give a more specific hint that points toward the algorithm or pattern without giving the solution.",
];

export async function generateHint(params: {
  problemTitle: string;
  problemDescription: string;
  userCode: string;
  language: string;
  hintLevel: number;
}): Promise<string> {
  const instruction = LEVEL_INSTRUCTIONS[params.hintLevel] ?? LEVEL_INSTRUCTIONS[0];

  const prompt = [
    "You are a coding interview coach. A candidate is working on the following problem.",
    "",
    `PROBLEM: ${params.problemTitle}`,
    params.problemDescription,
    "",
    `THEIR CURRENT CODE (${params.language}):`,
    "```",
    params.userCode,
    "```",
    "",
    instruction,
    "",
    "Respond with a single, concise hint paragraph. No code examples.",
  ].join("\n");

  const message = await getClient().messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  return block?.type === "text" ? block.text : "";
}
