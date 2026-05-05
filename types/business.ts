import type { InviteStatus, OrgRole } from "@prisma/client";

export interface CandidateResult {
  inviteId: string;
  candidateEmail: string;
  status: InviteStatus;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
}

export interface OrgMemberInfo {
  userId: string;
  role: OrgRole;
  email: string;
  username: string | null;
  joinedAt: string;
}

export interface ATSWebhookPayload {
  assessmentId: string;
  assessmentTitle: string;
  candidateEmail: string;
  status: InviteStatus;
  completedAt: string | null;
  totalProblems: number;
  problemsSolved: number;
  submissionsUrl: string;
}
