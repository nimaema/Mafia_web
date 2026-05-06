"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getAdminSuggestionRequests, reviewSuggestionRequest } from "@/actions/suggestions";
import { usePopup } from "@/components/PopupProvider";

type SuggestionType = "NEW_ROLE" | "NEW_SCENARIO" | "CHANGE_ROLE" | "CHANGE_SCENARIO";
type SuggestionStatus = "PENDING" | "APPROVED" | "REJECTED";
type StatusFilter = SuggestionStatus | "ALL";
type ReviewDecision = "APPROVED" | "REJECTED";
type Alignment = "CITIZEN" | "MAFIA" | "NEUTRAL";

type SuggestionRequest = {
  id: string;
  type: SuggestionType;
  status: SuggestionStatus;
  title: string;
  description: string;
  adminNote?: string | null;
  payload?: any;
  user?: { id: string; name: string | null; email: string | null; image: string | null } | null;
  targetRole?: { id: string; name: string; alignment: Alignment; description?: string | null } | null;
  targetScenario?: { id: string; name: string; description?: string | null } | null;
  createdRole?: { id: string; name: string; alignment: Alignment } | null;
  createdScenario?: { id: string; name: string } | null;
  reviewedBy?: { name: string | null; email: string | null } | null;
  createdAt: string;
  reviewedAt?: string | null;
};

const REQUEST_TYPES: Record<SuggestionType, { label: string; icon: string; tone: string; approval: string }> = {
  NEW_ROLE: {
    label: "نقش جدید",
    icon: "theater_comedy",
    tone: "from-cyan-400 to-sky-500",
    approval: "با تایید، یک نقش جدید در کتابخانه نقش‌ها ساخته می‌شود.",
  },
  NEW_SCENARIO: {
    label: "سناریوی جدید",
    icon: "account_tree",
    tone: "from-violet-400 to-fuchsia-500",
    approval: "با تایید، یک سناریوی جدید ساخته می‌شود و بعداً می‌توانید ترکیب نقش‌ها را تکمیل کنید.",
  },
  CHANGE_ROLE: {
    label: "اصلاح نقش",
    icon: "edit_note",
    tone: "from-emerald-400 to-teal-500",
    approval: "با تایید، تغییرهای پیشنهادی روی نقش انتخاب‌شده اعمال می‌شود.",
  },
  CHANGE_SCENARIO: {
    label: "اصلاح سناریو",
    icon: "rule_settings",
    tone: "from-amber-300 to-orange-500",
    approval: "با تایید، نام یا توضیح سناریوی انتخاب‌شده بروزرسانی می‌شود.",
  },
};

