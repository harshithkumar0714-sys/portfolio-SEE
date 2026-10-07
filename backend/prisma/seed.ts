import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) throw new Error("Set SEED_ADMIN_PASSWORD to a unique password of at least 12 characters before seeding");
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: "admin@smartstudy.local" },
    update: {},
    create: { name: "SmartStudy Admin", email: "admin@smartstudy.local", passwordHash, role: "admin" },
  });
  const achievements = [
    { code: "first-session", name: "First focus", description: "Complete your first study session", icon: "🎯", xpReward: 25 },
    { code: "streak-7", name: "Seven-day streak", description: "Study on seven consecutive days", icon: "🔥", xpReward: 100 },
    { code: "test-taker", name: "Test taker", description: "Complete your first mock test", icon: "📝", xpReward: 25 },
  ];
  for (const achievement of achievements) await prisma.achievement.upsert({ where: { code: achievement.code }, update: achievement, create: achievement });
}

main().finally(async () => prisma.$disconnect());
