import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import { OrgRole } from "@prisma/client";

type ClerkEvent = {
  type: string;
  data: Record<string, unknown>;
};

function mapClerkRole(role: string): OrgRole {
  if (role === "org:admin") return "ADMIN";
  if (role === "org:owner") return "OWNER";
  return "MEMBER";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "No webhook secret" }, { status: 500 });

  let event: ClerkEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  // User events
  if (type === "user.created" || type === "user.updated") {
    const emailAddresses = data.email_addresses as { email_address: string; id: string }[];
    const primaryEmailAddressId = data.primary_email_address_id as string | null;
    const primaryEmail = emailAddresses.find(
      (e) => e.id === primaryEmailAddressId,
    )?.email_address;

    if (!primaryEmail) {
      return NextResponse.json({ error: "No primary email" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { id: data.id as string },
      update: {
        email: primaryEmail,
        username: data.username as string | null,
        avatarUrl: data.image_url as string | null,
      },
      create: {
        id: data.id as string,
        email: primaryEmail,
        username: data.username as string | null,
        avatarUrl: data.image_url as string | null,
      },
    });
  }

  if (type === "user.deleted") {
    await prisma.user.deleteMany({ where: { id: data.id as string } });
  }

  // Organization events
  if (type === "organization.created" || type === "organization.updated") {
    await prisma.organization.upsert({
      where: { id: data.id as string },
      update: {
        name: data.name as string,
        slug: data.slug as string,
        logoUrl: (data.image_url as string | null) ?? null,
      },
      create: {
        id: data.id as string,
        name: data.name as string,
        slug: data.slug as string,
        logoUrl: (data.image_url as string | null) ?? null,
      },
    });
  }

  if (type === "organization.deleted") {
    await prisma.organization.deleteMany({ where: { id: data.id as string } });
  }

  // Membership events
  if (type === "organizationMembership.created") {
    const org = data.organization as Record<string, unknown>;
    const publicUserData = data.public_user_data as Record<string, unknown>;
    const orgId = org.id as string;
    const userId = publicUserData.user_id as string;
    const role = mapClerkRole(data.role as string);

    // Skip if user doesn't exist in our DB yet
    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (userExists) {
      await prisma.orgMember.upsert({
        where: { userId_orgId: { userId, orgId } },
        update: { role },
        create: { userId, orgId, role },
      });
    }
  }

  if (type === "organizationMembership.deleted") {
    const org = data.organization as Record<string, unknown>;
    const publicUserData = data.public_user_data as Record<string, unknown>;
    const orgId = org.id as string;
    const userId = publicUserData.user_id as string;

    await prisma.orgMember.deleteMany({ where: { userId, orgId } });
  }

  return NextResponse.json({ received: true });
}
