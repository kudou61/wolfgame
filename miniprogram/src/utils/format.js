/**
 * 格式化工具函数
 */

/**
 * 格式化时间
 * @param {number} timestamp - 时间戳
 * @returns {string} HH:MM 格式
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 格式化玩家名称
 * @param {object} player - 玩家对象
 * @param {number} index - 玩家索引
 * @returns {string}
 */
export const formatPlayerName = (player, index) => {
  return player.name || `玩家${index + 1}`
}

/**
 * 格式化日期
 * @param {number} timestamp - 时间戳
 * @returns {string} YYYY-MM-DD 格式
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}
