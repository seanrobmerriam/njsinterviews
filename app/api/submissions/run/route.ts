import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { submitCode, getSubmissionResult, LANGUAGE_IDS } from "@/lib/judge0";
import type { Language } from "@prisma/client";

const LANGUAGE_KEY: Record<Language, string> = {
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  PYTHON: "python",
  GO: "go",
  RUST: "rust",
  JAVA: "java",
  CPP: "cpp",
  SQL: "sql",
  HTML: "html",
};

const POLL_INTERVAL = 1500;
const MAX_POLLS = 20;

async function waitForResult(token: string) {
  for (let i = 0; i < MAX_POLLS; i++) {
    const result = await getSubmissionResult(token);
    if (result.status.id >= 3) return result; // Terminal status
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  return null;
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { problemId, language, code } = (await req.json()) as {
    problemId: string;
    language: Language;
    code: string;
  };

  if (!problemId || !language || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const problem = await prisma.problem.findUnique({
    where: { id: problemId, isActive: true },
    include: { testCases: { where: { isHidden: false }, take: 3 } },
  });
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const langKey = LANGUAGE_KEY[language];
  const languageId = LANGUAGE_IDS[langKey];
  if (!languageId) return NextResponse.json({ error: "Unsupported language" }, { status: 400 });

  // Submit each visible test case and wait for results
  const tokens = await Promise.all(
    problem.testCases.map((tc) =>
      submitCode({
        source_code: code,
        language_id: languageId,
        stdin: tc.input,
        expected_output: tc.output,
      }).catch(() => null),
    ),
  );

  const results = await Promise.all(
    tokens.map(async (token, i) => {
      const tc = problem.testCases[i]!;
      if (!token) {
        return { input: tc.input, expected: tc.output, actual: null, passed: false, stderr: null };
      }
      const res = await waitForResult(token);
      if (!res) {
        return { input: tc.input, expected: tc.output, actual: null, passed: false, stderr: "Timed out" };
      }
      const actual = res.stdout?.trim() ?? null;
      const passed = res.status.id === 3; // Accepted
      return {
        input: tc.input,
        expected: tc.output,
        actual,
        passed,
        stderr: res.stderr ?? res.compile_output ?? null,
      };
    }),
  );

  return NextResponse.json({ results });
}
