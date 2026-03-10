import { aiAPI, gameAPI } from '@/api/index.js';
import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  game: null,
  players: [],
  logs: [],
  aiConfigs: [],
  loading: false,
  isGodMode: false,
  actingPlayerIndex: null,

  setGodMode: (val) => set({ isGodMode: val }),
  setActingPlayerIndex: (index) => set({ actingPlayerIndex: index }),

  fetchAIConfigs: async () => {
    const res = await aiAPI.getAIConfigs();
    if (res.success) set({ aiConfigs: res.data });
  },

  createAIConfig: async (data) => {
    await aiAPI.createAIConfig(data);
    get().fetchAIConfigs();
  },

  deleteAIConfig: async (id) => {
    await aiAPI.deleteAIConfig(id);
    get().fetchAIConfigs();
  },

  initGame: async (config, players) => {
    set({ loading: true });
    try {
      const res = await gameAPI.createGame({ config, players });
      set({ loading: false });
      return res.data.gameId;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  fetchGameData: async (id) => {
    const res = await gameAPI.getGame(id);
    if (res.success) {
      set({
        game: res.data.game,
        players: res.data.players || [],
        logs: res.data.logs || []
      });
      // 保留 actingPlayerIndex 的当前值，避免轮询时被覆盖
      const currentIndex = get().actingPlayerIndex;
      set({ actingPlayerIndex: currentIndex });
    }
  },

  addLog: async (logData) => {
    await gameAPI.addLog(logData);
    // Refresh logs locally or fetch again
    const res = await gameAPI.getGame(logData.gameId);
    if (res.success) set({ logs: res.data.logs });
  },

  updateGame: async (data) => {
    await gameAPI.updateGameStatus(data);
    const res = await gameAPI.getGame(data.gameId);
    if (res.success) set({ game: res.data.game });
  },

  updatePlayer: async (data) => {
    await gameAPI.updatePlayer(data);
    const res = await gameAPI.getGame(get().game.f_id);
    if (res.success) set({ players: res.data.players });
  },

  resetGame: () => {
    set({
      game: null,
      players: [],
      logs: [],
      loading: false
    });
  },

  generateReview: async (id) => {
    set({ loading: true });
    try {
      // 直接调用后端的生成接口，由后端处理数据聚合和 AI 调用，避免前端跨域问题
      const res = await gameAPI.generateReview(id);

      if (!res.success) {
        throw new Error(res.error || '复盘生成失败');
      }

      // 更新本地状态
      const gameRes = await gameAPI.getGame(id);
      if (gameRes.success) {
        set({ game: gameRes.data.game });
      }

      console.log("[game] Review generated successfully for game:", id);
      return res.data.summary;
    } catch (e) {
      console.error('[game] Generate Review Error:', e);
      throw e;
    } finally {
      set({ loading: false });
    }
  }
}));

export default useGameStore;