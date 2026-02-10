import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { readFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import knex from 'knex';
import app from './functions/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置
const PORT = parseInt(process.env.PORT || '3000');
const DB_PATH = process.env.DB_PATH || './werewolf.db';
const ADMIN_WORK_NO = process.env.ADMIN_WORK_NO || '88158';

// 创建数据库连接
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: DB_PATH
  },
  useNullAsDefault: true
});

// 异步创建表结构
const initTables = async () => {
  // 创建管理员表
  const adminExists = await db.schema.hasTable('t_admins');
  if (!adminExists) {
    await db.schema.createTable('t_admins', table => {
      table.increments('f_id');
      table.string('f_work_no').notNullable();
      table.timestamp('f_create_time').defaultTo(db.fn.now());
    });
    const adminCount = (await db('t_admins').count('f_id as count').first()).count;
    if (adminCount === 0) {
      await db('t_admins').insert({ f_work_no: ADMIN_WORK_NO });
    }
  }

  // 创建 AI 配置表
  const aiConfigExists = await db.schema.hasTable('t_ai_configs');
  if (!aiConfigExists) {
    await db.schema.createTable('t_ai_configs', table => {
      table.increments('f_id');
      table.string('f_name').notNullable();
      table.string('f_url').notNullable();
      table.string('f_api_key').notNullable();
      table.string('f_model').notNullable();
      table.timestamp('f_create_time').defaultTo(db.fn.now());
      table.timestamp('f_update_time').defaultTo(db.fn.now());
    });
  }

  // 创建游戏主表
  const gamesExists = await db.schema.hasTable('t_games');
  if (!gamesExists) {
    await db.schema.createTable('t_games', table => {
      table.increments('f_id');
      table.string('f_status').defaultTo('setup');
      table.string('f_current_phase').defaultTo('night');
      table.string('f_current_step').defaultTo('waiting');
      table.integer('f_day_count').defaultTo(1);
      table.text('f_config');
      table.text('f_result');
      table.timestamp('f_create_time').defaultTo(db.fn.now());
      table.timestamp('f_update_time').defaultTo(db.fn.now());
    });
  }

  // 创建玩家表
  const playersExists = await db.schema.hasTable('t_players');
  if (!playersExists) {
    await db.schema.createTable('t_players', table => {
      table.increments('f_id');
      table.integer('f_game_id').notNullable();
      table.integer('f_player_index').notNullable();
      table.string('f_name');
      table.string('f_role');
      table.boolean('f_is_human').defaultTo(false);
      table.boolean('f_is_alive').defaultTo(true);
      table.integer('f_model_id');
      table.text('f_status_data');
      table.timestamp('f_create_time').defaultTo(db.fn.now());
      table.timestamp('f_update_time').defaultTo(db.fn.now());
    });
  }

  // 创建游戏日志表
  const logsExists = await db.schema.hasTable('t_game_logs');
  if (!logsExists) {
    await db.schema.createTable('t_game_logs', table => {
      table.increments('f_id');
      table.integer('f_game_id').notNullable();
      table.integer('f_player_index');
      table.string('f_phase');
      table.integer('f_day');
      table.string('f_type');
      table.text('f_content');
      table.string('f_visibility').defaultTo('all');
      table.timestamp('f_create_time').defaultTo(db.fn.now());
    });
  }

  console.log('Database tables initialized.');
};

await initTables();

// 模拟 FaaS 环境的 env
const server = new Hono();
server.use('*', async (c, next) => {
  c.env = {
    db,
    user: {
      workNo: ADMIN_WORK_NO,
      login: 'admin',
      email: 'admin@example.com',
      nickName: '管理员',
      name: '管理员'
    }
  };
  await next();
});

// API 路由
server.route('/api', app);

// 静态文件服务
server.get('*', async (c) => {
  const url = new URL(c.req.url);
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = join(__dirname, 'dist', filePath);

  try {
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
    const content = await readFile(filePath);
    const ext = filePath.split('.').pop();
    const contentType = {
      'html': 'text/html',
      'js': 'application/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
    }[ext] || 'application/octet-stream';

    return c.text(content, 200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    });
  } catch (e) {
    // 文件不存在时返回 index.html（前端路由）
    try {
      const indexContent = await readFile(join(__dirname, 'dist', 'index.html'));
      return c.text(indexContent, 200, { 'Content-Type': 'text/html' });
    } catch {
      return c.text('Not Found', 404);
    }
  }
});

serve({ port: PORT, fetch: server.fetch });