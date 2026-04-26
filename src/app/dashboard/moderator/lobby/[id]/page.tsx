"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher";
import { getGameStatus, startGame, setGameScenario, createCustomGameScenario } from "@/actions/game";
import { getScenarios } from "@/actions/admin";
import { getRoles } from "@/actions/role";

type Player = {
  id: string;
  name: string;
};

export default function GameLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("در حال انتظار برای بازیکنان...");
  const [settingScenario, setSettingScenario] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRoles, setCustomRoles] = useState<{ roleId: string, count: number }[]>([]);

  useEffect(() => {
    // Fetch initial status and scenarios
    Promise.all([
      getGameStatus(gameId),
      getScenarios(),
      getRoles()
    ]).then(([gameRes, scenariosRes, rolesRes]) => {
      setGame(gameRes);
      setScenarios(scenariosRes);
      setRoles(rolesRes);
      
      // If we already had players in the DB, load them here (not returned by getGameStatus currently, but ideally should be)
      // For now, we'll rely on players being empty initially or we need to update getGameStatus to return players.
      // Actually we should update getGameStatus to return players, but assuming it doesn't, players list populates as they join.
      
      setLoading(false);
    });

    // Initialize Pusher
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind('player-joined', (data: { player: Player }) => {
      setPlayers((prev) => {
        if (!prev.find(p => p.id === data.player.id)) {
           return [...prev, data.player];
        }
        return prev;
      });
    });

    channel.bind('player-left', (data: { playerId: string }) => {
      setPlayers((prev) => prev.filter(p => p.id !== data.playerId));
    });

    channel.bind('scenario-updated', (data: { scenario: any }) => {
      setGame((prev: any) => ({ ...prev, scenario: data.scenario }));
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, router]);

  const handleSelectScenario = async (scenarioId: string) => {
    setSettingScenario(true);
    const res = await setGameScenario(gameId, scenarioId);
    if (!res.success) {
      alert(res.error);
    }
    setSettingScenario(false);
  };

  const handleStartGame = async () => {
    setLoading(true);
    const res = await startGame(gameId);
    if (res.success) {
      router.push(`/dashboard/moderator/game/${gameId}`);
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleCustomRoleChange = (roleId: string, delta: number) => {
    setCustomRoles(prev => {
      const existing = prev.find(r => r.roleId === roleId);
      if (!existing && delta > 0) return [...prev, { roleId, count: 1 }];
      if (existing) {
        const newCount = Math.max(0, existing.count + delta);
        if (newCount === 0) return prev.filter(r => r.roleId !== roleId);
        return prev.map(r => r.roleId === roleId ? { ...r, count: newCount } : r);
      }
      return prev;
    });
  };

  const handleCreateCustomScenario = async () => {
    if (customRoles.length === 0) return;
    setSettingScenario(true);
    setShowCustomModal(false);
    const res = await createCustomGameScenario(gameId, customRoles);
    if (!res.success) {
      alert(res.error);
    }
    setSettingScenario(false);
  };

  if (loading) return <div className="p-12 text-center animate-pulse">در حال بارگذاری...</div>;

  const requiredPlayers = game?.scenario?.roles?.reduce((a: any, b: any) => a + b.count, 0) || 0;
  const recommendedScenarios = scenarios.filter(s => {
    const count = s.roles.reduce((a: any, b: any) => a + b.count, 0);
    return count === players.length;
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <header className="flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-lime-500/10">
          <span className="material-symbols-outlined text-3xl">groups</span>
        </div>
        <h2 className="text-2xl font-bold">لابی بازی مافیا</h2>
        <p className="text-zinc-500 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
          {status}
        </p>
        
        <div className="mt-4 p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full shadow-sm">
          <p className="text-sm text-zinc-500 mb-2">کد ورود به بازی:</p>
          <div className="text-4xl font-mono tracking-widest font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-emerald-500">
            {gameId.substring(0, 6).toUpperCase()}
          </div>
        </div>
      </header>

      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-gray-200 dark:bg-zinc-950/50">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">بازیکنان حاضر ({players.length})</h3>
        </div>
        
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 p-2 min-h-32 max-h-64 overflow-y-auto">
          {players.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-2 py-8">
              <span className="material-symbols-outlined text-4xl opacity-50">hourglass_empty</span>
              <p>منتظر ورود بازیکنان...</p>
            </div>
          ) : (
            players.map((player, i) => (
              <div key={player.id} className="p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                  {i + 1}
                </div>
                <span className="font-medium text-lg">{player.name}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">انتخاب سناریو</h3>
        
        {game?.scenario ? (
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-xl p-4 flex justify-between items-center">
             <div>
                <p className="font-bold text-lime-600 dark:text-lime-400">{game.scenario.name}</p>
                <p className="text-xs text-lime-600/70 dark:text-lime-400/70 mt-1">{requiredPlayers} نفره</p>
             </div>
             <button onClick={() => handleSelectScenario("")} className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20">تغییر</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
             {players.length > 0 && recommendedScenarios.length > 0 && (
               <div className="mb-2">
                 <p className="text-xs text-zinc-500 mb-2">پیشنهاد بر اساس تعداد بازیکنان:</p>
                 <div className="flex gap-2 flex-wrap">
                   {recommendedScenarios.map(s => (
                     <button 
                       key={s.id} 
                       onClick={() => handleSelectScenario(s.id)}
                       disabled={settingScenario}
                       className="bg-lime-500 text-zinc-950 px-4 py-2 rounded-xl text-sm font-bold hover:bg-lime-600 shadow-sm shadow-lime-500/20 disabled:opacity-50"
                     >
                       {s.name}
                     </button>
                   ))}
                 </div>
               </div>
             )}
             <select 
               onChange={(e) => handleSelectScenario(e.target.value)}
               value=""
               disabled={settingScenario}
               className="bg-gray-200 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-lime-500 w-full disabled:opacity-50"
             >
               <option value="">یک سناریو از پیش تعریف شده انتخاب کنید...</option>
               {scenarios.map(s => (
                 <option key={s.id} value={s.id}>{s.name} ({s.roles.reduce((a:any, b:any) => a + b.count, 0)} نفره)</option>
               ))}
             </select>
             
             <div className="flex items-center gap-2 mt-2">
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                <span className="text-xs text-zinc-400">یا</span>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
             </div>

             <button 
               onClick={() => setShowCustomModal(true)}
               disabled={settingScenario}
               className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-3 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
             >
               <span className="material-symbols-outlined">dashboard_customize</span>
               طراحی سناریو در لحظه
             </button>
          </div>
        )}
      </section>
      
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-300">
             <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-xl font-bold">طراحی سناریو سفارشی</h3>
                <button onClick={() => setShowCustomModal(false)} className="material-symbols-outlined text-zinc-400 hover:text-red-600 dark:text-red-400">close</button>
             </div>
             
             <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl">
                  <span className="font-semibold">تعداد بازیکنان حاضر:</span>
                  <span className="font-bold text-xl">{players.length}</span>
                </div>
                <div className="flex justify-between items-center bg-lime-500/10 text-lime-600 dark:text-lime-400 p-4 rounded-xl">
                  <span className="font-semibold">تعداد نقش‌های انتخاب شده:</span>
                  <span className="font-bold text-xl">{customRoles.reduce((a, b) => a + b.count, 0)}</span>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {roles.map(role => {
                    const count = customRoles.find(r => r.roleId === role.id)?.count || 0;
                    return (
                      <div key={role.id} className="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-gray-200 dark:bg-zinc-950/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${role.alignment === 'MAFIA' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : role.alignment === 'CITIZEN' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {role.name.substring(0, 1)}
                          </div>
                          <span className="font-medium text-sm">{role.name}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-1">
                          <button onClick={() => handleCustomRoleChange(role.id, -1)} disabled={count === 0} className="w-6 h-6 rounded flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-30">
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="w-4 text-center font-bold text-sm">{count}</span>
                          <button onClick={() => handleCustomRoleChange(role.id, 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700">
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>

             <div className="p-6 border-t border-zinc-100 dark:border-zinc-800">
               <button 
                 onClick={handleCreateCustomScenario}
                 disabled={customRoles.reduce((a, b) => a + b.count, 0) === 0}
                 className="w-full bg-lime-500 text-zinc-950 py-3 rounded-xl font-bold hover:bg-lime-600 transition-colors shadow-lg shadow-lime-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 <span className="material-symbols-outlined">save</span>
                 اعمال سناریو
               </button>
             </div>
          </div>
        </div>
      )}
      
      <button 
        onClick={handleStartGame}
        disabled={!game?.scenario || players.length < requiredPlayers || loading}
        className="w-full bg-lime-500 text-zinc-950 text-lg font-bold rounded-2xl py-4 hover:bg-lime-600 transition-colors shadow-lg shadow-lime-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">play_arrow</span>
        تایید و شروع بازی
      </button>

      {game?.scenario && players.length < requiredPlayers && (
        <p className="text-center text-sm text-red-600 dark:text-red-400 font-bold bg-red-500/10 py-2 rounded-lg">حداقل {requiredPlayers} بازیکن برای این سناریو نیاز است.</p>
      )}
    </div>
  );
}
