import type { Player } from '@/game/types';

export function getGameOverRedirectTarget(player: Player, isGameActive: boolean): '/dashboard' | '/' | null {
  if (isGameActive) return '/dashboard';

  const untouchedDefaultRun = player.turnCount === 0
    && player.name === 'Player'
    && player.properties.length === 0
    && player.achievements.length === 0;

  return untouchedDefaultRun ? '/' : null;
}
