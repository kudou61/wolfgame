# 狼人乱斗微信小程序 - 第一阶段初始化设计

## 文档信息

- **创建日期**: 2026-03-09
- **阶段**: 第一阶段 - 项目初始化
- **预计时间**: 2-3 小时
- **状态**: 已批准

## 设计决策

### 1. 项目组织方式

**决策**: 采用 Monorepo 方式，Web 版和小程序版共存

**理由**:
- Web 版和小程序版可以独立开发和部署
- 共享后端服务，减少维护成本
- 便于版本管理和代码对比
- 为未来可能的代码复用预留空间

**项目结构**:
```
wolfgame/
├── src/                    # 现有 Web 版（保持不变）
├── miniprogram/            # 新建小程序目录
│   ├── src/
│   │   ├── pages/          # 页面
│   │   ├── components/     # 组件
│   │   ├── stores/         # 状态管理
│   │   ├── api/            # API 封装
│   │   ├── utils/          # 工具函数
│   │   ├── assets/         # 静态资源
│   │   ├── styles/         # 全局样式
│   │   ├── app.jsx         # 应用入口
│   │   ├── app.config.js   # 应用配置
│   │   └── app.scss        # 全局样式
│   ├── config/             # Taro 配置
│   │   ├── index.js
│   │   ├── dev.js
│   │   └── prod.js
│   ├── project.config.json # 微信开发者工具配置
│   ├── package.json
│   └── README.md
├── server.js               # 现有后端（两个版本共用）
├── functions/              # 现有云函数
└── docs/
    └── plans/
        ├── miniprogram-audit-materials.md  # AI 功能审核材料
        └── 2026-03-09-phase1-initialization-design.md
```

### 2. 代码复用策略

**决策**: 小程序完全独立，不与 Web 版共享代码

**理由**:
- 避免平台差异导致的兼容性问题
- 简化构建和部署流程
- 降低维护复杂度
- 允许针对平台特性进行优化

**权衡**:
- ✅ 优点: 简单清晰，问题隔离
- ❌ 缺点: 有重复代码，需要同步修改

### 3. 后端架构

**决策**: 第一阶段继续使用现有后端，后续迁移到微信云开发

**理由**:
- 快速启动，减少初期工作量
- 现有后端已经稳定运行
- 为云开发迁移预留接口设计空间

**迁移路径**:
1. 第一阶段: 使用现有 server.js + functions/
2. 第二阶段: 逐步迁移到云函数
3. 第三阶段: 完全使用云开发（云函数 + 云数据库）

### 4. AI 功能处理

**决策**: 保留完整 AI 功能，准备详细审核材料

**理由**:
- AI 是核心功能，移除会影响用户体验
- 通过充分准备可以提高审核通过率
- 即使多次审核也值得保留

**风险缓解**:
- 准备详细的功能说明和安全措施文档
- 实现内容过滤和审核机制
- 预留功能开关，可快速降级

## 技术栈设计

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Taro | 3.6+ | 小程序框架 |
| React | 18.3+ | UI 框架 |
| Zustand | 5.0+ | 状态管理 |
| SCSS | - | 样式预处理 |

### 依赖变化

**新增依赖**:
```json
{
  "@tarojs/components": "3.6.x",
  "@tarojs/runtime": "3.6.x",
  "@tarojs/taro": "3.6.x",
  "@tarojs/plugin-platform-weapp": "3.6.x",
  "@tarojs/webpack5-runner": "3.6.x"
}
```

**保留依赖**:
- react, react-dom (版本一致)
- zustand (状态管理)

**移除依赖**:
- vite, @vitejs/plugin-react (构建工具改为 Taro)
- tailwind-merge, class-variance-authority (样式方案改变)
- framer-motion (小程序不支持复杂动画)
- lucide-react (改用图标图片)
- radix-ui (改用自定义组件)
- react-router-dom (改用 Taro 路由)
- react-hot-toast (改用 Taro.showToast)

## 配置设计

### 1. Taro 配置

**文件**: `miniprogram/config/index.js`

```javascript
const path = require('path')

const config = {
  projectName: 'wolf-weixin-miniprogram',
  date: '2026-3-9',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false
  },
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          selectorBlackList: ['van-']
        }
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      },
      cssModules: {
        enable: false
      }
    }
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
```

**关键配置说明**:
- `designWidth: 750`: 设计稿宽度，自动转换 rpx
- `alias`: 配置 `@` 别名指向 `src` 目录
- `pxtransform`: 自动将 px 转换为 rpx
- `compiler: webpack5`: 使用 Webpack 5 构建

### 2. 微信开发者工具配置

**文件**: `miniprogram/project.config.json`

```json
{
  "miniprogramRoot": "dist/",
  "projectname": "wolf-weixin-miniprogram",
  "description": "狼人乱斗微信小程序",
  "appid": "touristappid",
  "setting": {
    "urlCheck": false,
    "es6": false,
    "enhance": true,
    "compileHotReLoad": false,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram"
}
```

