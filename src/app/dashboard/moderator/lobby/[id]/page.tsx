"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher-client";
import { createCustomGameScenario, getGameStatus, setGameRoleAbilities, setGameScenario, startGame } from "@/actions/game";
import { getScenarios } from "@/actions/admin";
import { getRoles } from "@/actions/role";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatCell, StatusChip } from "@/components/CommandUI";

type Player = { id: string; name: string };

export default function GameLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert, showToast } = usePopup();
  const gameId = params.id as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingScenario, setSettingScenario] = useState(false);
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [customRoles, setCustomRoles] = useState<{ roleId: string; count: number }[]>([]);
  const [roleQuery, setRoleQuery] = useState("");
  const [saveCustomScenario, setSaveCustomScenario] = useState(false);
  const [customScenarioName, setCustomScenarioName] = useState("");
  const [activeRoleAbilities, setActiveRoleAbilities] = useState<Record<string, string[]>>({});

  useEffect(() => {
    Promise.all([getGameStatus(gameId), getScenarios(), getRoles()]).then(([gameRes, scenariosRes, rolesRes]) => {
      setGame(gameRes);
      setPlayers(gameRes?.players || []);
      setActiveRoleAbilities((gameRes?.activeRoleAbilities as Record<string, string[]>) || {});
      setScenarios(scenariosRes);
      setRoles(rolesRes);
      setLoading(false);
    });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);
    channel.bind("player-joined", (data: { player: Player }) => {
      setPlayers((prev) => (prev.find((p) => p.id === data.player.id) ? prev : [...prev, data.player]));
    });
    channel.bind("scenario-updated", (data: { scenario: any; activeRoleAbilities?: Record<string, string[]> }) => {
      setGame((prev: any) => ({ ...prev, scenario: data.scenario, activeRoleAbilities: data.activeRoleAbilities || prev?.activeRoleAbilities }));
      setActiveRoleAbilities(data.activeRoleAbilities || {});
    });
    channel.bind("ability-config-updated", (data: { activeRoleAbilities?: Record<string, string[]> }) => {
      setActiveRoleAbilities(data.activeRoleAbilities || {});
      setGame((prev: any) => ({ ...prev, activeRoleAbilities: data.activeRoleAbilities || {} }));
    });
    return () => pusher.unsubscribe(`game-${gameId}`);
  }, [gameId]);

  const requiredPlayers = game?.scenario?.roles?.reduce((a: any, b: any) => a + b.count, 0) || 0;
  const selectedCount = customRoles.reduce((a, b) => a + b.count, 0);
  const sortedRoles = useMemo(() => {
    const query = roleQuery.trim();
    return [...roles]
      .filter((role) => !query || role.name.includes(query))
      .sort((a, b) => {
        const ac = customRoles.find((item) => item.roleId === a.id)?.count || 0;
        const bc = customRoles.find((item) => item.roleId === b.id)?.count || 0;
        return bc - ac || a.name.localeCompare(b.name, "fa");
      });
  }, [roles, customRoles, roleQuery]);

  const handleSelectScenario = async (scenarioId: string) => {
    setSettingScenario(true);
    const res = await setGameScenario(gameId, scenarioId);
    if (!res.success) showAlert("خطا", res.error || "خطا در تنظیم سناریو", "error");
    else {
      const fresh = await getGameStatus(gameId);
      setGame(fresh);
      setActiveRoleAbilities((fresh?.activeRoleAbilities as Record<string, string[]>) || {});
      showToast("سناریو انتخاب شد", "success");
    }
    setSettingScenario(false);
  };

  const handleCustomRoleChange = (roleId: string, delta: number) => {
    setCustomRoles((prev) => {
      const existing = prev.find((role) => role.roleId === roleId);
      if (!existing && delta > 0) return [...prev, { roleId, count: 1 }];
      if (!existing) return prev;
      const next = Math.max(0, existing.count + delta);
      if (next === 0) return prev.filter((role) => role.roleId !== roleId);
      return prev.map((role) => (role.roleId === roleId ? { ...role, count: next } : role));
    });
  };

  const handleCreateCustomScenario = async () => {
    if (!selectedCount) return;
    setSettingScenario(true);
    const res = await createCustomGameScenario(gameId, customRoles, saveCustomScenario, customScenarioName);
    if (!res.success) showAlert("خطا", res.error || "خطا در ایجاد سناریوی سفارشی", "error");
    else {
      const fresh = await getGameStatus(gameId);
      setGame(fresh);
      setActiveRoleAbilities((fresh?.activeRoleAbilities as Record<string, string[]>) || {});
      showToast("سناریوی سفارشی اعمال شد", "success");
      setShowCustomSheet(false);
      setSaveCustomScenario(false);
      setCustomScenarioName("");
    }
    setSettingScenario(false);
  };

  const toggleAbility = (roleId: string, abilityId: string) => {
    setActiveRoleAbilities((prev) => {
      const current = prev[roleId] || [];
      const nextForRole = current.includes(abilityId) ? current.filter((id) => id !== abilityId) : [...current, abilityId];
      return { ...prev, [roleId]: nextForRole };
    });
  };

  const saveAbilityConfig = async () => {
    setSettingScenario(true);
    const res = await setGameRoleAbilities(gameId, activeRoleAbilities);
    if (!res.success) showAlert("خطا", res.error || "ذخیره توانایی‌ها انجام نشد.", "error");
    else showToast("توانایی‌های این بازی ذخیره شد", "success");
    setSettingScenario(false);
  };

  const handleStartGame = async () => {
    setLoading(true);
    const res = await startGame(gameId);
    if (res.success) router.push(`/dashboard/moderator/game/${gameId}`);
    else {
      showAlert("خطا در شروع بازی", res.error || "خطای نامشخص", "error");
      setLoading(false);
    }
  };

  if (loading) return <EmptyState icon="progress_activity" title="در حال بارگذاری لابی..." />;

  const scenarioAbilityRoles = (game?.scenario?.roles || [])
    .map((item: any) => ({ ...item, abilities: Array.isArray(item.role?.nightAbilities) ? item.role.nightAbilities : [] }))
    .filter((item: any) => item.abilities.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <CommandSurface className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <StatusChip tone="amber">Lobby Setup</StatusChip>
            <h1 className="mt-3 text-2xl font-black text-zinc-50">{game?.name || "لابی بازی"}</h1>
            <p className="mt-1 font-mono text-sm font-black text-cyan-100">#{game?.code}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCell label="بازیکن" value={players.length} tone="cyan" />
            <StatCell label="نقش" value={requiredPlayers || "-"} tone={requiredPlayers === players.length ? "emerald" : "amber"} />
            <StatCell label="سناریو" value={game?.scenario ? "فعال" : "نیازمند"} tone={game?.scenario ? "emerald" : "rose"} />
          </div>
        </div>
      </CommandSurface>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <SectionHeader title="فهرست بازیکنان" eyebrow="Living Roster" icon="group" />
          <CommandSurface className="p-4">
            {players.length === 0 ? (
              <EmptyState icon="hourglass_empty" title="بازیکنی وارد نشده" />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {players.map((player, index) => (
                  <div key={player.id} className="pm-ledger-row flex items-center gap-3 p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-xs font-black text-emerald-100">{index + 1}</span>
                    <p className="truncate text-sm font-black text-zinc-100">{player.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CommandSurface>
        </div>

        <div className="space-y-3">
          <SectionHeader title="سناریو" eyebrow="Scenario Control" icon="account_tree" />
          <CommandSurface className="space-y-4 p-4">
            {game?.scenario && (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <p className="font-black text-emerald-100">{game.scenario.name}</p>
                <p className="mt-1 text-xs text-emerald-100/70">{requiredPlayers} نقش برای این سناریو</p>
              </div>
            )}
            <select disabled={settingScenario} onChange={(e) => e.target.value && handleSelectScenario(e.target.value)} value="" className="pm-input h-12 px-4">
              <option value="">انتخاب سناریوی آماده...</option>
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>{scenario.name} ({scenario.roles.reduce((a: any, b: any) => a + b.count, 0)} نفره)</option>
              ))}
            </select>
            <CommandButton tone="ghost" onClick={() => setShowCustomSheet(true)} className="w-full">
              طراحی سناریوی سفارشی
            </CommandButton>
            {scenarioAbilityRoles.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-100">توانایی‌های فعال این بازی</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">برای همین لابی مشخص کنید کدام توانایی‌های نقش‌ها در گزارش فعال هستند.</p>
                  </div>
                  <CommandButton tone="ghost" onClick={saveAbilityConfig} disabled={settingScenario}>ذخیره</CommandButton>
                </div>
                <div className="mt-3 space-y-2">
                  {scenarioAbilityRoles.map((scenarioRole: any) => (
                    <div key={scenarioRole.roleId} className="pm-ledger-row p-3">
                      <p className="font-black text-zinc-100">{scenarioRole.role?.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {scenarioRole.abilities.map((ability: any) => {
                          const checked = (activeRoleAbilities[scenarioRole.roleId] || []).includes(ability.id);
                          return (
                            <button
                              key={ability.id}
                              type="button"
                              onClick={() => toggleAbility(scenarioRole.roleId, ability.id)}
                              className={`rounded-full border px-3 py-2 text-xs font-black transition-all ${checked ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.035] text-zinc-500"}`}
                            >
                              {checked ? "فعال: " : "غیرفعال: "}{ability.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CommandSurface>
        </div>
      </section>

      <CommandSurface className="p-4">
        <CommandButton onClick={handleStartGame} disabled={!game?.scenario || players.length !== requiredPlayers || loading} className="w-full">
          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          شروع بازی
        </CommandButton>
        {game?.scenario && players.length !== requiredPlayers && (
          <p className="mt-3 text-center text-sm font-bold text-amber-100">
            تعداد بازیکنان باید دقیقا با تعداد نقش‌ها برابر باشد: {players.length} / {requiredPlayers}
          </p>
        )}
      </CommandSurface>

      {showCustomSheet && (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md md:items-center">
          <CommandSurface className="pm-safe-sheet flex w-full max-w-2xl flex-col overflow-hidden p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusChip tone="violet">Custom Scenario</StatusChip>
                <h3 className="mt-3 text-xl font-black text-zinc-50">سناریوی لحظه‌ای</h3>
                <p className="mt-1 text-sm text-zinc-400">{selectedCount} نقش انتخاب شده</p>
              </div>
              <button onClick={() => setShowCustomSheet(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <input value={roleQuery} onChange={(e) => setRoleQuery(e.target.value)} placeholder="جستجوی نقش..." className="pm-input mt-4 h-12 px-4" />
            <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm font-black text-zinc-200">
              ذخیره در کتابخانه سناریوها
              <input type="checkbox" checked={saveCustomScenario} onChange={(event) => setSaveCustomScenario(event.target.checked)} className="h-5 w-5 accent-cyan-300" />
            </label>
            {saveCustomScenario && (
              <input value={customScenarioName} onChange={(event) => setCustomScenarioName(event.target.value)} placeholder="نام سناریوی ذخیره‌شده" className="pm-input mt-3 h-12 px-4" />
            )}
            <div className="pm-scrollbar mt-4 max-h-[54vh] space-y-2 overflow-y-auto">
              {sortedRoles.map((role) => {
                const count = customRoles.find((item) => item.roleId === role.id)?.count || 0;
                return (
                  <div key={role.id} className={`pm-ledger-row flex items-center justify-between gap-3 p-3 ${count ? "border-cyan-300/30 bg-cyan-300/10" : ""}`}>
                    <div className="min-w-0">
                      <p className="truncate font-black text-zinc-100">{role.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{role.alignment === "MAFIA" ? "مافیا" : role.alignment === "CITIZEN" ? "شهروند" : "مستقل"}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
                      <button onClick={() => handleCustomRoleChange(role.id, -1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">-</button>
                      <span className="w-6 text-center font-black text-cyan-100">{count}</span>
                      <button onClick={() => handleCustomRoleChange(role.id, 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <CommandButton onClick={handleCreateCustomScenario} disabled={!selectedCount || settingScenario} className="mt-4 w-full">
              اعمال سناریو
            </CommandButton>
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
