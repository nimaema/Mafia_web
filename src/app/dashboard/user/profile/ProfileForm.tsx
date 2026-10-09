"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, LinkBreak, PaperPlaneTilt, TelegramLogo, Trash, UploadSimple } from "@phosphor-icons/react";
import { updateProfile, changePassword } from "@/actions/user";
import { createTelegramAccountLink, unlinkTelegramAccount } from "@/actions/telegram";
import { usePopup } from "@/components/PopupProvider";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const OUTPUT_SIZE = 320;
const TARGET_DATA_URL_LENGTH = 150_000;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function compressProfileImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("فقط فایل تصویری قابل بارگذاری است.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("حجم فایل اولیه زیاد است. لطفاً تصویری زیر ۳ مگابایت انتخاب کنید.");
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("پردازش تصویر در مرورگر انجام نشد.");

  const sourceSize = Math.min(image.width, image.height);
  const sourceX = Math.max(0, (image.width - sourceSize) / 2);
  const sourceY = Math.max(0, (image.height - sourceSize) / 2);
  context.fillStyle = "#111827";
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const qualities = [0.82, 0.72, 0.62, 0.52];
  for (const quality of qualities) {
    const dataUrl = canvas.toDataURL("image/webp", quality);
    if (dataUrl.length <= TARGET_DATA_URL_LENGTH) return dataUrl;
  }

  const smallerCanvas = document.createElement("canvas");
  smallerCanvas.width = 240;
  smallerCanvas.height = 240;
  const smallerContext = smallerCanvas.getContext("2d");
  if (!smallerContext) throw new Error("پردازش تصویر در مرورگر انجام نشد.");
  smallerContext.drawImage(canvas, 0, 0, 240, 240);
  const compact = smallerCanvas.toDataURL("image/webp", 0.52);
  if (compact.length > TARGET_DATA_URL_LENGTH) {
    throw new Error("تصویر بعد از فشرده‌سازی هنوز بزرگ است. لطفاً تصویر ساده‌تری انتخاب کنید.");
  }
  return compact;
}

