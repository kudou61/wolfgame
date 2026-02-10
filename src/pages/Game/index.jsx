import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Moon, Sun, MessageSquare, Play, Loader2, Skull, Users, LogOut, LayoutGrid, Eye, MessageSquare as MessageIcon } from 'lucide-react';
import useGameStore from '@/stores/gameStore.js';
import PlayerCard from '@/components/PlayerCard.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-hot-toast';
import { AlertDialog } from 'radix-ui';

/**
 * 合并 Tailwind 类名
 */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Game = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    game, players, logs, fetchGameData, addLog, updateGame, updatePlayer, 
    isGodMode, setGodMode, actingPlayerIndex, setActingPlayerIndex 
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  const [humanSpeech, setHumanSpeech] = useState('');
  const [speechDialog, setSpeechDialog] = useState(null); // { player, content, position: { x, y } }
  const [logPanelHeight, setLogPanelHeight] = useState(() => window.innerHeight * 0.6); // 移动端日志面板高度（默认70%）
  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);
  const isAtBottom = useRef(true);

  // 核心锁：防止并发执行和重复执行同一阶段
  const processingRef = useRef(false);
  const processedStepsRef = useRef(new Set());

  // 轮询游戏状态
  useEffect(() => {
    fetchGameData(id);
    useGameStore.getState().fetchAIConfigs();
    const timer = setInterval(() => fetchGameData(id), 4000);
    return () => clearInterval(timer);
  }, [id]);

  // 处理滚动事件
  const handleScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  // 日志自动滚动
  useEffect(() => {
    if (isAtBottom.current) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, thinkingContent]);

  const me = useMemo(() => players.find(p => p.f_is_human), [players]);
  
  // 决定是否显示某个玩家的身份
  const shouldShowRole = (player) => {
    if (isGodMode) return true;
    if (me && player.f_id === me.f_id) return true;
    // 如果是狼人阵营，可以看到队友身份
    if (me && me.f_role === 'werewolf' && player.f_role === 'werewolf') return true;
    return false;
  };

  // 决定是否显示某条日志
  const shouldShowLog = (log) => {
    if (isGodMode) return true;
    if (log.f_visibility === 'all') return true;
    if (log.f_visibility === 'internal') return false; // 内部日志平时不显示
    if (me) {
      if (log.f_visibility === me.f_role) return true;
      if (log.f_visibility === `private_${me.f_player_index}`) return true;
    }
    return false;
  };

  const nightAction = useMemo(() => {
    if (!game?.f_config) return {};
    try {
      const config = typeof game.f_config === 'string' ? JSON.parse(game.f_config) : game.f_config;
      return config.nightAction || {};
    } catch (e) { return {}; }
  }, [game?.f_config]);

  const roleDistributionText = useMemo(() => {
    if (!game?.f_config) return '';
    try {
      const config = typeof game.f_config === 'string' ? JSON.parse(game.f_config) : game.f_config;
      const rc = config.roleConfig;
      if (!rc) return '';
      const parts = [];
      if (rc.werewolf) parts.push(`狼人 x${rc.werewolf}`);
      if (rc.seer) parts.push(`预言家 x${rc.seer}`);
      if (rc.witch) parts.push(`女巫 x${rc.witch}`);
      if (rc.hunter) parts.push(`猎人 x${rc.hunter}`);
      if (rc.villager) parts.push(`村民 x${rc.villager}`);
      return `本局配置：${parts.join('，')}。`;
    } catch (e) { return ''; }
  }, [game?.f_config]);

  const isWitchPhase = useMemo(() => game?.f_current_step === 'witch', [game?.f_current_step]);

  const currentStageName = useMemo(() => {
    if (!game) return '';
    const phase = game.f_current_phase === 'night' ? '夜晚' : '白天';
    const stepMap = {
      'werewolf': '狼人猎杀阶段',
      'seer': '预言家查验阶段',
      'witch': '女巫行动阶段',
      'announcement': '晨间宣告阶段',
      'discussion': '自由辩论阶段',
      'voting': '全员投票阶段',
      'hunter_shot': '猎人反击阶段'
    };
    return `[第${game.f_day_count}天 ${phase}] ${stepMap[game.f_current_step] || ''}`;
  }, [game]);
  
  // 游戏逻辑推进
  useEffect(() => {
    if (!game || game.f_status !== 'playing' || isProcessing || processingRef.current) return;
    const alivePlayers = players.filter(p => p.f_is_alive);
    if (alivePlayers.length === 0) return;
    const wolves = alivePlayers.filter(p => p.f_role === 'werewolf');
    const good = alivePlayers.filter(p => p.f_role !== 'werewolf');
    if (wolves.length === 0) { handleGameOver('good'); return; }
    if (wolves.length >= good.length) { handleGameOver('werewolf'); return; }
    
    // 检查是否已经处理过当前步骤
    const stepKey = `${id}_${game.f_day_count}_${game.f_current_phase}_${game.f_current_step}`;
    if (processedStepsRef.current.has(stepKey)) return;

    checkAndRunAIStep();
  }, [game, players, logs, isProcessing]);

  const handleGameOver = async (winner) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    console.log(`[game] Game Over detected. Winner: ${winner}`);
    try {
      await updateGame({ gameId: id, status: 'finished', result: { winner } });
      toast.success(winner === 'werewolf' ? '狼人阵营获胜！' : '好人阵营获胜！');
      navigate(`/result/${id}`);
    } catch (e) { 
      console.error('[game] Handle Game Over Error:', e); 
    } finally { 
      setIsProcessing(false); 
      processingRef.current = false;
    }
  };

  const checkAndRunAIStep = async () => {
    if (processingRef.current) return;
    
    const step = game.f_current_step;
    const phase = game.f_current_phase;
    const stepKey = `${id}_${game.f_day_count}_${phase}_${step}`;
    
    // 双重检查锁定
    if (processedStepsRef.current.has(stepKey)) return;
    
    console.log(`[game] Checking AI Step: ${stepKey}`);
    processingRef.current = true;
    setIsProcessing(true);

    try {
      if (phase === 'night') {
        if (step === 'werewolf') {
          const activeWolves = players.filter(p => p.f_role === 'werewolf' && p.f_is_alive);
          console.log(`[game] Running Werewolf Night. Active wolves: ${activeWolves.length}`);
          if (activeWolves.length > 0 && activeWolves.every(p => !p.f_is_human)) {
            const success = await runWerewolfNight(activeWolves);
            if (success) processedStepsRef.current.add(stepKey);
          } else if (activeWolves.some(p => p.f_is_human)) {
            console.log(`[game] Waiting for human werewolf action.`);
            if (me?.f_role === 'werewolf') setActingPlayerIndex(me.f_player_index);
          }
        } else if (step === 'seer') {
          const seer = players.find(p => p.f_role === 'seer');
          console.log(`[game] Seer phase. Seer alive: ${seer?.f_is_alive}`);
          if (!seer || !seer.f_is_alive) {
            await advanceStep('witch');
            processedStepsRef.current.add(stepKey);
          } else if (!seer.f_is_human) {
            const success = await runSeerNight(seer);
            if (success) processedStepsRef.current.add(stepKey);
          } else {
            if (me?.f_role === 'seer') setActingPlayerIndex(me.f_player_index);
          }
        } else if (step === 'witch') {
          const witch = players.find(p => p.f_role === 'witch');
          console.log(`[game] Witch phase. Witch alive: ${witch?.f_is_alive}`);
          if (!witch || !witch.f_is_alive) {
            await advanceStep('announcement');
            processedStepsRef.current.add(stepKey);
          } else if (!witch.f_is_human) {
            const success = await runWitchNight(witch);
            if (success) processedStepsRef.current.add(stepKey);
          } else {
            if (me?.f_role === 'witch') setActingPlayerIndex(me.f_player_index);
          }
        }
      } else {
        if (step === 'announcement') {
          console.log(`[game] Running Announcement.`);
          await runAnnouncement();
          processedStepsRef.current.add(stepKey);
        } else if (step === 'discussion') {
          console.log(`[game] Running Discussion.`);
          const success = await runDiscussion();
          if (success) processedStepsRef.current.add(stepKey);
        } else if (step === 'voting') {
          console.log(`[game] Running Voting.`);
          if (me?.f_is_alive) setActingPlayerIndex(me.f_player_index);
          await runVoting();
        } else if (step === 'hunter_shot') {
          if (me?.f_role === 'hunter') setActingPlayerIndex(me.f_player_index);
        }
      }
    } catch (error) { 
      console.error('[game] AI Step Error:', error); 
    } finally {
      setIsProcessing(false); 
      processingRef.current = false;
    }
  };

  const callAI = async (system, prompt) => {
    console.log("[game] === [AI Request] ===");
    console.log("[game] System:", system);
    console.log("[game] Prompt:", prompt);

    try {
      const response = await fetch('/api/ai/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ system, prompt })
      });
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'AI 调用失败');
      }
      return json.data.text;
    } catch (e) {
      console.error('[game] AI Error:', e);
      throw new Error('AI 调用失败，请检查 AI 配置');
    }
  };

  const runWerewolfNight = async (activeWolves) => {
    // 夜晚不设置高亮，防止暴露身份
    setThinkingContent('狼人们正在秘密商议...');
    const aliveGood = players.filter(p => p.f_is_alive && p.f_role !== 'werewolf');
    const allWolves = players.filter(p => p.f_role === 'werewolf');
    if (aliveGood.length === 0) return false;

    let targetIdx;
    try {
      const historyContext = logs
        .filter(l => l.f_visibility === 'all' || l.f_visibility === 'werewolf')
        .slice(-50)
        .map(l => {
          const phaseName = (l.f_phase || 'night') === 'night' ? '夜晚' : '白天';
          const day = l.f_day || 1;
          const timePrefix = `[第${day}天 ${phaseName}]`;
          if (l.f_player_index !== null && l.f_player_index !== undefined) {
            const action = l.f_type === 'speech' ? '发言' : '';
            return `${timePrefix} ${l.f_player_index}号${action}: ${l.f_content}`;
          }
          return `${timePrefix} 系统: ${l.f_content}`;
        })
        .join('\n');

      const systemPrompt = `你是一群狼人的领袖。你的目标是消灭所有好人。作为狼人，你需要通过隐蔽、欺骗和策略来赢得比赛。`;
      const prompt = `你是${activeWolves[0]?.f_player_index}号(狼人)。
${roleDistributionText}
当前阶段：${currentStageName}
你的狼人队友编号是：${allWolves.map(p => p.f_player_index + (p.f_is_alive ? '' : '(已出局)')).join(', ')}。
当前存活的好人：${aliveGood.map(p => p.f_player_index).join(', ')}。

[历史记录]
${historyContext}

[行动指令]
请分析局势，选择今晚杀害的目标。
请严格按格式输出：[内心想法] 你的分析和理由 (杀害) 玩家编号
示例：[内心想法] 3号是预言家，必须尽早除掉。(杀害) 3

策略提示：
1. 优先击杀威胁大的神职人员（如预言家、女巫）。
2. 也可以考虑"自刀"来骗取女巫的灵药，或者通过击杀行为制造混乱。
3. 分析发言记录，找出谁最怀疑你们，或者谁最被大家信任。`;

      const res = await callAI(systemPrompt, prompt);

      // 解析内心想法和杀害目标
      const thoughtMatch = res.match(/[\[【(（](?:内心想法|思考|想法)[\]】)）]\s*([\s\S]*?)\s*(?=[\[【(（](?:杀害|击杀)[\]】)）]|$)/i);
      const killMatch = res.match(/[\[【(（](?:杀害|击杀)[\]】)）]\s*(\d+)/i);

      let thought = thoughtMatch ? thoughtMatch[1].trim() : "";
      targetIdx = killMatch ? parseInt(killMatch[1]) : null;

      // 如果没匹配到格式，尝试直接找数字
      if (!targetIdx) {
        const fallbackMatch = res.match(/\d+/);
        targetIdx = fallbackMatch ? parseInt(fallbackMatch[0]) : aliveGood[0].f_player_index;
      }

      // 记录内心想法
      if (thought) {
        await addLog({
          gameId: id,
          type: 'thought',
          content: thought,
          visibility: 'werewolf',
          playerIndex: activeWolves[0]?.f_player_index,
          day: game.f_day_count,
          phase: 'night'
        });
      }
    } catch (e) {
      targetIdx = aliveGood[Math.floor(Math.random() * aliveGood.length)].f_player_index;
    }

    await addLog({ gameId: id, type: 'action', content: `狼人们商议后，决定杀害 ${targetIdx}号玩家`, visibility: 'werewolf', phase: 'night', day: game.f_day_count, playerIndex: activeWolves[0]?.f_player_index });
    
    const config = typeof game.f_config === 'string' ? JSON.parse(game.f_config) : (game.f_config || {});
    const nightAction = config.nightAction || {};
    nightAction.killed = targetIdx;
    await updateGame({ gameId: id, config: { ...config, nightAction } });
    await advanceStep('seer'); 
    setThinkingContent('');
    return true;
  };

  const runSeerNight = async (seer) => {
    // 夜晚不设置高亮，防止暴露身份
    setThinkingContent('预言家正在冥想查验...');
    const statusData = seer.f_status_data || { check_history: [] };
    const checkedIndices = statusData.check_history || [];
    const targets = players.filter(p => p.f_is_alive && p.f_id !== seer.f_id && !checkedIndices.includes(p.f_player_index));
    
    if (targets.length === 0) {
      await advanceStep('witch');
      return true;
    }

    let targetIdx;
    try {
      const historyContext = logs
        .filter(l => l.f_visibility === 'all' || l.f_visibility === `private_${seer.f_player_index}`)
        .slice(-50)
        .map(l => {
          const phaseName = (l.f_phase || 'night') === 'night' ? '夜晚' : '白天';
          const day = l.f_day || 1;
          const timePrefix = `[第${day}天 ${phaseName}]`;
          if (l.f_player_index !== null && l.f_player_index !== undefined) {
            const action = l.f_type === 'speech' ? '发言' : '';
            return `${timePrefix} ${l.f_player_index}号${action}: ${l.f_content}`;
          }
          return `${timePrefix} 系统: ${l.f_content}`;
        })
        .join('\n');

      const systemPrompt = `你是预言家。你的目标是查验玩家身份，带领好人阵营走向胜利。`;
      const prompt = `你是${seer.f_player_index}号(预言家)。
${roleDistributionText}
当前阶段：${currentStageName}
存活且未查验的玩家：${targets.map(p => p.f_player_index).join(', ')}。

[历史记录]
${historyContext}

[行动指令]
请选择一人查验。
请严格按格式输出：[内心想法] 你的分析和理由 (查验) 玩家编号
示例：[内心想法] 3号发言很可疑，我想先查验他。(查验) 3`;

      const res = await callAI(systemPrompt, prompt);

      // 解析内心想法和查验目标
      const thoughtMatch = res.match(/[\[【(（](?:内心想法|思考|想法)[\]】)）]\s*([\s\S]*?)\s*(?=[\[【(（](?:查验)[\]】)）]|$)/i);
      const checkMatch = res.match(/[\[【(（](?:查验)[\]】)）]\s*(\d+)/i);

      let thought = thoughtMatch ? thoughtMatch[1].trim() : "";
      targetIdx = checkMatch ? parseInt(checkMatch[1]) : null;

      // 如果没匹配到格式，尝试直接找数字
      if (!targetIdx) {
        const fallbackMatch = res.match(/\d+/);
        targetIdx = fallbackMatch ? parseInt(fallbackMatch[0]) : targets[0].f_player_index;
      }

      // 记录内心想法
      if (thought) {
        await addLog({
          gameId: id,
          type: 'thought',
          content: thought,
          visibility: `private_${seer.f_player_index}`,
          playerIndex: seer.f_player_index,
          day: game.f_day_count,
          phase: 'night'
        });
      }
    } catch (e) {
      targetIdx = targets[Math.floor(Math.random() * targets.length)].f_player_index;
    }

    const finalTarget = players.find(p => p.f_player_index === targetIdx) || targets[0];
    const isWolf = finalTarget.f_role === 'werewolf';
    checkedIndices.push(finalTarget.f_player_index);

    await addLog({ gameId: id, type: 'action', content: `查验了 ${finalTarget.f_player_index}号，其身份为：${isWolf ? '狼人' : '好人'}`, visibility: `private_${seer.f_player_index}`, phase: 'night', day: game.f_day_count, playerIndex: seer.f_player_index });
    await updatePlayer({ playerId: seer.f_id, statusData: { ...statusData, check_history: checkedIndices } });
    await advanceStep('witch'); 
    setThinkingContent('');
    return true;
  };

  const runWitchNight = async (witch) => {
    // 夜晚不设置高亮，防止暴露身份
    setThinkingContent('女巫正在调配秘药...');
    const config = typeof game.f_config === 'string' ? JSON.parse(game.f_config) : (game.f_config || {});
    const nightAction = config.nightAction || {};
    const statusData = witch.f_status_data || { potions: { save: 1, kill: 1 } };
    
    let aiDecision = { action: 'skip', target: null };
    try {
      const historyContext = logs
        .filter(l => l.f_visibility === 'all' || l.f_visibility === `private_${witch.f_player_index}`)
        .slice(-50)
        .map(l => {
          const phaseName = (l.f_phase || 'night') === 'night' ? '夜晚' : '白天';
          const day = l.f_day || 1;
          const timePrefix = `[第${day}天 ${phaseName}]`;
          if (l.f_player_index !== null && l.f_player_index !== undefined) {
            const action = l.f_type === 'speech' ? '发言' : '';
            return `${timePrefix} ${l.f_player_index}号${action}: ${l.f_content}`;
          }
          return `${timePrefix} 系统: ${l.f_content}`;
        })
        .join('\n');

      const systemPrompt = `你是女巫。你拥有一瓶灵药和一瓶毒药，你的目标是保护好人并消灭狼人。`;
      const prompt = `你是${witch.f_player_index}号(女巫)。
${roleDistributionText}
当前阶段：${currentStageName}
灵药剩余：${statusData.potions.save}，毒药剩余：${statusData.potions.kill}。
今晚被杀的是：${nightAction.killed || '无人'}。

[历史记录]
${historyContext}

[行动指令]
请决定今晚的行动。
请严格按格式输出：[内心想法] 你的分析和理由 (行动) 动作类型 [目标]
支持的行动：
- (救人) save - 只有今晚有玩家被杀时才能使用
- (毒人) poison 后面跟目标玩家编号，如 (毒人) 3
- (不动) skip - 不使用任何药水

示例：
[内心想法] 3号是预言家，今晚他被杀了，我要救他。(救人)
[内心想法] 5号发言像狼人，我要毒死他。(毒人) 5
[内心想法] 不太确定，今晚先不动。(不动)`;

      const res = await callAI(systemPrompt, prompt);

      // 解析内心想法和行动
      const thoughtMatch = res.match(/[\[【(（](?:内心想法|思考|想法)[\]】)）]\s*([\s\S]*?)\s*(?=[\[【(（](?:救人|毒人|不动)[\]】)）]|$)/i);
      const actionMatch = res.match(/[\[【(（](?:救人|毒人|不动)[\]】)）](?:\s*(\d+))?/i);

      let thought = thoughtMatch ? thoughtMatch[1].trim() : "";
      const actionType = actionMatch ? actionMatch[1].trim() : 'skip';
      const actionTarget = actionMatch && actionMatch[2] ? parseInt(actionMatch[2]) : null;

      // 转换为之前的决策格式
      if (actionType === '救人' || actionType === 'save') {
        aiDecision = { action: 'save' };
      } else if ((actionType === '毒人' || actionType === 'poison') && actionTarget) {
        aiDecision = { action: 'poison', target: actionTarget };
      } else {
        aiDecision = { action: 'skip' };
      }

      // 记录内心想法
      if (thought) {
        await addLog({
          gameId: id,
          type: 'thought',
          content: thought,
          visibility: `private_${witch.f_player_index}`,
          playerIndex: witch.f_player_index,
          day: game.f_day_count,
          phase: 'night'
        });
      }

      console.log(`[game] Witch AI Decision:`, aiDecision);
    } catch (e) { console.error('[game] Witch AI Error', e); }

    let acted = false;
    if (aiDecision.action === 'save' && nightAction.killed && statusData.potions.save > 0) {
      await addLog({ gameId: id, type: 'action', content: `女巫使用了灵药救活了 ${nightAction.killed}号玩家`, visibility: `private_${witch.f_player_index}`, phase: 'night', day: game.f_day_count, playerIndex: witch.f_player_index });
      nightAction.killed = null; statusData.potions.save = 0; acted = true;
    } else if (aiDecision.action === 'poison' && statusData.potions.kill > 0 && aiDecision.target) {
      const target = players.find(p => p.f_player_index === aiDecision.target && p.f_is_alive);
      if (target) {
        nightAction.poisoned = target.f_player_index; statusData.potions.kill = 0;
        await addLog({ gameId: id, type: 'action', content: `女巫使用了毒药带走了 ${target.f_player_index}号玩家`, visibility: `private_${witch.f_player_index}`, phase: 'night', day: game.f_day_count, playerIndex: witch.f_player_index });
        acted = true;
      }
    }

    if (acted) await updatePlayer({ playerId: witch.f_id, statusData });
    await updateGame({ gameId: id, config: { ...config, nightAction } });
    await advanceStep('announcement'); 
    setThinkingContent('');
    return true;
  };

  const runAnnouncement = async () => {
    const config = typeof game.f_config === 'string' ? JSON.parse(game.f_config) : (game.f_config || {});
    const nightAction = config.nightAction || {};
    const killedIdx = nightAction.killed;
    const poisonedIdx = nightAction.poisoned;
    let deathContent = '昨晚是个平安夜。';
    const deadIndices = [];
    if (killedIdx !== null && killedIdx !== undefined) deadIndices.push(killedIdx);
    if (poisonedIdx !== null && poisonedIdx !== undefined) deadIndices.push(poisonedIdx);
    
    if (deadIndices.length > 0) deathContent = `昨晚，${deadIndices.join('号、')}号玩家倒在了血泊中。`;
    await addLog({ gameId: id, type: 'system', content: deathContent, visibility: 'all', phase: 'day', day: game.f_day_count });
    
    // 确保宣告时没有高亮
    setActingPlayerIndex(null);

    for (const idx of deadIndices) {
      const victim = players.find(p => p.f_player_index === idx);
      if (victim) {
        await updatePlayer({ playerId: victim.f_id, isAlive: false });
        if (victim.f_role === 'hunter') await runHunterSkill(victim);
      }
    }

    // 计算发言起始位置
    // 规则：首日平安夜从 1 号 (index 0) 开始；有人出局从首位出局者的下一位开始
    let startIndex = 0; 
    if (deadIndices.length > 0) {
      // 从第一个出局者的下一位开始
      startIndex = (deadIndices[0] + 1) % players.length;
    }

    await updateGame({ 
      gameId: id, 
      config: { ...config, nightAction: {}, discussionStartIndex: startIndex } 
    });
    await advanceStep('discussion');
  };

  const runHunterSkill = async (hunter) => {
    setActingPlayerIndex(hunter.f_player_index);
    await addLog({ gameId: id, type: 'system', content: `🏹 猎人 ${hunter.f_player_index}号 触发了技能！`, visibility: 'all', phase: 'day', day: game.f_day_count });

    if (!hunter.f_is_human) {
      const targets = players.filter(p => p.f_is_alive && p.f_id !== hunter.f_id);
      if (targets.length > 0) {
        setThinkingContent(`${hunter.f_player_index}号猎人正在分析局势...`);

        let targetIdx = null;
        try {
          const currentLogs = useGameStore.getState().logs;
          const historyContext = currentLogs
            .filter(l => {
              if (l.f_visibility === 'all' || l.f_visibility === 'internal') return true;
              return false;
            })
            .slice(-60)
            .map(l => {
              const phaseName = (l.f_phase || 'night') === 'night' ? '夜晚' : '白天';
              const day = l.f_day || 1;
              const timePrefix = `[第${day}天 ${phaseName}]`;
              if (l.f_player_index !== null && l.f_player_index !== undefined) {
                const action = l.f_type === 'speech' ? '发言' : '';
                return `${timePrefix} ${l.f_player_index}号${action}: ${l.f_content}`;
              }
              return `${timePrefix} 系统: ${l.f_content}`;
            })
            .join('\n');

          const aliveIndices = targets.map(p => p.f_player_index);

          const systemPrompt = `你是猎人。你临死前可以开枪带走一名玩家。你的目标是帮助好人阵营获胜。`;
          const prompt = `你是${hunter.f_player_index}号(猎人)。
${roleDistributionText}
当前阶段：${currentStageName}
你已被淘汰，临死前可以开枪带走一名玩家。
可选择的目标：${aliveIndices.join(', ')}号。

[历史记录]
${historyContext}

[行动指令]
请分析之前的发言和行动记录，选择你最想带走的目标。
你的目标是帮助好人阵营获胜，优先带走疑似狼人的玩家。
请严格按格式输出：[内心想法] 你的分析和理由 (开枪) 玩家编号
示例：[内心想法] 3号发言逻辑混乱，5号预言家查杀了他，我要带走3号。(开枪) 3`;

          const res = await callAI(systemPrompt, prompt);

          const thoughtMatch = res.match(/[\[【(（](?:内心想法|思考|想法)[\]】)）]\s*([\s\S]*?)\s*(?=[\[【(（](?:开枪|目标)[\]】)）]|$)/i);
          const shotMatch = res.match(/[\[【(（](?:开枪|目标)[\]】)）]\s*(\d+)/i);

          let thought = thoughtMatch ? thoughtMatch[1].trim() : "";
          targetIdx = shotMatch ? parseInt(shotMatch[1]) : null;

          if (!targetIdx) {
            const fallbackMatch = res.match(/\d+/);
            targetIdx = fallbackMatch ? parseInt(fallbackMatch[0]) : targets[0].f_player_index;
          }

          if (thought) {
            await addLog({
              gameId: id,
              type: 'thought',
              content: thought,
              visibility: `private_${hunter.f_player_index}`,
              playerIndex: hunter.f_player_index,
              day: game.f_day_count,
              phase: 'day'
            });
          }
        } catch (e) {
          console.error(`[game] Hunter AI Error:`, e);
          targetIdx = targets[Math.floor(Math.random() * targets.length)].f_player_index;
        }

        const target = players.find(p => p.f_player_index === targetIdx && p.f_is_alive) || targets[0];
        await addLog({ gameId: id, type: 'action', content: `猎人临死前开枪带走了 ${target.f_player_index}号玩家`, visibility: 'all', phase: 'day', day: game.f_day_count });
        await updatePlayer({ playerId: target.f_id, isAlive: false });

        setActingPlayerIndex(null);
        setThinkingContent('');
      }
    } else {
      toast('你是猎人，请选择一名玩家带走！', { icon: '🏹' });
      await updateGame({ gameId: id, step: 'hunter_shot' });
    }
  };

  const runDiscussion = async () => {
    const config = typeof game.f_config === 'string' ? JSON.parse(game.f_config) : (game.f_config || {});
    const startIndex = config.discussionStartIndex || 0;
    
    const alivePlayers = players.filter(p => p.f_is_alive);
    
    // 获取所有存活玩家并按照规则排序
    const sortedAlive = [...alivePlayers].sort((a, b) => a.f_player_index - b.f_player_index);
    
    // 找到第一个索引大于等于 startIndex 的存活玩家作为起点
    let startPos = sortedAlive.findIndex(p => p.f_player_index >= startIndex);
    if (startPos === -1) startPos = 0; 
    
    const orderedPlayers = [
      ...sortedAlive.slice(startPos),
      ...sortedAlive.slice(0, startPos)
    ];
    
    // 获取当前天已发言的玩家编号
    const latestLogs = useGameStore.getState().logs;
    const currentDaySpeeches = latestLogs.filter(l => l.f_day === game.f_day_count && l.f_type === 'speech');
    const spokenIndices = new Set(currentDaySpeeches.map(l => l.f_player_index));

    for (const player of orderedPlayers) {
      if (spokenIndices.has(player.f_player_index)) continue;

      // 如果轮到真人玩家发言，停止 AI 自动运行，等待真人
      if (player.f_is_human) {
        setActingPlayerIndex(player.f_player_index);
        setThinkingContent('等待玩家发言...');
        return false;
      }

      // AI 发言逻辑
      const ai = player;
      setActingPlayerIndex(ai.f_player_index);
      setThinkingContent(`${ai.f_player_index}号玩家正在组织语言...`);
      try {
        // 重新获取日志以确保包含刚刚产生的发言
        const currentLogs = useGameStore.getState().logs;
        const currentRoundSpeeches = currentLogs
          .filter(l => l.f_day === game.f_day_count && l.f_type === 'speech')
          .map(l => `[第${l.f_day || 1}天 白天] ${l.f_player_index}号发言: ${l.f_content}`)
          .join('\n');

        const historyContext = currentLogs
          .filter(l => {
            if (l.f_day === game.f_day_count && l.f_type === 'speech') return false; 
            if (l.f_visibility === 'all') return true;
            if (l.f_visibility === 'werewolf' && ai.f_role === 'werewolf') return true;
            if (l.f_visibility === `private_${ai.f_player_index}`) return true;
            return false;
          })
          .slice(-50)
          .map(l => {
            const phaseName = (l.f_phase || 'night') === 'night' ? '夜晚' : '白天';
            const day = l.f_day || 1;
            const timePrefix = `[第${day}天 ${phaseName}]`;
            if (l.f_player_index !== null && l.f_player_index !== undefined) {
              const action = l.f_type === 'speech' ? '发言' : '';
              return `${timePrefix} ${l.f_player_index}号${action}: ${l.f_content}`;
            }
            return `${timePrefix} 系统: ${l.f_content}`;
          })
          .join('\n');

        const systemPrompt = `你是一个狼人杀游戏的玩家。你的目标是根据你的身份带领你的阵营获胜。你需要展现出合理的逻辑，并根据局势进行博弈。`;
        
        let guidelines = "";
        if (ai.f_role === 'werewolf') {
          const allWolves = players.filter(p => p.f_role === 'werewolf');
          guidelines = `你是狼人。你的核心目标是隐藏身份，生存下去并消灭好人。
你的狼人队友编号是：${allWolves.map(p => p.f_player_index + (p.f_is_alive ? '' : '(已出局)')).join(', ')}。
行为准则：
1. **严禁自曝**：除非局势已定或为了极大的战略收益，否则绝不要承认自己是狼人。
2. **伪装身份**：在发言中表现得像个村民或某个神职人员。你可以假装自己是预言家并发“查杀”或“金水”。
3. **逻辑博弈**：观察他人的发言，找出逻辑漏洞并加以攻击，将嫌疑引向他人。
4. **配合队友**：留意队友的发言，在不暴露彼此关系的前提下互相掩护或进行“倒钩”操作。
5. **内心想法**：在[内心想法]中详细规划你的欺骗策略，但在(发言)中必须表现得正气凛然。`;
        } else if (ai.f_role === 'seer') {
          guidelines = `你是预言家。你需要通过查验信息带领好人走向胜利。注意保护自己，不要过早暴露。`;
        } else if (ai.f_role === 'witch') {
          guidelines = `你是女巫。手中握有生杀大权。谨慎使用药水，并观察谁在伪装。`;
        } else if (ai.f_role === 'hunter') {
          guidelines = `你是猎人。如果你被放逐或杀害，你可以开枪带走一名玩家。`;
        } else {
          guidelines = `你是村民。你需要通过分析他人的发言，找出狼人并将其投票出局。`;
        }

        const prompt = `你是${ai.f_player_index}号玩家，身份是${ai.f_role}。
${roleDistributionText}
当前阶段：${currentStageName}
当前存活：${alivePlayers.map(p => `${p.f_player_index}号`).join(', ')}。

[身份准则]
${guidelines}

[历史记录]
${historyContext}

【本轮已发言内容】
${currentRoundSpeeches || '暂无'}

[行动指令]
请分析局势并开始你的思考与发言。注意参考前面玩家的发言内容，分析逻辑并给出回应。
**注意：发言内容字数必须控制在 30 到 300 字之间。**
请严格按格式输出：[内心想法] (发言) 你的发言内容`;

        const fullText = await callAI(systemPrompt, prompt);

        if (fullText) {
          let thought = "";
          let speech = "";

          // 使用更健壮的正则提取内心想法和发言，支持中英文括号
          const thoughtRegex = /[\[【(（](?:内心想法|思考|想法)[\]】)）]\s*([\s\S]*?)\s*(?=[\[【(（](?:发言|说|对话)[\]】)）]|$)/i;
          const speechRegex = /[\[【(（](?:发言|说|对话)[\]】)）]\s*([\s\S]*)/i;

          const thoughtMatch = fullText.match(thoughtRegex);
          const speechMatch = fullText.match(speechRegex);

          if (thoughtMatch) {
            thought = thoughtMatch[1].trim();
          }
          
          if (speechMatch) {
            speech = speechMatch[1].trim();
          } else if (!thoughtMatch) {
            // 如果完全没匹配到格式，则整段作为发言
            speech = fullText.trim();
          } else {
            // 如果有内心想法但没匹配到发言标签，尝试寻找可能的分割点或者取剩余部分
            const remaining = fullText.replace(thoughtRegex, '').trim();
            if (remaining) {
              speech = remaining;
            }
          }
          
          // 过滤掉可能残留在内容中的标签文字
          const cleanTag = (text) => text.replace(/^[\[【(（](?:内心想法|思考|想法|发言|说|对话)[\]】)）]/, '').trim();
          if (thought) thought = cleanTag(thought);
          if (speech) speech = cleanTag(speech);
          
          // 只有当真正有内容时才添加日志
          if (thought && thought !== '内心想法') {
            await addLog({ gameId: id, type: 'thought', content: thought, visibility: `private_${ai.f_player_index}`, playerIndex: ai.f_player_index, day: game.f_day_count, phase: 'day' });
          }
          
          if (speech) {
            await addLog({ gameId: id, type: 'speech', content: speech, visibility: 'all', playerIndex: ai.f_player_index, day: game.f_day_count, phase: 'day' });
          }
          // 发言结束，清除高亮
          setActingPlayerIndex(null);
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (e) { 
        console.error('AI Speech Error:', e);
        setActingPlayerIndex(null);
      }
    }

    // 更新最新日志状态，确保后续逻辑拿到最新数据
    await fetchGameData(id);

    await advanceStep('voting'); 
    setThinkingContent('');
    return true;
  };

  const runVoting = async () => {
    if (me?.f_is_alive) {
      const myVote = logs.find(l => l.f_type === 'vote' && l.f_player_index === me.f_player_index && l.f_day === game.f_day_count);
      if (!myVote) return; 
    }

    setThinkingContent('正在统计投票结果...');
    const alivePlayers = players.filter(p => p.f_is_alive);
    const aliveIndices = alivePlayers.map(p => p.f_player_index);
    const voteRecords = [];
    
    for (const p of alivePlayers) {
      let targetIdx = null;
      if (p.f_is_human) {
        setActingPlayerIndex(p.f_player_index);
        const myVote = logs.find(l => l.f_type === 'vote' && l.f_player_index === p.f_player_index && l.f_day === game.f_day_count);
        const match = myVote?.f_content.match(/\d+/);
        targetIdx = match ? parseInt(match[0]) : null;
      } else {
        try {
          setActingPlayerIndex(p.f_player_index);
          setThinkingContent(`${p.f_player_index}号玩家正在决定投票...`);
          
          // 获取该玩家可见的历史记录
          const currentLogs = useGameStore.getState().logs;
          const historyContext = currentLogs
            .filter(l => {
              // 核心修改：投票阶段只能看到之前回合的投票结果，不能看到当前回合其他人的实时投票
              if (l.f_type === 'vote' && l.f_day === game.f_day_count) return false;

              if (l.f_visibility === 'all' || l.f_visibility === 'internal') return true;
              if (l.f_visibility === 'werewolf' && p.f_role === 'werewolf') return true;
              if (l.f_visibility === `private_${p.f_player_index}`) return true;
              return false;
            })
            .slice(-60) // 投票时需要更长的上下文
            .map(l => {
              const phaseName = (l.f_phase || 'night') === 'night' ? '夜晚' : '白天';
              const day = l.f_day || 1;
              const timePrefix = `[第${day}天 ${phaseName}]`;
              if (l.f_player_index !== null && l.f_player_index !== undefined) {
                const action = l.f_type === 'speech' ? '发言' : '';
                return `${timePrefix} ${l.f_player_index}号${action}: ${l.f_content}`;
              }
              return `${timePrefix} 系统: ${l.f_content}`;
            })
            .join('\n');

          const systemPrompt = `你是一个狼人杀游戏的玩家。现在进入投票环节，你需要决定将哪位玩家放逐。`;
          const prompt = `你是${p.f_player_index}号玩家，身份是${p.f_role}。
${roleDistributionText}
当前阶段：${currentStageName}
存活玩家：${aliveIndices.join(', ')}。
你的目标是：${p.f_role === 'werewolf' ? '隐藏身份并放逐好人' : '找出狼人并将其放逐'}。

[历史记录]
${historyContext}

[行动指令]
请分析之前的发言和行动记录，决定你的投票目标。注意你无法看到其他玩家在本轮（今天）的实时投票结果。
请严格按格式输出：[内心想法] 你的分析和理由 (投票) 玩家编号
示例：[内心想法] 3号发言逻辑混乱，且5号预言家查杀了他。(投票) 3`;

          const res = await callAI(systemPrompt, prompt);
          
          // 解析内心想法和投票
          const thoughtMatch = res.match(/[\[【(（](?:内心想法|思考|想法)[\]】)）]\s*([\s\S]*?)\s*(?=[\[【(（](?:投票|选择)[\]】)）]|$)/i);
          const voteMatch = res.match(/[\[【(（](?:投票|选择)[\]】)）]\s*(\d+)/i);
          
          let thought = thoughtMatch ? thoughtMatch[1].trim() : "";
          targetIdx = voteMatch ? parseInt(voteMatch[1]) : null;

          // 如果没匹配到格式，尝试直接找数字
          if (!targetIdx) {
            const fallbackMatch = res.match(/\d+/);
            targetIdx = fallbackMatch ? parseInt(fallbackMatch[0]) : null;
          }

          if (thought) {
            await addLog({ 
              gameId: id, 
              type: 'thought', 
              content: thought, 
              visibility: `private_${p.f_player_index}`, 
              playerIndex: p.f_player_index, 
              day: game.f_day_count, 
              phase: 'day' 
            });
          }

          if (targetIdx && aliveIndices.includes(targetIdx) && targetIdx !== p.f_player_index) {
            await addLog({ 
              gameId: id, 
              type: 'vote', 
              content: `投票给了 ${targetIdx}号玩家`, 
              visibility: 'all', 
              playerIndex: p.f_player_index, 
              phase: 'day', 
              day: game.f_day_count 
            });
          } else {
            // 兜底逻辑：弃票或随机投一个
            targetIdx = null;
            await addLog({ 
              gameId: id, 
              type: 'vote', 
              content: `弃票`, 
              visibility: 'all', 
              playerIndex: p.f_player_index, 
              phase: 'day', 
              day: game.f_day_count 
            });
          }
          // 投票结束，清除高亮
          setActingPlayerIndex(null);
        } catch (e) {
          console.error(`Player ${p.f_player_index} Vote Error:`, e);
          setActingPlayerIndex(null);
        }
      }
      if (targetIdx) voteRecords.push({ voter: p.f_player_index, target: targetIdx });
    }

    const voteCounts = {};
    voteRecords.forEach(r => voteCounts[r.target] = (voteCounts[r.target] || 0) + 1);
    
    let maxVotes = 0;
    let candidates = [];
    for (const [target, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) { maxVotes = count; candidates = [parseInt(target)]; }
      else if (count === maxVotes) { candidates.push(parseInt(target)); }
    }

    if (candidates.length === 1 && maxVotes > 0) {
      const victim = players.find(p => p.f_is_alive && p.f_player_index === candidates[0]);
      
      // 记录详细投票流水（内部可见，用于AI分析）
      const voteSummary = voteRecords.map(r => `${r.voter}号->${r.target}号`).join('，');
      await addLog({
        gameId: id,
        type: 'system',
        content: `投票详情：${voteSummary}`,
        visibility: 'internal',
        phase: 'day',
        day: game.f_day_count
      });

      // 公示最终结果（全员可见）
      await addLog({ 
        gameId: id, 
        type: 'system', 
        content: `[第${game.f_day_count}天 白天] 投票结果：${candidates[0]}号玩家以 ${maxVotes}票出局。`, 
        visibility: 'all', 
        phase: 'day', 
        day: game.f_day_count 
      });

      if (victim) {
        await updatePlayer({ playerId: victim.f_id, isAlive: false });
        if (victim.f_role === 'hunter') await runHunterSkill(victim);
      }
    } else {
      // 记录详细投票流水（内部可见）
      const voteSummary = voteRecords.length > 0 
        ? voteRecords.map(r => `${r.voter}号->${r.target}号`).join('，')
        : '无人投票';
      
      await addLog({
        gameId: id,
        type: 'system',
        content: `投票详情：${voteSummary}`,
        visibility: 'internal',
        phase: 'day',
        day: game.f_day_count
      });

      await addLog({ 
        gameId: id, 
        type: 'system', 
        content: `[第${game.f_day_count}天 白天] 投票结果：平票或无人投票，无人出局。`, 
        visibility: 'all', 
        phase: 'day', 
        day: game.f_day_count 
      });
    }

    await advanceStep('werewolf'); 
    setThinkingContent('');
  };

  const advanceStep = async (nextStep) => {
    const currentState = useGameStore.getState().game;
    let nextPhase = currentState.f_current_phase; 
    let nextDay = currentState.f_day_count;
    
    if (nextStep === 'werewolf') { 
      nextPhase = 'night'; 
      nextDay += 1; 
    } else if (nextStep === 'announcement' || nextStep === 'discussion' || nextStep === 'voting') {
      nextPhase = 'day';
    }
    
    await updateGame({ 
      gameId: id, 
      step: nextStep, 
      phase: nextPhase, 
      dayCount: nextDay 
    });
    setActingPlayerIndex(null);
  };

  const handleHumanAction = async (actionType) => {
    if (actionType === 'speech') {
      if (!humanSpeech.trim()) return;
      setIsProcessing(true);
      await addLog({ 
        gameId: id, 
        type: 'speech', 
        content: humanSpeech.trim(), 
        visibility: 'all', 
        playerIndex: me.f_player_index,
        day: game.f_day_count,
        phase: 'day'
      });
      setHumanSpeech('');
      setActingPlayerIndex(null); // 人类发言结束，清除高亮
      setIsProcessing(false);
      return;
    }

    if (!selectedTarget && actionType !== 'skip') { toast.error('请先选择一个目标'); return; }
    setIsProcessing(true);
    const step = game.f_current_step;
    const config = typeof game.f_config === 'string' ? JSON.parse(game.f_config) : game.f_config;
    const nightAction = config.nightAction ? (typeof config.nightAction === 'string' ? JSON.parse(config.nightAction) : config.nightAction) : {};
    try {
      if (step === 'werewolf') {
        nightAction.killed = selectedTarget.f_player_index;
        await updateGame({ gameId: id, config: { ...config, nightAction } });
        await addLog({ gameId: id, type: 'action', content: `你选择了杀害 ${selectedTarget.f_player_index}号`, visibility: 'werewolf', phase: 'night', day: game.f_day_count, playerIndex: me.f_player_index });
        await advanceStep('seer');
      } else if (step === 'seer') {
        const isWolf = selectedTarget.f_role === 'werewolf';
        await addLog({ gameId: id, type: 'action', content: `你查验了 ${selectedTarget.f_player_index}号，身份为：${isWolf ? '狼人' : '好人'}`, visibility: `private_${me.f_player_index}`, phase: 'night', day: game.f_day_count, playerIndex: me.f_player_index });
        await advanceStep('witch');
      } else if (step === 'witch') {
        const statusData = { ...me.f_status_data };
        if (actionType === 'save') {
          if (statusData.potions?.save > 0 && nightAction.killed === selectedTarget.f_player_index) {
            nightAction.killed = null; statusData.potions.save = 0;
            await addLog({ gameId: id, type: 'action', content: `你救活了 ${selectedTarget.f_player_index}号`, visibility: `private_${me.f_player_index}`, phase: 'night', day: game.f_day_count, playerIndex: me.f_player_index });
          } else { toast.error('无法救治'); setIsProcessing(false); return; }
        } else if (actionType === 'poison') {
          if (statusData.potions?.kill > 0) {
            nightAction.poisoned = selectedTarget.f_player_index; statusData.potions.kill = 0;
            await addLog({ gameId: id, type: 'action', content: `你毒走了 ${selectedTarget.f_player_index}号`, visibility: `private_${me.f_player_index}`, phase: 'night', day: game.f_day_count, playerIndex: me.f_player_index });
          } else { toast.error('药水用完'); setIsProcessing(false); return; }
        }
        await updatePlayer({ playerId: me.f_id, statusData });
        await updateGame({ gameId: id, config: { ...config, nightAction } });
        await advanceStep('announcement');
      } else if (step === 'voting') {
        await addLog({ gameId: id, type: 'vote', content: `你投票给了 ${selectedTarget.f_player_index}号玩家`, visibility: 'all', playerIndex: me.f_player_index, phase: 'day', day: game.f_day_count });
        setActingPlayerIndex(null); // 投票结束清除高亮
      } else if (step === 'hunter_shot') {
        await addLog({ gameId: id, type: 'action', content: `你开枪带走了 ${selectedTarget.f_player_index}号玩家`, visibility: 'all', phase: 'day', day: game.f_day_count, playerIndex: me.f_player_index });
        await updatePlayer({ playerId: selectedTarget.f_id, isAlive: false });
        await advanceStep('werewolf');
      }
    } catch (err) { toast.error('操作失败'); } finally { setIsProcessing(false); setSelectedTarget(null); }
  };

  const skipAction = async () => {
    setIsProcessing(true);
    if (game.f_current_step === 'witch') await advanceStep('announcement');
    else if (game.f_current_step === 'hunter_shot') await advanceStep('werewolf');
    setIsProcessing(false);
  };

  const handleShowSpeech = (player, content, position) => {
    setSpeechDialog({ player, content, position });
  };

  const handleSelectPlayer = (player) => {
    // 如果点击的是已选中的玩家，则取消选中；否则选中该玩家
    if (selectedTarget?.f_id === player.f_id) {
      setSelectedTarget(null);
    } else {
      setSelectedTarget(player);
    }
  };

  // 处理日志面板拖动调整高度
  const handleLogPanelDrag = (e) => {
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    const newHeight = window.innerHeight - clientY;
    setLogPanelHeight(Math.max(200, Math.min(window.innerHeight - 100, newHeight)));
  };

  const startLogPanelDrag = (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleLogPanelDrag);
    document.addEventListener('touchmove', handleLogPanelDrag);
    document.addEventListener('mouseup', stopLogPanelDrag);
    document.addEventListener('touchend', stopLogPanelDrag);
  };

  const stopLogPanelDrag = () => {
    document.removeEventListener('mousemove', handleLogPanelDrag);
    document.removeEventListener('touchmove', handleLogPanelDrag);
    document.removeEventListener('mouseup', stopLogPanelDrag);
    document.removeEventListener('touchend', stopLogPanelDrag);
  };

  if (!game) return <div className="flex-1 flex items-center justify-center bg-slate-950"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen w-full bg-slate-950 text-white lg:overflow-hidden">
      {/* 左侧/顶部：状态与舞台 */}
      <div className="flex flex-col h-[18vh] lg:h-full lg:w-1/4 lg:border-r border-slate-800 bg-slate-900/40 backdrop-blur-xl z-20 shrink-0">
        {/* 顶部状态栏 */}
        <div className="h-12 lg:h-20 border-b border-slate-800/50 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex flex-col">
            <span className="text-[8px] lg:text-[10px] font-black text-primary uppercase tracking-widest">Room #{id}</span>
            <span className="text-[10px] lg:text-xs font-bold text-slate-400">Live Battle</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 上帝视角开关 */}
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button 
                  className={cn(
                    "p-1.5 lg:p-2 rounded-xl transition-all flex items-center gap-1.5 border",
                    isGodMode 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Eye className="w-4 h-4 lg:w-5 h-5" />
                  <span className="text-[10px] font-black uppercase hidden sm:inline">
                    {isGodMode ? '上帝模式' : '观察模式'}
                  </span>
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] z-[101]">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Eye className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black mb-4">
                      {isGodMode ? '切换到观察者模式？' : '开启上帝视角？'}
                    </h2>
                    <p className="text-slate-400 mb-8 text-sm">
                      {isGodMode 
                        ? '切换后你将只能看到公共信息，不再能透视他人身份和内心活动。' 
                        : '上帝视角将揭示所有玩家的真实身份、内心想法以及夜晚的所有行动日志。'}
                    </p>
                    <div className="flex gap-4">
                      <AlertDialog.Cancel asChild>
                        <button className="flex-1 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-colors">取消</button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <button 
                          onClick={() => setGodMode(!isGodMode)} 
                          className={cn(
                            "flex-1 py-3 rounded-xl font-bold transition-colors",
                            isGodMode ? "bg-slate-700" : "bg-primary"
                          )}
                        >
                          确认切换
                        </button>
                      </AlertDialog.Action>
                    </div>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>

             <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button className="p-1.5 lg:p-2 hover:bg-red-500/10 rounded-xl transition-colors text-slate-500 hover:text-red-500"><LogOut className="w-4 h-4 lg:w-5 h-5" /></button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] z-[101]">
                  <div className="text-center">
                    <h2 className="text-2xl font-black mb-4">退出游戏？</h2>
                    <p className="text-slate-400 mb-8 text-sm">对局正在进行中，退出将丢失进度。</p>
                    <div className="flex gap-4">
                      <AlertDialog.Cancel asChild><button className="flex-1 py-3 bg-slate-800 rounded-xl font-bold">取消</button></AlertDialog.Cancel>
                      <AlertDialog.Action asChild><button onClick={() => navigate('/')} className="flex-1 py-3 bg-red-600 rounded-xl font-bold">确认退出</button></AlertDialog.Action>
                    </div>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        </div>

        {/* 昼夜状态 */}
        <div className="flex-1 flex flex-row lg:flex-col items-center justify-around lg:justify-center p-2 lg:p-8 border-b border-slate-800/50 overflow-hidden">
          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl border border-slate-800 lg:mb-6">
            {game.f_current_phase === 'night' ? <Moon className="w-4 h-4 lg:w-6 h-6 text-indigo-400" /> : <Sun className="w-4 h-4 lg:w-6 h-6 text-amber-400" />}
            <span className="text-sm lg:text-xl font-black tracking-tighter whitespace-nowrap">DAY {game.f_day_count}</span>
          </div>
          
          <div className="text-center">
            <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-black text-primary mb-3 uppercase tracking-widest">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              {game.f_current_step}
            </div>
            <h2 className="text-base lg:text-3xl font-black text-white tracking-tight">
              {game.f_current_step === 'werewolf' ? '🐺 狼人猎杀' : 
               game.f_current_step === 'seer' ? '🔮 预言查验' : 
               game.f_current_step === 'witch' ? '🧪 女巫时刻' : 
               game.f_current_step === 'announcement' ? '📢 晨间宣告' : 
               game.f_current_step === 'discussion' ? '🗣️ 自由辩论' : 
               game.f_current_step === 'voting' ? '⚖️ 全员投票' : '🏹 猎人反击'}
            </h2>
          </div>
        </div>

        {/* 身份卡 (PC端常驻) */}
        <div className="hidden lg:flex flex-1 flex-col p-8 justify-end">
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-[2rem] border border-slate-700 shadow-2xl">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">My Identity</div>
            <div className="text-2xl font-black text-white mb-4">
               {me?.f_role === 'werewolf' ? '🐺 狼人' : 
                me?.f_role === 'seer' ? '🔮 预言家' : 
                me?.f_role === 'witch' ? '🧪 女巫' : 
                me?.f_role === 'hunter' ? '🏹 猎人' : 
                me ? '👨‍🌾 村民' : '👁️ 上帝视角'}
            </div>
            {me && !me.f_is_alive && (
              <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase">
                <Skull className="w-4 h-4" /> Eliminated
              </div>
            )}
            {!me && (
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase">
                <Eye className="w-4 h-4" /> Spectating
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 中间：玩家阵列 */}
      <div className="min-h-[calc(100vh-18vh-120px)] lg:h-full lg:flex-1 flex flex-col bg-slate-950 p-4 lg:p-8 lg:overflow-y-auto shrink-0 border-b lg:border-b-0 border-slate-800/50">
        <div className="flex items-center justify-between mb-3 lg:mb-6">
          <h3 className="text-[10px] lg:text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-3 h-3 lg:w-4 h-4" /> 幸存者名单
          </h3>
          <div className="flex gap-2">
            <div className="px-2 py-0.5 lg:px-3 lg:py-1 rounded-lg bg-slate-900 text-[8px] lg:text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
              {players.filter(p => p.f_is_alive).length} ALIVE
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-6">
          {players.map(p => {
            // 获取该玩家在当前天、当前阶段的最新发言
            const latestSpeech = [...logs].reverse().find(l => 
              l.f_player_index === p.f_player_index && 
              l.f_type === 'speech' && 
              l.f_day === game.f_day_count && 
              l.f_phase === game.f_current_phase
            )?.f_content;

            return (
              <div key={p.f_id} className="relative aspect-square">
                <PlayerCard
                  player={p}
                  isSelected={selectedTarget?.f_id === p.f_id}
                  onClick={handleSelectPlayer}
                  onSpeechClick={latestSpeech ? (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleShowSpeech(p, latestSpeech, {
                      x: rect.left + rect.width / 2,
                      y: rect.bottom + 10
                    });
                  } : undefined}
                  isTargetable={me?.f_is_alive && (game.f_current_phase === 'night' || game.f_current_step === 'voting' || game.f_current_step === 'hunter_shot')}
                  showRole={shouldShowRole(p)}
                  speech={latestSpeech}
                  isActing={actingPlayerIndex === p.f_player_index}
                />
                {isWitchPhase && nightAction?.killed === p.f_player_index && (isGodMode || (me && me.f_role === 'witch')) && (
                  <div className="absolute -top-1 -left-1 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded shadow-xl z-30 animate-bounce">KILLED</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧：日志与交互 (移动端为弹出层，PC端为固定面板) */}
      <div className="hidden lg:flex flex-1 min-h-0 lg:w-1/3 flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 shadow-2xl z-30 overflow-hidden">
        {/* 标签切换 */}
        <div className="flex justify-around py-2 lg:py-4 border-b border-slate-800/50 bg-slate-900/50 shrink-0">
          <button onClick={() => setActiveTab('chat')} className={cn("flex items-center gap-2 px-4 py-1.5 lg:py-2 rounded-xl transition-all font-black text-[10px] lg:text-xs uppercase tracking-widest", activeTab === 'chat' ? "bg-primary text-white" : "text-slate-500 hover:text-slate-300")}>
            <MessageSquare className="w-3.5 h-3.5 lg:w-4 h-4" /> 战报
          </button>
          <button onClick={() => setActiveTab('notes')} className={cn("flex items-center gap-2 px-4 py-1.5 lg:py-2 rounded-xl transition-all font-black text-[10px] lg:text-xs uppercase tracking-widest", activeTab === 'notes' ? "bg-primary text-white" : "text-slate-500 hover:text-slate-300")}>
            <LayoutGrid className="w-3.5 h-3.5 lg:w-4 h-4" /> 笔记
          </button>
        </div>

        {/* 日志内容 */}
        <div ref={logContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 custom-scrollbar">
          {activeTab === 'chat' ? (
            <>
              {logs.filter(shouldShowLog).map((log, idx) => (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={log.f_id || idx} className={cn("flex flex-col", log.f_type === 'system' ? "items-center my-2 lg:my-4" : "items-start")}>
                  {log.f_type === 'system' ? (
                    <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[9px] lg:text-[10px] font-bold text-slate-400 tracking-tight">{log.f_content}</div>
                  ) : (
                    <div className="flex gap-2 lg:gap-3 max-w-[95%]">
                      <div className="w-6 h-6 lg:w-8 h-8 rounded-lg lg:rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center text-[9px] lg:text-[10px] font-black text-slate-500">{log.f_player_index || '?'}</div>
                      <div className="flex flex-col gap-1">
                        <div className={cn(
                          "rounded-xl lg:rounded-2xl rounded-tl-none p-2 lg:p-3 text-[10px] lg:text-xs leading-relaxed border shadow-lg", 
                          log.f_type === 'thinking' ? "bg-indigo-950/30 border-indigo-500/20 text-indigo-300/80 italic" : 
                          log.f_type === 'action' ? "bg-indigo-900/40 border-indigo-500/30 text-indigo-100" : 
                          "bg-slate-800 border-slate-700 text-slate-200"
                        )}>
                          {log.f_type === 'thinking' && <span className="font-black mr-1 not-italic text-indigo-400/60">[内心想法]</span>}
                          {log.f_content}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {thinkingContent && (
                <div className="flex items-center gap-2 text-primary animate-pulse py-1">
                  <Loader2 className="w-3 h-3 lg:w-4 h-4 animate-spin" />
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest italic">{thinkingContent}</span>
                </div>
              )}
              <div ref={logEndRef} />
            </>
          ) : (
            <div className="space-y-2 lg:space-y-3">
              {players.map(p => (
                <div key={p.f_id} className="bg-slate-950/50 p-3 lg:p-4 rounded-xl lg:rounded-2xl flex items-center justify-between border border-slate-800 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-6 h-6 lg:w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] lg:text-xs font-black text-slate-500 group-hover:text-primary">{p.f_player_index}</div>
                    <span className="text-[10px] lg:text-xs font-bold text-slate-300">{p.f_name}</span>
                  </div>
                  <select className="bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-0.5 text-[9px] lg:text-[10px] font-bold text-slate-500 outline-none cursor-pointer">
                    <option>未知</option><option>🐺 狼人</option><option>🔮 预言家</option><option>🧪 女巫</option><option>🏹 猎人</option><option>👨‍🌾 村民</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 交互操作区 */}
        <div className="p-4 lg:p-6 bg-slate-950 border-t border-slate-800/50 shrink-0">
          {me?.f_is_alive ? (
            <div className="flex flex-col gap-3 lg:gap-4">
              {game.f_current_step === 'discussion' ? (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <textarea 
                      value={humanSpeech}
                      onChange={(e) => setHumanSpeech(e.target.value)}
                      placeholder="输入你的发言内容..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-primary transition-all resize-none h-20"
                    />
                    <button 
                      disabled={!humanSpeech.trim() || isProcessing}
                      onClick={() => handleHumanAction('speech')}
                      className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-lg disabled:opacity-30"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : game.f_current_step === 'witch' && me?.f_role === 'witch' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={!selectedTarget || isProcessing || me.f_status_data.potions?.save === 0 || nightAction?.killed !== selectedTarget?.f_player_index} onClick={() => handleHumanAction('save')} className="py-2.5 lg:py-3 rounded-xl bg-emerald-600 text-white font-black text-[10px] lg:text-xs disabled:opacity-30">灵药 ({me.f_status_data.potions?.save})</button>
                  <button disabled={!selectedTarget || isProcessing || me.f_status_data.potions?.kill === 0} onClick={() => handleHumanAction('poison')} className="py-2.5 lg:py-3 rounded-xl bg-red-600 text-white font-black text-[10px] lg:text-xs disabled:opacity-30">毒药 ({me.f_status_data.potions?.kill})</button>
                  <button onClick={skipAction} className="col-span-2 py-1.5 lg:py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-[9px] lg:text-[10px] border border-slate-700">跳过行动</button>
                </div>
              ) : (
                <button disabled={!selectedTarget || isProcessing} onClick={() => handleHumanAction()} className={cn("w-full py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-sm lg:text-lg flex items-center justify-center gap-2 lg:gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-40", game.f_current_phase === 'night' ? "bg-red-600 shadow-red-600/20" : "bg-primary shadow-primary/20")}>
                  {isProcessing ? <Loader2 className="w-5 h-5 lg:w-6 h-6 animate-spin" /> : <Play className="w-4 h-4 lg:w-5 h-5 fill-current" />}
                  <span className="uppercase tracking-widest">确认行动</span>
                </button>
              )}
            </div>
          ) : (
            <div className="py-3 lg:py-4 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl lg:rounded-2xl bg-slate-900/50">
              <div className="flex items-center gap-2 mb-1 lg:mb-2">
                {isGodMode ? (
                  <Eye className="w-5 h-5 lg:w-6 h-6 text-primary animate-pulse" />
                ) : (
                  <Users className="w-5 h-5 lg:w-6 h-6 text-slate-500" />
                )}
                <span className="text-xs lg:text-sm font-black text-white uppercase tracking-tighter">
                  {isGodMode ? '上帝视角已开启' : '观察者模式'}
                </span>
              </div>
              <span className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center px-4">
                {isGodMode 
                  ? '你可以看到所有玩家的身份、内心想法和夜晚行动' 
                  : '你正在以普通观众身份观看比赛'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 移动端底部交互操作区 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800/50 p-4 z-[60]">
        {me?.f_is_alive ? (
          <div className="flex flex-col gap-3">
            {game.f_current_step === 'discussion' ? (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <textarea
                    value={humanSpeech}
                    onChange={(e) => setHumanSpeech(e.target.value)}
                    placeholder="输入你的发言内容..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-primary transition-all resize-none h-20"
                  />
                  <button
                    disabled={!humanSpeech.trim() || isProcessing}
                    onClick={() => handleHumanAction('speech')}
                    className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-lg disabled:opacity-30"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : game.f_current_step === 'witch' && me?.f_role === 'witch' ? (
              <div className="grid grid-cols-2 gap-2">
                <button disabled={!selectedTarget || isProcessing || me.f_status_data.potions?.save === 0 || nightAction?.killed !== selectedTarget?.f_player_index} onClick={() => handleHumanAction('save')} className="py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] disabled:opacity-30">灵药 ({me.f_status_data.potions?.save})</button>
                <button disabled={!selectedTarget || isProcessing || me.f_status_data.potions?.kill === 0} onClick={() => handleHumanAction('poison')} className="py-2.5 rounded-xl bg-red-600 text-white font-black text-[10px] disabled:opacity-30">毒药 ({me.f_status_data.potions?.kill})</button>
                <button onClick={skipAction} className="col-span-2 py-1.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-[9px] border border-slate-700">跳过行动</button>
              </div>
            ) : (
              <button disabled={!selectedTarget || isProcessing} onClick={() => handleHumanAction()} className={cn("w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-40", game.f_current_phase === 'night' ? "bg-red-600 shadow-red-600/20" : "bg-primary shadow-primary/20")}>
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span className="uppercase tracking-widest">确认行动</span>
              </button>
            )}
          </div>
        ) : (
          <div className="py-3 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <div className="flex items-center gap-2 mb-1">
              {isGodMode ? (
                <Eye className="w-5 h-5 text-primary animate-pulse" />
              ) : (
                <Users className="w-5 h-5 text-slate-500" />
              )}
              <span className="text-xs font-black text-white uppercase tracking-tighter">
                {isGodMode ? '上帝视角已开启' : '观察者模式'}
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center px-4">
              {isGodMode
                ? '你可以看到所有玩家的身份、内心想法和夜晚行动'
                : '你正在以普通观众身份观看比赛'}
            </span>
          </div>
        )}
      </div>

      {/* 移动端日志面板 */}
      {(
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-[50] bg-slate-900 border-t border-slate-800 shadow-2xl flex flex-col"
          style={{ height: `${logPanelHeight}px` }}
        >
          {/* 拖动条 */}
          <div
            onMouseDown={startLogPanelDrag}
            onTouchStart={startLogPanelDrag}
            className="absolute top-0 left-0 right-0 h-6 bg-slate-800/50 flex items-center justify-center cursor-ns-resize hover:bg-slate-700/50 transition-colors z-[55]"
          >
            <div className="w-12 h-1 bg-slate-600 rounded-full" />
          </div>

          {/* 标签切换 */}
          <div className="flex justify-around py-2 pt-8 border-b border-slate-800/50 bg-slate-900/50 shrink-0">
            <button onClick={() => setActiveTab('chat')} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest", activeTab === 'chat' ? "bg-primary text-white" : "text-slate-500 hover:text-slate-300")}>
              <MessageSquare className="w-3.5 h-3.5" /> 战报
            </button>
            <button onClick={() => setActiveTab('notes')} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest", activeTab === 'notes' ? "bg-primary text-white" : "text-slate-500 hover:text-slate-300")}>
              <LayoutGrid className="w-3.5 h-3.5" /> 笔记
            </button>
          </div>

          {/* 日志内容 */}
          <div ref={logContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {activeTab === 'chat' ? (
              <>
                {logs.filter(shouldShowLog).map((log, idx) => (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={log.f_id || idx} className={cn("flex flex-col", log.f_type === 'system' ? "items-center my-2" : "items-start")}>
                    {log.f_type === 'system' ? (
                      <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[9px] font-bold text-slate-400 tracking-tight">{log.f_content}</div>
                    ) : (
                      <div className="flex gap-2 max-w-[95%]">
                        <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center text-[9px] font-black text-slate-500">{log.f_player_index || '?'}</div>
                        <div className="flex flex-col gap-1">
                          <div className={cn(
                            "rounded-xl rounded-tl-none p-2 text-[10px] leading-relaxed border shadow-lg",
                            log.f_type === 'thinking' ? "bg-indigo-950/30 border-indigo-500/20 text-indigo-300/80 italic" :
                            log.f_type === 'action' ? "bg-indigo-900/40 border-indigo-500/30 text-indigo-100" :
                            "bg-slate-800 border-slate-700 text-slate-200"
                          )}>
                            {log.f_type === 'thinking' && <span className="font-black mr-1 not-italic text-indigo-400/60">[内心想法]</span>}
                            {log.f_content}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {thinkingContent && (
                  <div className="flex items-center gap-2 text-primary animate-pulse py-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest italic">{thinkingContent}</span>
                  </div>
                )}
                <div ref={logEndRef} />
              </>
            ) : (
              <div className="space-y-2">
                {players.map(p => (
                  <div key={p.f_id} className="bg-slate-950/50 p-3 rounded-xl flex items-center justify-between border border-slate-800 group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:text-primary">{p.f_player_index}</div>
                      <span className="text-[10px] font-bold text-slate-300">{p.f_name}</span>
                    </div>
                    <select className="bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-0.5 text-[9px] font-bold text-slate-500 outline-none cursor-pointer">
                      <option>未知</option><option>🐺 狼人</option><option>🔮 预言家</option><option>🧪 女巫</option><option>🏹 猎人</option><option>👨‍🌾 村民</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 发言内容悬浮框（移动端） */}
      <AnimatePresence>
        {speechDialog && (
          <>
            {/* 点击外部关闭 */}
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setSpeechDialog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[100] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 min-w-[200px] max-w-[250px]"
              style={{
                left: `${Math.max(16, Math.min(window.innerWidth - 216, speechDialog.position?.x - 125))}px`,
                top: `${Math.min(window.innerHeight - 150, speechDialog.position?.y || 0)}px`
              }}
            >
              <div className="font-black text-primary mb-2 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                <MessageIcon className="w-3 h-3" />
                {speechDialog.player.f_player_index}号玩家发言
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {speechDialog.content}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;