import { PrismaClient, Alignment } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Users ──
  console.log("🔐 Seeding users...");
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "admin123";
  await prisma.user.upsert({
    where: { email: "admin@mafia.com" },
    update: {},
    create: {
      email: "admin@mafia.com",
      name: "مدیر سیستم",
      password_hash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "mod@mafia.com" },
    update: {},
    create: {
      email: "mod@mafia.com",
      name: "گرداننده",
      password_hash: await bcrypt.hash("mod123", 10),
      role: "MODERATOR",
    },
  });

  // ── Rename legacy roles ──
  console.log("🔄 Migrating legacy role names...");
  const renames: [string, string][] = [
    ["پدرخوانده", "رئیس مافیا"],
    ["روئین تن", "رویین‌تن"],
  ];
  for (const [oldName, newName] of renames) {
    const existing = await prisma.mafiaRole.findUnique({ where: { name: oldName } });
    const conflict = await prisma.mafiaRole.findUnique({ where: { name: newName } });
    if (existing && !conflict) {
      await prisma.mafiaRole.update({ where: { name: oldName }, data: { name: newName } });
      console.log(`  ✅ Renamed "${oldName}" → "${newName}"`);
    }
  }

  // ── Roles ──
  console.log("🎭 Seeding roles...");

  const allRoles = [
    // ─── CITIZEN ───
    { name: "کارآگاه", alignment: Alignment.CITIZEN, description: "هر شب یک نفر را استعلام میکند. استعلام تمام مافیاها جز رئیس مافیا مثبت است." },
    { name: "دکتر", alignment: Alignment.CITIZEN, description: "نجات بازیکنان از شلیک شب. تا ۷ نفر ۱ سیو، ۸ نفر به بالا ۲ سیو در یک شب." },
    { name: "رویین‌تن", alignment: Alignment.CITIZEN, description: "در شب نامیرا است و با تیر مافیا کشته نمیشود. امکان مذاکره با رویین‌تن وجود دارد." },
    { name: "شهروند ساده", alignment: Alignment.CITIZEN, description: "بدون توانایی خاص. کمک به تیم شهروند با رأی و استدلال." },
    { name: "محقق", alignment: Alignment.CITIZEN, description: "هر شب خودش را به یک نفر گره میزند. اگر محقق حذف شود، فرد گره‌خورده نیز حذف میشود (به جز رئیس مافیا)." },
    { name: "بازپرس", alignment: Alignment.CITIZEN, description: "یک بار در طول بازی میتواند دو نفر را به دفاعیه بیاورد. هر کدام دو زمان ۳۰ ثانیه‌ای دفاع میکنند." },
    { name: "تکتیرانداز", alignment: Alignment.CITIZEN, description: "هر شب بیدار میشود اما فقط ۱ تیر دارد. شلیک به شهروند = مرگ خودش، به مافیا = مرگ مافیا، به رئیس مافیا = بی‌اثر." },
    { name: "راهنما", alignment: Alignment.CITIZEN, description: "هر شب یک نفر را انتخاب میکند. اگر شهروند باشد استعلام میگیرد، اگر مافیا باشد مافیا راهنما را میشناسد." },
    { name: "مین‌گذار", alignment: Alignment.CITIZEN, description: "یک بار جلوی خانه یک نفر مین میکارد. اگر مافیا آن شخص را شات کند، باید یک فدایی بدهد." },
    { name: "وکیل", alignment: Alignment.CITIZEN, description: "یک بار در کل بازی وکالت یک نفر را بر عهده میگیرد. آن شخص فردا تحت هیچ شرایطی وارد دفاعیه نمیشود." },
    { name: "محافظ", alignment: Alignment.CITIZEN, description: "خود و هدف شبانه‌اش در برابر ترور روز یاغی ایمن هستند." },
    { name: "فراماسون", alignment: Alignment.CITIZEN, description: "عضو لژ فراماسونری. نقش ویژه در سناریو فراماسون." },
    { name: "فرمانده", alignment: Alignment.CITIZEN, description: "پس از شلیک تکتیرانداز بیدار میشود و باید شلیک او را تأیید یا رد کند." },
    { name: "کشیش", alignment: Alignment.CITIZEN, description: "نقش مقابل سایلنسر. یک نفر را از سایلنت شدن محافظت میکند. اگر هدف سایلنسر نبوده، نطق جایزه میگیرد." },
    { name: "تفنگدار", alignment: Alignment.CITIZEN, description: "هر شب حداکثر ۲ تفنگ توزیع میکند. تفنگ مشقی بینهایت، جنگی محدود (تا ۱۱ نفر: ۱ عدد، تا ۱۷ نفر: ۲ عدد)." },
    { name: "کابوی", alignment: Alignment.CITIZEN, description: "با اعلام «من کابوی هستم و X را با خودم میبرم» مستقیماً شب میشود. ساید هر دو اعلام شده و حذف میشوند." },
    { name: "قاضی", alignment: Alignment.CITIZEN, description: "یک بار در شب میتواند نتیجه رأیگیری روز گذشته را باطل کند. نتیجه فردا اعلام میشود." },
    { name: "تکاور", alignment: Alignment.CITIZEN, description: "اگر در شب توسط مافیا شات شود، بیدار شده و حق شلیک متقابل دارد. شلیک به شهروند = خروج قطعی خودش." },
    { name: "نگهبان", alignment: Alignment.CITIZEN, description: "در مقابل افسونگر. به بازیکنان نگهبانی میدهد تا توانایی‌شان مسدود نشود. زره روز دارد (با اولین دفاعیه میافتد)." },
    { name: "سرباز", alignment: Alignment.CITIZEN, description: "تیر خود را در شب میفرستد. اگر به شهروند برسد اسنایپر میشود، اگر به مافیا برسد سرباز حذف میشود." },
    // ─── MAFIA ───
    { name: "رئیس مافیا", alignment: Alignment.MAFIA, description: "شلیک شب بر عهده اوست. استعلام کارآگاه همیشه منفی است. محقق نمیتواند او را با خود بیرون ببرد." },
    { name: "ناتو", alignment: Alignment.MAFIA, description: "یک بار در طول بازی حدس نقش شهروند نقشدار. اگر درست باشد آن شهروند حذف میشود. در شب ناتویی شلیک ندارد." },
    { name: "شیاد", alignment: Alignment.MAFIA, description: "به تنهایی به دنبال کارآگاه است. اگر کارآگاه را انتخاب کند، استعلام آن شب منفی میشود. هر شب تکرارپذیر." },
    { name: "مافیا ساده", alignment: Alignment.MAFIA, description: "عضو ساده تیم مافیا. بدون توانایی خاص." },
    { name: "دن مافیا", alignment: Alignment.MAFIA, description: "استعلام منفی. با قابلیت «رأی خیانت» در خواب نیمروزی رأی تارگت نماینده را ±۱ میکند." },
    { name: "یاغی", alignment: Alignment.MAFIA, description: "رتبه دو مافیا. اگر دن یا هکر خارج شوند، تبدیل به تروریست میشود و میتواند یک نفر را با خود ببرد." },
    { name: "هکر", alignment: Alignment.MAFIA, description: "هر شب توانایی یک نفر را مختل میکند (به مقصد نمیرسد)." },
    { name: "سایلنسر", alignment: Alignment.MAFIA, description: "یک نفر را در شب انتخاب میکند و او در روز بعد حق صحبت ندارد." },
    { name: "تروریست", alignment: Alignment.MAFIA, description: "تا قبل از رأیگیری میتواند یک نفر را با خود از بازی خارج کند (به جز محافظ و هدف او)." },
    { name: "افسونگر", alignment: Alignment.MAFIA, description: "هر شب توانایی یک شهروند را میگیرد. نمیتواند دو شب متوالی یک نفر را انتخاب کند." },
    { name: "دکتر لکتر", alignment: Alignment.MAFIA, description: "نجات اعضای مافیا در شب." },
    // ─── NEUTRAL ───
    { name: "جوکر", alignment: Alignment.NEUTRAL, description: "نقش مستقل. در صورت اعدام شدن توسط رأی شهروندان، برنده بازی میشود." },
  ];

  for (const role of allRoles) {
    await prisma.mafiaRole.upsert({
      where: { name: role.name },
      update: { description: role.description, alignment: role.alignment, is_permanent: true },
      create: { name: role.name, alignment: role.alignment, description: role.description, is_permanent: true },
    });
  }
  console.log(`  ✅ ${allRoles.length} roles synced`);

  // ── Scenarios ──
  console.log("📋 Seeding scenarios...");

  const dbRoles = await prisma.mafiaRole.findMany();
  const id = (name: string) => {
    const r = dbRoles.find(r => r.name === name);
    if (!r) console.warn(`  ⚠️ Role not found: ${name}`);
    return r?.id;
  };

  type ScenarioDef = { name: string; description: string; roles: { name: string; count: number }[] };

  const scenarios: ScenarioDef[] = [
    // ── 1. کلاسیک ──
    {
      name: "کلاسیک ۱۲ نفره",
      description: "سناریو بازپرس و محقق - ۱۲ نفر | ترتیب شب: محقق، مافیا، شیاد، کارآگاه، دکتر، بازپرس",
      roles: [
        { name: "محقق", count: 1 }, { name: "بازپرس", count: 1 }, { name: "دکتر", count: 1 },
        { name: "کارآگاه", count: 1 }, { name: "رویین‌تن", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "شهروند ساده", count: 2 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "شیاد", count: 1 },
        { name: "مافیا ساده", count: 1 },
      ],
    },
    {
      name: "کلاسیک ۱۳ نفره",
      description: "سناریو بازپرس و محقق - ۱۳ نفر | مذاکره با رویین‌تن ندارد",
      roles: [
        { name: "محقق", count: 1 }, { name: "بازپرس", count: 1 }, { name: "دکتر", count: 1 },
        { name: "کارآگاه", count: 1 }, { name: "رویین‌تن", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "شهروند ساده", count: 3 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "شیاد", count: 1 },
        { name: "مافیا ساده", count: 1 },
      ],
    },
    // ── 2. نماینده ──
    {
      name: "نماینده ۱۰ نفره",
      description: "سناریو نماینده - ۱۰ نفر | خواب نیمروزی برای مشورت مافیا و رأی خیانت",
      roles: [
        { name: "دکتر", count: 1 }, { name: "راهنما", count: 1 }, { name: "مین‌گذار", count: 1 },
        { name: "وکیل", count: 1 }, { name: "محافظ", count: 1 }, { name: "شهروند ساده", count: 2 },
        { name: "دن مافیا", count: 1 }, { name: "یاغی", count: 1 }, { name: "هکر", count: 1 },
      ],
    },
    {
      name: "نماینده ۱۲ نفره",
      description: "سناریو نماینده - ۱۲ نفر | ناتو و سرباز اضافه میشوند",
      roles: [
        { name: "دکتر", count: 1 }, { name: "راهنما", count: 1 }, { name: "مین‌گذار", count: 1 },
        { name: "وکیل", count: 1 }, { name: "محافظ", count: 1 }, { name: "سرباز", count: 1 },
        { name: "شهروند ساده", count: 2 },
        { name: "دن مافیا", count: 1 }, { name: "یاغی", count: 1 }, { name: "هکر", count: 1 },
        { name: "ناتو", count: 1 },
      ],
    },
    // ── 3. فراماسون ──
    {
      name: "فراماسون ۱۲ نفره",
      description: "سناریو فراماسون - ۱۲ نفر | مذاکره فقط با ۲ مافیای باقیمانده",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "فرمانده", count: 1 }, { name: "کشیش", count: 1 }, { name: "تفنگدار", count: 1 },
        { name: "رویین‌تن", count: 1 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "سایلنسر", count: 1 },
        { name: "مافیا ساده", count: 1 },
        { name: "جوکر", count: 1 },
      ],
    },
    {
      name: "فراماسون ۱۳ نفره",
      description: "سناریو فراماسون - ۱۳ نفر | کابوی اضافه میشود",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "فرمانده", count: 1 }, { name: "کشیش", count: 1 }, { name: "تفنگدار", count: 1 },
        { name: "رویین‌تن", count: 1 }, { name: "کابوی", count: 1 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "سایلنسر", count: 1 },
        { name: "مافیا ساده", count: 1 },
        { name: "جوکر", count: 1 },
      ],
    },
    {
      name: "فراماسون ۱۵ نفره",
      description: "سناریو فراماسون - ۱۵ نفر | نسخه کامل با تمام نقش‌ها",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "فراماسون", count: 1 }, { name: "فرمانده", count: 1 }, { name: "کشیش", count: 1 },
        { name: "تفنگدار", count: 1 }, { name: "رویین‌تن", count: 1 }, { name: "کابوی", count: 1 },
        { name: "قاضی", count: 1 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "سایلنسر", count: 1 },
        { name: "تروریست", count: 1 },
        { name: "جوکر", count: 1 },
      ],
    },
    // ── 4. تکاور ──
    {
      name: "تکاور ۱۰ نفره",
      description: "سناریو تکاور - ۱۰ نفر | افسونگر شب اول با تیم بیدار نمیشود",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکاور", count: 1 },
        { name: "نگهبان", count: 1 }, { name: "تفنگدار", count: 1 }, { name: "شهروند ساده", count: 2 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "افسونگر", count: 1 },
      ],
    },
    {
      name: "تکاور ۱۲ نفره",
      description: "سناریو تکاور - ۱۲ نفر | افسونگر ۲ انتخاب دارد",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکاور", count: 1 },
        { name: "نگهبان", count: 1 }, { name: "تفنگدار", count: 1 }, { name: "شهروند ساده", count: 3 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "افسونگر", count: 1 },
        { name: "مافیا ساده", count: 1 },
      ],
    },
    {
      name: "تکاور ۱۳ نفره",
      description: "سناریو تکاور - ۱۳ نفر",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکاور", count: 1 },
        { name: "نگهبان", count: 1 }, { name: "تفنگدار", count: 1 }, { name: "شهروند ساده", count: 4 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "افسونگر", count: 1 },
        { name: "مافیا ساده", count: 1 },
      ],
    },
    {
      name: "تکاور ۱۵ نفره",
      description: "سناریو تکاور - ۱۵ نفر | نسخه کامل",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکاور", count: 1 },
        { name: "نگهبان", count: 1 }, { name: "تفنگدار", count: 1 }, { name: "شهروند ساده", count: 5 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "افسونگر", count: 1 },
        { name: "مافیا ساده", count: 2 },
      ],
    },
  ];

  for (const s of scenarios) {
    const roleLinks = s.roles
      .map(r => ({ roleId: id(r.name), count: r.count }))
      .filter((r): r is { roleId: string; count: number } => r.roleId != null);

    if (roleLinks.length === 0) { console.warn(`  ⚠️ Skipping ${s.name}: no valid roles`); continue; }

    const existing = await prisma.scenario.findUnique({ where: { name: s.name } });

    if (existing) {
      await prisma.scenarioRole.deleteMany({ where: { scenarioId: existing.id } });
      await prisma.scenario.update({
        where: { id: existing.id },
        data: {
          description: s.description,
          roles: { create: roleLinks.map(rl => ({ count: rl.count, role: { connect: { id: rl.roleId } } })) },
        },
      });
      console.log(`  🔄 Updated: ${s.name}`);
    } else {
      await prisma.scenario.create({
        data: {
          name: s.name,
          description: s.description,
          roles: { create: roleLinks.map(rl => ({ count: rl.count, role: { connect: { id: rl.roleId } } })) },
        },
      });
      console.log(`  ✅ Created: ${s.name}`);
    }
  }

  // Clean up old scenarios that are no longer standard
  const oldScenarioNames = ["سناریو پدرخوانده", "سناریو بازپرس", "سناریو کاپو"];
  for (const name of oldScenarioNames) {
    const old = await prisma.scenario.findUnique({ where: { name } });
    if (old) {
      await prisma.scenarioRole.deleteMany({ where: { scenarioId: old.id } });
      await prisma.scenario.delete({ where: { id: old.id } });
      console.log(`  🗑️ Removed old scenario: ${name}`);
    }
  }

  // Mark old roles that are no longer standard as non-permanent
  const currentNames = new Set(allRoles.map(r => r.name));
  const legacyRoles = await prisma.mafiaRole.findMany({ where: { is_permanent: true } });
  for (const lr of legacyRoles) {
    if (!currentNames.has(lr.name)) {
      await prisma.mafiaRole.update({ where: { id: lr.id }, data: { is_permanent: false } });
      console.log(`  📌 Marked as non-permanent: ${lr.name}`);
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
