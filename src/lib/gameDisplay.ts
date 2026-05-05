export const TEMP_SCENARIO_DESCRIPTION_PREFIX = "__TEMP_GAME_SCENARIO__";

type ScenarioLike = {
  name?: string | null;
  description?: string | null;
  roles?: Array<{ count: number }> | null;
};

type GameLike = {
  name?: string | null;
  code?: string | null;
};

export function isTemporaryScenario(scenario?: ScenarioLike | null) {
  return Boolean(
    scenario?.description?.startsWith(TEMP_SCENARIO_DESCRIPTION_PREFIX) ||
      scenario?.description === "سناریو ساخته شده در لحظه"
  );
}

export function scenarioPlayerCount(scenario?: ScenarioLike | null) {
  return scenario?.roles?.reduce((sum, role) => sum + role.count, 0) || 0;
}

export function scenarioDisplayName(scenario?: ScenarioLike | null, fallback = "بدون سناریو") {
  if (!scenario) return fallback;
  if (!isTemporaryScenario(scenario)) return scenario.name || fallback;

  const count = scenarioPlayerCount(scenario);
  return count ? `سناریوی سفارشی ${count} نفره` : "سناریوی سفارشی";
}

export function scenarioDisplayDescription(scenario?: ScenarioLike | null) {
  if (!scenario || isTemporaryScenario(scenario)) return "";
  return scenario.description || "";
}

export function withScenarioDisplayName<T extends { scenario?: ScenarioLike | null }>(game: T): T {
  if (!isTemporaryScenario(game.scenario)) return game;

  return {
    ...game,
    scenario: {
      ...game.scenario,
      name: scenarioDisplayName(game.scenario),
      description: null,
    },
  } as T;
}

export function gameDisplayName(game?: GameLike | null, fallback = "لابی مافیا") {
  const cleanName = game?.name?.trim();
  if (!cleanName) return fallback;
  if (game?.code && cleanName === `بازی ${game.code}`) return fallback;
  if (/^بازی \d{6}$/.test(cleanName)) return fallback;
  return cleanName;
}

export function withGameDisplayName<T extends GameLike>(game: T): T {
  return {
    ...game,
    name: gameDisplayName(game),
  };
}
