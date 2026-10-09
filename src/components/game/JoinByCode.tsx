"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "@phosphor-icons/react";
import { joinGame } from "@/actions/game";
import { Notice } from "@/components/ui/Notice";

/** Accept Persian/Arabic digits as typed on Persian keyboards. */
function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 6);
}

export function JoinByCode({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError("کد بازی شش رقم است. آن را از گرداننده بگیرید.");
      return;
    }
    setPending(true);
    const name = (session?.user?.name || session?.user?.email || "").trim();
    const result = await joinGame(code, name, password || undefined);
    setPending(false);
    if (result.success) {
      router.push(`/lobby/${result.gameId}`);
      return;
    }
    const message = result.error || "پیوستن به بازی انجام نشد.";
    if (message.includes("رمز")) {
      if (needsPassword) setError("رمز لابی درست نیست.");
      setNeedsPassword(true);
      window.setTimeout(() => passwordRef.current?.focus(), 50);
      return;
    }
    setError(message === "بازی یافت نشد" ? "بازی‌ای با این کد پیدا نشد. کد را دوباره بررسی کنید." : message);
  };

  return (
    <form onSubmit={submit} noValidate className={`flex flex-col gap-3 ${className}`}>
      <label htmlFor="join-code" className="font-extrabold">
        کد بازی را از گرداننده بگیرید
      </label>
      <div className="flex gap-2">
        <input
          id="join-code"
          value={code}
          onChange={(event) => setCode(normalizeDigits(event.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          dir="ltr"
          placeholder="۰۰۰۰۰۰"
          aria-invalid={error ? true : undefined}
          className="min-h-14 flex-1 text-center text-2xl font-black tracking-[0.35em] tabular-nums placeholder:tracking-[0.35em]"
        />
        <button type="submit" disabled={pending} className="nq-btn nq-btn-primary nq-btn-lg w-14 shrink-0 px-0" aria-label="پیوستن به بازی">
          {pending ? <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : <ArrowLeft size={22} weight="bold" aria-hidden />}
        </button>
      </div>
      {needsPassword ? (
        <input
          ref={passwordRef}
          type="password"
          dir="ltr"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-label="رمز لابی"
          placeholder="این لابی رمز دارد"
        />
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </form>
  );
}
