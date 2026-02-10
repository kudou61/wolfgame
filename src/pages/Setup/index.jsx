import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Play, Trash2, Shield, Info, ChevronRight } from 'lucide-react';
import useGameStore from '@/stores/gameStore.js';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Setup = () => {
  const navigate = useNavigate();
  const { aiConfigs, fetchAIConfigs, initGame, createAIConfig, deleteAIConfig } = useGameStore();
  
  const [playerCount, setPlayerCount] = useState(12);
  const [includeHuman, setIncludeHuman] = useState(false);
  const [gameSpeed, setGameSpeed] = useState('standard');
  const [roles, setRoles] = useState({
    werewolf: 4, seer: 1, witch: 1, hunter: 1, villager: 5
  });

  const [showAIModal, setShowAIModal] = useState(false);
  const [newAI, setNewAI] = useState({ name: '', url: '', apiKey: '', model: '' });

  useEffect(() => {
    fetchAIConfigs();
    document.title = '游戏准备 - 狼人乱斗';
  }, []);

  useEffect(() => {
    if (playerCount === 12) setRoles({ werewolf: 4, seer: 1, witch: 1, hunter: 1, villager: 5 });
    else if (playerCount === 9) setRoles({ werewolf: 3, seer: 1, witch: 1, hunter: 1, villager: 3 });
    else if (playerCount === 6) setRoles({ werewolf: 2, seer: 1, witch: 1, hunter: 0, villager: 2 });
  }, [playerCount]);

  const handleStartGame = async () => {
    if (aiConfigs.length === 0) { toast.error('请配置 AI 模型'); setShowAIModal(true); return; }
    const totalRoles = Object.values(roles).reduce((a, b) => a + b, 0);
    if (totalRoles !== playerCount) { toast.error(`角色总数不匹配`); return; }
    const roleList = [];
    Object.entries(roles).forEach(([role, count]) => { for (let i = 0; i < count; i++) roleList.push(role); });
    const shuffledRoles = roleList.sort(() => Math.random() - 0.5);
    const players = shuffledRoles.map((role, idx) => {
      const isHuman = includeHuman && idx === 0;
      const aiModel = aiConfigs[Math.floor(Math.random() * aiConfigs.length)];
      return { name: isHuman ? '你' : `AI玩家 ${idx + 1}`, role, isHuman, modelId: isHuman ? null : aiModel.f_id };
    });
    try {
      const gameId = await initGame({ playerCount, gameSpeed, roleConfig: roles }, players);
      navigate(`/game/${gameId}`);
    } catch (e) { toast.error('创建失败'); }
  };

  const handleAddAI = async () => {
    if (!newAI.name || !newAI.url || !newAI.apiKey || !newAI.model) { toast.error('填写完整配置'); return; }
    try { await createAIConfig(newAI); toast.success('已添加'); setNewAI({ name: '', url: '', apiKey: '', model: '' }); fetchAIConfigs(); }
    catch (e) { toast.error('保存失败'); }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto p-4 md:p-8 lg:p-12">
      <header className="flex items-center justify-between mb-6 md:mb-10 lg:mb-12">
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tighter text-white flex items-center gap-3 md:gap-4">
            <Shield className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-primary" /> 狼人乱斗
          </h1>
          <p className="text-slate-500 text-[10px] md:text-xs mt-1 md:mt-2 font-bold uppercase tracking-widest">AI Large Model Battle Platform</p>
        </div>
        <button 
          onClick={() => setShowAIModal(true)} 
          className="p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all shadow-xl group"
        >
          <Settings className="w-5 h-5 md:w-7 md:h-7 text-slate-400 group-hover:rotate-90 transition-transform" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 max-w-6xl mx-auto w-full">
        {/* 左侧：核心设置 */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-5 md:p-8 rounded-3xl backdrop-blur-xl">
            <label className="flex items-center gap-2 md:gap-3 text-[10px] md:text-sm font-black text-slate-400 mb-4 md:mb-6 uppercase tracking-widest">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" /> 玩家规模
            </label>
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
              {[6, 9, 12].map(num => (
                <button 
                  key={num} 
                  onClick={() => setPlayerCount(num)} 
                  className={cn(
                    "py-3 md:py-6 rounded-xl md:rounded-2xl font-black text-lg md:text-xl transition-all border-2", 
                    playerCount === num 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-slate-800/50 border-transparent text-slate-500 hover:border-slate-700"
                  )}
                >
                  {num}人
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between bg-slate-950/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-800">
              <div className="flex flex-col">
                <span className="text-base md:text-lg font-black text-white">真人参战</span>
                <span className="text-[10px] md:text-xs text-slate-500 font-bold">开启后你将作为 1 号玩家参与</span>
              </div>
              <button 
                onClick={() => setIncludeHuman(!includeHuman)} 
                className={cn("w-12 md:w-16 h-6 md:h-8 rounded-full transition-all p-1 flex items-center", includeHuman ? "bg-primary" : "bg-slate-700")}
              >
                <div className={cn("w-4 md:w-6 h-4 md:h-6 bg-white rounded-full shadow-lg transition-transform duration-300", includeHuman ? "translate-x-6 md:translate-x-8" : "translate-x-0")} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 md:p-8 rounded-3xl backdrop-blur-xl">
            <label className="flex items-center gap-2 md:gap-3 text-[10px] md:text-sm font-black text-slate-400 mb-4 md:mb-6 uppercase tracking-widest">
              <Info className="w-4 h-4 md:w-5 md:h-5 text-primary" /> 演进速度
            </label>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {[
                { id: 'fast', label: '极速', desc: '秒级响应' }, 
                { id: 'standard', label: '标准', desc: '正常语速' }, 
                { id: 'slow', label: '沉浸', desc: '深度思考' }
              ].map(speed => (
                <button 
                  key={speed.id} 
                  onClick={() => setGameSpeed(speed.id)} 
                  className={cn(
                    "p-2 md:p-4 rounded-xl md:rounded-2xl text-center transition-all border-2", 
                    gameSpeed === speed.id 
                      ? "bg-white border-white text-slate-950 shadow-lg" 
                      : "bg-slate-800/50 border-transparent text-slate-500"
                  )}
                >
                  <div className="text-xs md:text-sm font-black">{speed.label}</div>
                  <div className="text-[8px] md:text-[10px] font-bold opacity-60">{speed.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：角色与开始 */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-5 md:p-8 rounded-3xl backdrop-blur-xl">
            <label className="flex items-center gap-2 md:gap-3 text-[10px] md:text-sm font-black text-slate-400 mb-4 md:mb-6 uppercase tracking-widest">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-primary" /> 阵营分配
            </label>
            <div className="grid grid-cols-1 gap-2 md:gap-3">
              {Object.entries(roles).map(([role, count]) => (
                <div key={role} className="bg-slate-950/50 border border-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                  <span className="text-xs md:text-sm font-black text-slate-200">
                    {role === 'werewolf' ? '🐺 狼人' : role === 'seer' ? '🔮 预言家' : role === 'witch' ? '🧪 女巫' : role === 'hunter' ? '🏹 猎人' : '👨‍🌾 村民'}
                  </span>
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      onClick={() => setRoles({...roles, [role]: Math.max(0, count - 1)})} 
                      className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg md:rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
                    >-</button>
                    <span className="font-mono font-black text-base md:text-lg text-white w-5 md:w-6 text-center">{count}</span>
                    <button 
                      onClick={() => setRoles({...roles, [role]: count + 1})} 
                      className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg md:rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleStartGame} 
            className="w-full py-5 md:py-8 bg-primary text-white rounded-3xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-[0_15px_40px_rgba(99,102,241,0.3)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-4 group"
          >
            <Play className="w-6 h-6 md:w-8 md:h-8 fill-current group-hover:translate-x-1 transition-transform" /> 
            开启对局
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 opacity-50" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowAIModal(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 40, opacity: 0 }} 
              className="relative w-full max-w-2xl bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl md:text-3xl font-black mb-6 md:mb-8 text-white flex items-center gap-3 md:gap-4">
                <Settings className="text-primary w-7 h-7 md:w-10 md:h-10" /> 模型引擎管理
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3 md:space-y-4 max-h-[250px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {aiConfigs.map(cfg => (
                    <div key={cfg.f_id} className="p-4 md:p-5 bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-black text-sm md:text-base text-slate-200">{cfg.f_name}</span>
                        <span className="text-[8px] md:text-[10px] text-slate-500 font-mono mt-1">{cfg.f_model}</span>
                      </div>
                      <button onClick={() => deleteAIConfig(cfg.f_id).then(fetchAIConfigs)} className="p-2 md:p-3 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg md:rounded-xl transition-all">
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  ))}
                  {aiConfigs.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm font-bold">暂无配置，请添加</div>
                  )}
                </div>
                <div className="space-y-3 md:space-y-4">
                  <input placeholder="模型昵称" className="w-full bg-slate-950 border border-slate-800 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm text-white outline-none focus:border-primary transition-all" value={newAI.name} onChange={e => setNewAI({...newAI, name: e.target.value})} />
                  <input placeholder="Model ID" className="w-full bg-slate-950 border border-slate-800 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm text-white outline-none focus:border-primary transition-all" value={newAI.model} onChange={e => setNewAI({...newAI, model: e.target.value})} />
                  <input placeholder="API Base URL" className="w-full bg-slate-950 border border-slate-800 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-4 text-[10px] md:text-xs text-white outline-none focus:border-primary transition-all" value={newAI.url} onChange={e => setNewAI({...newAI, url: e.target.value})} />
                  <input placeholder="API Key" type="password" className="w-full bg-slate-950 border border-slate-800 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-4 text-sm text-white outline-none focus:border-primary transition-all" value={newAI.apiKey} onChange={e => setNewAI({...newAI, apiKey: e.target.value})} />
                  <button onClick={handleAddAI} className="w-full py-3 md:py-5 bg-white text-slate-950 rounded-lg md:rounded-2xl font-black text-sm md:text-base shadow-xl hover:bg-slate-100 transition-all">保存配置</button>
                </div>
              </div>
              <button onClick={() => setShowAIModal(false)} className="w-full mt-6 md:mt-8 py-3 md:py-4 bg-slate-800 text-slate-400 rounded-lg md:rounded-2xl font-bold text-sm hover:text-white transition-all">关闭</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Setup;