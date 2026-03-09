# 狼人乱斗微信小程序迁移设计方案

## 项目概述

将现有的 React + Vite + Hono 狼人杀游戏 Web 应用迁移到微信小程序平台，采用 Taro 跨平台框架，保留 React 代码结构和核心业务逻辑。

## 迁移策略

**方案选择**：渐进式迁移（方案 A）

- 创建新的 Taro 项目 `wolf-weixin-miniprogram`
- 保留原 Web 项目 `wolf-weixin` 可运行状态
- 逐页面迁移：Setup → Game → Result
- 代码复用率目标：70-80%

**技术选型**：
- 框架：Taro 3.6+ (React 18)
- 状态管理：Zustand 5.x（保持不变）
- UI 组件：Taro UI / NutUI（替代 Radix UI）
- 样式方案：CSS Modules / SCSS（替代 Tailwind CSS）
- 网络请求：Taro.request（替代 fetch）

## 1. 项目架构设计

### 目录结构

```
wolf-weixin/                    # 原 Web 项目（保留）
  ├── src/
  ├── package.json
  └── ...

wolf-weixin-miniprogram/        # 新建 Taro 小程序项目
  ├── src/
  │   ├── pages/               # 页面
  │   │   ├── setup/           # 游戏配置页
  │   │   │   ├── index.jsx
  │   │   │   ├── index.config.js
  │   │   │   └── index.scss
  │   │   ├── game/            # 游戏进行页
  │   │   │   ├── index.jsx
  │   │   │   ├── index.config.js
  │   │   │   └── index.scss
  │   │   └── result/          # 游戏结果页
  │   │       ├── index.jsx
  │   │       ├── index.config.js
  │   │       └── index.scss
  │   ├── components/          # 组件（从原项目迁移）
  │   │   ├── PlayerCard/
  │   │   └── ...
  │   ├── stores/              # Zustand 状态管理（复用）
  │   │   └── gameStore.js
  │   ├── api/                 # API 封装（改造）
  │   │   └── index.js
  │   ├── utils/               # 工具函数
  │   ├── app.jsx              # 应用入口
  │   ├── app.config.js        # Taro 应用配置
  │   └── app.scss             # 全局样式
  ├── config/                  # Taro 编译配置
  │   ├── index.js
  │   ├── dev.js
  │   └── prod.js
  ├── project.config.json      # 微信小程序配置
  └── package.json
```

### 技术栈对比

| 功能 | Web 版本 | 小程序版本 |
|------|---------|-----------|
| 框架 | React 18 + Vite | Taro 3.6 + React 18 |
| 路由 | react-router-dom | Taro 页面配置 |
| 状态管理 | Zustand | Zustand（保持） |
| 样式 | Tailwind CSS | SCSS / CSS Modules |
| 网络请求 | fetch | Taro.request |
| UI 组件 | Radix UI | Taro UI / NutUI |
| 图标 | lucide-react | Taro Icons / iconfont |
| 动画 | framer-motion | CSS 动画 + Taro API |
| Toast | react-hot-toast | Taro.showToast |

## 2. 样式迁移方案

### Tailwind CSS → SCSS 转换

**转换策略**：
- 提取常用 Tailwind 类名为 SCSS 变量和 mixin
- 使用 CSS Modules 实现样式隔离
- 保持响应式设计（rpx 单位）

**示例转换**：

```jsx
// 原代码（Tailwind）
<div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
  <button className="px-4 py-2 bg-primary rounded-lg hover:bg-primary/90">
    开始游戏
  </button>
</div>

// 转换后（SCSS + Taro）
<View className="loading-container">
  <Button className="start-button">开始游戏</Button>
</View>
```

```scss
// index.scss
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #0f172a;
  color: #ffffff;
}

.start-button {
  padding: 16rpx 32rpx;
  background-color: var(--primary-color);
  border-radius: 16rpx;

  &:active {
    opacity: 0.9;
  }
}
```

### 动画处理

**framer-motion → CSS 动画**：

```jsx
// 原代码
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  内容
</motion.div>

// 转换后
<View className="fade-in-up">
  内容
</View>
```

```scss
.fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 图标处理

**lucide-react → iconfont**：
- 使用阿里 iconfont 平台导出图标
- 或使用 Taro UI 内置图标组件

## 3. API 调用改造方案

### 网络请求封装

**fetch → Taro.request**：

```javascript
// src/api/index.js

import Taro from '@tarojs/taro';

const API_BASE = 'https://your-domain.com/api'; // 需要配置合法域名

