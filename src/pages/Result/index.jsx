import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Skull, RefreshCcw, FileText, User, Star, Award, ChevronLeft, Share2, ScrollText } from 'lucide-react';
import useGameStore from '@/stores/gameStore.js';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';

const LogsDialog = lazy(() => import('./components/LogsDialog.jsx'));

const Result = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { game, players, logs, fetchGameData, generateReview, resetGame, loading: storeLoading } = useGameStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  useEffect(() => {
    fetchGameData(id);
    document.title = '对局结算 - 狼人乱斗';
  }, [id]);

  const handlePlayAgain = () => {
    resetGame();
    navigate('/');
  };

  const result = useMemo(() => {
    if (!game?.f_result) return {};
    try { return typeof game.f_result === 'string' ? JSON.parse(game.f_result) : game.f_result; }
    catch (e) { return {}; }
  }, [game?.f_result]);

  useEffect(() => {
    if (game && !result.summary && !isGenerating) {
      const runReview = async () => {
        setIsGenerating(true);
        try {
          await generateReview(id);
        } catch (error) {
          toast.error(error.message || 'AI 复盘生成失败');
        } finally {
          setIsGenerating(false);
        }
      };
      runReview();
    }
  }, [game, result.summary, id]);

  if (!game) return <div className="flex-1 flex items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div></div>;

  const isGoodWin = result.winner === 'good';
  const summary = result.summary;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* 内容滚动区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 顶部横幅 */}
        <div className={clsx(
          "relative py-12 lg:py-20 px-8 text-center overflow-hidden",
          isGoodWin ? "bg-emerald-600/10" : "bg-red-600/10"
        )}>
          <div className="absolute inset-0 pointer-events-none">
             <div className={clsx("absolute top-0 left-1/2 -translate-x-1/2 w-full h-full blur-[100px] opacity-20", isGoodWin ? "bg-emerald-500" : "bg-red-500")} />
          </div>

          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="relative z-10">
            <div className={clsx(
              "w-24 h-24 lg:w-32 lg:h-32 rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] border-4",
              isGoodWin ? "bg-emerald-500 border-emerald-400" : "bg-red-500 border-red-400"
            )}>
              {isGoodWin ? <Trophy className="w-12 h-12 lg:w-16 lg:h-16 text-white" /> : <Skull className="w-12 h-12 lg:w-16 lg:h-16 text-white" />}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter mb-4 uppercase leading-[1.1] py-1">
              {isGoodWin ? '好人阵营胜利' : '狼人阵营胜利'}
            </h1>
            <p className="text-slate-400 font-bold text-sm lg:text-lg uppercase tracking-[0.2em]">Game Over • {game.f_day_count} Days Battle</p>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto w-full p-6 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：玩家列表 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl">
              <h2 className="text-sm font-black text-slate-500 mb-8 flex items-center gap-3 uppercase tracking-widest">
                <Award className="w-5 h-5 text-primary" /> 身份揭秘
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {players.map(p => (
                  <div key={p.f_id} className={clsx(
                    "bg-slate-950/50 p-4 rounded-2xl border flex flex-col items-center text-center group transition-all relative overflow-hidden",
                    p.f_is_alive ? "border-slate-800 hover:border-primary/30" : "border-red-900/30 opacity-60 grayscale-[0.5]"
                  )}>
                    {!p.f_is_alive && (
                      <div className="absolute top-0 right-0 p-1 bg-red-500/20 rounded-bl-xl">
                        <Skull className="w-3 h-3 text-red-500" />
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-black mb-2">#{p.f_player_index}</div>
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border transition-transform",
                      p.f_is_alive ? "bg-slate-900 border-slate-800 group-hover:scale-110" : "bg-slate-950 border-red-900/20"
                    )}>
                       <User className={clsx("w-6 h-6", p.f_is_alive ? "text-slate-400" : "text-slate-600")} />
                    </div>
                    <div className="text-xs font-black truncate w-full mb-2">{p.f_name}</div>
                    <div className="flex flex-col gap-1 w-full">
                      <div className={clsx(
                        "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter",
                        p.f_role === 'werewolf' ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                      )}>
                        {p.f_role === 'werewolf' ? '狼人' : p.f_role === 'seer' ? '预言家' : p.f_role === 'witch' ? '女巫' : p.f_role === 'hunter' ? '猎人' : '村民'}
                      </div>
                      <div className={clsx(
                        "text-[9px] font-black uppercase tracking-widest py-0.5 rounded",
                        p.f_is_alive ? "text-emerald-500/80" : "text-red-500/80"
                      )}>
                        {p.f_is_alive ? '存活' : '已出局'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：AI复盘 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-black text-slate-500 flex items-center gap-3 uppercase tracking-widest">
                  <FileText className="w-5 h-5 text-primary" /> AI 首席分析师复盘
                </h2>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsLogsOpen(true)} className="text-xs text-slate-400 font-black hover:text-white flex items-center gap-2 uppercase tracking-tighter transition-colors">
                    <ScrollText className="w-4 h-4" /> 查看对局日志
                  </button>
                  {summary && !isGenerating && (
                    <button onClick={() => generateReview(id)} className="text-xs text-primary font-black hover:underline flex items-center gap-2 uppercase tracking-tighter">
                      <RefreshCcw className="w-4 h-4" /> 重新生成
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center py-24">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Star className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-white uppercase tracking-[0.3em] mb-2">Analyzing Battle Logs</p>
                      <p className="text-sm text-slate-500 animate-pulse">正在深度解构对局博弈逻辑，请稍候...</p>
                    </div>
                  </div>
                ) : summary ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="prose prose-invert prose-slate max-w-none text-slate-300 bg-slate-950/50 p-8 rounded-3xl border border-slate-800 shadow-inner overflow-y-auto max-h-[600px] custom-scrollbar">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-24 opacity-20">
                    <FileText className="w-16 h-16 mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest">暂无复盘数据</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部固定操作栏 */}
      <div className="sticky bottom-0 left-0 right-0 p-4 lg:p-6 bg-slate-950/80 backdrop-blur-2xl border-t border-slate-800/50 z-50">
        <div className="max-w-6xl mx-auto flex gap-3 lg:gap-4">
          <button onClick={handlePlayAgain} className="flex-1 py-3 lg:py-4 bg-slate-800 text-white rounded-xl lg:rounded-2xl font-black text-sm lg:text-base flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-700 transition-all shadow-lg">
            <RefreshCcw className="w-4 h-4 lg:w-5 lg:h-5" /> 再来一局
          </button>
          <button onClick={() => setIsLogsOpen(true)} className="px-4 lg:px-6 py-3 lg:py-4 bg-slate-900 text-white rounded-xl lg:rounded-2xl font-black text-sm lg:text-base flex items-center justify-center gap-2 border border-slate-800 hover:bg-slate-800 transition-all shadow-lg whitespace-nowrap">
            <ScrollText className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" /> 日志
          </button>
          <button onClick={() => toast.success('战报已复制到剪贴板')} className="px-4 lg:px-6 py-3 lg:py-4 bg-primary text-white rounded-xl lg:rounded-2xl font-black text-sm lg:text-base flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap">
            <Share2 className="w-4 h-4 lg:w-5 lg:h-5" /> 分享
          </button>
        </div>
      </div>

      <Suspense fallback={
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
        </div>
      }>
        {isLogsOpen && (
          <LogsDialog 
            open={isLogsOpen} 
            onOpenChange={setIsLogsOpen} 
            logs={logs || []} 
            players={players || []} 
          />
        )}
      </Suspense>
    </div>
  );
};

export default Result;