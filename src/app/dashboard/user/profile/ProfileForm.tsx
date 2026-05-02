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
    <div className="grid gap-5">
    <form action={action} noValidate className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.03]" onSubmit={(event) => {
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
      <div className="mb-5 flex items-start gap-3">
        <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-xl text-zinc-950 shadow-sm shadow-lime-500/20">manage_accounts</span>
        <div>
          <h3 className="text-xl font-black text-zinc-950 dark:text-white">اطلاعات پروفایل</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">نام نمایشی و ایمیل حساب را مدیریت کنید.</p>
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950/50">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white text-3xl font-black text-zinc-400 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="size-full object-cover" />
              ) : (
                getInitial(nameValue)
              )}
              <span className="absolute inset-x-0 bottom-0 bg-zinc-950/70 py-1 text-center text-[9px] font-black text-white">
                پروفایل
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-zinc-950 dark:text-white">تصویر بازیکن</p>
              <p className="mt-1 max-w-lg text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                یک تصویر واضح انتخاب کنید تا در لابی و صفحه بازی کنار نام شما نمایش داده شود.
              </p>
              {imageValue.startsWith("data:image/") && (
                <p className="mt-2 inline-flex rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-1 text-[10px] font-black text-lime-700 dark:text-lime-300">
                  تصویر آماده ذخیره است
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:w-44">
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
              className="ui-button-primary min-h-10 px-3 text-xs"
            >
              <span className={`material-symbols-outlined text-base ${imageProcessing ? "animate-spin" : ""}`}>{imageProcessing ? "refresh" : "upload"}</span>
              {imageProcessing ? "پردازش..." : "انتخاب تصویر"}
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
                className="ui-button-secondary min-h-10 px-3 text-xs text-red-600 dark:text-red-300"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                حذف تصویر
              </button>
            )}
          </div>
        </div>
        {imageWarning && (
          <p className="border-t border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-700 dark:text-amber-300">
            {imageWarning}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">نام و نام خانوادگی</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">person</span>
          <input 
            type="text" 
            name="name" 
            value={nameValue}
            onChange={(event) => {
              setNameValue(event.target.value);
              checkName(event.target.value);
            }}
            maxLength={60}
            className="w-full pl-10 pr-4"
          />
        </div>
        {nameWarning && (
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300">
            {nameWarning}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">ایمیل</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">mail</span>
          <input 
            type="email" 
            name="email" 
            defaultValue={user.email} 
            dir="ltr"
            readOnly={hasGoogleProvider}
            className={`w-full pl-10 pr-4 ${hasGoogleProvider ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="ui-button-primary mt-5 min-h-12 w-full"
      >
        {isPending ? (
          <span className="material-symbols-outlined animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined">save</span>
        )}
        ذخیره تغییرات
      </button>
    </form>

    <form action={pwdAction} noValidate className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/50" onSubmit={(event) => {
      const formData = new FormData(event.currentTarget);
      if (!String(formData.get("newPassword") || "") || !String(formData.get("confirmPassword") || "") || (hasPassword && !String(formData.get("currentPassword") || ""))) {
        event.preventDefault();
        showAlert("فرم ناقص است", "فیلدهای رمز عبور را کامل وارد کنید.", "warning");
      }
    }}>
      <div className="mb-5 flex items-start gap-3">
        <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-xl text-white shadow-sm shadow-sky-500/20">encrypted</span>
        <div>
          <h3 className="text-xl font-black text-zinc-950 dark:text-white">{hasPassword ? "تغییر رمز عبور" : "ایجاد رمز عبور"}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">برای ورود مستقیم با ایمیل، رمز حساب را امن نگه دارید.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
      {hasPassword && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">رمز عبور فعلی</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">lock</span>
            <input 
              type="password" 
              name="currentPassword" 
              dir="ltr"
              className="w-full pl-10 pr-4"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">رمز عبور جدید</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">key</span>
          <input 
            type="password" 
            name="newPassword" 
            dir="ltr"
            className="w-full pl-10 pr-4"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">تکرار رمز عبور جدید</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">key</span>
          <input 
            type="password" 
            name="confirmPassword" 
            dir="ltr"
            className="w-full pl-10 pr-4"
          />
        </div>
      </div>
      </div>

      <button 
        type="submit" 
        disabled={isPwdPending}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400 disabled:opacity-50"
      >
        {isPwdPending ? (
          <span className="material-symbols-outlined animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined">password</span>
        )}
        {hasPassword ? "تغییر رمز" : "ایجاد رمز"}
      </button>
    </form>

    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-5 flex items-start gap-3">
        <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xl text-white shadow-sm shadow-zinc-950/20 dark:bg-white dark:text-zinc-950">linked_services</span>
        <div>
          <h3 className="text-xl font-black text-zinc-950 dark:text-white">اتصال حساب‌ها</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">ورود سریع‌تر و تصویر پروفایل گوگل از اینجا مدیریت می‌شود.</p>
        </div>
      </div>
      {hasGoogleProvider ? (
        <div className="flex items-center justify-between rounded-lg border border-lime-500/20 bg-lime-500/10 p-4">
          <div className="flex items-center gap-3">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            <div>
              <span className="font-black text-zinc-950 dark:text-white">حساب گوگل</span>
              <p className="mt-1 text-xs font-bold text-lime-700 dark:text-lime-300">تصویر و تایید ایمیل از گوگل دریافت می‌شود.</p>
            </div>
          </div>
          <span className="rounded-lg border border-lime-500/20 bg-white px-3 py-1 text-xs font-black text-lime-600 dark:bg-zinc-950 dark:text-lime-300">متصل</span>
        </div>
      ) : (
        <button 
          onClick={() => signIn("google", { callbackUrl: "/dashboard/user/profile" })}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-black text-zinc-950 transition-colors hover:bg-white dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/[0.06]"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          اتصال به حساب گوگل
        </button>
      )}
    </div>

    </div>
  );
}