/**
 * 通用请求函数
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  try {
    const result = await Taro.request({
      url,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : undefined,
      header: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return result.data;
  } catch (error) {
    console.error(`[API] Request failed: ${path}`, error);
    Taro.showToast({
      title: '网络请求失败',
      icon: 'none',
    });
    throw error;
  }
}

/**
 * GET 请求
 */
export const get = (path) => request(path, { method: 'GET' });

/**
 * POST 请求
 */
export const post = (path, data) => request(path, {
  method: 'POST',
  body: JSON.stringify(data),
});

/**
 * DELETE 请求
 */
export const del = (path) => request(path, { method: 'DELETE' });

// ============ AI 配置相关 ============
export const aiAPI = {
  getAIConfigs: () => get('/ai-configs'),
  createAIConfig: (data) => post('/ai-configs', data),
  deleteAIConfig: (id) => del(`/ai-configs/${id}`),
  completion: (data) => post('/ai/completion', data),
  batchVoteCompletion: (requests) => {
    return Promise.all(
      requests.map(req => post('/ai/completion', req))
    );
  }
};

// ============ 游戏相关 ============
export const gameAPI = {
  createGame: (data) => post('/game/create', data),
  getGame: (id) => get(`/game/${id}`),
  addLog: (data) => post('/game/log', data),
  updateGameStatus: (data) => post('/game/update-status', data),
  updatePlayer: (data) => post('/game/update-player', data),
  generateReview: (id) => post(`/game/${id}/review-generate`),
};

export default { get, post, delete: del, aiAPI, gameAPI };
```

### 域名配置

**微信公众平台配置**：
1. 登录微信公众平台
2. 开发 → 开发管理 → 开发设置 → 服务器域名
3. 配置 request 合法域名：`https://your-domain.com`

**开发阶段**：
- 微信开发者工具：详情 → 本地设置 → 勾选"不校验合法域名"

### AI API 调用

**保持后端代理方式**：
- 小程序端通过后端 API 调用 Claude API
- 避免在小程序端暴露 API Key
- 后端处理 AI 请求和响应

## 4. 路由和页面配置

### 应用配置

**app.config.js**：

```javascript
export default defineAppConfig({
  pages: [
    'pages/setup/index',
    'pages/game/index',
    'pages/result/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#0f172a',
    navigationBarTitleText: '狼人乱斗',
    navigationBarTextStyle: 'white',
    navigationStyle: 'default'
  },
  tabBar: undefined // 不使用 tabBar
});
```

### 页面配置

**pages/setup/index.config.js**：

```javascript
export default definePageConfig({
  navigationBarTitleText: '游戏准备',
  enableShareAppMessage: true
});
```

### 路由跳转改造

**导航 API 对比**：

```javascript
// 原代码（react-router-dom）
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(`/game/${gameId}`);

// 改造后（Taro）
import Taro from '@tarojs/taro';

Taro.navigateTo({
  url: `/pages/game/index?id=${gameId}`
});

// 返回上一页
Taro.navigateBack();

// 重定向
Taro.redirectTo({
  url: '/pages/setup/index'
});
```

### 页面参数接收

```javascript
// 原代码
import { useParams } from 'react-router-dom';
const { id } = useParams();

// 改造后
import Taro from '@tarojs/taro';

const Game = () => {
  const router = Taro.useRouter();
  const gameId = router.params.id;

  // ...
};
```

### 页面生命周期

```javascript
import { useEffect } from 'react';
import Taro, { useLoad, useDidShow, useDidHide } from '@tarojs/taro';

const Setup = () => {
  // 页面加载时触发（只触发一次）
  useLoad(() => {
    console.log('Page loaded');
  });

  // 页面显示时触发（每次显示都触发）
  useDidShow(() => {
    console.log('Page shown');
    fetchAIConfigs(); // 刷新数据
  });

  // 页面隐藏时触发
  useDidHide(() => {
    console.log('Page hidden');
  });

  // useEffect 仍然可用
  useEffect(() => {
    // 组件级别的副作用
  }, []);

  return <View>...</View>;
};
```

## 5. 状态管理和组件迁移

### Zustand 状态管理

**完全兼容，无需修改**：

```javascript
// stores/gameStore.js
import { create } from 'zustand';
import { aiAPI, gameAPI } from '@/api';

const useGameStore = create((set, get) => ({
  game: null,
  players: [],
  logs: [],
  aiConfigs: [],
  loading: false,
  isGodMode: false,
  actingPlayerIndex: null,

  setGodMode: (val) => set({ isGodMode: val }),
  setActingPlayerIndex: (index) => set({ actingPlayerIndex: index }),

  fetchAIConfigs: async () => {
    const res = await aiAPI.getAIConfigs();
    if (res.success) set({ aiConfigs: res.data });
  },

  // ... 其他方法保持不变
}));

export default useGameStore;
```