const STATUS_META: Record<SuggestionStatus, { label: string; icon: string; className: string }> = {
  PENDING: { label: "در انتظار بررسی", icon: "hourglass_top", className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  APPROVED: { label: "تایید شد", icon: "task_alt", className: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
  REJECTED: { label: "رد شد", icon: "block", className: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300" },
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "APPROVED", label: "تاییدشده" },
  { value: "REJECTED", label: "ردشده" },
];

function userInitial(user?: SuggestionRequest["user"]) {
  const source = (user?.name || user?.email || "?").trim();
  return source.slice(0, 1).toUpperCase();
}

function alignmentLabel(alignment?: Alignment | null) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function formatDate(value?: string | null) {
  if (!value) return "ثبت نشده";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function payloadRows(payload?: any) {
  if (!payload) return [];
  return [
    payload.proposedName ? { label: "نام پیشنهادی", value: payload.proposedName } : null,
    payload.proposedAlignment ? { label: "جبهه پیشنهادی", value: alignmentLabel(payload.proposedAlignment) } : null,
    payload.proposedDescription ? { label: "متن پیشنهادی", value: payload.proposedDescription } : null,
  ].filter(Boolean) as { label: string; value: string }[];
}

export function AdminSuggestionRequestsPanel() {
  const { showAlert, showConfirm, showToast } = usePopup();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [requests, setRequests] = useState<SuggestionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((request) => request.status === "PENDING").length,
      approved: requests.filter((request) => request.status === "APPROVED").length,
      rejected: requests.filter((request) => request.status === "REJECTED").length,
    };
  }, [requests]);

  const loadRequests = (nextFilter = filter) => {
    setLoading(true);
    startTransition(async () => {
      try {
        const data = await getAdminSuggestionRequests(nextFilter);
        setRequests(data as SuggestionRequest[]);
      } catch (error: any) {
        showAlert("درخواست‌ها بارگذاری نشد", error.message || "اطلاعات درخواست‌ها خوانده نشد.", "error");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    loadRequests(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const review = (request: SuggestionRequest, decision: ReviewDecision) => {
    const meta = REQUEST_TYPES[request.type];
    const title = decision === "APPROVED" ? "تایید درخواست" : "رد درخواست";
    const message =
      decision === "APPROVED"
        ? `${meta.approval} ادامه می‌دهید؟`
        : "این درخواست رد می‌شود و کاربر پاسخ مدیر را در صفحه درخواست‌های خود می‌بیند. ادامه می‌دهید؟";

    showConfirm(
      title,
      message,
      () => {
        setActiveId(request.id);
        startTransition(async () => {
          try {
            await reviewSuggestionRequest(request.id, {
              decision,
              adminNote: notes[request.id] || "",
            });
            showToast(decision === "APPROVED" ? "درخواست تایید و اعمال شد" : "درخواست رد شد", decision === "APPROVED" ? "success" : "info");
            await loadRequests(filter);
          } catch (error: any) {
            showAlert("بررسی درخواست انجام نشد", error.message || "درخواست قابل اعمال نیست.", "error");
          } finally {
            setActiveId(null);
          }
        });
      },
      decision === "APPROVED" ? "warning" : "error"
    );
  };

  return (
    <div className="space-y-5" dir="rtl">
      <section className="ui-card overflow-hidden">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="ui-kicker">مدیریت پیشنهادها</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">درخواست‌های نقش و سناریو</h1>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-7 text-zinc-500 dark:text-zinc-400">
              این صفحه درخواست‌های کاربران برای نقش جدید، سناریوی جدید یا اصلاح موارد موجود را یک‌جا نشان می‌دهد. تایید درخواست می‌تواند تغییر را مستقیم روی کتابخانه اعمال کند.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center sm:min-w-[28rem]">
            <div className="rounded-xl border border-zinc-200 bg-white/72 p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xl font-black text-zinc-950 dark:text-white">{stats.total}</p>
              <p className="mt-1 text-[10px] font-black text-zinc-500 dark:text-zinc-400">کل</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xl font-black text-amber-700 dark:text-amber-300">{stats.pending}</p>
              <p className="mt-1 text-[10px] font-black text-amber-700/70 dark:text-amber-300/70">در انتظار</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
              <p className="text-xl font-black text-cyan-700 dark:text-cyan-300">{stats.approved}</p>
              <p className="mt-1 text-[10px] font-black text-cyan-700/70 dark:text-cyan-300/70">تایید</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-xl font-black text-red-600 dark:text-red-300">{stats.rejected}</p>
              <p className="mt-1 text-[10px] font-black text-red-600/70 dark:text-red-300/70">رد</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ui-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-black transition-all ${
                  filter === item.value
                    ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-800 dark:text-cyan-200"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-cyan-500/25 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => loadRequests(filter)} disabled={loading || isPending} className="ui-button-secondary min-h-10 px-3 text-xs">
            <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>refresh</span>
            بروزرسانی
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-96 items-center justify-center p-8">
            <span className="material-symbols-outlined animate-spin text-4xl text-cyan-600">progress_activity</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex min-h-96 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="ui-icon size-16">
              <span className="material-symbols-outlined text-3xl text-zinc-400">rate_review</span>
            </div>
            <p className="font-black text-zinc-950 dark:text-white">درخواستی برای این فیلتر وجود ندارد</p>
            <p className="max-w-sm text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400">وقتی کاربران پیشنهادی ثبت کنند، کارت بررسی آن اینجا نمایش داده می‌شود.</p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 xl:grid-cols-2">
            {requests.map((request) => {
              const typeMeta = REQUEST_TYPES[request.type];
              const status = STATUS_META[request.status];
              const rows = payloadRows(request.payload);
              const isBusy = activeId === request.id && isPending;
              return (
                <article key={request.id} className="motion-surface overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/60">
                  <div className={`h-1.5 bg-gradient-to-l ${typeMeta.tone}`} />
                  <div className="space-y-4 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${typeMeta.tone} text-white shadow-lg shadow-zinc-950/10`}>
                          <span className="material-symbols-outlined text-2xl">{typeMeta.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">{typeMeta.label}</span>
                            <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-black ${status.className}`}>
                              <span className="material-symbols-outlined text-sm">{status.icon}</span>
                              {status.label}
                            </span>
                          </div>
                          <h2 className="mt-2 line-clamp-2 text-lg font-black leading-7 text-zinc-950 dark:text-white">{request.title}</h2>
                          <p className="mt-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{formatDate(request.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-sm font-black text-zinc-950 shadow-sm shadow-zinc-950/5 dark:bg-white/[0.08] dark:text-white">
                        {request.user?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={request.user.image} alt="" className="size-full object-cover" />
                        ) : (
                          <span>{userInitial(request.user)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{request.user?.name || "کاربر بدون نام"}</p>
                        <p className="truncate text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{request.user?.email || "ایمیل ثبت نشده"}</p>
                      </div>
                    </div>

                    <p className="text-sm font-bold leading-7 text-zinc-600 dark:text-zinc-300">{request.description}</p>

                    {(request.targetRole || request.targetScenario) && (
                      <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
                        <p className="text-[10px] font-black text-violet-700 dark:text-violet-300">مورد هدف</p>
                        <p className="mt-1 text-sm font-black text-zinc-950 dark:text-white">{request.targetRole?.name || request.targetScenario?.name}</p>
                        {request.targetRole?.alignment && <p className="mt-1 text-xs font-bold text-violet-700 dark:text-violet-300">{alignmentLabel(request.targetRole.alignment)}</p>}
                      </div>
                    )}

                    {rows.length > 0 && (
                      <div className="grid gap-2">
                        {rows.map((row) => (
                          <div key={row.label} className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                            <p className="text-[10px] font-black text-cyan-700 dark:text-cyan-300">{row.label}</p>
                            <p className="mt-1 whitespace-pre-line text-sm font-bold leading-7 text-cyan-950 dark:text-cyan-100">{row.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {(request.createdRole || request.createdScenario) && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-black text-emerald-700 dark:text-emerald-300">
                        خروجی ساخته‌شده: {request.createdRole?.name || request.createdScenario?.name}
                      </div>
                    )}

                    {request.reviewedAt && (
                      <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        بررسی شده در {formatDate(request.reviewedAt)} توسط {request.reviewedBy?.name || request.reviewedBy?.email || "مدیر"}
                      </p>
                    )}

                    {request.status === "PENDING" ? (
                      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">پاسخ مدیر برای کاربر</span>
                          <textarea
                            value={notes[request.id] || ""}
                            onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value.slice(0, 1000) }))}
                            className="min-h-24 resize-none"
                            placeholder="اختیاری؛ دلیل تایید یا رد را کوتاه و روشن بنویسید."
                          />
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button onClick={() => review(request, "APPROVED")} disabled={isBusy} className="ui-button-primary min-h-11">
                            <span className={`material-symbols-outlined text-xl ${isBusy ? "animate-spin" : ""}`}>{isBusy ? "progress_activity" : "task_alt"}</span>
                            تایید و اعمال
                          </button>
                          <button onClick={() => review(request, "REJECTED")} disabled={isBusy} className="ui-button-secondary min-h-11 border-red-500/20 text-red-600 hover:bg-red-500/10 dark:text-red-300">
                            <span className="material-symbols-outlined text-xl">block</span>
                            رد درخواست
                          </button>
                        </div>
                      </div>
                    ) : request.adminNote ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
                        پاسخ مدیر: {request.adminNote}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
