"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createSuggestionRequest,
  getMySuggestionRequests,
  getSuggestionReferenceData,
} from "@/actions/suggestions";
import { CheckCircle, HourglassMedium, Plus, XCircle } from "@phosphor-icons/react";
import { usePopup } from "@/components/PopupProvider";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Sheet } from "@/components/ui/Sheet";
import { FactionTag } from "@/components/ui/Tag";

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

const REQUEST_TYPES: { value: SuggestionType; title: string }[] = [
  { value: "NEW_ROLE", title: "نقش تازه" },
  { value: "NEW_SCENARIO", title: "سناریوی تازه" },
  { value: "CHANGE_ROLE", title: "اصلاح یک نقش" },
  { value: "CHANGE_SCENARIO", title: "اصلاح یک سناریو" },
];

const STATUS_META = {
  PENDING: { label: "در حال بررسی", Icon: HourglassMedium, className: "bg-warning/14 text-warning" },
  APPROVED: { label: "تایید شد", Icon: CheckCircle, className: "bg-success/14 text-success" },
  REJECTED: { label: "رد شد", Icon: XCircle, className: "bg-danger/12 text-danger" },
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
  const { showToast } = usePopup();
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const needsRole = type === "CHANGE_ROLE";
  const needsScenario = type === "CHANGE_SCENARIO";
  const roleRelated = type === "NEW_ROLE" || type === "CHANGE_ROLE";
  const proposedNameLabel = type === "NEW_ROLE" || type === "NEW_SCENARIO" ? "نام پیشنهادی" : "نام جدید اگر لازم است";
  const proposedDescriptionLabel = type === "NEW_SCENARIO" ? "توضیح و ترکیب نقش‌های پیشنهادی" : "توضیح پیشنهادی یا تغییر مورد نظر";


  const loadData = () => {
    setLoading(true);
    startTransition(async () => {
      try {
        const [refs, mine] = await Promise.all([getSuggestionReferenceData(), getMySuggestionRequests()]);
        setReference(refs);
        setRequests(mine as SuggestionRequest[]);
      } catch (error: any) {
        setLoadError(error.message || "پیشنهادها بارگذاری نشدند.");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    loadData();
     
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
    setFormError(null);
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
        showToast("پیشنهاد شما ثبت شد", "success");
        resetForm();
        setFormOpen(false);
        const mine = await getMySuggestionRequests();
        setRequests(mine as SuggestionRequest[]);
      } catch (error: any) {
        setFormError(error.message || "ثبت پیشنهاد انجام نشد. اطلاعات را بررسی کنید.");
      }
    });
  };

  const textarea = "min-h-28 w-full resize-y rounded-[var(--radius-sm)] border border-line bg-sunken p-4 font-medium leading-7";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="nq-display text-[2.6rem] leading-[1.15]">پیشنهادها</h1>
          <p className="mt-1 max-w-xl font-medium leading-7 text-muted">نقش یا سناریوی تازه‌ای به ذهنتان رسیده؟ پیشنهاد بدهید تا مدیر بررسی کند و به بازی اضافه شود.</p>
        </div>
        <button type="button" onClick={() => setFormOpen(true)} className="nq-btn nq-btn-primary nq-btn-lg shrink-0 self-start">
          <Plus size={20} weight="bold" aria-hidden />
          پیشنهاد تازه
        </button>
      </header>

      {loadError ? <Notice tone="danger">{loadError}</Notice> : null}

      {loading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong p-8 text-center">
          <p className="font-extrabold">هنوز پیشنهادی نداده‌اید</p>
          <p className="mx-auto mt-1 max-w-sm text-sm font-medium leading-7 text-muted">وضعیت هر پیشنهاد و پاسخ مدیر همین‌جا نشان داده می‌شود.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => {
            const status = STATUS_META[request.status];
            const payload = request.payload || {};
            return (
              <li key={request.id} className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`nq-tag ${status.className}`}>
                    <status.Icon size={14} weight="fill" aria-hidden />
                    {status.label}
                  </span>
                  <span className="nq-tag">{typeLabel(request.type)}</span>
                  <span className="text-xs font-medium text-faint">{formatDate(request.createdAt)}</span>
                </div>
                <h2 className="mt-2.5 text-lg font-extrabold">{request.title}</h2>
                <p className="mt-1 font-medium leading-7 text-muted">{request.description}</p>
                {payload.proposedName || payload.proposedDescription || payload.proposedAlignment ? (
                  <div className="mt-3 flex flex-col gap-1 rounded-[var(--radius-sm)] bg-raised p-3 text-sm font-medium leading-6">
                    {payload.proposedName ? <p>{`نام پیشنهادی: ${payload.proposedName}`}</p> : null}
                    {payload.proposedAlignment ? (
                      <p className="flex items-center gap-2">
                        جبهه: <FactionTag alignment={payload.proposedAlignment} />
                      </p>
                    ) : null}
                    {payload.proposedDescription ? <p className="text-muted">{payload.proposedDescription}</p> : null}
                  </div>
                ) : null}
                {request.targetRole || request.targetScenario ? <p className="mt-2 text-sm font-bold text-muted">{`درباره: ${request.targetRole?.name || request.targetScenario?.name}`}</p> : null}
                {request.createdRole || request.createdScenario ? <p className="mt-2 text-sm font-bold text-success">{`به بازی اضافه شد: ${request.createdRole?.name || request.createdScenario?.name}`}</p> : null}
                {request.adminNote ? (
                  <p className="mt-3 border-s-2 border-accent ps-3 text-sm font-medium leading-6">
                    <span className="font-bold text-accent">پاسخ مدیر: </span>
                    {request.adminNote}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="پیشنهاد تازه"
        footer={
          <button type="button" onClick={submitRequest} disabled={isPending} className="nq-btn nq-btn-primary nq-btn-lg w-full">
            {isPending ? "در حال ثبت…" : "ثبت پیشنهاد"}
          </button>
        }
      >
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 text-sm font-bold">درباره چیست؟</legend>
            <div className="grid grid-cols-2 gap-2">
              {REQUEST_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={type === item.value}
                  onClick={() => selectType(item.value)}
                  className={`min-h-12 rounded-[var(--radius-sm)] px-3 text-sm font-extrabold transition-colors ${type === item.value ? "bg-accent-soft text-accent ring-1 ring-accent/50" : "bg-raised text-muted hover:text-fg"}`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </fieldset>

          {formError ? <Notice tone="danger">{formError}</Notice> : null}

          {needsRole ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">کدام نقش؟</span>
              <select value={targetRoleId} onChange={(event) => setTargetRoleId(event.target.value)}>
                <option value="">یک نقش انتخاب کنید</option>
                {reference.roles.map((role) => (
                  <option key={role.id} value={role.id}>{`${role.name} (${alignmentLabel(role.alignment)})`}</option>
                ))}
              </select>
            </label>
          ) : null}

          {needsScenario ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">کدام سناریو؟</span>
              <select value={targetScenarioId} onChange={(event) => setTargetScenarioId(event.target.value)}>
                <option value="">یک سناریو انتخاب کنید</option>
                {reference.scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                ))}
              </select>
            </label>
          ) : null}

          <Field label="عنوان" name="title" value={title} onChange={(event) => setTitle(event.target.value.slice(0, 90))} hint="یک جمله کوتاه، مثلاً «اضافه شدن نقش نگهبان»." />
          <Field label={proposedNameLabel} name="proposedName" value={proposedName} onChange={(event) => setProposedName(event.target.value.slice(0, 80))} />

          {roleRelated ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold">{type === "CHANGE_ROLE" ? "جبهه تازه (اگر لازم است)" : "جبهه"}</span>
              <select value={proposedAlignment} onChange={(event) => setProposedAlignment(event.target.value as Alignment | "")}>
                {type === "CHANGE_ROLE" ? <option value="">بدون تغییر</option> : null}
                <option value="CITIZEN">شهروند</option>
                <option value="MAFIA">مافیا</option>
                <option value="NEUTRAL">مستقل</option>
              </select>
            </label>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">چرا؟</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value.slice(0, 1800))} className={textarea} />
            <span className="text-xs font-medium text-muted">ایده یا مشکلی که دیدید را واضح بنویسید.</span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">{proposedDescriptionLabel}</span>
            <textarea value={proposedDescription} onChange={(event) => setProposedDescription(event.target.value.slice(0, 1600))} className={textarea} />
            {type === "NEW_SCENARIO" ? <span className="text-xs font-medium text-muted">مثلاً: ۱۰ نفره، ۳ مافیا، ۶ شهروند، ۱ مستقل.</span> : null}
          </label>
        </div>
      </Sheet>
    </div>
  );
}
