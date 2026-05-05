import type { Difficulty, Category, Language } from "@prisma/client";

export interface ProblemListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
  tags: string[];
  isFree: boolean;
  isPremium: boolean;
  orderIndex: number;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemDetail extends ProblemListItem {
  description: string;
  constraints: Record<string, unknown> | null;
  examples: ProblemExample[];
  hints: string[];
  starterCode: { language: Language; code: string }[];
}
