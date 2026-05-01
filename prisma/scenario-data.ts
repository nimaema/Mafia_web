import { Alignment, type Prisma } from "@prisma/client";

export type RoleDefinition = {
  name: string;
  alignment: Alignment;
  description: string;
  is_permanent?: boolean;
  nightAbilities?: Prisma.JsonValue | null;
};

export type ScenarioDefinition = {
  name: string;
  description: string;
  roles: { name: string; count: number }[];
};

export type ScenarioBackupFile = {
  version: 1;
  exportedAt: string;
  roles: RoleDefinition[];
  scenarios: ScenarioDefinition[];
};

export const SCENARIO_BACKUP_VERSION = 1;

export function mergeRoleDefinitions(...groups: RoleDefinition[][]) {
  const merged = new Map<string, RoleDefinition>();
  groups.flat().forEach((role) => {
    const previous = merged.get(role.name);
    merged.set(role.name, {
      ...previous,
      ...role,
      description: role.description || previous?.description || "",
      nightAbilities: role.nightAbilities ?? previous?.nightAbilities ?? null,
      is_permanent: role.is_permanent ?? previous?.is_permanent ?? false,
    });
  });
  return Array.from(merged.values());
}

export function standardScenarioNames() {
  return STANDARD_SCENARIO_DEFINITIONS.map((scenario) => scenario.name);
}

