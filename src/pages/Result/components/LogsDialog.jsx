import React, { useMemo } from 'react';
import { Dialog } from 'radix-ui';
import { X, ScrollText, MessageSquare, Brain, Zap, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

const LogsDialog = ({ open, onOpenChange, logs = [], players = [] }) => {
  const getPlayerName = (index) => {
    const p = (players || []).find(player => player.f_player_index === index);
    if (!p) return '系统';

    // 显示玩家身份
    const roleName = p.f_role === 'werewolf' ? '狼人' :
                     p.f_role === 'seer' ? '预言家' :
                     p.f_role === 'witch' ? '女巫' :
                     p.f_role === 'hunter' ? '猎人' : '村民';
    return `${p.f_player_index}号(${p.f_name})[${roleName}]`;
  };

  // 根据玩家身份获取颜色样式
  const getPlayerRoleStyle = (index) => {
    const p = (players || []).find(player => player.f_player_index === index);
    if (!p) return {};

    // 根据角色返回不同的边框颜色
    const roleColors = {
      'werewolf': 'border-red-500/50',
      'seer': 'border-indigo-500/50',
      'witch': 'border-emerald-500/50',
      'hunter': 'border-amber-500/50',
      'villager': 'border-sky-500/50'
    };

    return {
      borderColor: roleColors[p.f_role] || 'border-slate-600'
    };
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'speech': return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'thought': return <Brain className="w-4 h-4 text-purple-400" />;
      case 'action': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'system': return <ShieldAlert className="w-4 h-4 text-slate-400" />;
      default: return <ScrollText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getLogTypeLabel = (type) => {
    switch (type) {
      case 'speech': return '发言';
      case 'thought': return '内心想法';
      case 'action': return '行动';
      case 'system': return '系统';
      default: return '记录';
    }
  };

  // Group logs by Day
  const groupedLogs = (logs || []).reduce((acc, log) => {
    // 隐藏内部详细日志（如详细投票流水）
    if (log.f_visibility === 'internal') return acc;
    
    const day = log.f_day || 0;
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-in fade-in duration-300 transform" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl z-[101] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
            <div>
              <Dialog.Title className="text-2xl font-black text-white flex items-center gap-3 italic tracking-tighter uppercase">
                <ScrollText className="w-8 h-8 text-primary" /> 完整对局日志
              </Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                Full Battle History & Player Thoughts
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
            {Object.keys(groupedLogs).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <ScrollText className="w-16 h-16 mb-4" />
                <p className="text-lg font-black uppercase tracking-widest">暂无对局日志</p>
              </div>
            ) : (
              Object.entries(groupedLogs).sort(([a], [b]) => Number(a) - Number(b)).map(([day, dayLogs]) => (
                <div key={day} className="space-y-6">
                  <div className="sticky top-0 z-10 flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-slate-800" />
                    <span className="px-6 py-2 bg-slate-800 text-slate-300 rounded-full text-xs font-black uppercase tracking-[0.3em] border border-slate-700 shadow-xl">
                      {day === '0' ? '游戏准备' : `第 ${day} 天`}
                    </span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>

                  <div className="space-y-4">
                    {dayLogs.map((log) => {
                      const playerStyle = getPlayerRoleStyle(log.f_player_index);
                      return (
                        <div key={log.f_id} className={clsx(
                          "group relative pl-6 border-l-2 transition-all hover:border-primary/50",
                          log.f_type === 'thought' ? "border-purple-500/30" :
                          log.f_type === 'speech' ? "border-sky-500/30" :
                          log.f_type === 'action' ? "border-amber-500/30" : "border-slate-800",
                          playerStyle.borderColor
                        )}>
                          <div className="flex items-start gap-4">
                            <div className={clsx(
                              "mt-1 p-1.5 rounded-lg border",
                              log.f_type === 'thought' ? "bg-purple-500/10 border-purple-500/20" :
                              log.f_type === 'speech' ? "bg-sky-500/10 border-sky-500/20" :
                              log.f_type === 'action' ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-800 border-slate-700"
                            )}>
                              {getLogIcon(log.f_type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={clsx(
                                  "text-xs font-black uppercase tracking-tighter",
                                  log.f_player_index ? "text-slate-300" : "text-slate-400"
                                )}>
                                  {getPlayerName(log.f_player_index)}
                                </span>
                                <span className={clsx(
                                  "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                                  log.f_type === 'thought' ? "text-purple-400 bg-purple-500/5" :
                                  log.f_type === 'speech' ? "text-sky-400 bg-sky-500/5" :
                                  log.f_type === 'action' ? "text-amber-400 bg-amber-500/5" : "text-slate-500 bg-slate-800/50"
                                )}>
                                  {getLogTypeLabel(log.f_type)}
                                </span>
                                {log.f_phase && (
                                  <span className="text-[10px] text-slate-600 font-bold uppercase">
                                    • {log.f_phase === 'night' ? '夜晚' : '白天'}
                                  </span>
                                )}
                              </div>
                              <p className={clsx(
                                "text-sm leading-relaxed",
                                log.f_type === 'thought' ? "text-slate-400 italic" : "text-slate-200"
                              )}>
                                {log.f_content}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-slate-800 bg-slate-900/80 text-center">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
              End of Logs • Total {(logs || []).length} Entries
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LogsDialog;