# 狼人乱斗微信小程序 - 第二阶段公共模块迁移设计

## 文档信息

- **创建日期**: 2026-03-09
- **阶段**: 第二阶段 - 公共模块迁移
- **预计时间**: 3-5 天
- **状态**: 已批准

## 设计决策

### 1. Zustand 状态管理

**决策**: 完全复用 Zustand，直接迁移 gameStore.js

**理由**:
- Zustand 轻量且与框架无关，在 Taro 中可以正常使用
- Web 版的状态逻辑已经稳定，无需重新设计
- 减少迁移工作量和出错风险

**实施方案**:
- 直接复制 `src/stores/gameStore.js` 到 `miniprogram/src/stores/`
- 只修改导入路径：`@/api.js` → `@/api/index.js`
- 保持所有状态和方法不变

### 2. API 封装策略

**决策**: 保持小程序版现有的 API 封装，手动添加 Web 版缺失的接口

**理由**:
- 小程序版已有基于 Taro.request 的完整封装
- 避免重复工作，只需补充接口定义
- 保持统一的错误处理和 Toast 提示

**实施方案**:
- 保持 `miniprogram/src/api/index.js` 的 ApiClient 类
- 添加 aiAPI 对象（5 个接口）
- 补充 gameAPI 的缺失接口（4 个）

### 3. 主题样式转换

**决策**: 将 theme.js 中的颜色变量和样式转换为 SCSS

**理由**:
- 小程序不支持动态注入 CSS
- SCSS 变量系统更适合小程序
- 保持视觉一致性

**实施方案**:
- 扩展 `variables.scss` 添加游戏特定颜色
- 在 `mixins.scss` 中添加自定义样式 Mixins
- 所有 px 单位转换为 rpx

### 4. 工具函数提取

**决策**: 全面检查 Web 版代码，提取所有可复用的工具函数

**理由**:
- 避免代码重复
- 提高可维护性
- 为后续页面迁移做准备

**实施方案**:
- 扫描 Web 版所有文件
- 提取游戏逻辑、格式化、常量等工具函数
- 创建独立的工具文件

## 详细设计

### 1. API 层扩展

**文件**: `miniprogram/src/api/index.js`

**新增 aiAPI**:

```javascript
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

**补充 gameAPI**:

```javascript
export const gameApi = {
  // 已有接口保持不变
  createGame: (config) => api.post('/api/games', config),
  getGame: (id) => api.get(`/api/games/${id}`),
  deleteGame: (id) => api.delete(`/api/games/${id}`),
  performAction: (gameId, action) => api.post(`/api/games/${gameId}/actions`, action),

  // 新增接口
  addLog: (data) => api.post('/game/log', data),
  updateGameStatus: (data) => api.post('/game/update-status', data),
  updatePlayer: (data) => api.post('/game/update-player', data),
  generateReview: (id) => api.post(`/game/${id}/review-generate`)
}
```

### 2. Zustand Store 迁移

**源文件**: `src/stores/gameStore.js`
**目标文件**: `miniprogram/src/stores/gameStore.js`

**修改内容**:

```javascript
// 修改前
import { aiAPI, gameAPI } from '@/api.js';

// 修改后
import { aiAPI, gameAPI } from '@/api/index.js';
```

**保持不变**:
- 所有状态定义
- 所有方法实现
- 所有业务逻辑

**依赖安装**:
```bash
cd miniprogram
npm install zustand
```

### 3. 主题样式转换

**3.1 扩展颜色变量**

**文件**: `miniprogram/src/styles/variables.scss`

```scss
// 游戏特定颜色
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

**3.2 添加自定义 Mixins**

**文件**: `miniprogram/src/styles/mixins.scss`

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

### 4. 工具函数提取

**4.1 游戏逻辑工具**

**文件**: `miniprogram/src/utils/game.js`

```javascript
/**
 * 判断角色是否为狼人
 */
export const isWerewolf = (role) => {
  return role === 'werewolf'
}

/**
 * 判断角色是否为好人阵营
 */
export const isGood = (role) => {
  return ['villager', 'seer', 'witch', 'hunter'].includes(role)
}

/**
 * 判断游戏阶段
 */
export const isNight = (phase) => {
  return phase === 'night'
}

/**
 * 判断玩家是否存活
 */
export const isAlive = (player) => {
  return player.status === 'alive'
}
```

**4.2 格式化工具**

**文件**: `miniprogram/src/utils/format.js`

```javascript
/**
 * 格式化时间
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 格式化玩家名称
 */
export const formatPlayerName = (player, index) => {
  return player.name || `玩家${index + 1}`
}
```

**4.3 常量定义**

**文件**: `miniprogram/src/utils/constants.js`

```javascript
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
  SHOOT: 'shoot'
}
```

**4.4 存储工具**

**文件**: `miniprogram/src/utils/storage.js`

```javascript
import Taro from '@tarojs/taro'

/**
 * 存储数据
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

## 实施步骤

### 步骤 1: 扩展 API 层
1. 修改 `miniprogram/src/api/index.js`
2. 添加 aiAPI 对象
3. 补充 gameAPI 接口
4. 验证语法正确

### 步骤 2: 迁移 Zustand Store
1. 安装 zustand 依赖
2. 复制 gameStore.js
3. 修改导入路径
4. 验证无语法错误

### 步骤 3: 转换主题样式
1. 扩展 variables.scss
2. 添加 Mixins
3. 验证 SCSS 编译

### 步骤 4: 提取工具函数
1. 扫描 Web 版代码
2. 创建工具文件
3. 提取并整理函数
4. 添加注释和文档

### 步骤 5: 测试验证
1. 运行构建测试
2. 验证所有模块可导入
3. 检查无编译错误

### 步骤 6: 提交代码
1. 查看 git 状态
2. 添加所有文件
3. 提交代码

## 验收标准

### API 层
- [ ] aiAPI 包含 5 个接口
- [ ] gameAPI 包含 8 个接口
- [ ] 所有接口使用 Taro.request
- [ ] 错误处理正确

### Zustand Store
- [ ] gameStore.js 迁移完成
- [ ] 导入路径正确
- [ ] 无语法错误
- [ ] zustand 依赖已安装

### 主题样式
- [ ] variables.scss 包含所有颜色变量
- [ ] mixins.scss 包含自定义 Mixins
- [ ] SCSS 编译无错误

### 工具函数
- [ ] game.js 包含游戏逻辑函数
- [ ] format.js 包含格式化函数
- [ ] constants.js 包含常量定义
- [ ] storage.js 包含存储工具
- [ ] 所有函数有注释

### 构建测试
- [ ] npm run dev:weapp 成功
- [ ] 无编译错误
- [ ] 所有模块可导入

## 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Zustand 在 Taro 中不兼容 | 高 | 低 | 提前测试，准备降级方案 |
| backdrop-filter 不支持 | 中 | 中 | 提供降级样式 |
| 工具函数提取不完整 | 中 | 中 | 后续迭代补充 |

## 后续步骤

第二阶段完成后，进入第三阶段：Setup 页面迁移

---

**文档版本**: v1.0
**创建日期**: 2026-03-09
**批准状态**: 已批准
