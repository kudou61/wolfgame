/**
 * 本地存储工具函数
 */
import Taro from '@tarojs/taro'

/**
 * 存储数据
 * @param {string} key - 存储键
 * @param {any} value - 存储值
 */
export const setStorage = (key, value) => {
  try {
    Taro.setStorageSync(key, value)
  } catch (e) {
    console.error('Storage set error:', e)
  }
}

/**
 * 获取数据
 * @param {string} key - 存储键
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
export const getStorage = (key, defaultValue = null) => {
  try {
    const value = Taro.getStorageSync(key)
    return value !== undefined ? value : defaultValue
  } catch (e) {
    console.error('Storage get error:', e)
    return defaultValue
  }
}

/**
 * 删除数据
 * @param {string} key - 存储键
 */
export const removeStorage = (key) => {
  try {
    Taro.removeStorageSync(key)
  } catch (e) {
    console.error('Storage remove error:', e)
  }
}

/**
 * 清空所有数据
 */
export const clearStorage = () => {
  try {
    Taro.clearStorageSync()
  } catch (e) {
    console.error('Storage clear error:', e)
  }
}
