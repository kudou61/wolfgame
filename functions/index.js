import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';

const app = new Hono();

// --- AI Configs ---
app.get('/ai-configs', async (c) => {
  const { db } = c.env;
  const configs = await db('t_ai_configs').select('f_id', 'f_name', 'f_url', 'f_model', 'f_update_time');
  return c.json({ success: true, data: configs });
});

app.post('/ai-configs', async (c) => {
  const { db } = c.env;
  const body = await c.req.json();
  const id = await db('t_ai_configs').insert({
    f_name: body.name,
    f_url: body.url,
    f_api_key: body.apiKey,
    f_model: body.model
  });
  return c.json({ success: true, data: { id: id[0] } });
});

app.delete('/ai-configs/:id', async (c) => {
  const { db } = c.env;
  const id = c.req.param('id');
  await db('t_ai_configs').where('f_id', id).delete();
  return c.json({ success: true });
});

app.put('/ai-configs/:id', async (c) => {
  const { db } = c.env;
  const id = c.req.param('id');
  const body = await c.req.json();
  await db('t_ai_configs').where('f_id', id).update({
    f_name: body.name,
    f_url: body.url,
    f_api_key: body.apiKey,
    f_model: body.model,
    f_update_time: db.fn.now()
  });
  return c.json({ success: true });
});

