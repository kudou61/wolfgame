/**
 * 游戏逻辑工具函数
 */

/**
 * 判断角色是否为狼人
 * @param {string} role - 角色类型
 * @returns {boolean}
 */
export const isWerewolf = (role) => {
  return role === 'werewolf'
}

/**
 * 判断角色是否为好人阵营
 * @param {string} role - 角色类型
 * @returns {boolean}
 */
export const isGood = (role) => {
  return ['villager', 'seer', 'witch', 'hunter'].includes(role)
}

/**
 * 判断游戏阶段是否为夜晚
 * @param {string} phase - 游戏阶段
 * @returns {boolean}
 */
export const isNight = (phase) => {
  return phase === 'night'
}

/**
 * 判断玩家是否存活
 * @param {object} player - 玩家对象
 * @returns {boolean}
 */
export const isAlive = (player) => {
  return player.status === 'alive'
}
