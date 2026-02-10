/**
 * API 请求封装
 * 替代 @alipay/weavefox-vibe-web 的 vibeSdk.functions 调用
 */

const API_BASE = '/api';

/**
 * 通用请求函数
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`[API] Request failed: ${path}`, error);
    throw error;
  }
}

/**
 * GET 请求
 */
export const get = (path) => request(path, { method: 'GET' });

/**
 * POST 请求
 */
export const post = (path, data) => request(path, {
  method: 'POST',
  body: JSON.stringify(data),
});

/**
 * DELETE 请求
 */
export const del = (path) => request(path, { method: 'DELETE' });

// ============ AI 配置相关 ============
export const aiAPI = {
  getAIConfigs: () => get('/ai-configs'),
  createAIConfig: (data) => post('/ai-configs', data),
  deleteAIConfig: (id) => del(`/ai-configs/${id}`),
  completion: (data) => post('/ai/completion', data),
  // 并发调用多个AI配置进行投票决策
  batchVoteCompletion: (requests) => {
    // 返回一个 Promise.all，并发处理所有AI请求
    return Promise.all(
      requests.map(req => post('/ai/completion', req))
    );
  }
};

// ============ 游戏相关 ============
export const gameAPI = {
  createGame: (data) => post('/game/create', data),
  getGame: (id) => get(`/game/${id}`),
  addLog: (data) => post('/game/log', data),
  updateGameStatus: (data) => post('/game/update-status', data),
  updatePlayer: (data) => post('/game/update-player', data),
  generateReview: (id) => post(`/game/${id}/review-generate`),
};

export default { get, post, delete: del, aiAPI, gameAPI };