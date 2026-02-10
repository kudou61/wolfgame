狼人乱斗 (Werewolf Chaos) 本地部署指南
本指南将帮助你在本地环境中部署和运行“狼人乱斗”应用。该应用采用前后端分离架构，前端基于 React + Tailwind CSS v4，后端基于 Hono + Knex (MySQL)。

1. 环境要求
在开始之前，请确保你的开发环境已安装以下软件：

Node.js: v18.0.0 或更高版本
MySQL: v8.0 或更高版本
tnpm / pnpm: 用于管理依赖包（内网环境请使用tnpm）
2. 数据库配置
2.1 创建数据库
登录你的 MySQL 终端并创建一个新数据库：


CREATE DATABASE werewolf_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
2.2 初始化表结构
执行以下 SQL 语句以创建必要的表结构：


-- 管理员表
CREATE TABLE `t_admins` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `f_work_no` varchar(20) NOT NULL,
  `f_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`f_id`)
);

-- AI 配置表
CREATE TABLE `t_ai_configs` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `f_name` varchar(255) NOT NULL,
  `f_url` varchar(500) NOT NULL,
  `f_api_key` varchar(500) NOT NULL,
  `f_model` varchar(100) NOT NULL,
  `f_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `f_update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`f_id`)
);

-- 游戏主表
CREATE TABLE `t_games` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `f_status` varchar(50) NULL DEFAULT 'setup',
  `f_current_phase` varchar(50) NULL DEFAULT 'night',
  `f_current_step` varchar(50) NULL DEFAULT 'waiting',
  `f_day_count` int(11) NULL DEFAULT 1,
  `f_config` text NULL,
  `f_result` text NULL,
  `f_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `f_update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`f_id`)
);

-- 玩家表
CREATE TABLE `t_players` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `f_game_id` bigint(20) NOT NULL,
  `f_player_index` int(11) NOT NULL,
  `f_name` varchar(100) NULL,
  `f_role` varchar(50) NULL,
  `f_is_human` tinyint(1) NULL DEFAULT 0,
  `f_is_alive` tinyint(1) NULL DEFAULT 1,
  `f_model_id` bigint(20) NULL,
  `f_status_data` text NULL,
  `f_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `f_update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`f_id`),
  KEY `idx_game_id` (`f_game_id`)
);

-- 游戏日志表
CREATE TABLE `t_game_logs` (
  `f_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `f_game_id` bigint(20) NOT NULL,
  `f_player_index` int(11) NULL,
  `f_phase` varchar(50) NULL,
  `f_day` int(11) NULL,
  `f_type` varchar(50) NULL,
  `f_content` text NULL,
  `f_visibility` varchar(100) NULL DEFAULT 'all',
  `f_create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`f_id`),
  KEY `idx_game_log` (`f_game_id`)
);
2.3 设置初始管理员
将你的工号或标识符添加到管理员表中：


INSERT INTO t_admins (f_work_no) VALUES ('88158');
3. 后端服务 (Functions) 部署
由于后端代码是为 FaaS 环境编写的，本地运行需要一个简单的适配器。

3.1 安装依赖
在项目根目录下执行：


tnpm install hono knex mysql2 @hono/node-server
3.2 创建本地运行入口 (server.js)
在根目录创建 server.js：

```
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import knex from 'knex';
import app from './functions/index.js';

const db = knex({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'your_username',
    password: 'your_password',
    database: 'werewolf_db'
  }
});

// 模拟 FaaS 环境的 env
const server = new Hono();
server.use('*', async (c, next) => {
  c.env = {
    db,
    user: {
      workNo: '88158',
      login: 'admin',
      email: 'admin@example.com',
      nickName: '管理员',
      name: '管理员'
    }
  };
  await next();
});

server.route('/', app);

serve(server, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});

```


4. 前端服务部署
4.1 安装依赖


tnpm install
4.2 配置 Vite
确保 vite.config.js 中配置了代理，以便前端可以访问本地后端接口：



export default {
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
};
4.3 启动开发服务器


tnpm run dev
5. 常见问题
图片显示异常: 确保网络可以访问 work.alibaba-inc.com 的头像服务，或在 src/components/PlayerCard.jsx 中修改头像逻辑。
AI 无法发言: 需要在"设置"页面配置有效的 AI 接口地址和 API Key。
数据库连接失败: 请检查 server.js 中的数据库配置信息是否正确。
weavefox-vibe-web 请求失败: 项目依赖 `@alipay/weavefox-vibe-web`（阿里内部 UI 组件库），该库会发起埋点/遥测请求。如在内网环境无法访问，该请求失败通常不影响主要功能，可忽略。

6. 依赖说明
项目已移除对 `@alipay/weavefox-vibe-web` 组件库的依赖，已完成以下本地化替换：

| 功能 | 原依赖 | 替换方案 |
|------|--------|----------|
| 后端 API 调用 | vibeSdk.functions | src/api.js（原生 fetch 封装） |
| AI 对话补全 | vibeSdk.ai.completion | 直接调用 OpenAI 兼容接口（本地 AI 配置） |

所有 API 调用现已使用原生 fetch 实现，不再依赖外部组件库。AI 对话补全功能需在"设置"页面配置有效的 AI 接口地址和 API Key（支持 OpenAI 兼容格式）。