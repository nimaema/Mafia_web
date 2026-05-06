"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createSuggestionRequest,
  getMySuggestionRequests,
  getSuggestionReferenceData,
} from "@/actions/suggestions";
import { usePopup } from "@/components/PopupProvider";

type SuggestionType = "NEW_ROLE" | "NEW_SCENARIO" | "CHANGE_ROLE" | "CHANGE_SCENARIO";
type Alignment = "CITIZEN" | "MAFIA" | "NEUTRAL";

type ReferenceData = {
  roles: { id: string; name: string; alignment: Alignment; description?: string | null }[];
  scenarios: { id: string; name: string; description?: string | null }[];
};

type SuggestionRequest = {
  id: string;
  type: SuggestionType;
  status: "PENDING" | "APPROVED" | "REJECTED";
  title: string;
  description: string;
  adminNote?: string | null;
  payload?: any;
  targetRole?: { id: string; name: string; alignment: Alignment } | null;
  targetScenario?: { id: string; name: string } | null;
  createdRole?: { id: string; name: string; alignment: Alignment } | null;
  createdScenario?: { id: string; name: string } | null;
  createdAt: string;
  reviewedAt?: string | null;
};

const REQUEST_TYPES: { value: SuggestionType; title: string; text: string; icon: string }[] = [
  { value: "NEW_ROLE", title: "نقش جدید", text: "پیشنهاد یک نقش تازه با جبهه و رفتار کلی", icon: "theater_comedy" },
  { value: "NEW_SCENARIO", title: "سناریوی جدید", text: "ایده سناریو، تعداد نفرات و ترکیب پیشنهادی", icon: "account_tree" },
  { value: "CHANGE_ROLE", title: "اصلاح نقش", text: "تغییر نام، توضیح یا جبهه یک نقش موجود", icon: "edit_note" },
  { value: "CHANGE_SCENARIO", title: "اصلاح سناریو", text: "اصلاح توضیح یا نام سناریوی موجود", icon: "rule_settings" },
];