**配置说明**:
- `miniprogramRoot`: 编译输出目录
- `appid`: 开发时使用游客模式，发布前替换
- `urlCheck: false`: 开发时跳过域名校验
- `es6: false`: 由 Taro 处理 ES6 转换

### 3. 环境配置

**开发环境** (`miniprogram/config/dev.js`):
```javascript
module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    API_BASE_URL: '"http://localhost:3000"'
  },
  mini: {},
  h5: {}
}
```

**生产环境** (`miniprogram/config/prod.js`):
```javascript
module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    API_BASE_URL: '"https://your-production-domain.com"'
  },
  mini: {},
  h5: {}
}
```

## 样式系统设计

### 1. 设计原则

- 使用 SCSS 替代 Tailwind CSS
- 使用 rpx 单位实现响应式
- 通过变量和 Mixins 统一主题
- 保持与 Web 版视觉一致

### 2. 颜色系统

**文件**: `miniprogram/src/styles/variables.scss`

```scss
// 颜色系统（保持与 Web 版一致的深色主题）
$color-bg-primary: #0f172a;
$color-bg-secondary: #1e293b;
$color-bg-tertiary: #334155;
$color-text-primary: #ffffff;
$color-text-secondary: #94a3b8;
$color-text-tertiary: #64748b;
$color-primary: #3b82f6;
$color-success: #10b981;
$color-danger: #ef4444;
$color-warning: #f59e0b;

// 间距系统（rpx 单位）
$spacing-xs: 8rpx;
$spacing-sm: 16rpx;
$spacing-md: 24rpx;
$spacing-lg: 32rpx;
$spacing-xl: 48rpx;
$spacing-2xl: 64rpx;

// 圆角
$radius-sm: 8rpx;
$radius-md: 16rpx;
$radius-lg: 24rpx;
$radius-full: 9999rpx;

// 字体大小
$font-xs: 24rpx;
$font-sm: 28rpx;
$font-md: 32rpx;
$font-lg: 36rpx;
$font-xl: 40rpx;
$font-2xl: 48rpx;

// 阴影
$shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
$shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
$shadow-lg: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
```

### 3. 常用 Mixins

**文件**: `miniprogram/src/styles/mixins.scss`

```scss
@import './variables.scss';

// Flex 布局
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

// 卡片样式
@mixin card {
  background-color: $color-bg-secondary;
  border-radius: $radius-md;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
}

// 按钮样式
@mixin button-base {
  border-radius: $radius-md;
  padding: $spacing-md $spacing-lg;
  font-size: $font-md;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.8;
  }
}

@mixin button-primary {
  @include button-base;
  background-color: $color-primary;
  color: $color-text-primary;
}

@mixin button-danger {
  @include button-base;
  background-color: $color-danger;
  color: $color-text-primary;
}

// 文本省略
@mixin text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin text-ellipsis-multi($lines: 2) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: $lines;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 4. Tailwind 到 SCSS 转换示例

| Tailwind CSS | SCSS |
|--------------|------|
| `flex items-center justify-between` | `@include flex-between;` |
| `bg-slate-800 rounded-lg p-6` | `@include card;` |
| `text-sm text-gray-400` | `font-size: $font-sm; color: $color-text-secondary;` |
| `w-full h-full` | `width: 100%; height: 100%;` |
| `gap-4` | `gap: $spacing-lg;` |

## API 封装设计

### 1. 配置管理

**文件**: `miniprogram/src/api/config.js`

```javascript
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com'
    : 'http://localhost:3000',
  timeout: 10000
}
```

### 2. 请求封装

**文件**: `miniprogram/src/api/index.js`

```javascript
import Taro from '@tarojs/taro'
import { API_CONFIG } from './config'

