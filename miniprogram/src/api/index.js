import Taro from '@tarojs/taro'
import { API_CONFIG } from './config'

class ApiClient {
  request(options) {
    const { url, method = 'GET', data, header = {} } = options

    return Taro.request({
      url: `${API_CONFIG.baseURL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      timeout: API_CONFIG.timeout
    }).then(res => {
      if (res.statusCode === 200) {
        return res.data
      }
      throw new Error(res.data?.message || '请求失败')
    }).catch(err => {
      Taro.showToast({
        title: err.message || '网络错误',
        icon: 'none',
        duration: 2000
      })
      throw err
    })
  }

  get(url, data) {
    return this.request({ url, method: 'GET', data })
  }

  post(url, data) {
    return this.request({ url, method: 'POST', data })
  }

  put(url, data) {
    return this.request({ url, method: 'PUT', data })
  }

  delete(url) {
    return this.request({ url, method: 'DELETE' })
  }
}

export const api = new ApiClient()

// 游戏相关 API
export const gameApi = {
  // 创建游戏
  createGame: (config) => api.post('/api/games', config),

  // 获取游戏信息
  getGame: (id) => api.get(`/api/games/${id}`),

  // 删除游戏
  deleteGame: (id) => api.delete(`/api/games/${id}`),

  // 执行游戏动作
  performAction: (gameId, action) => api.post(`/api/games/${gameId}/actions`, action)
}