export const STANDARD_ROLE_DEFINITIONS: RoleDefinition[] = [
  { name: "کارآگاه", alignment: Alignment.CITIZEN, description: "هر شب یک نفر را استعلام میکند. استعلام بیشتر مافیاها مثبت است؛ رئیس مافیا و دن مافیا معمولا منفی اعلام میشوند." },
  { name: "دکتر", alignment: Alignment.CITIZEN, description: "نجات بازیکنان از شلیک شب. تعداد سیو و امکان سیو خودش بسته به سناریو تنظیم میشود." },
  { name: "رویین‌تن", alignment: Alignment.CITIZEN, description: "در شب نامیرا است و با تیر مافیا کشته نمیشود. امکان مذاکره با او بسته به سناریو متفاوت است." },
  { name: "شهروند ساده", alignment: Alignment.CITIZEN, description: "بدون توانایی خاص. کمک به تیم شهروند با رأی و استدلال." },
  { name: "محقق", alignment: Alignment.CITIZEN, description: "هر شب خودش را به یک نفر گره میزند. اگر محقق حذف شود، فرد گره‌خورده نیز حذف میشود؛ رئیس مافیا استثنا است." },
  { name: "بازپرس", alignment: Alignment.CITIZEN, description: "یک بار در طول بازی میتواند دو نفر را به دفاعیه بیاورد. هر کدام دو زمان ۳۰ ثانیه‌ای دفاع میکنند." },
  { name: "تکتیرانداز", alignment: Alignment.CITIZEN, description: "هر شب بیدار میشود اما فقط ۱ تیر دارد. شلیک به شهروند باعث خروج خودش میشود و تیر به رئیس مافیا بی‌اثر است." },
  { name: "راهنما", alignment: Alignment.CITIZEN, description: "هر شب یک نفر را انتخاب میکند. اگر شهروند باشد استعلام میگیرد، اگر مافیا باشد مافیا راهنما را میشناسد." },
  { name: "مین‌گذار", alignment: Alignment.CITIZEN, description: "یک بار جلوی خانه یک نفر مین میکارد. اگر مافیا آن شخص را شات کند، باید یک فدایی بدهد." },
  { name: "وکیل", alignment: Alignment.CITIZEN, description: "یک بار در کل بازی وکالت یک نفر را بر عهده میگیرد تا فردا وارد دفاعیه نشود." },
  { name: "محافظ", alignment: Alignment.CITIZEN, description: "خود و هدف شبانه‌اش در برابر ترور روز یاغی ایمن هستند." },
  { name: "فراماسون", alignment: Alignment.CITIZEN, description: "عضو لژ فراماسونری. شهروندی که با بیدار کردن شهروندان لینک شهروندی میسازد." },
  { name: "فرمانده", alignment: Alignment.CITIZEN, description: "پس از شلیک تکتیرانداز بیدار میشود و باید شلیک او را تأیید یا رد کند." },
  { name: "کشیش", alignment: Alignment.CITIZEN, description: "نقش مقابل سایلنسر. یک نفر را از سایلنت شدن محافظت میکند." },
  { name: "تفنگدار", alignment: Alignment.CITIZEN, description: "هر شب تفنگ توزیع میکند. تفنگ مشقی و جنگی بسته به سناریو و تعداد بازیکنان تنظیم میشود." },
  { name: "کابوی", alignment: Alignment.CITIZEN, description: "با اعلام دوئل، خودش و هدفش را وارد حذف مستقیم میکند و بازی به شب میرود." },
  { name: "قاضی", alignment: Alignment.CITIZEN, description: "یک بار در شب میتواند نتیجه رأیگیری روز گذشته را باطل کند." },
  { name: "تکاور", alignment: Alignment.CITIZEN, description: "اگر در شب توسط مافیا شات شود، بیدار شده و حق شلیک متقابل دارد." },
  { name: "نگهبان", alignment: Alignment.CITIZEN, description: "در مقابل افسونگر/گروگانگیر عمل میکند و از توانایی بازیکنان محافظت میکند." },
  { name: "سرباز", alignment: Alignment.CITIZEN, description: "تیر خود را در شب میفرستد. اگر به شهروند برسد اسنایپر میشود و اگر به مافیا برسد سرباز حذف میشود." },
  { name: "مظنون", alignment: Alignment.CITIZEN, description: "شهروندی که استعلام او برای کارآگاه مثبت است، اما در اعلام وضعیت شهروند محسوب میشود." },
  { name: "زره‌ساز", alignment: Alignment.CITIZEN, description: "مشابه دکتر تک‌سیو است و یک بار در کل بازی میتواند خودش را نجات بدهد." },
  { name: "عطار", alignment: Alignment.CITIZEN, description: "یک زهر و یک پادزهر دارد. زهر را شبانه میدهد و پادزهر با رأی فاز شب تعیین تکلیف میشود." },
  { name: "وارث", alignment: Alignment.CITIZEN, description: "شب معارفه یک نفر را انتخاب میکند و در صورت خروج او، بعضی نقش‌های مشخص به وارث میرسند." },
  { name: "کدخدا", alignment: Alignment.CITIZEN, description: "دو نفر در طول بازی میتوانند به لینک شهروندی او وصل شوند. بیدار کردن مافیای غیرخبرچین خطر مرگ کدخدا را دارد." },
  { name: "رئیس مافیا", alignment: Alignment.MAFIA, description: "شلیک شب بر عهده اوست. استعلام کارآگاه همیشه منفی است و بعضی سناریوها توانایی سوداگری/یاکوزا را به او میدهند." },
  { name: "ناتو", alignment: Alignment.MAFIA, description: "یک بار در طول بازی نقش شهروند نقشدار را حدس میزند. در شب ناتویی شلیک انجام نمیشود." },
  { name: "شیاد", alignment: Alignment.MAFIA, description: "به تنهایی به دنبال کارآگاه است. اگر کارآگاه را انتخاب کند، استعلام آن شب منفی میشود." },
  { name: "مافیا ساده", alignment: Alignment.MAFIA, description: "عضو ساده تیم مافیا. بدون توانایی خاص." },
  { name: "دن مافیا", alignment: Alignment.MAFIA, description: "استعلام منفی دارد. بسته به سناریو رأی خیانت، پادزهر، سوداگری یا دستور تیر کاپو را مدیریت میکند." },
  { name: "یاغی", alignment: Alignment.MAFIA, description: "رتبه دو مافیا. اگر دن یا هکر خارج شوند، تبدیل به تروریست میشود." },
  { name: "هکر", alignment: Alignment.MAFIA, description: "هر شب توانایی یک نفر را مختل میکند و نمیگذارد به مقصد برسد." },
  { name: "سایلنسر", alignment: Alignment.MAFIA, description: "یک نفر را در شب انتخاب میکند و او در روز بعد حق صحبت ندارد." },
  { name: "تروریست", alignment: Alignment.MAFIA, description: "تا قبل از رأیگیری میتواند یک نفر را با خود از بازی خارج کند." },
  { name: "افسونگر", alignment: Alignment.MAFIA, description: "هر شب توانایی یک شهروند را میگیرد. با تیم مافیا هماهنگ است اما اکشنش جدا ثبت میشود." },
  { name: "دکتر لکتر", alignment: Alignment.MAFIA, description: "نجات اعضای مافیا در شب." },
  { name: "جادوگر", alignment: Alignment.MAFIA, description: "هر شب یک شهروند را انتخاب میکند؛ اگر هدف توانایی داشته باشد، اثر توانایی روی خودش برمیگردد." },
  { name: "جلاد", alignment: Alignment.MAFIA, description: "مشابه ناتو، با حدس درست نقش یک بازیکن او را از بازی خارج میکند. جلادی جای شات شب انجام میشود." },
  { name: "خبرچین", alignment: Alignment.MAFIA, description: "جاسوس تیم مافیا در سناریو کاپو. اگر کدخدا او را بیدار کند، به عنوان شهروند بیدار میشود." },
  { name: "جوکر", alignment: Alignment.NEUTRAL, description: "نقش مستقل. در صورت اعدام شدن توسط رأی شهروندان، برنده بازی میشود." },
];