export default function ProfileForm({
  user,
  hasGoogleProvider,
  hasPassword,
  telegramAccount,
}: {
  user: { name: string, email: string, image?: string | null },
  hasGoogleProvider?: boolean,
  hasPassword?: boolean,
  telegramAccount?: { username?: string | null, firstName?: string | null, lastName?: string | null, linkedAt?: string | null } | null,
}) {
  const router = useRouter();
  const { update } = useSession();
  const { showToast, showAlert, showConfirm } = usePopup();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nameValue, setNameValue] = useState(user.name || "");
  const [nameWarning, setNameWarning] = useState("");
  const [imageValue, setImageValue] = useState("");
  const [imagePreview, setImagePreview] = useState(user.image || "");
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [imageWarning, setImageWarning] = useState("");
  const [imageProcessing, setImageProcessing] = useState(false);
  const [telegramPending, setTelegramPending] = useState(false);
  const telegramName = telegramAccount?.username
    ? `@${telegramAccount.username}`
    : [telegramAccount?.firstName, telegramAccount?.lastName].filter(Boolean).join(" ") || "تلگرام";

  const checkName = (value: string) => {
    const longPart = value.trim().split(/\s+/).find((part) => part.length > 25);
    setNameWarning(longPart ? "نام و نام خانوادگی هر کدام حداکثر ۲۵ کاراکتر هستند." : "");
  };

  const [result, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await updateProfile(formData);
      if (res.success) {
        await update(); 
      }
      return res;
    },
    null
  );

  const [pwdResult, pwdAction, isPwdPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await changePassword(formData);
      return res;
    },
    null
  );

  useEffect(() => {
    if (result?.success) showToast("مشخصات ذخیره شد", "success");
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pwdResult?.success) showToast(hasPassword ? "رمز عبور عوض شد" : "رمز عبور ساخته شد", "success");
  }, [pwdResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageChange = async (file?: File) => {
    if (!file) return;
    setImageProcessing(true);
    setImageWarning("");
    try {
      const compressed = await compressProfileImage(file);
      setImageValue(compressed);
      setImagePreview(compressed);
      setRemoveProfileImage(false);
    } catch (error: any) {
      setImageWarning(error?.message || "این تصویر قابل استفاده نیست.");
    } finally {
      setImageProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLinkTelegram = async () => {
    setTelegramPending(true);
    try {
      const result = await createTelegramAccountLink();
      if (result.success && result.link) {
        window.open(result.link, "_blank", "noopener,noreferrer");
        showToast("تلگرام باز شد؛ دکمه Start ربات را بزنید.", "success");
      } else {
        showAlert("اتصال تلگرام", result.error || "لینک اتصال ساخته نشد.", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("اتصال تلگرام", "اتصال به سرور انجام نشد.", "error");
    } finally {
      setTelegramPending(false);
    }
  };

  const handleUnlinkTelegram = () => {
    showConfirm("قطع اتصال تلگرام", "ربات دیگر حساب شما را نمی‌شناسد تا دوباره از پروفایل لینک کنید. ادامه می‌دهید؟", async () => {
      setTelegramPending(true);
      try {
        const result = await unlinkTelegramAccount();
        if (result.success) {
          showToast("تلگرام از حساب جدا شد", "success");
          router.refresh();
        } else {
          showAlert("قطع اتصال تلگرام", result.error || "قطع اتصال انجام نشد.", "error");
        }
      } catch (error) {
        console.error(error);
        showAlert("قطع اتصال تلگرام", "ارتباط با سرور انجام نشد.", "error");
      } finally {
        setTelegramPending(false);
      }
    }, "warning");
  };

  const [formError, setFormError] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-10">
      <form
        action={action}
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          setFormError(null);
          const formData = new FormData(event.currentTarget);
          const problem = !String(formData.get("name") || "").trim() || !String(formData.get("email") || "").trim()
            ? "نام و ایمیل را کامل وارد کنید."
            : nameWarning || (imageProcessing ? "کمی صبر کنید تا تصویر آماده شود." : imageWarning);
          if (problem) {
            event.preventDefault();
            setFormError(problem);
          }
        }}
      >
        <h2 className="text-lg font-extrabold">مشخصات</h2>
        <input type="hidden" name="profileImage" value={imageValue} />
        <input type="hidden" name="removeProfileImage" value={removeProfileImage ? "true" : "false"} />

        {formError || result?.error ? <Notice tone="danger">{formError || result?.error}</Notice> : null}

        <div className="flex items-center gap-4 rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-line">
          <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[1rem] bg-raised text-sm font-bold text-muted">
            {imagePreview ? <img src={imagePreview} alt="" className="size-full object-cover" /> : "عکس"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">عکس پروفایل</p>
            <p className="text-sm font-medium leading-6 text-muted">اختیاری. سر میز همه با نقابتان شما را می‌شناسند.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handleImageChange(event.target.files?.[0])} />
          <div className="flex shrink-0 gap-1.5">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageProcessing} className="nq-icon-btn" aria-label="انتخاب عکس">
              {imageProcessing ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : <UploadSimple size={20} weight="bold" aria-hidden />}
            </button>
            {imagePreview || imageValue ? (
              <button
                type="button"
                onClick={() => {
                  setImageValue("");
                  setImagePreview("");
                  setRemoveProfileImage(true);
                  setImageWarning("");
                }}
                className="nq-icon-btn hover:!text-danger"
                aria-label="حذف عکس"
              >
                <Trash size={20} weight="bold" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
        {imageWarning ? <Notice tone="warning">{imageWarning}</Notice> : null}
        {imageValue.startsWith("data:image/") ? <p className="text-sm font-bold text-accent">عکس تازه آماده است. برای ثبت، ذخیره را بزنید.</p> : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="نام"
            name="name"
            value={nameValue}
            maxLength={60}
            onChange={(event) => {
              setNameValue(event.target.value);
              checkName(event.target.value);
            }}
            error={nameWarning || null}
            hint="همین نام سر میز و در گزارش بازی دیده می‌شود."
          />
          <Field
            label="ایمیل"
            name="email"
            type="email"
            dir="ltr"
            defaultValue={user.email}
            readOnly={hasGoogleProvider}
            hint={hasGoogleProvider ? "ایمیل حساب گوگل قابل تغییر نیست." : undefined}
            className={hasGoogleProvider ? "opacity-70" : ""}
          />
        </div>

        <button type="submit" disabled={isPending} className="nq-btn nq-btn-primary nq-btn-lg self-start">
          {isPending ? "در حال ذخیره…" : "ذخیره مشخصات"}
          {!isPending ? <Check size={20} weight="bold" aria-hidden /> : null}
        </button>
      </form>

      <form
        action={pwdAction}
        noValidate
        className="flex flex-col gap-5 border-t border-line pt-10"
        onSubmit={(event) => {
          setPwdError(null);
          const formData = new FormData(event.currentTarget);
          if (!String(formData.get("newPassword") || "") || !String(formData.get("confirmPassword") || "") || (hasPassword && !String(formData.get("currentPassword") || ""))) {
            event.preventDefault();
            setPwdError("همه خانه‌های رمز عبور را پر کنید.");
          }
        }}
      >
        <div>
          <h2 className="text-lg font-extrabold">{hasPassword ? "تغییر رمز عبور" : "ساخت رمز عبور"}</h2>
          <p className="mt-0.5 text-sm font-medium text-muted">{hasPassword ? "برای امنیت، رمز فعلی را هم وارد کنید." : "با رمز عبور می‌توانید بدون گوگل هم وارد شوید."}</p>
        </div>
        {pwdError || pwdResult?.error ? <Notice tone="danger">{pwdError || pwdResult?.error}</Notice> : null}
        <div className="grid gap-5 md:grid-cols-3">
          {hasPassword ? <Field label="رمز فعلی" name="currentPassword" type="password" dir="ltr" autoComplete="current-password" /> : null}
          <Field label="رمز تازه" name="newPassword" type="password" dir="ltr" autoComplete="new-password" />
          <Field label="تکرار رمز تازه" name="confirmPassword" type="password" dir="ltr" autoComplete="new-password" />
        </div>
        <button type="submit" disabled={isPwdPending} className="nq-btn nq-btn-secondary nq-btn-lg self-start">
          {isPwdPending ? "در حال ذخیره…" : hasPassword ? "عوض کردن رمز" : "ساخت رمز"}
        </button>
      </form>

      <section className="flex flex-col gap-3 border-t border-line pt-10" aria-labelledby="connections-title">
        <h2 id="connections-title" className="text-lg font-extrabold">
          حساب‌های متصل
        </h2>
        <ul className="divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-surface">
          <li className="flex items-center gap-4 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-[0.85rem] bg-raised">
              <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">گوگل</p>
              <p className="text-sm font-medium text-muted">{hasGoogleProvider ? "متصل است. می‌توانید با گوگل وارد شوید." : "برای ورود سریع‌تر وصل کنید."}</p>
            </div>
            {hasGoogleProvider ? (
              <span className="nq-tag bg-success/14 text-success">متصل</span>
            ) : (
              <button type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard/user/profile" })} className="nq-btn nq-btn-secondary nq-btn-sm">
                اتصال
              </button>
            )}
          </li>
          <li className="flex items-center gap-4 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-[0.85rem] bg-raised text-[#29a9eb]">
              <TelegramLogo size={24} weight="fill" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">ربات تلگرام</p>
              <p className="text-sm font-medium text-muted">{telegramAccount ? `متصل به ${telegramName}` : "برای پیوستن به لابی و دیدن نقش از داخل تلگرام."}</p>
            </div>
            {telegramAccount ? (
              <button type="button" onClick={handleUnlinkTelegram} disabled={telegramPending} className="nq-btn nq-btn-ghost nq-btn-sm text-danger">
                <LinkBreak size={16} weight="bold" aria-hidden />
                قطع
              </button>
            ) : (
              <button type="button" onClick={handleLinkTelegram} disabled={telegramPending} className="nq-btn nq-btn-secondary nq-btn-sm">
                <PaperPlaneTilt size={16} weight="bold" aria-hidden />
                اتصال
              </button>
            )}
          </li>
        </ul>
      </section>
    </div>
  );
}
