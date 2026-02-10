import React from 'react';
import { motion } from 'framer-motion';
import { User, Skull, Target, Shield, Eye, FlaskConical, Swords, Users, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Tooltip } from 'radix-ui';

/**
 * 合并 Tailwind 类名
 */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PlayerCard = ({ player, isSelected, onClick, isTargetable, showRole, speech, isActing }) => {
  const getRoleIcon = () => {
    if (!player.f_is_alive) return <Skull className="w-6 h-6 text-red-600/60" />;
    
    if (showRole) {
      switch (player.f_role) {
        case 'werewolf': return <Swords className="w-6 h-6 text-red-500" />;
        case 'seer': return <Eye className="w-6 h-6 text-indigo-400" />;
        case 'witch': return <FlaskConical className="w-6 h-6 text-emerald-400" />;
        case 'hunter': return <Shield className="w-6 h-6 text-amber-500" />;
        default: return <Users className="w-6 h-6 text-slate-400" />;
      }
    }
    
    return <User className="w-6 h-6 text-slate-400" />;
  };

  const getRoleName = () => {
    if (!showRole) return player.f_name;
    const roleMap = {
      'werewolf': '狼人',
      'seer': '预言家',
      'witch': '女巫',
      'hunter': '猎人',
      'villager': '村民'
    };
    return roleMap[player.f_role] || '未知';
  };

  return (
    <Tooltip.Provider delayDuration={200}>
      <motion.div
        whileHover={player.f_is_alive ? { scale: 1.05, y: -2 } : {}}
        whileTap={player.f_is_alive ? { scale: 0.95 } : {}}
        animate={isActing ? { 
          boxShadow: [
            "0 0 0px rgba(99,102,241,0)", 
            "0 0 25px rgba(99,102,241,0.8)", 
            "0 0 0px rgba(99,102,241,0)"
          ],
          borderColor: ["#1e293b", "#6366f1", "#1e293b"],
          scale: [1, 1.02, 1]
        } : {}}
        transition={isActing ? { 
          repeat: Infinity, 
          duration: 1.5,
          ease: "easeInOut"
        } : {}}
        onClick={() => player.f_is_alive && onClick?.(player)}
        className={cn(
          "relative rounded-2xl border-2 flex flex-col items-center justify-center transition-all p-1 cursor-pointer select-none aspect-square",
          player.f_is_alive 
            ? isActing
              ? "bg-indigo-500/20 border-indigo-500 z-20 shadow-[0_0_30px_rgba(99,102,241,0.4)]"
              : isSelected 
                ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(99,102,241,0.4)] z-10" 
                : "bg-slate-900 border-slate-800 hover:border-slate-600"
            : "bg-slate-950 border-slate-900 grayscale opacity-40 cursor-not-allowed",
          isTargetable && player.f_is_alive && !isSelected && !isActing && "animate-pulse border-accent/40 ring-2 ring-accent/10"
        )}
      >
        {/* Player Number Badge */}
        <div className={cn(
          "absolute top-1.5 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-md",
          player.f_is_alive ? "bg-slate-800 text-slate-400" : "bg-slate-900 text-slate-700"
        )}>
          {player.f_player_index}
        </div>

        {/* Speech Icon */}
        {speech && (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <div className="absolute top-1.5 right-2 bg-primary/20 text-primary p-1 rounded-lg border border-primary/30 animate-in fade-in zoom-in duration-300">
                <MessageSquare className="w-3 h-3 fill-current" />
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content 
                side="top" 
                className="z-[100] max-w-[200px] bg-slate-900 border border-slate-700 text-slate-200 p-3 rounded-xl shadow-2xl text-[10px] leading-relaxed animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="font-black text-primary mb-1 uppercase tracking-widest text-[8px]">
                  {player.f_player_index}号玩家发言
                </div>
                {speech}
                <Tooltip.Arrow className="fill-slate-700" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}

        {/* Main Content */}
        <div className="flex flex-col items-center gap-1.5">
          <div className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shadow-inner",
            player.f_is_alive ? "bg-slate-900" : "bg-slate-950"
          )}>
            {getRoleIcon()}
          </div>
          <div className="flex flex-col items-center leading-tight">
            <div className={cn(
              "text-[9px] font-black truncate w-full text-center px-1 uppercase tracking-tighter",
              player.f_is_alive ? "text-slate-300" : "text-slate-600"
            )}>
              {player.f_name}
            </div>
            {showRole && player.f_is_alive && (
              <div className="text-[8px] font-bold text-primary/80 uppercase tracking-widest scale-90">
                {getRoleName()}
              </div>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && !isActing && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-2 -right-2 bg-primary text-white rounded-xl p-1.5 shadow-xl border-2 border-slate-950"
          >
            <Target className="w-3.5 h-3.5" />
          </motion.div>
        )}

        {/* Death Mark */}
        {!player.f_is_alive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[2px] bg-red-600/30 rotate-45 absolute" />
            <div className="w-full h-[2px] bg-red-600/30 -rotate-45 absolute" />
          </div>
        )}
      </motion.div>
    </Tooltip.Provider>
  );
};

export default PlayerCard;