### 组件迁移策略

**基础组件替换**：

| Web 组件 | Taro 组件 |
|---------|----------|
| `<div>` | `<View>` |
| `<span>` | `<Text>` |
| `<img>` | `<Image>` |
| `<button>` | `<Button>` |
| `<input>` | `<Input>` |
| `<textarea>` | `<Textarea>` |

**第三方组件替换**：

| Web 库 | 小程序方案 |
|-------|----------|
| react-hot-toast | Taro.showToast |
| lucide-react | Taro Icons / iconfont |
| framer-motion | CSS 动画 + Taro 动画 API |
| Radix UI | Taro UI / NutUI |

### PlayerCard 组件迁移示例

**原组件**（简化版）：

```jsx
// components/PlayerCard.jsx
import { motion } from 'framer-motion';
import { Shield, Skull } from 'lucide-react';

const PlayerCard = ({ player, onClick }) => {
  return (
    <motion.div
      className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg"
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
    >
      {player.role === 'werewolf' ? <Skull /> : <Shield />}
      <span className="text-white">{player.name}</span>
    </motion.div>
  );
};
```

**迁移后**：

```jsx
// components/PlayerCard/index.jsx
import { View, Text, Image } from '@tarojs/components';
import './index.scss';

const PlayerCard = ({ player, onClick }) => {
  return (
    <View
      className="player-card"
      hoverClass="player-card-hover"
      onClick={onClick}
    >
      <Image
        className="player-icon"
        src={player.role === 'werewolf' ? '/assets/skull.png' : '/assets/shield.png'}
      />
      <Text className="player-name">{player.name}</Text>
    </View>
  );
};

export default PlayerCard;
```

```scss
// components/PlayerCard/index.scss
.player-card {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 32rpx;
  background-color: #1e293b;
  border-radius: 16rpx;
  transition: transform 0.2s;
}

.player-card-hover {
  transform: scale(1.05);
}

.player-icon {
  width: 48rpx;
  height: 48rpx;
}

.player-name {
  color: #ffffff;
  font-size: 28rpx;
}
```

### 懒加载处理

**移除 React.lazy**：

```jsx
// 原代码
import { lazy, Suspense } from 'react';
const Setup = lazy(() => import('@/pages/Setup'));

// 改造后（Taro 自动按页面懒加载）
// 无需手动处理，Taro 会自动分包
```

**组件级懒加载**（可选）：

```jsx
// Suspense 仍可用于组件级懒加载
import { Suspense, lazy } from 'react';
import { View } from '@tarojs/components';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

const Page = () => (
  <View>
    <Suspense fallback={<View>加载中...</View>}>
      <HeavyComponent />
    </Suspense>
  </View>
);
```

## 6. 小程序特性适配

### 本地存储

```javascript
// localStorage → Taro.setStorageSync
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');

// 改为
Taro.setStorageSync('key', 'value');
const value = Taro.getStorageSync('key');

// 异步版本
await Taro.setStorage({ key: 'key', data: 'value' });
const { data } = await Taro.getStorage({ key: 'key' });
```

### Toast 提示

```javascript
// react-hot-toast → Taro.showToast
import { toast } from 'react-hot-toast';

toast.success('操作成功');
toast.error('操作失败');

// 改为
import Taro from '@tarojs/taro';

Taro.showToast({
  title: '操作成功',
  icon: 'success',
  duration: 2000
});

Taro.showToast({
  title: '操作失败',
  icon: 'none',
  duration: 2000
});
```

### 分享功能

```javascript
import Taro, { useShareAppMessage } from '@tarojs/taro';

const Setup = () => {
  // 自定义分享内容
  useShareAppMessage(() => {
    return {
      title: '狼人乱斗 - 一起来玩吧！',
      path: '/pages/setup/index',
      imageUrl: '/assets/share-cover.png'
    };
  });

  return <View>...</View>;
};
```

### 权限声明

**project.config.json**：

```json
{
  "miniprogramRoot": "dist/",
  "projectname": "wolf-weixin-miniprogram",
  "description": "狼人乱斗微信小程序",
  "appid": "your-appid",
  "setting": {
    "urlCheck": true,
    "es6": false,
    "enhance": true,
    "compileHotReLoad": false
  },
  "compileType": "miniprogram"
}
```