export const STANDARD_SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
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
  {
    name: "نماینده ۱۳ نفره",
    description: "سناریو نماینده - ۱۳ نفر | نسخه ۱۲ نفره به همراه یک شهروند ساده",
    roles: [
      { name: "دکتر", count: 1 }, { name: "راهنما", count: 1 }, { name: "مین‌گذار", count: 1 },
      { name: "وکیل", count: 1 }, { name: "محافظ", count: 1 }, { name: "سرباز", count: 1 },
      { name: "شهروند ساده", count: 3 },
      { name: "دن مافیا", count: 1 }, { name: "یاغی", count: 1 }, { name: "هکر", count: 1 },
      { name: "ناتو", count: 1 },
    ],
  },
  {
    name: "فراماسون ۱۲ نفره",
    description: "سناریو فراماسون - ۱۲ نفر | مذاکره فقط با ۲ مافیای باقیمانده",
    roles: [
      { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکتیرانداز", count: 1 },
      { name: "فرمانده", count: 1 }, { name: "کشیش", count: 1 }, { name: "تفنگدار", count: 1 },
      { name: "فراماسون", count: 1 },
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
      { name: "فراماسون", count: 1 }, { name: "فرمانده", count: 1 }, { name: "کشیش", count: 1 },
      { name: "تفنگدار", count: 1 }, { name: "کابوی", count: 1 },
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
  {
    name: "کاپو ۱۰ نفره",
    description: "سناریو کاپو - ۱۰ نفر | دن مافیا، جادوگر، جلاد و تفنگ کاپو",
    roles: [
      { name: "کارآگاه", count: 1 }, { name: "مظنون", count: 1 }, { name: "زره‌ساز", count: 1 },
      { name: "عطار", count: 1 }, { name: "وارث", count: 1 }, { name: "شهروند ساده", count: 2 },
      { name: "دن مافیا", count: 1 }, { name: "جادوگر", count: 1 }, { name: "جلاد", count: 1 },
    ],
  },
  {
    name: "کاپو ۱۲ نفره",
    description: "سناریو کاپو - ۱۲ نفر | نسخه ۱۰ نفره به همراه خبرچین و کدخدا",
    roles: [
      { name: "کارآگاه", count: 1 }, { name: "مظنون", count: 1 }, { name: "زره‌ساز", count: 1 },
      { name: "عطار", count: 1 }, { name: "وارث", count: 1 }, { name: "کدخدا", count: 1 },
      { name: "شهروند ساده", count: 2 },
      { name: "دن مافیا", count: 1 }, { name: "جادوگر", count: 1 }, { name: "جلاد", count: 1 },
      { name: "خبرچین", count: 1 },
    ],
  },
  {
    name: "کاپو ۱۳ نفره",
    description: "سناریو کاپو - ۱۳ نفر | نسخه ۱۲ نفره به همراه یک شهروند ساده",
    roles: [
      { name: "کارآگاه", count: 1 }, { name: "مظنون", count: 1 }, { name: "زره‌ساز", count: 1 },
      { name: "عطار", count: 1 }, { name: "وارث", count: 1 }, { name: "کدخدا", count: 1 },
      { name: "شهروند ساده", count: 3 },
      { name: "دن مافیا", count: 1 }, { name: "جادوگر", count: 1 }, { name: "جلاد", count: 1 },
      { name: "خبرچین", count: 1 },
    ],
  },
];
