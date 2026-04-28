"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher-client";
import { getGameStatus, startGame, setGameScenario, createCustomGameScenario } from "@/actions/game";
import { getScenarios } from "@/actions/admin";
import { getRoles } from "@/actions/role";
import { usePopup } from "@/components/PopupProvider";
import { LobbyPreviewCard } from "@/components/game/LobbyPreviewCard";

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
  const [customScenarioName, setCustomScenarioName] = useState("");

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

  const lobbyPlayers = useMemo(
    () =>
      players.map((player) => ({
        id: player.id,
        name: player.name,
      })),
    [players]
  );

  const filteredCustomRoles = useMemo(() => {
    const query = customRoleSearch.trim().toLowerCase();
    const roleCountMap = new Map(customRoles.map((role) => [role.roleId, role.count]));
    const visibleRoles = query
      ? roles.filter((role) =>
          [role.name, role.description || "", alignmentLabel(role.alignment)]
            .some((value) => value.toLowerCase().includes(query))
        )
      : roles;

    return [...visibleRoles].sort((left, right) => {
      const leftCount = roleCountMap.get(left.id) || 0;
      const rightCount = roleCountMap.get(right.id) || 0;
      if (leftCount !== rightCount) return rightCount - leftCount;
      return left.name.localeCompare(right.name, "fa");
    });
  }, [customRoleSearch, customRoles, roles]);

  const selectedCustomCount = customRoles.reduce((sum, item) => sum + item.count, 0);
  const selectedCustomRoles = useMemo(
    () =>
      customRoles
        .map((item) => {
          const role = roles.find((roleItem) => roleItem.id === item.roleId);
          return role ? { ...role, count: item.count } : null;
        })
        .filter(Boolean) as Array<any & { count: number }>,
    [customRoles, roles]
  );
  const customScenarioDelta = selectedCustomCount - players.length;
  const customScenarioStatus = selectedCustomCount === 0
    ? "هیچ نقشی انتخاب نشده"
    : customScenarioDelta === 0
      ? "هماهنگ با بازیکنان حاضر"
      : customScenarioDelta > 0
        ? `${customScenarioDelta} نقش بیشتر از بازیکنان`
        : `${Math.abs(customScenarioDelta)} نقش کمتر از بازیکنان`;
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
    if (saveCustomScenario && !customScenarioName.trim()) {
      showAlert("نام سناریو", "برای ذخیره در کتابخانه، یک نام کوتاه و مشخص وارد کنید.", "warning");
      setSettingScenario(false);
      setShowCustomModal(true);
      return;
    }

    if (selectedCustomCount !== players.length) {
      showAlert("تعداد نقش‌ها", `تعداد نقش‌ها (${selectedCustomCount}) باید با تعداد بازیکنان حاضر (${players.length}) برابر باشد.`, "warning");
      setSettingScenario(false);
      setShowCustomModal(true);
      return;
    }

    const res = await createCustomGameScenario(gameId, customRoles, saveCustomScenario, customScenarioName);
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
      setCustomScenarioName("");
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
        <div className="flex flex-col gap-4 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03] lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ui-kicker">مدیریت لابی</p>
            <h1 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{game?.name || "لابی بازی مافیا"}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              سناریو، لینک ورود و شروع بازی همین بالا در دسترس است.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyJoinLink} className="ui-button-secondary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">content_copy</span>
              کپی لینک
            </button>
            <button onClick={() => router.push("/dashboard/moderator")} className="ui-button-secondary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">arrow_forward</span>
              بازگشت
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            {game?.scenario ? (
              <div className="rounded-lg border border-lime-500/20 bg-lime-500/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-lime-700 dark:text-lime-300">سناریوی فعال</p>
                    <p className="mt-1 text-xl font-black text-zinc-950 dark:text-white">{game.scenario.name}</p>
                    <p className="mt-1 text-sm font-bold text-lime-700 dark:text-lime-300">{players.length} / {requiredPlayers} بازیکن</p>
                  </div>
                  <span className="rounded-lg bg-lime-500 px-2.5 py-1 text-[10px] font-black text-zinc-950">فعال</span>
                </div>
                <button onClick={() => handleSelectScenario("")} className="ui-button-secondary mt-4 min-h-10 px-4 text-xs" disabled={settingScenario}>
                  <span className="material-symbols-outlined text-lg">swap_horiz</span>
                  تغییر سناریو
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <span className="material-symbols-outlined text-4xl text-zinc-400">account_tree</span>
                <p className="mt-3 text-lg font-black text-zinc-950 dark:text-white">سناریو انتخاب نشده</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">یک سناریوی آماده انتخاب کنید یا ترکیب مخصوص همین لابی را بچینید.</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">انتخاب از کتابخانه</span>
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
                  setCustomScenarioName("");
                  setShowCustomModal(true);
                }}
                disabled={settingScenario}
                className="ui-button-secondary min-h-12 w-full"
              >
                <span className="material-symbols-outlined text-xl">dashboard_customize</span>
                طراحی سناریو در لحظه
              </button>
            </div>

            {players.length > 0 && recommendedScenarios.length > 0 && !game?.scenario && (
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs font-black text-zinc-500 dark:text-zinc-400">پیشنهاد مناسب تعداد فعلی</p>
                <div className="grid gap-2 sm:grid-cols-3">
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
          </div>

          <aside className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <button
              onClick={handleStartGame}
              disabled={Boolean(startDisabledReason) || loading}
              className="ui-button-primary min-h-12 w-full text-base"
            >
              <span className="material-symbols-outlined text-xl">play_arrow</span>
              شروع بازی
            </button>
            {startDisabledReason ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-bold leading-6 text-amber-700 dark:text-amber-300">
                {startDisabledReason}
              </p>
            ) : (
              <p className="rounded-lg border border-lime-500/20 bg-lime-500/10 p-3 text-sm font-bold leading-6 text-lime-700 dark:text-lime-300">
                همه چیز برای شروع آماده است.
              </p>
            )}
          </aside>
        </div>
      </section>

      <LobbyPreviewCard
        title={game?.name || "لابی بازی مافیا"}
        subtitle="نمای بازیکنان، ظرفیت و ترکیب سناریوی انتخاب‌شده."
        scenarioName={game?.scenario?.name || "سناریوی تعیین نشده"}
        code={game?.code || "------"}
        statusLabel={seatsRemaining <= 0 && requiredPlayers ? "آماده شروع" : "در حال تکمیل"}
        playerCount={players.length}
        capacity={requiredPlayers}
        moderatorName={game?.moderator?.name || "گرداننده"}
        locked={game?.hasPassword}
        players={lobbyPlayers}
        roleBreakdown={scenarioRoles}
      />

      {showCustomModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-xl sm:items-center sm:p-4">
          <div className="ui-card flex h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-lg">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50/90 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
              <div className="min-w-0">
                <p className="ui-kicker">سناریوی سفارشی</p>
                <h2 className="mt-1 text-xl font-black text-zinc-950 dark:text-white sm:text-2xl">چیدن نقش‌ها</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                  <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
                    {selectedCustomCount} / {players.length} نقش
                  </span>
                  <span className={`rounded-lg border px-2.5 py-1 ${
                    selectedCustomCount > 0 && customScenarioDelta === 0
                      ? "border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}>
                    {customScenarioStatus}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomRoleSearch("");
                  setSaveCustomScenario(false);
                  setCustomScenarioName("");
                }}
                className="ui-button-secondary size-10 p-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
                <aside className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03] lg:sticky lg:top-0 lg:h-fit">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-zinc-950 dark:text-white">انتخاب‌شده‌ها</p>
                    {selectedCustomRoles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCustomRoles([])}
                        className="text-xs font-black text-red-600 transition-colors hover:text-red-500 dark:text-red-400"
                      >
                        پاک کردن
                      </button>
                    )}
                  </div>

                  {selectedCustomRoles.length === 0 ? (
                    <div className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-white p-4 text-sm font-bold leading-6 text-zinc-500 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-400">
                      نقش‌ها را از لیست اضافه کنید.
                    </div>
                  ) : (
                    <div className="custom-scrollbar mt-3 flex max-h-44 gap-2 overflow-x-auto pb-1 lg:max-h-[48vh] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
                      {selectedCustomRoles.map((role) => (
                        <div key={`selected-${role.id}`} className="flex min-w-44 items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-white/10 dark:bg-zinc-950/60 lg:min-w-0">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-zinc-950 dark:text-white">{role.name}</p>
                            <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[9px] font-black ${alignmentClass(role.alignment)}`}>
                              {alignmentLabel(role.alignment)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/[0.03]">
                            <button type="button" onClick={() => handleCustomRoleChange(role.id, -1)} className="flex size-7 items-center justify-center rounded-md hover:bg-white dark:hover:bg-white/10">
                              <span className="material-symbols-outlined text-base">remove</span>
                            </button>
                            <span className="w-5 text-center text-xs font-black text-zinc-950 dark:text-white">{role.count}</span>
                            <button type="button" onClick={() => handleCustomRoleChange(role.id, 1)} className="flex size-7 items-center justify-center rounded-md hover:bg-white dark:hover:bg-white/10">
                              <span className="material-symbols-outlined text-base">add</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </aside>

                <section className="min-w-0">
                  <label className="sticky top-0 z-10 mb-4 flex min-h-12 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950">
                    <span className="material-symbols-outlined text-zinc-400">search</span>
                    <input
                      value={customRoleSearch}
                      onChange={(event) => setCustomRoleSearch(event.target.value)}
                      placeholder="جستجوی سریع نقش"
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
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredCustomRoles.map((role) => {
                        const count = customRoles.find((item) => item.roleId === role.id)?.count || 0;

                        return (
                          <div
                            key={role.id}
                            className={`rounded-lg border p-3 transition-colors ${
                              count > 0
                                ? "border-lime-500/30 bg-lime-500/10"
                                : "border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{role.name}</p>
                                <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                                  {alignmentLabel(role.alignment)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-950">
                                <button type="button" onClick={() => handleCustomRoleChange(role.id, -1)} disabled={count === 0} className="flex size-9 items-center justify-center rounded-md hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-white/10">
                                  <span className="material-symbols-outlined text-base">remove</span>
                                </button>
                                <span className="w-6 text-center text-base font-black text-zinc-950 dark:text-white">{count}</span>
                                <button type="button" onClick={() => handleCustomRoleChange(role.id, 1)} className="flex size-9 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10">
                                  <span className="material-symbols-outlined text-base">add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className="grid gap-3 border-t border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/95 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <input
                  type="checkbox"
                  checked={saveCustomScenario}
                  onChange={(event) => setSaveCustomScenario(event.target.checked)}
                  className="mt-1 size-4 accent-lime-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-black text-zinc-950 dark:text-white">ذخیره در کتابخانه سناریوها</span>
                </span>
              </label>

              {saveCustomScenario && (
                <label className="flex flex-col gap-2 rounded-lg border border-lime-500/20 bg-lime-500/10 p-3 sm:col-span-2">
                  <span className="text-xs font-black text-lime-700 dark:text-lime-300">نام سناریو برای کتابخانه</span>
                  <input
                    value={customScenarioName}
                    onChange={(event) => setCustomScenarioName(event.target.value)}
                    maxLength={40}
                    placeholder="مثلاً سناریوی ۱۰ نفره جمعه"
                    className="w-full"
                  />
                </label>
              )}

              <button
                onClick={handleCreateCustomScenario}
                disabled={selectedCustomCount === 0 || selectedCustomCount !== players.length || (saveCustomScenario && !customScenarioName.trim())}
                className="ui-button-primary min-h-12 w-full"
              >
                <span className="material-symbols-outlined text-xl">save</span>
                اعمال سناریو ({selectedCustomCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