// --- AI Completion ---
app.post('/ai/completion', async (c) => {
  const { db } = c.env;
  const { system, prompt, modelId } = await c.req.json();

  try {
    // 获取 AI 配置，如果指定了 modelId 则使用对应的配置，否则使用第一个
    let config;
    if (modelId) {
      config = await db('t_ai_configs').where('f_id', modelId).first();
    } else {
      config = await db('t_ai_configs').first();
    }

    if (!config) {
      return c.json({ success: false, error: '请先在设置页面配置 AI 模型' }, 400);
    }

    const apiUrl = config.f_url.replace(/\/$/, '') + '/chat/completions';
    const payload = {
      model: config.f_model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      stream: false
    };

    console.log("[game] === [AI Request] ===");
    console.log("[game] URL:", apiUrl);
    console.log("[game] System:", system);
    console.log("[game] Prompt:", prompt);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.f_api_key}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[game] AI API Error (${response.status}):`, errorText);
      throw new Error(`AI 接口返回错误 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log("[game] === [AI Response] ===");
    console.log("[game]", content);

    return c.json({ success: true, data: { text: content } });
  } catch (error) {
    console.error('[game] AI completion failed:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// --- Game Logic ---
app.post('/game/create', async (c) => {
  const { db } = c.env;
  const { config, players } = await c.req.json();
  
  const [gameId] = await db('t_games').insert({
    f_status: 'playing',
    f_current_phase: 'night',
    f_current_step: 'werewolf',
    f_day_count: 1,
    f_config: JSON.stringify(config)
  });

  const playerInserts = players.map((p, idx) => ({
    f_game_id: gameId,
    f_player_index: idx + 1,
    f_name: p.name,
    f_role: p.role,
    f_is_human: p.isHuman,
    f_model_id: p.modelId,
    f_status_data: JSON.stringify({
      potions: p.role === 'witch' ? { save: 1, kill: 1 } : null,
      check_history: [],
      vote_history: []
    })
  }));

  await db('t_players').insert(playerInserts);
  
  await db('t_game_logs').insert({
    f_game_id: gameId,
    f_type: 'system',
    f_content: '游戏开始！天黑请闭眼。',
    f_visibility: 'all',
    f_day: 1,
    f_phase: 'night'
  });

  return c.json({ success: true, data: { gameId } });
});

app.get('/game/:id', async (c) => {
  const { db } = c.env;
  const gameId = c.req.param('id');
  const game = await db('t_games').where('f_id', gameId).first();
  const players = await db('t_players').where('f_game_id', gameId).orderBy('f_player_index', 'asc');
  const logs = await db('t_game_logs').where('f_game_id', gameId).orderBy('f_id', 'asc');

  return c.json({
    success: true,
    data: {
      game: { ...game, f_config: JSON.parse(game.f_config || '{}') },
      players: players.map(p => ({ ...p, f_status_data: JSON.parse(p.f_status_data || '{}') })),
      logs
    }
  });
});

app.post('/game/log', async (c) => {
  const { db } = c.env;
  const { gameId, playerIndex, type, content, visibility, phase, day } = await c.req.json();
  await db('t_game_logs').insert({
    f_game_id: gameId,
    f_player_index: playerIndex,
    f_type: type,
    f_content: content,
    f_visibility: visibility || 'all',
    f_phase: phase,
    f_day: day
  });
  return c.json({ success: true });
});

app.post('/game/update-status', async (c) => {
  const { db } = c.env;
  const { gameId, status, phase, step, dayCount, result, config } = await c.req.json();
  const updateData = {};
  if (status) updateData.f_status = status;
  if (phase) updateData.f_current_phase = phase;
  if (step) updateData.f_current_step = step;
  if (dayCount) updateData.f_day_count = dayCount;
  if (result) updateData.f_result = JSON.stringify(result);
  if (config) updateData.f_config = typeof config === 'string' ? config : JSON.stringify(config);
  
  await db('t_games').where('f_id', gameId).update(updateData);
  return c.json({ success: true });
});

app.post('/game/update-player', async (c) => {
  const { db } = c.env;
  const { playerId, isAlive, statusData } = await c.req.json();
  const updateData = {};
  if (isAlive !== undefined) updateData.f_is_alive = isAlive;
  if (statusData) updateData.f_status_data = JSON.stringify(statusData);
  
  await db('t_players').where('f_id', playerId).update(updateData);
  return c.json({ success: true });
});

// --- AI Review ---
app.post('/game/:id/review-generate', async (c) => {
  const { db } = c.env;
  const gameId = c.req.param('id');

  try {
    // 1. 获取游戏数据、玩家和日志
    const game = await db('t_games').where('f_id', gameId).first();
    if (!game) return c.json({ success: false, error: 'Game not found' }, 404);

    const players = await db('t_players').where('f_game_id', gameId).orderBy('f_player_index', 'asc');
    const logs = await db('t_game_logs').where('f_game_id', gameId).orderBy('f_id', 'asc');
    
    // 获取 AI 配置
    const config = await db('t_ai_configs').first();
    if (!config) return c.json({ success: false, error: '请先在设置页面配置 AI 模型' }, 400);

    // 2. 准备 Prompt
    const result = JSON.parse(game.f_result || '{}');
    const relevantLogs = logs.length > 150 ? logs.slice(-150) : logs;
    const logText = relevantLogs.map(l => {
      const phaseName = (l.f_phase || 'night') === 'night' ? '夜晚' : '白天';
      const day = l.f_day || 1;
      const timePrefix = `[第${day}天 ${phaseName}]`;
      const p = players.find(player => player.f_player_index === l.f_player_index);
      
      if (p) {
        const action = l.f_type === 'speech' ? '发言' : '';
        return `${timePrefix} ${p.f_player_index}号(${p.f_role})${action}: ${l.f_content}`;
      }
      return `${timePrefix} 系统: ${l.f_content}`;
    }).join('\n');

    const prompt = `
      你是一个专业的狼人杀复盘专家。请根据以下完整的游戏日志，为本局对局撰写一份深度复盘报告。
      
      报告要求：
      1. **标题要吸引人**：给本局起一个带感的标题。
      2. **胜负速览（必须使用 Markdown 表格）**：包含结果、阵营、存活人数、耗时等维度。
      3. **关键转折点分析**：分析决定走向的博弈瞬间。
      4. **玩家表现评价**：选出本局的 MVP（最有价值玩家）和 SVP（最坑玩家），并给出毒辣但幽默的理由。
      5. **一句话总结**：用幽默犀利的语言概括本局。
      
      游戏结果：${result.winner === 'good' ? '好人阵营获胜' : '狼人阵营获胜'}
      游戏天数：${game.f_day_count}天
      玩家信息：${players.map(p => `${p.f_player_index}号:${p.f_name}(${p.f_role})`).join(', ')}
      
      日志详情：
      ${logText}
      
      请使用 Markdown 格式，语气专业、犀利且富有感染力。
    `;

    // 3. 在后端调用 AI 接口 (避免前端跨域)
    const apiUrl = config.f_url.replace(/\/$/, '') + '/chat/completions';
    const aiPayload = {
      model: config.f_model,
      messages: [
        { role: 'system', content: '你是一个资深的狼人杀解说员和复盘专家。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    };

    console.log("[game] === [AI Request (Review)] ===");
    console.log("[game] URL:", apiUrl);
    console.log("[game] Payload:", JSON.stringify(aiPayload, null, 2));

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.f_api_key}`
      },
      body: JSON.stringify(aiPayload)
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[game] AI API Error (${aiResponse.status}):`, errorText);
      throw new Error(`AI 接口返回错误 (${aiResponse.status}): ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content;

    if (!summary) {
      console.error("[game] AI returned empty summary");
      throw new Error('AI 未返回有效复盘内容');
    }

    // 4. 保存到数据库
    result.summary = summary;
    await db('t_games').where('f_id', gameId).update({
      f_result: JSON.stringify(result),
      f_update_time: db.fn.now()
    });

    console.log("[game] Review saved to DB for game:", gameId);
    return c.json({ success: true, data: { summary } });
  } catch (error) {
    console.error('[game] Review generation failed:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/game/:id/review-save', async (c) => {
  const { db } = c.env;
  const gameId = c.req.param('id');
  const { summary } = await c.req.json();
  
  try {
    const game = await db('t_games').where('f_id', gameId).first();
    if (!game) return c.json({ success: false, error: 'Game not found' }, 404);

    const result = JSON.parse(game.f_result || '{}');
    result.summary = summary;

    await db('t_games').where('f_id', gameId).update({
      f_result: JSON.stringify(result)
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;