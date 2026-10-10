"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockSimple, Plus, TelegramLogo, Trash } from "@phosphor-icons/react";
import { cancelGame, createGame, getModeratorGamesSafe } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { MaskStack } from "@/components/brand/MaskAvatar";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { getPusherClient } from "@/lib/pusher-client";
import { phaseTitle } from "@/lib/phase";

const toFa = (value: number) => value.toLocaleString("fa-IR");
const faDigits = (value: string) => value.replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

function capacityOf(game: any) {
  return game.scenario?.roles?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
}

export default function ModeratorLobbies() {
  const router = useRouter();
  const { showConfirm, showToast } = usePopup();
  const [games, setGames] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [telegram, setTelegram] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await getModeratorGamesSafe(Date.now());
      setGames(result.data);
      setError(result.success ? "" : result.error || "لابی‌ها بارگذاری نشدند.");
    } catch {
      setError("لابی‌ها بارگذاری نشدند. اتصال را بررسی کنید.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const pusher = getPusherClient();
    const channel = pusher.subscribe("lobby");
    channel.bind("game-created", refresh);
    channel.bind("lobby-updated", refresh);
    return () => {
      channel.unbind("game-created", refresh);
      channel.unbind("lobby-updated", refresh);
      pusher.unsubscribe("lobby");
    };
  }, [refresh]);

  const create = async () => {
    setCreateError(null);
    if (isPrivate && !password.trim()) {
      setCreateError("برای لابی رمزدار یک رمز کوتاه بنویسید.");
      return;
    }
    setCreating(true);
    try {
      const result = await createGame(name.trim(), isPrivate ? password.trim() : "", telegram);
      if (result.success) {
        router.push(`/dashboard/moderator/lobby/${result.gameId}`);
        return;
      }
      setCreateError(result.error || "ساخت لابی انجام نشد.");
    } catch {
      setCreateError("ساخت لابی انجام نشد. اتصال را بررسی کنید.");
    }
    setCreating(false);
  };

  const remove = (game: any) =>
    showConfirm(
      "لابی لغو شود؟",
      `«${game.name}» بسته می‌شود و بازیکنانی که سر میز نشسته‌اند بیرون می‌روند.`,
      async () => {
        const result = await cancelGame(game.id);
        if (result.success) {
          showToast("لابی لغو شد", "success");
          refresh();
        } else {
          showToast(result.error || "لغو لابی انجام نشد", "error");
        }
      },
      "error",
    );

  const running = games.filter((game) => game.status === "IN_PROGRESS");
  const waiting = games.filter((game) => game.status === "WAITING");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="nq-display text-[2.6rem] leading-[1.15]">لابی‌های من</h1>
          <p className="mt-1 font-medium text-muted">میز بچینید، کد را اعلام کنید، و بازی را از همین‌جا بگردانید.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="nq-btn nq-btn-primary nq-btn-lg shrink-0 self-start">
          <Plus size={20} weight="bold" aria-hidden />
          لابی تازه
        </button>
      </header>

      {error ? <Notice tone="danger">{error}</Notice> : null}

      {!loaded ? (
        <div className="grid gap-3 lg:grid-cols-2" aria-busy="true">
          {[0, 1].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
          ))}
        </div>
      ) : games.length === 0 && !error ? (
        <div className="nq-khatam overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface px-6 py-12 text-center">
          <p className="nq-display text-3xl">میز خالی است</p>
          <p className="mx-auto mt-2 max-w-sm font-medium leading-7 text-muted">یک لابی بسازید تا کد ورود آماده شود و دوستانتان سر میز بنشینند.</p>
          <button type="button" onClick={() => setCreateOpen(true)} className="nq-btn nq-btn-primary nq-btn-lg mt-6">
            ساخت اولین لابی
          </button>
        </div>
      ) : null}

      {running.length ? (
        <section aria-labelledby="running-title" className="flex flex-col gap-3">
          <h2 id="running-title" className="text-lg font-extrabold">
            بازی‌های در جریان
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {running.map((game) => {
              const alive = (game.players || []).filter((player: any) => player.isAlive !== false).length;
              return (
                <li key={game.id}>
                  <Link href={`/dashboard/moderator/game/${game.id}`} className="nq-grain group relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-lg)] bg-night p-5 text-moon">
                    <span className="relative z-10 flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold opacity-80">{`${game.name} · ${game.scenario?.name || "سناریو"}`}</span>
                        <span className="nq-display mt-1 block text-[2.2rem] leading-none">{phaseTitle(game.phase, game.phaseNumber ?? 0)}</span>
                      </span>
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-moon text-night transition-transform group-hover:-translate-x-1">
                        <ArrowLeft size={22} weight="bold" aria-hidden />
                      </span>
                    </span>
                    <span className="relative z-10 flex items-center justify-between gap-3">
                      <MaskStack seeds={(game.players || []).map((player: any) => player.userId || player.id)} images={(game.players || []).map((player: any) => player.image)} max={9} size="xs" ringClassName="ring-night" />
                      <span className="text-sm font-bold opacity-85">{`${toFa(alive)} نفر در بازی`}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {waiting.length ? (
        <section aria-labelledby="waiting-title" className="flex flex-col gap-3">
          <h2 id="waiting-title" className="text-lg font-extrabold">
            در انتظار شروع
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {waiting.map((game) => {
              const capacity = capacityOf(game);
              const seated = game._count?.players || 0;
              const ready = capacity > 0 && seated === capacity;
              return (
                <li key={game.id} className="nq-khatam overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2 truncate text-lg font-extrabold">
                        {game.name}
                        {game.password ? <LockSimple size={16} weight="bold" className="text-muted" aria-label="رمزدار" /> : null}
                        {game.telegramJoinEnabled ? <TelegramLogo size={16} weight="fill" className="text-[#29a9eb]" aria-label="ورود از تلگرام فعال" /> : null}
                      </h3>
                      <p className="mt-0.5 truncate text-sm font-medium text-muted">{game.scenario?.name || "سناریو هنوز انتخاب نشده"}</p>
                    </div>
                    <span className="text-2xl font-black tracking-[0.14em] text-accent tabular-nums" dir="ltr">
                      {faDigits(game.code || "")}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {seated ? (
                      <MaskStack seeds={(game.players || []).map((player: any) => player.userId || player.id)} images={(game.players || []).map((player: any) => player.image)} max={8} size="xs" ringClassName="ring-surface" />
                    ) : (
                      <span className="text-sm font-medium text-faint">هنوز کسی ننشسته</span>
                    )}
                    <span className={`nq-tag ${ready ? "bg-success/14 text-success" : "bg-accent-soft text-accent"}`}>
                      {capacity ? (ready ? "میز کامل است" : `${toFa(seated)} از ${toFa(capacity)}`) : `${toFa(seated)} نفر`}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/dashboard/moderator/lobby/${game.id}`} className="nq-btn nq-btn-primary flex-1">
                      مدیریت لابی
                    </Link>
                    <button type="button" onClick={() => remove(game)} className="nq-icon-btn size-12 hover:!text-danger" aria-label={`لغو لابی ${game.name}`}>
                      <Trash size={20} weight="bold" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="لابی تازه"
        footer={
          <button type="button" onClick={create} disabled={creating} className="nq-btn nq-btn-primary nq-btn-lg w-full">
            {creating ? "در حال ساخت…" : "ساخت لابی"}
          </button>
        }
      >
        <div className="flex flex-col gap-5">
          {createError ? <Notice tone="danger">{createError}</Notice> : null}
          <Field label="نام لابی" name="lobbyName" value={name} onChange={(event) => setName(event.target.value)} hint="مثلاً «جمعه‌شب کافه». اگر خالی بماند، نامی خودکار ساخته می‌شود." />
          <fieldset>
            <legend className="mb-2 text-sm font-bold">چه کسی می‌تواند بنشیند؟</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, title: "همه با کد" },
                { value: true, title: "کد و رمز" },
              ].map((option) => (
                <button
                  key={option.title}
                  type="button"
                  aria-pressed={isPrivate === option.value}
                  onClick={() => setIsPrivate(option.value)}
                  className={`min-h-12 rounded-[var(--radius-sm)] text-sm font-extrabold transition-colors ${isPrivate === option.value ? "bg-accent-soft text-accent ring-1 ring-accent/50" : "bg-raised text-muted hover:text-fg"}`}
                >
                  {option.title}
                </button>
              ))}
            </div>
          </fieldset>
          {isPrivate ? <Field label="رمز لابی" name="lobbyPassword" dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} hint="رمز را سر میز به بازیکنان بگویید." /> : null}
          <Switch checked={telegram} onChange={setTelegram} label="ورود از تلگرام" description="بازیکنانی که تلگرامشان را وصل کرده‌اند با ربات هم می‌توانند بنشینند." />
          <p className="text-sm font-medium leading-7 text-muted">بعد از ساخت، سناریو را انتخاب می‌کنید و کد ورود را سر میز اعلام می‌کنید.</p>
        </div>
      </Sheet>
    </div>
  );
}
