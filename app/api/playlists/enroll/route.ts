import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/tier";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { playlistId } = (await req.json()) as { playlistId: string };
  if (!playlistId) return NextResponse.json({ error: "Missing playlistId" }, { status: 400 });

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { isPro: true },
  });
  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (playlist.isPro) {
    const tier = await getUserTier(user.id);
    if (tier === "FREE") {
      return NextResponse.json({ error: "Upgrade to Pro to access this playlist." }, { status: 403 });
    }
  }

  const enrollment = await prisma.playlistEnrollment.upsert({
    where: { userId_playlistId: { userId: user.id, playlistId } },
    update: {},
    create: { userId: user.id, playlistId },
  });

  return NextResponse.json({ enrollment });
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playlistId = req.nextUrl.searchParams.get("playlistId");
  if (!playlistId) return NextResponse.json({ error: "Missing playlistId" }, { status: 400 });

  await prisma.playlistEnrollment.deleteMany({
    where: { userId: user.id, playlistId },
  });

  return NextResponse.json({ ok: true });
}
