/**
 * 游戏常量定义
 */

// 角色类型
export const ROLES = {
  WEREWOLF: 'werewolf',
  VILLAGER: 'villager',
  SEER: 'seer',
  WITCH: 'witch',
  HUNTER: 'hunter'
}

// 游戏阶段
export const PHASES = {
  NIGHT: 'night',
  DAY: 'day',
  VOTE: 'vote'
}

// 玩家状态
export const PLAYER_STATUS = {
  ALIVE: 'alive',
  DEAD: 'dead'
}

// 行动类型
export const ACTION_TYPES = {
  KILL: 'kill',
  SAVE: 'save',
  POISON: 'poison',
  CHECK: 'check',
  SHOOT: 'shoot',
  VOTE: 'vote'
}

// 阵营类型
export const CAMPS = {
  WEREWOLF: 'werewolf',
  GOOD: 'good'
}
