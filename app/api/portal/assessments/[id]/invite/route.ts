import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/resend";

export const dynamic = "force-dynamic";

async function requireAdminOrOwner(userId: string, orgId: string) {
  const member = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });
  if (!member || !["ADMIN", "OWNER"].includes(member.role)) return null;
  return member;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await requireAdminOrOwner(userId, orgId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: assessmentId } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { orgId: true, title: true },
  });
  if (!assessment || assessment.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { emails } = body as { emails: string[] };

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails array is required" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sent: string[] = [];
  const failed: string[] = [];

  for (const email of emails) {
    try {
      const invite = await prisma.assessmentInvite.create({
        data: { assessmentId, candidateEmail: email.trim(), expiresAt },
      });

      const link = `${appUrl}/assess/${invite.token}`;
      const expiryDate = expiresAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email.trim(),
        subject: "You're invited to complete a coding assessment",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a1a;">Coding Assessment Invitation</h2>
            <p>You've been invited to complete a coding assessment: <strong>${assessment.title}</strong></p>
            <p>This is a timed technical assessment. Please make sure you're in a quiet environment before starting.</p>
            <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">
              Start Assessment
            </a>
            <p style="color:#666;font-size:14px;">This invitation expires on <strong>${expiryDate}</strong>.</p>
            <p style="color:#666;font-size:12px;">If you didn't expect this email, you can safely ignore it.</p>
          </div>
        `,
      });

      sent.push(email.trim());
    } catch {
      failed.push(email.trim());
    }
  }

  return NextResponse.json({ sent: sent.length, failed });
}
