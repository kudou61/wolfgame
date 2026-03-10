# 第二阶段公共模块迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 Web 版的公共模块（API、Store、主题、工具函数）迁移到小程序

**Architecture:** 保持小程序现有 API 封装，扩展接口；完整迁移 Zustand Store；将 CSS 主题转换为 SCSS；提取并整理工具函数

**Tech Stack:** Taro 3.6+, React 18.3+, Zustand 5.0+, SCSS

---

## Task 1: 扩展 API 层 - 添加 aiAPI

**Files:**
- Modify: `miniprogram/src/api/index.js`

**Step 1: 读取现有 API 文件**

Run: `cat miniprogram/src/api/index.js`
Expected: 看到现有的 ApiClient 类和 gameApi

**Step 2: 在 gameApi 导出之后添加 aiAPI**

在文件末尾，`export const gameApi` 之后添加：

```javascript
// AI 相关 API
export const aiAPI = {
  getAIConfigs: () => api.get('/ai-configs'),
  createAIConfig: (data) => api.post('/ai-configs', data),
  deleteAIConfig: (id) => api.delete(`/ai-configs/${id}`),
  completion: (data) => api.post('/ai/completion', data),
  batchVoteCompletion: (requests) => {
    return Promise.all(
      requests.map(req => api.post('/ai/completion', req))
    )
  }
}
```

**Step 3: 验证语法**

Run: `cd miniprogram && node -e "require('./src/api/index.js')"`
Expected: 无语法错误

---

## Task 2: 扩展 API 层 - 补充 gameApi 接口

**Files:**
- Modify: `miniprogram/src/api/index.js`

**Step 1: 读取当前 gameApi 定义**

查看现有的 4 个接口

**Step 2: 添加缺失的 4 个接口**

在 gameApi 对象中添加：

```javascript
export const gameApi = {
  // 已有的 4 个接口保持不变
  createGame: (config) => api.post('/api/games', config),
  getGame: (id) => api.get(`/api/games/${id}`),
  deleteGame: (id) => api.delete(`/api/games/${id}`),
  performAction: (gameId, action) => api.post(`/api/games/${gameId}/actions`, action),

  // 新增 4 个接口
  addLog: (data) => api.post('/game/log', data),
  updateGameStatus: (data) => api.post('/game/update-status', data),
  updatePlayer: (data) => api.post('/game/update-player', data),
  generateReview: (id) => api.post(`/game/${id}/review-generate`)
}
```

**Step 3: 验证完整性**

Run: `grep -c ":" miniprogram/src/api/index.js | tail -1`
Expected: gameApi 应该有 8 个方法

---

## Task 3: 安装 Zustand 依赖

**Files:**
- Modify: `miniprogram/package.json`

**Step 1: 进入 miniprogram 目录**

Run: `cd /volume2/homes/aaron/project/wolfgame/miniprogram`
Expected: 当前目录切换成功

**Step 2: 安装 zustand**

Run: `npm install zustand`
Expected: 安装成功，package.json 中添加 zustand 依赖

**Step 3: 验证安装**

Run: `npm list zustand`
Expected: 显示 zustand 版本号

---

## Task 4: 迁移 Zustand Store

**Files:**
- Create: `miniprogram/src/stores/gameStore.js`

**Step 1: 复制 Web 版 gameStore**

Run: `cp /volume2/homes/aaron/project/wolfgame/src/stores/gameStore.js /volume2/homes/aaron/project/wolfgame/miniprogram/src/stores/gameStore.js`
Expected: 文件复制成功

**Step 2: 修改导入路径**

使用 Edit 工具修改第一行：

Old:
```javascript
import { aiAPI, gameAPI } from '@/api.js';
```

New:
```javascript
import { aiAPI, gameAPI } from '@/api/index.js';
```

**Step 3: 验证文件**

Run: `head -5 miniprogram/src/stores/gameStore.js`
Expected: 看到修改后的导入路径

**Step 4: 检查语法**

Run: `cd miniprogram && npx eslint src/stores/gameStore.js --no-eslintrc || echo "No eslint, skip"`
Expected: 无严重语法错误

---

## Task 5: 扩展样式变量

**Files:**
- Modify: `miniprogram/src/styles/variables.scss`

**Step 1: 读取现有变量文件**

Run: `cat miniprogram/src/styles/variables.scss`
Expected: 看到现有的颜色、间距等变量

**Step 2: 在文件末尾添加游戏特定颜色**

添加以下内容：

```scss
// 游戏特定颜色（从 theme.js 转换）
$color-werewolf: #ef4444;
$color-good: #22c55e;
$color-night: #1e1b4b;
$color-day: #fef08a;

// 其他主题颜色
$color-accent: #d4af37;
$color-accent-foreground: #1a1a2a;
$color-border: #334155;
$color-ring: #6366f1;
```