### 性能优化

**避免频繁更新**：
```javascript
// Taro 会自动批量更新，但仍需注意
const [count, setCount] = useState(0);

// 避免在循环中频繁 setState
for (let i = 0; i < 100; i++) {
  setCount(i); // ❌ 不推荐
}

// 推荐：一次性更新
setCount(100); // ✅ 推荐
```

**长列表优化**：
```jsx
import { VirtualList } from '@tarojs/components';

<VirtualList
  height={500}
  itemData={players}
  itemCount={players.length}
  itemSize={100}
>
  {({ index, data }) => (
    <PlayerCard player={data[index]} />
  )}
</VirtualList>
```

**图片懒加载**：
```jsx
<Image
  src={imageUrl}
  lazyLoad
  mode="aspectFill"
/>
```

### 开发调试

**微信开发者工具**：
1. 下载并安装微信开发者工具
2. 导入项目（选择 `dist/` 目录）
3. 预览和调试

**真机调试**：
- 点击"预览"生成二维码
- 使用微信扫码在真机上测试

**远程调试**：
- 工具 → 远程调试
- 在真机上调试网络请求和性能

## 7. 迁移实施计划

### 阶段 1：项目初始化（1-2 天）

1. 创建 Taro 项目
2. 配置开发环境
3. 搭建基础目录结构
4. 配置 Taro 编译选项
5. 配置微信小程序 AppID

### 阶段 2：公共模块迁移（2-3 天）

1. 迁移 API 封装（api/index.js）
2. 迁移状态管理（stores/gameStore.js）
3. 迁移工具函数（utils/）
4. 创建全局样式和主题变量

### 阶段 3：Setup 页面迁移（3-4 天）

1. 创建页面结构
2. 迁移 UI 组件
3. 转换样式（Tailwind → SCSS）
4. 适配小程序 API
5. 测试功能完整性

### 阶段 4：Game 页面迁移（5-7 天）

1. 创建页面结构
2. 迁移 PlayerCard 组件
3. 迁移游戏逻辑
4. 处理实时更新（轮询或 WebSocket）
5. 测试游戏流程

### 阶段 5：Result 页面迁移（2-3 天）

1. 创建页面结构
2. 迁移结果展示组件
3. 迁移复盘功能
4. 测试完整流程

### 阶段 6：测试和优化（3-5 天）

1. 功能测试
2. 兼容性测试
3. 性能优化
4. 真机测试
5. 修复 Bug

### 阶段 7：发布准备（1-2 天）

1. 配置生产环境 API 域名
2. 提交微信审核
3. 准备发布材料
4. 发布上线

**总计时间**：约 2-3 周

## 8. 风险和注意事项

### 技术风险

1. **样式兼容性**：Tailwind 转 SCSS 工作量较大，需要仔细测试
2. **动画效果**：framer-motion 的复杂动画可能难以完全还原
3. **性能问题**：小程序对包体积和性能有严格限制
4. **API 限制**：小程序的网络请求有并发限制（最多 10 个）

### 业务风险

1. **功能缺失**：部分 Web 特性在小程序中无法实现
2. **用户体验差异**：小程序和 Web 的交互习惯不同
3. **审核风险**：微信审核可能拒绝某些功能（如 AI 相关）

### 缓解措施

1. **分阶段迁移**：逐页面迁移，降低风险
2. **充分测试**：每个阶段完成后进行完整测试
3. **保留 Web 版本**：作为备选方案
4. **提前沟通**：与微信审核团队沟通 AI 功能的合规性

## 9. 后续规划

### 短期（1-2 个月）

1. 完成小程序基础功能迁移
2. 通过微信审核并发布
3. 收集用户反馈并优化

### 中期（3-6 个月）

1. 迁移到微信云开发
2. 使用云函数替代现有后端
3. 使用云数据库存储游戏数据
4. 优化性能和用户体验

### 长期（6-12 个月）

1. 支持多平台（支付宝小程序、抖音小程序）
2. 增加社交功能（好友对战、排行榜）
3. 增加更多游戏模式和角色
4. 商业化探索（广告、付费功能）

## 10. 总结

本设计方案采用渐进式迁移策略，使用 Taro 框架将现有 React Web 应用迁移到微信小程序平台。核心优势：

- **风险可控**：保留原项目，逐步迁移
- **代码复用**：70-80% 的业务逻辑可复用
- **技术成熟**：Taro 生态完善，社区活跃
- **扩展性强**：后续可支持多平台

预计 2-3 周完成迁移，后续可根据用户反馈持续优化。