const STATUS_META = {
  PENDING: { label: "در انتظار بررسی", icon: "hourglass_top", className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  APPROVED: { label: "تایید شد", icon: "task_alt", className: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
  REJECTED: { label: "رد شد", icon: "block", className: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300" },
};

function typeLabel(type: SuggestionType) {
  return REQUEST_TYPES.find((item) => item.value === type)?.title || "درخواست";
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

export function SuggestionRequestsPanel() {
  const { showAlert, showToast } = usePopup();
  const [reference, setReference] = useState<ReferenceData>({ roles: [], scenarios: [] });
  const [requests, setRequests] = useState<SuggestionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<SuggestionType>("NEW_ROLE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetRoleId, setTargetRoleId] = useState("");
  const [targetScenarioId, setTargetScenarioId] = useState("");
  const [proposedName, setProposedName] = useState("");
  const [proposedDescription, setProposedDescription] = useState("");
  const [proposedAlignment, setProposedAlignment] = useState<Alignment | "">("CITIZEN");

  const selectedType = REQUEST_TYPES.find((item) => item.value === type) || REQUEST_TYPES[0];
  const needsRole = type === "CHANGE_ROLE";
  const needsScenario = type === "CHANGE_SCENARIO";
  const roleRelated = type === "NEW_ROLE" || type === "CHANGE_ROLE";
  const proposedNameLabel = type === "NEW_ROLE" || type === "NEW_SCENARIO" ? "نام پیشنهادی" : "نام جدید اگر لازم است";
  const proposedDescriptionLabel = type === "NEW_SCENARIO" ? "توضیح و ترکیب نقش‌های پیشنهادی" : "توضیح پیشنهادی یا تغییر مورد نظر";

  const pendingCount = useMemo(() => requests.filter((request) => request.status === "PENDING").length, [requests]);

  const loadData = () => {
    setLoading(true);
    startTransition(async () => {
      try {
        const [refs, mine] = await Promise.all([getSuggestionReferenceData(), getMySuggestionRequests()]);
        setReference(refs);
        setRequests(mine as SuggestionRequest[]);
      } catch (error: any) {
        showAlert("خطا در بارگذاری درخواست‌ها", error.message || "اطلاعات درخواست‌ها خوانده نشد.", "error");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetRoleId("");
    setTargetScenarioId("");
    setProposedName("");
    setProposedDescription("");
    setProposedAlignment("CITIZEN");
  };

  const selectType = (nextType: SuggestionType) => {
    setType(nextType);
    if (nextType === "CHANGE_ROLE") setProposedAlignment("");
    if (nextType === "NEW_ROLE") setProposedAlignment("CITIZEN");
  };

  const submitRequest = () => {
    startTransition(async () => {
      try {
        await createSuggestionRequest({
          type,
          title,
          description,
          targetRoleId,
          targetScenarioId,
          proposedName,
          proposedDescription,
          proposedAlignment: roleRelated && proposedAlignment ? proposedAlignment : undefined,
        });
        showToast("درخواست شما ثبت شد", "success");
        resetForm();
        const mine = await getMySuggestionRequests();
        setRequests(mine as SuggestionRequest[]);
      } catch (error: any) {
        showAlert("ثبت درخواست انجام نشد", error.message || "لطفاً اطلاعات درخواست را بررسی کنید.", "error");
      }
    });
  };

  return (
    <div className="space-y-5" dir="rtl">
      <section className="ui-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ui-kicker">درخواست‌های بازی</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">پیشنهاد نقش و سناریو</h1>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-7 text-zinc-500 dark:text-zinc-400">
              اگر نقش، سناریو یا تغییری به ذهنتان رسیده، اینجا ثبت کنید. مدیر می‌تواند آن را تایید کند، رد کند یا بعد از تایید وارد کتابخانه نقش‌ها و سناریوها کند.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:min-w-64">
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
              <p className="text-2xl font-black text-cyan-700 dark:text-cyan-300">{requests.length}</p>
              <p className="mt-1 text-[10px] font-black text-cyan-700/70 dark:text-cyan-300/70">کل درخواست‌ها</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{pendingCount}</p>
              <p className="mt-1 text-[10px] font-black text-amber-700/70 dark:text-amber-300/70">در انتظار بررسی</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="ui-card overflow-hidden">
          <div className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="ui-kicker">ثبت درخواست جدید</p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{selectedType.title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400">{selectedType.text}</p>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {REQUEST_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => selectType(item.value)}
                  className={`rounded-lg border p-3 text-right transition-all ${
                    type === item.value
                      ? "border-cyan-500/35 bg-cyan-500/10 shadow-sm shadow-cyan-500/10"
                      : "border-zinc-200 bg-zinc-50 hover:border-cyan-500/25 hover:bg-white dark:border-white/10 dark:bg-white/[0.03]"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-cyan-700 dark:text-cyan-300">{item.icon}</span>
                  <span className="mt-2 block text-sm font-black text-zinc-950 dark:text-white">{item.title}</span>
                  <span className="mt-1 block text-[10px] font-bold leading-5 text-zinc-500 dark:text-zinc-400">{item.text}</span>
                </button>
              ))}
            </div>

            {needsRole && (
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">نقش مورد نظر</span>
                <select value={targetRoleId} onChange={(event) => setTargetRoleId(event.target.value)}>
                  <option value="">انتخاب نقش...</option>
                  {reference.roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name} | {alignmentLabel(role.alignment)}</option>
                  ))}
                </select>
              </label>
            )}

            {needsScenario && (
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">سناریوی مورد نظر</span>
                <select value={targetScenarioId} onChange={(event) => setTargetScenarioId(event.target.value)}>
                  <option value="">انتخاب سناریو...</option>
                  {reference.scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">عنوان درخواست</span>
                <input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 90))} placeholder="مثلاً اضافه شدن نقش نگهبان" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">{proposedNameLabel}</span>
                <input value={proposedName} onChange={(event) => setProposedName(event.target.value.slice(0, 80))} placeholder="نام نقش یا سناریو" />
              </label>
            </div>

            {roleRelated && (
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">{type === "CHANGE_ROLE" ? "جبهه جدید اگر لازم است" : "جبهه پیشنهادی"}</span>
                <select value={proposedAlignment} onChange={(event) => setProposedAlignment(event.target.value as Alignment | "")}>
                  {type === "CHANGE_ROLE" && <option value="">بدون تغییر جبهه</option>}
                  <option value="CITIZEN">شهروند</option>
                  <option value="MAFIA">مافیا</option>
                  <option value="NEUTRAL">مستقل</option>
                </select>
              </label>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">توضیح درخواست</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 1800))}
                className="min-h-32 resize-none"
                placeholder="مشکل، ایده یا دلیل پیشنهاد را واضح بنویسید."
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">{proposedDescriptionLabel}</span>
              <textarea
                value={proposedDescription}
                onChange={(event) => setProposedDescription(event.target.value.slice(0, 1600))}
                className="min-h-28 resize-none"
                placeholder={type === "NEW_SCENARIO" ? "مثلاً: ۱۰ نفره؛ ۳ مافیا، ۶ شهروند، ۱ مستقل..." : "متن نهایی پیشنهادی یا تغییر دقیق را بنویسید."}
              />
            </label>

            <button onClick={submitRequest} disabled={isPending} className="ui-button-primary min-h-12 w-full">
              <span className={`material-symbols-outlined text-xl ${isPending ? "animate-spin" : ""}`}>{isPending ? "progress_activity" : "send"}</span>
              ثبت درخواست
            </button>
          </div>
        </div>

        <div className="ui-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div>
              <p className="ui-kicker">پیگیری</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">وضعیت درخواست‌های شما</h2>
            </div>
            <button onClick={loadData} disabled={loading || isPending} className="ui-button-secondary min-h-10 px-3 text-xs">
              <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>refresh</span>
              بروزرسانی
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center p-8">
              <span className="material-symbols-outlined animate-spin text-4xl text-cyan-600">progress_activity</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="ui-icon size-16">
                <span className="material-symbols-outlined text-3xl text-zinc-400">rate_review</span>
              </div>
              <p className="font-black text-zinc-950 dark:text-white">هنوز درخواستی ثبت نکرده‌اید</p>
              <p className="max-w-sm text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400">بعد از ثبت، وضعیت بررسی مدیر همین‌جا نمایش داده می‌شود.</p>
            </div>
          ) : (
            <div className="custom-scrollbar max-h-[760px] space-y-3 overflow-y-auto p-4">
              {requests.map((request) => {
                const status = STATUS_META[request.status];
                const payload = request.payload || {};
                return (
                  <article key={request.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">{typeLabel(request.type)}</span>
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-black ${status.className}`}>
                            <span className="material-symbols-outlined text-sm">{status.icon}</span>
                            {status.label}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-black text-zinc-950 dark:text-white">{request.title}</h3>
                        <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{formatDate(request.createdAt)}</p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm font-bold leading-7 text-zinc-600 dark:text-zinc-300">{request.description}</p>
                    {(payload.proposedName || payload.proposedDescription || payload.proposedAlignment) && (
                      <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-bold leading-6 text-cyan-800 dark:text-cyan-200">
                        {payload.proposedName && <p>نام پیشنهادی: {payload.proposedName}</p>}
                        {payload.proposedAlignment && <p>جبهه پیشنهادی: {alignmentLabel(payload.proposedAlignment)}</p>}
                        {payload.proposedDescription && <p>متن پیشنهادی: {payload.proposedDescription}</p>}
                      </div>
                    )}
                    {(request.targetRole || request.targetScenario) && (
                      <p className="mt-2 text-xs font-black text-zinc-500 dark:text-zinc-400">
                        مورد مرتبط: {request.targetRole?.name || request.targetScenario?.name}
                      </p>
                    )}
                    {(request.createdRole || request.createdScenario) && (
                      <p className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-700 dark:text-cyan-300">
                        اضافه شد: {request.createdRole?.name || request.createdScenario?.name}
                      </p>
                    )}
                    {request.adminNote && (
                      <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
                        پاسخ مدیر: {request.adminNote}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