**Step 3: 验证 SCSS 语法**

Run: `cd miniprogram && npm run dev:weapp 2>&1 | head -20`
Expected: 无 SCSS 编译错误

---

## Task 6: 添加自定义样式 Mixins

**Files:**
- Modify: `miniprogram/src/styles/mixins.scss`

**Step 1: 读取现有 Mixins 文件**

Run: `cat miniprogram/src/styles/mixins.scss`
Expected: 看到现有的 Mixins

**Step 2: 在文件末尾添加新 Mixins**

添加以下内容：

```scss
// 玻璃态效果
@mixin glass-morphism {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}

// 竞技场网格布局
@mixin arena-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240rpx, 1fr));
  gap: $spacing-xl;
}

// 自定义滚动条
@mixin custom-scrollbar {
  &::-webkit-scrollbar {
    width: 12rpx;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: $color-border;
    border-radius: 20rpx;

    &:hover {
      background: #475569;
    }
  }
}
```

**Step 3: 验证 SCSS 编译**

Run: `cd miniprogram && npm run dev:weapp 2>&1 | grep -i "error" | head -5`
Expected: 无错误输出

---

## Task 7: 创建游戏逻辑工具函数

**Files:**
- Create: `miniprogram/src/utils/game.js`

**Step 1: 创建文件并添加内容**

```javascript
/**
 * 游戏逻辑工具函数
 */

/**
 * 判断角色是否为狼人
 * @param {string} role - 角色类型
 * @returns {boolean}
 */
export const isWerewolf = (role) => {
  return role === 'werewolf'
}

/**
 * 判断角色是否为好人阵营
 * @param {string} role - 角色类型
 * @returns {boolean}
 */
export const isGood = (role) => {
  return ['villager', 'seer', 'witch', 'hunter'].includes(role)
}

/**
 * 判断游戏阶段是否为夜晚
 * @param {string} phase - 游戏阶段
 * @returns {boolean}
 */
export const isNight = (phase) => {
  return phase === 'night'
}

/**
 * 判断玩家是否存活
 * @param {object} player - 玩家对象
 * @returns {boolean}
 */
export const isAlive = (player) => {
  return player.status === 'alive'
}
```

**Step 2: 验证文件创建**

Run: `cat miniprogram/src/utils/game.js | head -10`
Expected: 看到文件内容

---

## Task 8: 创建格式化工具函数

**Files:**
- Create: `miniprogram/src/utils/format.js`

**Step 1: 创建文件并添加内容**

```javascript
/**
 * 格式化工具函数
 */

/**
 * 格式化时间
 * @param {number} timestamp - 时间戳
 * @returns {string} HH:MM 格式
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 格式化玩家名称
 * @param {object} player - 玩家对象
 * @param {number} index - 玩家索引
 * @returns {string}
 */
export const formatPlayerName = (player, index) => {
  return player.name || `玩家${index + 1}`
}

/**
 * 格式化日期
 * @param {number} timestamp - 时间戳
 * @returns {string} YYYY-MM-DD 格式
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

**Step 2: 验证文件创建**

Run: `wc -l miniprogram/src/utils/format.js`
Expected: 显示行数

---

## Task 9: 创建常量定义

**Files:**
- Create: `miniprogram/src/utils/constants.js`

**Step 1: 创建文件并添加内容**

```javascript
/**
 * 游戏常量定义
 */

// 角色类型
export const ROLES = {
  WEREWOLF: 'werewolf',
  VILLAGER: 'villager',
  SEER: 'seer',
  WITCH: 'witch',
  HUNTER: 'hunter'
}

// 游戏阶段
export const PHASES = {
  NIGHT: 'night',
  DAY: 'day',
  VOTE: 'vote'
}

// 玩家状态
export const PLAYER_STATUS = {
  ALIVE: 'alive',
  DEAD: 'dead'
}

// 行动类型
export const ACTION_TYPES = {
  KILL: 'kill',
  SAVE: 'save',
  POISON: 'poison',
  CHECK: 'check',
  SHOOT: 'shoot',
  VOTE: 'vote'
}

// 阵营类型
export const CAMPS = {
  WEREWOLF: 'werewolf',
  GOOD: 'good'
}
```

**Step 2: 验证文件创建**

Run: `cat miniprogram/src/utils/constants.js | grep "export const" | wc -l`
Expected: 显示 5（5 个导出的常量对象）

---

## Task 10: 创建存储工具函数

**Files:**
- Create: `miniprogram/src/utils/storage.js`

**Step 1: 创建文件并添加内容**

```javascript
/**
 * 本地存储工具函数
 */
