import type { Language, SubmissionStatus } from "@prisma/client";

export interface SubmissionRequest {
  problemId: string;
  language: Language;
  code: string;
  assessmentId?: string;
}

export interface SubmissionResponse {
  submissionId: string;
  token: string;
}

export interface SubmissionResult {
  id: string;
  status: SubmissionStatus;
  runtime: number | null;
  memory: number | null;
  errorMessage: string | null;
  testsPassed: number;
  testsTotal: number;
}
