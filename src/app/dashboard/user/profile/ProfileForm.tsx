"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfile, changePassword } from "@/actions/user";
import { signIn, useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, StatusChip } from "@/components/CommandUI";

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const OUTPUT_SIZE = 320;
const TARGET_DATA_URL_LENGTH = 150_000;

function initial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "؟";
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
  if (!file.type.startsWith("image/")) throw new Error("فقط فایل تصویری قابل بارگذاری است.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("حجم فایل اولیه زیاد است. تصویر زیر ۳ مگابایت انتخاب کنید.");

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

  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const dataUrl = canvas.toDataURL("image/webp", quality);
    if (dataUrl.length <= TARGET_DATA_URL_LENGTH) return dataUrl;
  }

  throw new Error("تصویر بعد از فشرده‌سازی هنوز بزرگ است. تصویر ساده‌تری انتخاب کنید.");
}

export default function ProfileForm({
  user,
  hasGoogleProvider,
  hasPassword,
}: {
  user: { name: string; email: string; image?: string | null };
  hasGoogleProvider?: boolean;
  hasPassword?: boolean;
}) {
  const { update } = useSession();
  const { showToast, showAlert } = usePopup();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nameValue, setNameValue] = useState(user.name || "");
  const [nameWarning, setNameWarning] = useState("");
  const [imageValue, setImageValue] = useState("");
  const [imagePreview, setImagePreview] = useState(user.image || "");
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const [result, action, isPending] = useActionState(async (_prevState: any, formData: FormData) => {
    const res = await updateProfile(formData);
    if (res.success) await update();
    return res;
  }, null);

  const [pwdResult, pwdAction, isPwdPending] = useActionState(async (_prevState: any, formData: FormData) => {
    return changePassword(formData);
  }, null);

  useEffect(() => {
    if (result?.success) showToast("پروفایل بروزرسانی شد", "success");
    else if (result?.error) showAlert("خطا", result.error, "error");
  }, [result, showAlert, showToast]);

  useEffect(() => {
    if (pwdResult?.success) showToast(hasPassword ? "رمز عبور تغییر یافت" : "رمز عبور ایجاد شد", "success");
    else if (pwdResult?.error) showAlert("خطا", pwdResult.error, "error");
  }, [pwdResult, hasPassword, showAlert, showToast]);

  const checkName = (value: string) => {
    const longPart = value.trim().split(/\s+/).find((part) => part.length > 25);
    setNameWarning(longPart ? "نام و نام خانوادگی هر کدام حداکثر ۲۵ کاراکتر هستند." : "");
  };

  const handleImageChange = async (file?: File) => {
    if (!file) return;
    setImageProcessing(true);
    try {
      const compressed = await compressProfileImage(file);
      setImageValue(compressed);
      setImagePreview(compressed);
      setRemoveProfileImage(false);
      showToast("تصویر آماده ذخیره شد", "success");
    } catch (error: any) {
      showAlert("تصویر پروفایل", error?.message || "تصویر قابل استفاده نیست.", "warning");
    } finally {
      setImageProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-5">
      <form
        action={action}
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          if (nameWarning || imageProcessing) {
            event.preventDefault();
            showAlert("فرم آماده نیست", imageProcessing ? "کمی صبر کنید تا تصویر آماده شود." : nameWarning, "warning");
          }
        }}
      >
        <input type="hidden" name="profileImage" value={imageValue} />
        <input type="hidden" name="removeProfileImage" value={removeProfileImage ? "true" : "false"} />

        <CommandSurface className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-3xl font-black text-cyan-100">
                {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : initial(nameValue)}
                <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[10px] text-white">پروفایل</span>
              </div>
              <div className="min-w-0">
                <StatusChip tone={imageValue ? "emerald" : "cyan"}>{imageValue ? "آماده ذخیره" : "تصویر بازیکن"}</StatusChip>
                <p className="mt-2 text-sm leading-6 text-zinc-400">تصویر در مرورگر کوچک و فشرده می‌شود و بعد ذخیره خواهد شد.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:w-40">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handleImageChange(event.target.files?.[0])} />
              <CommandButton type="button" onClick={() => fileInputRef.current?.click()} disabled={imageProcessing} className="w-full">
                <span className={`material-symbols-outlined text-[18px] ${imageProcessing ? "animate-spin" : ""}`}>{imageProcessing ? "progress_activity" : "upload"}</span>
                انتخاب
              </CommandButton>
              {(imagePreview || imageValue) && (
                <CommandButton
                  type="button"
                  tone="rose"
                  onClick={() => {
                    setImageValue("");
                    setImagePreview("");
                    setRemoveProfileImage(true);
                  }}
                  className="w-full"
                >
                  حذف
                </CommandButton>
              )}
            </div>
          </div>
        </CommandSurface>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-black text-zinc-400">نام و نام خانوادگی</label>
            <input
              name="name"
              value={nameValue}
              onChange={(event) => {
                setNameValue(event.target.value);
                checkName(event.target.value);
              }}
              maxLength={60}
              className="pm-input h-12 px-4"
              placeholder="نام نمایشی"
            />
            {nameWarning && <p className="mt-2 rounded-xl border border-amber-300/25 bg-amber-300/10 p-2 text-xs font-bold text-amber-100">{nameWarning}</p>}
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-zinc-400">ایمیل</label>
            <input name="email" defaultValue={user.email} dir="ltr" readOnly={hasGoogleProvider} className={`pm-input h-12 px-4 text-left ${hasGoogleProvider ? "opacity-55" : ""}`} placeholder="email@example.com" />
          </div>
        </div>

        <CommandButton type="submit" disabled={isPending} className="w-full">
          <span className="material-symbols-outlined text-[18px]">{isPending ? "progress_activity" : "save"}</span>
          ذخیره تغییرات
        </CommandButton>
      </form>

      <form action={pwdAction} noValidate className="space-y-4">
        <div>
          <p className="text-lg font-black text-zinc-50">{hasPassword ? "امنیت رمز" : "ساخت رمز عبور"}</p>
          <p className="mt-1 text-sm text-zinc-400">برای ورود با ایمیل، رمز حساب را مدیریت کنید.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {hasPassword && <input name="currentPassword" type="password" dir="ltr" className="pm-input h-12 px-4 text-left" placeholder="رمز فعلی" />}
          <input name="newPassword" type="password" dir="ltr" className="pm-input h-12 px-4 text-left" placeholder="رمز جدید" />
          <input name="confirmPassword" type="password" dir="ltr" className="pm-input h-12 px-4 text-left" placeholder="تکرار رمز جدید" />
        </div>
        <CommandButton type="submit" tone="violet" disabled={isPwdPending} className="w-full">
          <span className="material-symbols-outlined text-[18px]">password</span>
          {hasPassword ? "تغییر رمز" : "ایجاد رمز"}
        </CommandButton>
      </form>

      <CommandSurface className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-zinc-50">اتصال گوگل</p>
            <p className="mt-1 text-sm text-zinc-400">{hasGoogleProvider ? "حساب گوگل به پروفایل متصل است." : "ورود سریع و تصویر گوگل را فعال کنید."}</p>
          </div>
          {hasGoogleProvider ? (
            <StatusChip tone="emerald">متصل</StatusChip>
          ) : (
            <CommandButton tone="ghost" onClick={() => signIn("google", { callbackUrl: "/dashboard/user/profile" })}>
              اتصال گوگل
            </CommandButton>
          )}
        </div>
      </CommandSurface>
    </div>
  );
}
