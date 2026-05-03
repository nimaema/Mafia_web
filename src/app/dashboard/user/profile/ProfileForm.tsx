"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfile, changePassword } from "@/actions/user";
import { signIn, useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";
import { useEffect } from "react";

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const OUTPUT_SIZE = 320;
const TARGET_DATA_URL_LENGTH = 150_000;

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "؟";
}

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
}: {
  user: { name: string, email: string, image?: string | null },
  hasGoogleProvider?: boolean,
  hasPassword?: boolean,
}) {
  const { update } = useSession();
  const { showToast, showAlert } = usePopup();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nameValue, setNameValue] = useState(user.name || "");
  const [nameWarning, setNameWarning] = useState("");
  const [imageValue, setImageValue] = useState("");
  const [imagePreview, setImagePreview] = useState(user.image || "");
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [imageWarning, setImageWarning] = useState("");
  const [imageProcessing, setImageProcessing] = useState(false);

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
    if (result?.success) {
      showToast("پروفایل با موفقیت بروزرسانی شد", "success");
    } else if (result?.error) {
      showAlert("خطا", result.error || "خطا در بروزرسانی", "error");
    }
  }, [result]);

  useEffect(() => {
    if (pwdResult?.success) {
      showToast(hasPassword ? "رمز عبور تغییر یافت" : "رمز عبور ایجاد شد", "success");
    } else if (pwdResult?.error) {
      showAlert("خطا", pwdResult.error || "خطا در تغییر رمز عبور", "error");
    }
  }, [pwdResult]);

  const handleImageChange = async (file?: File) => {
    if (!file) return;
    setImageProcessing(true);
    setImageWarning("");
    try {
      const compressed = await compressProfileImage(file);
      setImageValue(compressed);
      setImagePreview(compressed);
      setRemoveProfileImage(false);
      showToast("تصویر آماده ذخیره شد", "success");
    } catch (error: any) {
      const message = error?.message || "تصویر قابل استفاده نیست.";
      setImageWarning(message);
      showAlert("تصویر پروفایل", message, "warning");
    } finally {
      setImageProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-6">
      <form action={action} noValidate className="border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]" onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        if (!String(formData.get("name") || "").trim() || !String(formData.get("email") || "").trim()) {
          event.preventDefault();
          showAlert("فرم ناقص است", "نام و ایمیل را کامل وارد کنید.", "warning");
        }
        if (nameWarning) {
          event.preventDefault();
          showAlert("نام طولانی است", nameWarning, "warning");
        }
        if (imageWarning || imageProcessing) {
          event.preventDefault();
          showAlert("تصویر پروفایل", imageProcessing ? "کمی صبر کنید تا تصویر آماده شود." : imageWarning, "warning");
        }
      }}>
        <input type="hidden" name="profileImage" value={imageValue} />
        <input type="hidden" name="removeProfileImage" value={removeProfileImage ? "true" : "false"} />

        <div className="mb-8 flex items-start gap-4">
          <span className="material-symbols-outlined flex size-12 shrink-0 items-center justify-center bg-zinc-900 text-white dark:bg-white dark:text-black">manage_accounts</span>
          <div>
            <h3 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">اطلاعات پروفایل</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">نام نمایشی و ایمیل حساب را مدیریت کنید.</p>
          </div>
        </div>

        <div className="mb-6 border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#151515]">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden border-2 border-zinc-200 bg-white text-4xl font-black text-zinc-300 dark:border-white/10 dark:bg-black dark:text-zinc-800">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="size-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" />
                ) : (
                  getInitial(nameValue)
                )}
                <span className="absolute inset-x-0 bottom-0 bg-black/80 py-1 text-center text-[10px] font-black tracking-widest text-white uppercase">
                  پروفایل
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-black text-zinc-900 dark:text-white">تصویر بازیکن</p>
                <p className="mt-2 max-w-lg text-xs leading-relaxed font-medium text-zinc-500 dark:text-zinc-400">
                  یک تصویر واضح انتخاب کنید تا در لابی و صفحه بازی کنار نام شما نمایش داده شود.
                </p>
                {imageValue.startsWith("data:image/") && (
                  <p className="mt-3 inline-flex border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-widest font-black text-red-600 dark:text-red-400">
                    تصویر آماده ذخیره است
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:w-48">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleImageChange(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageProcessing}
                className="group relative h-10 w-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-black overflow-hidden transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className={`material-symbols-outlined text-base ${imageProcessing ? "animate-spin" : ""}`}>{imageProcessing ? "refresh" : "upload"}</span>
                  {imageProcessing ? "پردازش..." : "انتخاب تصویر"}
                </span>
              </button>
              {(imagePreview || imageValue) && (
                <button
                  type="button"
                  onClick={() => {
                    setImageValue("");
                    setImagePreview("");
                    setRemoveProfileImage(true);
                    setImageWarning("");
                  }}
                  className="group relative h-10 w-full border border-red-500/30 bg-transparent text-red-600 dark:text-red-400 text-[10px] uppercase tracking-widest font-black hover:bg-red-500/10 transition-colors"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">delete</span>
                    حذف تصویر
                  </span>
                </button>
              )}
            </div>
          </div>
          {imageWarning && (
            <p className="border-t border-red-500/30 bg-red-500/10 px-6 py-4 text-xs font-bold text-red-600 dark:text-red-400">
              {imageWarning}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400">نام و نام خانوادگی</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors">person</span>
              <input
                type="text"
                name="name"
                value={nameValue}
                onChange={(event) => {
                  setNameValue(event.target.value);
                  checkName(event.target.value);
                }}
                maxLength={60}
                className="w-full pl-12 pr-4 py-3 bg-zinc-100 dark:bg-[#151515] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            {nameWarning && (
              <p className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-400 mt-2">
                {nameWarning}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400">ایمیل</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">mail</span>
              <input
                type="email"
                name="email"
                defaultValue={user.email}
                dir="ltr"
                readOnly={hasGoogleProvider}
                className={`w-full pl-12 pr-4 py-3 bg-zinc-100 dark:bg-[#151515] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors ${hasGoogleProvider ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="group relative w-full h-12 bg-red-600 dark:bg-[#98000b] text-white font-black overflow-hidden mt-8 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
            {isPending ? (
              <span className="material-symbols-outlined animate-spin text-base">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-base">save</span>
            )}
            ذخیره تغییرات
          </span>
        </button>
      </form>

      <form action={pwdAction} noValidate className="border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]" onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        if (!String(formData.get("newPassword") || "") || !String(formData.get("confirmPassword") || "") || (hasPassword && !String(formData.get("currentPassword") || ""))) {
          event.preventDefault();
          showAlert("فرم ناقص است", "فیلدهای رمز عبور را کامل وارد کنید.", "warning");
        }
      }}>
        <div className="mb-8 flex items-start gap-4">
          <span className="material-symbols-outlined flex size-12 shrink-0 items-center justify-center bg-zinc-900 text-white dark:bg-white dark:text-black">encrypted</span>
          <div>
            <h3 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">{hasPassword ? "تغییر رمز عبور" : "ایجاد رمز عبور"}</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">برای ورود مستقیم با ایمیل، رمز حساب را امن نگه دارید.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {hasPassword && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400">رمز عبور فعلی</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors">lock</span>
                <input
                  type="password"
                  name="currentPassword"
                  dir="ltr"
                  className="w-full pl-12 pr-4 py-3 bg-zinc-100 dark:bg-[#151515] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400">رمز عبور جدید</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors">key</span>
              <input
                type="password"
                name="newPassword"
                dir="ltr"
                className="w-full pl-12 pr-4 py-3 bg-zinc-100 dark:bg-[#151515] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400">تکرار رمز عبور جدید</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors">key</span>
              <input
                type="password"
                name="confirmPassword"
                dir="ltr"
                className="w-full pl-12 pr-4 py-3 bg-zinc-100 dark:bg-[#151515] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPwdPending}
          className="group relative w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-black font-black overflow-hidden mt-8 transition-all disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
            {isPwdPending ? (
              <span className="material-symbols-outlined animate-spin text-base">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-base">password</span>
            )}
            {hasPassword ? "تغییر رمز" : "ایجاد رمز"}
          </span>
        </button>
      </form>

      <div className="border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]">
        <div className="mb-8 flex items-start gap-4">
          <span className="material-symbols-outlined flex size-12 shrink-0 items-center justify-center bg-zinc-900 text-white dark:bg-white dark:text-black">linked_services</span>
          <div>
            <h3 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">اتصال حساب‌ها</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">ورود سریع‌تر و تصویر پروفایل گوگل از اینجا مدیریت می‌شود.</p>
          </div>
        </div>
        {hasGoogleProvider ? (
          <div className="flex items-center justify-between border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-[#151515]">
            <div className="flex items-center gap-4">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-8 h-8 grayscale opacity-80" />
              <div>
                <span className="font-black text-[10px] uppercase tracking-widest text-zinc-900 dark:text-white">حساب گوگل</span>
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">تصویر و تایید ایمیل از گوگل دریافت می‌شود.</p>
              </div>
            </div>
            <span className="border border-green-500/30 bg-green-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">متصل</span>
          </div>
        ) : (
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard/user/profile" })}
            className="group relative flex h-14 w-full items-center justify-center gap-3 border border-zinc-200 bg-zinc-50 px-4 py-3 font-black text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:bg-[#151515] dark:text-white dark:hover:bg-white/5"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
            <span className="text-[10px] uppercase tracking-widest">اتصال به حساب گوگل</span>
          </button>
        )}
      </div>

    </div>
  );
}
