import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/tier";
import type { Language } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const problemId = req.nextUrl.searchParams.get("problemId");
  if (!problemId) return NextResponse.json({ error: "Missing problemId" }, { status: 400 });

  const solution = await prisma.savedSolution.findFirst({
    where: { userId: user.id, problemId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ solution });
}

export async function PUT(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tier = await getUserTier(user.id);
  if (tier === "FREE") {
    return NextResponse.json({ error: "Upgrade to Pro to save solutions." }, { status: 403 });
  }

  const { problemId, language, code, notes } = (await req.json()) as {
    problemId: string;
    language: Language;
    code: string;
    notes?: string;
  };

  if (!problemId || !language || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const saved = await prisma.savedSolution.upsert({
    where: { userId_problemId_language: { userId: user.id, problemId, language } },
    update: { code, notes: notes ?? null, updatedAt: new Date() },
    create: { userId: user.id, problemId, language, code, notes: notes ?? null },
  });

  return NextResponse.json({ saved });
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const problemId = req.nextUrl.searchParams.get("problemId");
  const language = req.nextUrl.searchParams.get("language") as Language | null;

  if (!problemId || !language) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  await prisma.savedSolution.deleteMany({
    where: { userId: user.id, problemId, language },
  });

  return NextResponse.json({ ok: true });
}
