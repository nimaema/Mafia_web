import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const moderatorPassword = await bcrypt.hash("mod123", 10);

  console.log("Seeding users...");

  // Create Admin
  await prisma.user.upsert({
    where: { email: "admin@mafia.com" },
    update: {},
    create: {
      email: "admin@mafia.com",
      name: "مدیر سیستم",
      password_hash: adminPassword,
      role: "ADMIN",
    },
  });

  // Create Moderator
  await prisma.user.upsert({
    where: { email: "mod@mafia.com" },
    update: {},
    create: {
      email: "mod@mafia.com",
      name: "گرداننده",
      password_hash: moderatorPassword,
      role: "MODERATOR",
    },
  });

  console.log("Seeding roles...");

  // Create Default Roles
  const defaultRoles = [
    { name: "کارآگاه", alignment: "CITIZEN", description: "استعلام هویت بازیکنان" },
    { name: "دکتر", alignment: "CITIZEN", description: "نجات بازیکنان از شلیک شب" },
    { name: "روئین تن", alignment: "CITIZEN", description: "یک جان اضافی در شب دارد" },
    { name: "شهروند ساده", alignment: "CITIZEN", description: "کمک به شهروندان با رای" },
    { name: "پدرخوانده", alignment: "MAFIA", description: "رئیس مافیا، استعلام منفی" },
    { name: "دکتر لکتر", alignment: "MAFIA", description: "نجات اعضای مافیا" },
    { name: "مافیا ساده", alignment: "MAFIA", description: "اعضای تیم مافیا" },
    { name: "جوکر", alignment: "NEUTRAL", description: "برنده شدن در صورت اعدام" },
  ];

  for (const role of defaultRoles) {
    await prisma.mafiaRole.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        alignment: role.alignment as any,
        description: role.description,
        is_permanent: true,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
