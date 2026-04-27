"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher";
import { getGameStatus, startGame, setGameScenario, createCustomGameScenario } from "@/actions/game";
import { getScenarios } from "@/actions/admin";
import { getRoles } from "@/actions/role";
import { usePopup } from "@/components/PopupProvider";

type Player = {
  id: string;
  name: string;
};

function alignmentClass(alignment?: string) {
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
}

function alignmentLabel(alignment?: string) {
  if (alignment === "MAFIA") return "مافیا";
  if (alignment === "CITIZEN") return "شهروند";
  return "مستقل";
}

export default function GameLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert, showToast } = usePopup();
  const gameId = params.id as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingScenario, setSettingScenario] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRoles, setCustomRoles] = useState<{ roleId: string; count: number }[]>([]);
  const [customRoleSearch, setCustomRoleSearch] = useState("");
  const [saveCustomScenario, setSaveCustomScenario] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([getGameStatus(gameId), getScenarios(), getRoles()])
      .then(([gameRes, scenariosRes, rolesRes]) => {
        if (!mounted) return;

        if (!gameRes) {
          router.push("/dashboard/moderator");
          return;
        }

        setGame(gameRes);
        setPlayers((gameRes.players || []).map((player: any) => ({ id: player.id, name: player.name })));
        setScenarios(scenariosRes);
        setRoles(rolesRes);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        if (!mounted) return;
        showAlert("خطا", "لابی بارگذاری نشد. اتصال سرور یا دیتابیس را بررسی کنید.", "error");
        setLoading(false);
      });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("player-joined", (data: { player: Player }) => {
      setPlayers((prev) => {
        if (prev.find((player) => player.id === data.player.id)) return prev;
        return [...prev, data.player];
      });
    });

    channel.bind("player-left", (data: { playerId: string }) => {
      setPlayers((prev) => prev.filter((player) => player.id !== data.playerId));
    });

    channel.bind("scenario-updated", (data: { scenario: any }) => {
      setGame((prev: any) => (prev ? { ...prev, scenario: data.scenario } : prev));
    });

    return () => {
      mounted = false;
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, router, showAlert]);

  const requiredPlayers = useMemo(
    () => game?.scenario?.roles?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
    [game]
  );

  const recommendedScenarios = useMemo(
    () =>
      scenarios.filter((scenario) => {
        const count = scenario.roles.reduce((sum: number, item: any) => sum + item.count, 0);
        return count === players.length;
      }),
    [players.length, scenarios]
  );

  const scenarioRoles = useMemo(
    () =>
      (game?.scenario?.roles || []).map((item: any) => ({
        roleId: item.roleId,
        name: item.role?.name || "نقش",
        alignment: item.role?.alignment,
        count: item.count,
      })),
    [game]
  );

  const filteredCustomRoles = useMemo(() => {
    const query = customRoleSearch.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) =>
      [role.name, role.description || "", alignmentLabel(role.alignment)]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [customRoleSearch, roles]);

  const selectedCustomCount = customRoles.reduce((sum, item) => sum + item.count, 0);
  const seatsRemaining = requiredPlayers ? requiredPlayers - players.length : 0;
  const startDisabledReason = !game?.scenario
    ? "برای شروع بازی ابتدا سناریو را انتخاب کنید."
    : players.length < requiredPlayers
      ? `${requiredPlayers - players.length} بازیکن دیگر برای این سناریو لازم است.`
      : players.length > requiredPlayers
        ? "تعداد بازیکنان از ظرفیت سناریو بیشتر است."
        : "";

  const handleSelectScenario = async (scenarioId: string) => {
    setSettingScenario(true);
    const res = await setGameScenario(gameId, scenarioId);
    if (!res.success) {
      showAlert("خطا", res.error || "خطا در تنظیم سناریو", "error");
    } else {
      const updatedGame = await getGameStatus(gameId);
      setGame(updatedGame);
      showToast(scenarioId ? "سناریو با موفقیت انتخاب شد" : "سناریو برداشته شد", "success");
    }
    setSettingScenario(false);
  };

  const handleStartGame = async () => {
    setLoading(true);
    const res = await startGame(gameId);
    if (res.success) {
      router.push(`/dashboard/moderator/game/${gameId}`);
    } else {
      showAlert("خطا در شروع بازی", res.error || "خطای نامشخص", "error");
      setLoading(false);
    }
  };

  const handleCustomRoleChange = (roleId: string, delta: number) => {
    setCustomRoles((prev) => {
      const existing = prev.find((role) => role.roleId === roleId);
      if (!existing && delta > 0) return [...prev, { roleId, count: 1 }];
      if (!existing) return prev;

      const newCount = Math.max(0, existing.count + delta);
      if (newCount === 0) return prev.filter((role) => role.roleId !== roleId);
      return prev.map((role) => (role.roleId === roleId ? { ...role, count: newCount } : role));
    });
  };

  const handleCreateCustomScenario = async () => {
    if (selectedCustomCount === 0) return;

    setSettingScenario(true);
    setShowCustomModal(false);
    const res = await createCustomGameScenario(gameId, customRoles, saveCustomScenario);
    if (!res.success) {
      showAlert("خطا", res.error || "خطا در ایجاد سناریو سفارشی", "error");
    } else {
      const updatedGame = await getGameStatus(gameId);
      setGame(updatedGame);
      if (saveCustomScenario) {
        const nextScenarios = await getScenarios();
        setScenarios(nextScenarios);
      }
      setCustomRoleSearch("");
      setSaveCustomScenario(false);
      showToast(saveCustomScenario ? "سناریوی سفارشی ذخیره و اعمال شد" : "سناریوی سفارشی اعمال شد", "success");
    }
    setSettingScenario(false);
  };

  const copyJoinLink = async () => {
    const link = `${window.location.origin}/lobby/${gameId}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("لینک ورود کپی شد", "success");
    } catch {
      showAlert("کپی لینک", link, "info");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[560px] items-center justify-center" dir="rtl">
        <div className="ui-card flex w-full max-w-xl flex-col items-center gap-4 p-10 text-center">
          <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-lime-500 dark:border-zinc-800"></div>
          <p className="font-bold text-zinc-500 dark:text-zinc-400">در حال آماده‌سازی لابی...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <section className="ui-card overflow-hidden">
        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex items-start gap-4">
            <div className="ui-icon-accent size-14">
              <span className="material-symbols-outlined text-3xl">groups</span>
            </div>
            <div>
              <p className="ui-kicker">اتاق انتظار</p>
              <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">{game?.name || "لابی بازی مافیا"}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                بازیکن‌ها، کد ورود، سناریو و شروع بازی از همین صفحه کنترل می‌شود.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={copyJoinLink} className="ui-button-secondary min-h-11 px-4">
                  <span className="material-symbols-outlined text-xl">content_copy</span>
                  کپی لینک ورود
                </button>
                <button onClick={() => router.push("/dashboard/moderator")} className="ui-button-secondary min-h-11 px-4">
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  بازگشت
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="ui-muted p-3">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">کد بازی</p>
              <p className="mt-2 font-mono text-2xl font-black text-zinc-950 dark:text-white">#{game?.code}</p>
            </div>
            <div className="ui-muted p-3">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">ورود</p>
              <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">{game?.hasPassword ? "خصوصی" : "باز"}</p>
            </div>
            <div className="ui-muted p-3">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">بازیکن</p>
              <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">{players.length}</p>
            </div>
            <div className="ui-muted p-3">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">ظرفیت</p>
              <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">{requiredPlayers || "سناریو ندارد"}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="ui-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div>
              <p className="font-black text-zinc-950 dark:text-white">بازیکنان حاضر</p>
              <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {requiredPlayers ? `${players.length} از ${requiredPlayers}` : `${players.length} بازیکن وارد شده`}
              </p>
            </div>
            <span className={`rounded-lg px-3 py-1 text-xs font-black ${seatsRemaining <= 0 && requiredPlayers ? "bg-lime-500 text-zinc-950" : "border border-zinc-200 bg-white text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400"}`}>
              {requiredPlayers ? (seatsRemaining > 0 ? `${seatsRemaining} جای خالی` : "آماده") : "در انتظار سناریو"}
            </span>
          </div>

          <div className="custom-scrollbar max-h-[620px] overflow-y-auto p-4">
            {players.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                <div className="ui-icon size-16">
                  <span className="material-symbols-outlined text-3xl text-zinc-400">person_add</span>
                </div>
                <div>
                  <p className="font-black text-zinc-950 dark:text-white">هنوز کسی وارد نشده</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">لینک یا کد بازی را برای بازیکنان بفرستید.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {players.map((player, index) => (
                  <div key={player.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lime-500 font-black text-zinc-950">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-zinc-950 dark:text-white">{player.name}</p>
                        <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">جایگاه {index + 1}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="ui-card overflow-hidden">
            <div className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="font-black text-zinc-950 dark:text-white">سناریوی بازی</p>
              <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">ظرفیت سناریو باید با تعداد بازیکنان برابر باشد.</p>
            </div>

            <div className="space-y-4 p-5">
              {game?.scenario ? (
                <div className="rounded-lg border border-lime-500/20 bg-lime-500/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-zinc-950 dark:text-white">{game.scenario.name}</p>
                      <p className="mt-1 text-xs font-bold text-lime-700 dark:text-lime-300">{requiredPlayers} نفره</p>
                    </div>
                    <button onClick={() => handleSelectScenario("")} className="ui-button-secondary min-h-9 px-3 text-xs" disabled={settingScenario}>
                      تغییر
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {scenarioRoles.map((role: any) => (
                      <span key={role.roleId} className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                        {role.name} x{role.count}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {players.length > 0 && recommendedScenarios.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-black text-zinc-500 dark:text-zinc-400">پیشنهاد مناسب تعداد فعلی</p>
                      <div className="grid gap-2">
                        {recommendedScenarios.slice(0, 3).map((scenario) => (
                          <button
                            key={scenario.id}
                            onClick={() => handleSelectScenario(scenario.id)}
                            disabled={settingScenario}
                            className="rounded-lg border border-lime-500/25 bg-lime-500/10 p-3 text-right transition-all hover:bg-lime-500/15 disabled:opacity-50"
                          >
                            <p className="font-black text-zinc-950 dark:text-white">{scenario.name}</p>
                            <p className="mt-1 text-xs text-lime-700 dark:text-lime-300">
                              {scenario.roles.reduce((sum: number, item: any) => sum + item.count, 0)} نفره
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">همه سناریوها</span>
                    <select onChange={(event) => handleSelectScenario(event.target.value)} value="" disabled={settingScenario}>
                      <option value="">انتخاب سناریو...</option>
                      {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name} ({scenario.roles.reduce((sum: number, item: any) => sum + item.count, 0)} نفره)
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    onClick={() => {
                      setCustomRoleSearch("");
                      setSaveCustomScenario(false);
                      setShowCustomModal(true);
                    }}
                    disabled={settingScenario}
                    className="ui-button-secondary min-h-12 w-full"
                  >
                    <span className="material-symbols-outlined text-xl">dashboard_customize</span>
                    طراحی سناریو در لحظه
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="ui-card p-5">
            <button
              onClick={handleStartGame}
              disabled={Boolean(startDisabledReason) || loading}
              className="ui-button-primary min-h-12 w-full text-base"
            >
              <span className="material-symbols-outlined text-xl">play_arrow</span>
              شروع بازی
            </button>
            {startDisabledReason && (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-bold leading-6 text-amber-700 dark:text-amber-300">
                {startDisabledReason}
              </p>
            )}
          </section>
        </aside>
      </main>

      {showCustomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl">
          <div className="ui-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div>
                <p className="ui-kicker">سناریوی سفارشی</p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">چیدن نقش‌ها</h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">مجموع نقش‌ها بهتر است با تعداد بازیکنان حاضر برابر باشد.</p>
              </div>
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomRoleSearch("");
                  setSaveCustomScenario(false);
                }}
                className="ui-button-secondary size-10 p-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="grid gap-3 border-b border-zinc-200 p-5 dark:border-white/10 sm:grid-cols-2">
              <div className="ui-muted p-3">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">بازیکنان حاضر</p>
                <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">{players.length}</p>
              </div>
              <div className="ui-muted p-3">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">نقش‌های انتخاب شده</p>
                <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">{selectedCustomCount}</p>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
              <label className="mb-4 flex min-h-12 items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 dark:border-white/10 dark:bg-zinc-950/40">
                <span className="material-symbols-outlined text-zinc-400">search</span>
                <input
                  value={customRoleSearch}
                  onChange={(event) => setCustomRoleSearch(event.target.value)}
                  placeholder="جستجوی نقش برای سناریوی این لابی"
                  className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                />
              </label>

              {filteredCustomRoles.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 p-8 text-center dark:border-white/10">
                  <div className="ui-icon size-14">
                    <span className="material-symbols-outlined text-3xl text-zinc-400">manage_search</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">نقشی با این جستجو پیدا نشد.</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredCustomRoles.map((role) => {
                  const count = customRoles.find((item) => item.roleId === role.id)?.count || 0;
                  return (
                    <div key={role.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{role.name}</p>
                          <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                            {alignmentLabel(role.alignment)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-950">
                          <button onClick={() => handleCustomRoleChange(role.id, -1)} disabled={count === 0} className="flex size-7 items-center justify-center rounded-md hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-white/10">
                            <span className="material-symbols-outlined text-base">remove</span>
                          </button>
                          <span className="w-5 text-center text-sm font-black text-zinc-950 dark:text-white">{count}</span>
                          <button onClick={() => handleCustomRoleChange(role.id, 1)} className="flex size-7 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10">
                            <span className="material-symbols-outlined text-base">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-zinc-200 p-5 dark:border-white/10">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <input
                  type="checkbox"
                  checked={saveCustomScenario}
                  onChange={(event) => setSaveCustomScenario(event.target.checked)}
                  className="mt-1 size-4 accent-lime-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-black text-zinc-950 dark:text-white">ذخیره در کتابخانه سناریوها</span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    به صورت پیش‌فرض این ترکیب فقط روی همین لابی اعمال می‌شود.
                  </span>
                </span>
              </label>

              <button
                onClick={handleCreateCustomScenario}
                disabled={selectedCustomCount === 0}
                className="ui-button-primary min-h-12 w-full"
              >
                <span className="material-symbols-outlined text-xl">save</span>
                اعمال سناریو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
