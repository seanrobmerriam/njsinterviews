import { prisma } from "./prisma";
import type { Tier } from "@prisma/client";

export async function getUserTier(userId: string): Promise<Tier> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
  return user?.tier ?? "FREE";
}

const TIER_ORDER: Tier[] = ["FREE", "PRO", "BUSINESS"];

export function requireTier(userTier: Tier, required: Tier[]): boolean {
  const userIndex = TIER_ORDER.indexOf(userTier);
  const minRequired = Math.min(...required.map((t) => TIER_ORDER.indexOf(t)));
  return userIndex >= minRequired;
}