class ApiClient {
  request(options) {
    const { url, method = 'GET', data, header = {} } = options

    return Taro.request({
      url: `${API_CONFIG.baseURL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      timeout: API_CONFIG.timeout
    }).then(res => {
      if (res.statusCode === 200) {
        return res.data
      }
      throw new Error(res.data?.message || '请求失败')
    }).catch(err => {
      Taro.showToast({
        title: err.message || '网络错误',
        icon: 'none',
        duration: 2000
      })
      throw err
    })
  }

  get(url, data) {
    return this.request({ url, method: 'GET', data })
  }

  post(url, data) {
    return this.request({ url, method: 'POST', data })
  }

  put(url, data) {
    return this.request({ url, method: 'PUT', data })
  }

  delete(url) {
    return this.request({ url, method: 'DELETE' })
  }
}

export const api = new ApiClient()

// 游戏相关 API
export const gameApi = {
  // 创建游戏
  createGame: (config) => api.post('/api/games', config),

  // 获取游戏信息
  getGame: (id) => api.get(`/api/games/${id}`),

  // 删除游戏
  deleteGame: (id) => api.delete(`/api/games/${id}`),

  // 执行游戏动作
  performAction: (gameId, action) => api.post(`/api/games/${gameId}/actions`, action)
}
```

**设计要点**:
- 统一错误处理和 Toast 提示
- 支持开发/生产环境切换
- API 接口与现有后端保持一致
- 为后续云开发迁移预留接口结构

## AI 功能审核准备

### 审核材料文档

**文件**: `docs/plans/miniprogram-audit-materials.md`

**包含内容**:

1. **AI 功能说明**
   - AI 仅用于游戏娱乐场景（模拟狼人杀玩家）
   - 不涉及政治、色情、暴力等敏感内容
   - AI 生成内容仅限游戏内对话和复盘分析
   - 所有 AI 内容都经过后端审核过滤

2. **技术实现说明**
   - AI API 调用通过后端代理，不在小程序端直接调用
   - 后端对 AI 生成内容进行关键词过滤
   - 用户无法直接输入 prompt，只能选择预设选项
   - 实现内容审核日志记录

3. **内容安全措施**
   - 敏感词过滤机制
   - 内容审核日志
   - 用户举报功能（预留）
   - 违规内容处理流程

4. **测试账号和流程**
   - 提供完整的测试流程说明
   - 展示 AI 功能的实际效果
   - 强调娱乐性和安全性
   - 提供测试视频或截图

### 审核策略

**第一次提交**:
- 详细说明 AI 功能用途和安全措施
- 提供完整测试流程
- 强调内容安全和审核机制

**如被拒绝**:
- 根据审核反馈调整说明文档
- 必要时调整功能实现
- 补充更多安全措施说明

**降级方案**:
- 实现 AI 功能开关（后端配置）
- 可快速关闭 AI 功能
- 保证核心游戏流程不受影响

## 执行步骤

### 步骤 1: 安装 Taro CLI

```bash
npm install -g @tarojs/cli
```

**验证**:
```bash
taro --version
```

### 步骤 2: 创建 Taro 项目

```bash
cd /volume2/homes/aaron/project/wolfgame
taro init miniprogram
```

**交互选项**:
- 框架: React
- 是否使用 TypeScript: 否
- CSS 预处理器: SCSS
- 模板: 默认模板

### 步骤 3: 配置项目

1. 修改 `miniprogram/config/index.js`
2. 创建 `miniprogram/config/dev.js`
3. 创建 `miniprogram/config/prod.js`
4. 修改 `miniprogram/project.config.json`

### 步骤 4: 搭建目录结构

```bash
cd miniprogram/src
mkdir -p pages components stores api utils assets/icons styles
```

创建文件:
- `styles/variables.scss`
- `styles/mixins.scss`
- `api/config.js`
- `api/index.js`

### 步骤 5: 配置开发环境

1. 下载并安装微信开发者工具
2. 打开微信开发者工具
3. 导入项目（选择 `miniprogram/` 目录）
4. 选择"不校验合法域名"（开发阶段）

### 步骤 6: 启动开发服务器

```bash
cd miniprogram
npm install
npm run dev:weapp
```

### 步骤 7: 验证环境

在微信开发者工具中:
- ✅ 可以看到默认页面
- ✅ 修改代码后自动刷新
- ✅ 控制台无错误
- ✅ 样式变量可以使用

## 验收标准

### 功能验收

- [ ] Taro 项目创建成功
- [ ] 微信开发者工具可以打开项目
- [ ] 可以看到默认页面
- [ ] 热更新正常工作
- [ ] 样式变量和 Mixins 可以使用
- [ ] API 封装可以正常调用（测试接口）
- [ ] 路径别名 `@` 可用

### 文档验收

- [ ] 配置文件完整且正确
- [ ] README.md 包含开发说明
- [ ] AI 审核材料文档准备完成

### 环境验收

- [ ] 开发环境配置正确
- [ ] 生产环境配置正确
- [ ] 微信开发者工具配置正确

## 预计时间

- 安装和创建项目: 30 分钟
- 配置和目录搭建: 1 小时
- 样式系统和 API 封装: 1 小时
- 验证和调试: 30 分钟

**总计**: 2-3 小时

## 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Taro CLI 安装失败 | 高 | 低 | 使用 npx 或 yarn 替代 |
| 微信开发者工具兼容性问题 | 中 | 低 | 查阅官方文档，更新工具版本 |
| 配置错误导致无法运行 | 高 | 中 | 参考官方模板，逐步验证配置 |
| 样式系统不符合预期 | 中 | 低 | 提前测试样式转换效果 |

## 后续步骤

第一阶段完成后，进入第二阶段：公共模块迁移

- 迁移状态管理（Zustand store）
- 迁移工具函数
- 准备图标资源
- 创建基础组件

---

**文档版本**: v1.0
**创建日期**: 2026-03-09
**批准状态**: 已批准
