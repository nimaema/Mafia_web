"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { MaskMark } from "@/components/brand/MaskMark";

/** Shown when a page crashes. Offers a retry before sending people home. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-canvas px-6 py-12 text-fg" dir="rtl">
      <div className="mx-auto w-full max-w-md">
        <MaskMark className="h-10 text-mafia" />
        <h1 className="nq-display mt-6 text-[3rem] leading-[1.1]">یک چیزی خراب شد.</h1>
        <p className="mt-3 font-medium leading-8 text-muted">این صفحه درست بارگذاری نشد. دوباره امتحان کنید؛ اگر مشکل ماند، به خانه برگردید.</p>
        {error.digest ? (
          <p className="mt-2 text-xs font-medium text-faint" dir="ltr">
            {`ref: ${error.digest}`}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="nq-btn nq-btn-primary nq-btn-lg">
            <ArrowsClockwise size={20} weight="bold" aria-hidden />
            دوباره امتحان کن
          </button>
          <Link href="/dashboard/user" className="nq-btn nq-btn-secondary nq-btn-lg">
            رفتن به خانه
          </Link>
        </div>
      </div>
    </main>
  );
}