import Taro from '@tarojs/taro'

/**
 * 存储数据
 * @param {string} key - 存储键
 * @param {any} value - 存储值
 */
export const setStorage = (key, value) => {
  try {
    Taro.setStorageSync(key, value)
  } catch (e) {
    console.error('Storage set error:', e)
  }
}

/**
 * 获取数据
 * @param {string} key - 存储键
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
export const getStorage = (key, defaultValue = null) => {
  try {
    const value = Taro.getStorageSync(key)
    return value !== undefined ? value : defaultValue
  } catch (e) {
    console.error('Storage get error:', e)
    return defaultValue
  }
}

/**
 * 删除数据
 * @param {string} key - 存储键
 */
export const removeStorage = (key) => {
  try {
    Taro.removeStorageSync(key)
  } catch (e) {
    console.error('Storage remove error:', e)
  }
}

/**
 * 清空所有数据
 */
export const clearStorage = () => {
  try {
    Taro.clearStorageSync()
  } catch (e) {
    console.error('Storage clear error:', e)
  }
}
```

**Step 2: 验证文件创建**

Run: `cat miniprogram/src/utils/storage.js | grep "export const" | wc -l`
Expected: 显示 4（4 个导出的函数）

---

## Task 11: 测试构建

**Files:**
- 无需创建文件

**Step 1: 清理之前的构建**

Run: `cd /volume2/homes/aaron/project/wolfgame/miniprogram && rm -rf dist/`
Expected: dist 目录被删除

**Step 2: 运行构建测试**

Run: `npm run dev:weapp`
Expected: 构建成功，无错误

**Step 3: 检查构建输出**

Run: `ls -la dist/ | head -10`
Expected: 看到编译后的文件

**Step 4: 停止构建进程**

手动停止（Ctrl+C）

---

## Task 12: 提交代码

**Files:**
- 所有新创建和修改的文件

**Step 1: 返回项目根目录**

Run: `cd /volume2/homes/aaron/project/wolfgame`
Expected: 当前目录切换成功

**Step 2: 查看 Git 状态**

Run: `git status`
Expected: 看到所有修改的文件

**Step 3: 添加所有文件到暂存区**

Run: `git add miniprogram/src/api/index.js miniprogram/src/stores/gameStore.js miniprogram/src/styles/variables.scss miniprogram/src/styles/mixins.scss miniprogram/src/utils/ miniprogram/package.json miniprogram/package-lock.json docs/plans/2026-03-09-phase2-modules-migration-design.md`
Expected: 文件添加到暂存区

**Step 4: 提交代码**

Run:
```bash
git commit -m "$(cat <<'EOF'
feat: 第二阶段 - 公共模块迁移

- 扩展 API 层：添加 aiAPI 和补充 gameAPI 接口
- 迁移 Zustand Store：完整复制 gameStore.js
- 扩展样式系统：添加游戏特定颜色和自定义 Mixins
- 创建工具函数：game、format、constants、storage

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
EOF
)"
```

Expected: 提交成功

**Step 5: 查看提交历史**

Run: `git log --oneline -1`
Expected: 看到刚才的提交记录

---

## 验收标准

完成所有任务后，验证以下内容：

### API 层
- [ ] `miniprogram/src/api/index.js` 包含 aiAPI（5 个接口）
- [ ] `miniprogram/src/api/index.js` 包含 gameAPI（8 个接口）
- [ ] 所有接口使用 Taro.request

### Zustand Store
- [ ] `miniprogram/src/stores/gameStore.js` 存在
- [ ] 导入路径已修改为 `@/api/index.js`
- [ ] zustand 依赖已安装

### 样式系统
- [ ] `miniprogram/src/styles/variables.scss` 包含游戏特定颜色
- [ ] `miniprogram/src/styles/mixins.scss` 包含 3 个新 Mixins

### 工具函数
- [ ] `miniprogram/src/utils/game.js` 存在（4 个函数）
- [ ] `miniprogram/src/utils/format.js` 存在（3 个函数）
- [ ] `miniprogram/src/utils/constants.js` 存在（5 个常量对象）
- [ ] `miniprogram/src/utils/storage.js` 存在（4 个函数）

### 构建测试
- [ ] `npm run dev:weapp` 成功
- [ ] 无编译错误

### Git
- [ ] 所有文件已提交
- [ ] 提交信息规范

---

## 后续步骤

第二阶段完成后，可以开始第三阶段：Setup 页面迁移

---

**计划版本**: v1.0
**创建日期**: 2026-03-09
**预计时间**: 3-5 天
