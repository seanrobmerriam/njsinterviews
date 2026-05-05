const JUDGE0_URL = process.env.JUDGE0_URL!;
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

export const LANGUAGE_IDS: Record<string, number> = {
  javascript: 93, // Node.js 18
  typescript: 94, // TypeScript 5
  python: 71, // Python 3.11
  go: 95, // Go 1.21
  rust: 73, // Rust
  java: 62, // Java 17
  cpp: 54, // C++ 17
  sql: 82, // SQL (SQLite)
};

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number; // seconds
  memory_limit?: number; // KB
}

function judge0Headers(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (JUDGE0_API_KEY) headers["X-Auth-Token"] = JUDGE0_API_KEY;
  return headers;
}

export async function submitCode(params: Judge0Submission): Promise<string> {
  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
    method: "POST",
    headers: judge0Headers(),
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as { token: string };
  return data.token;
}

export interface Judge0Result {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;
  memory: number | null;
}

export async function getSubmissionResult(token: string): Promise<Judge0Result> {
  const res = await fetch(
    `${JUDGE0_URL}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,time,memory,compile_output`,
    { headers: judge0Headers() },
  );
  return res.json() as Promise<Judge0Result>;
}
