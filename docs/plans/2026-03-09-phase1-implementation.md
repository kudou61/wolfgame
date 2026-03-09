# 微信小程序第一阶段实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建微信小程序开发环境，创建 Taro 项目，配置基础架构

**Architecture:** 在现有 wolfgame 仓库中创建 miniprogram/ 子目录，使用 Taro 3.6+ 框架，配置 SCSS 样式系统和 API 封装

**Tech Stack:** Taro 3.6+, React 18.3+, Zustand 5.0+, SCSS, Webpack 5

---

## Task 1: 安装 Taro CLI

**Files:**
- 无需创建文件

**Step 1: 检查是否已安装 Taro CLI**

Run: `taro --version`
Expected: 如果未安装会报错 "command not found"

**Step 2: 全局安装 Taro CLI**

Run: `npm install -g @tarojs/cli`
Expected: 安装成功，显示安装进度和版本信息

**Step 3: 验证安装**

Run: `taro --version`
Expected: 显示 Taro CLI 版本号（3.6.x 或更高）

**Step 4: 记录版本信息**

创建临时记录文件记录环境信息（后续会删除）

---

## Task 2: 创建 Taro 项目

**Files:**
- Create: `miniprogram/` (目录)

**Step 1: 进入项目根目录**

Run: `cd /volume2/homes/aaron/project/wolfgame`
Expected: 当前目录切换到项目根目录

**Step 2: 创建 Taro 项目**

Run: `taro init miniprogram`

交互选项（按顺序选择）:
1. 请输入项目名称: `miniprogram`
2. 请选择框架: `React`
3. 是否需要使用 TypeScript: `否`
4. 请选择 CSS 预处理器: `Sass`
5. 请选择模板: `默认模板`

Expected: 项目创建成功，生成 miniprogram/ 目录

**Step 3: 验证项目结构**

Run: `ls -la miniprogram/`
Expected: 看到以下目录和文件:
- src/
- config/
- package.json
- project.config.json

**Step 4: 进入项目目录**

Run: `cd miniprogram`
Expected: 当前目录切换到 miniprogram/

**Step 5: 安装依赖**

Run: `npm install`
Expected: 依赖安装成功，生成 node_modules/ 和 package-lock.json

---

## Task 3: 配置 Taro 主配置文件

**Files:**
- Modify: `miniprogram/config/index.js`

**Step 1: 读取现有配置**

Read: `miniprogram/config/index.js`
Expected: 看到 Taro 默认配置

**Step 2: 更新配置文件**

Replace entire content with:

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
          selectorBlackList: []
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
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true
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

**Step 3: 验证配置语法**

Run: `node -c config/index.js`
Expected: 无输出表示语法正确

---

## Task 4: 创建开发环境配置

**Files:**
- Create: `miniprogram/config/dev.js`

**Step 1: 创建开发环境配置文件**

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

**Step 2: 验证配置语法**

Run: `node -c config/dev.js`
Expected: 无输出表示语法正确

---

## Task 5: 创建生产环境配置

**Files:**
- Create: `miniprogram/config/prod.js`

**Step 1: 创建生产环境配置文件**

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

**Step 2: 验证配置语法**

Run: `node -c config/prod.js`
Expected: 无输出表示语法正确

---

## Task 6: 配置微信开发者工具

**Files:**
- Modify: `miniprogram/project.config.json`

**Step 1: 读取现有配置**

Read: `miniprogram/project.config.json`
Expected: 看到默认的项目配置

**Step 2: 更新配置文件**

Replace entire content with:

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

**Step 3: 验证 JSON 格式**

Run: `cat project.config.json | python -m json.tool`
Expected: 输出格式化的 JSON，无错误

---

## Task 7: 创建目录结构

**Files:**
- Create: `miniprogram/src/pages/` (目录)
- Create: `miniprogram/src/components/` (目录)
- Create: `miniprogram/src/stores/` (目录)
- Create: `miniprogram/src/api/` (目录)
- Create: `miniprogram/src/utils/` (目录)
- Create: `miniprogram/src/assets/` (目录)
- Create: `miniprogram/src/assets/icons/` (目录)
- Create: `miniprogram/src/styles/` (目录)

**Step 1: 创建所有目录**

Run: `cd src && mkdir -p pages components stores api utils assets/icons styles`
Expected: 目录创建成功

**Step 2: 验证目录结构**

Run: `ls -la`
Expected: 看到所有新创建的目录

**Step 3: 创建 .gitkeep 文件（保持空目录）**

Run: `touch pages/.gitkeep components/.gitkeep stores/.gitkeep utils/.gitkeep assets/icons/.gitkeep`
Expected: 文件创建成功

---

## Task 8: 创建样式变量文件

**Files:**
- Create: `miniprogram/src/styles/variables.scss`

**Step 1: 创建样式变量文件**

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

**Step 2: 验证文件创建**

Run: `cat styles/variables.scss | head -10`
Expected: 看到文件内容的前 10 行

---

## Task 9: 创建样式 Mixins 文件

**Files:**
- Create: `miniprogram/src/styles/mixins.scss`

**Step 1: 创建 Mixins 文件**

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

**Step 2: 验证文件创建**

Run: `cat styles/mixins.scss | head -10`
Expected: 看到文件内容的前 10 行

---

## Task 10: 创建 API 配置文件

**Files:**
- Create: `miniprogram/src/api/config.js`

**Step 1: 创建 API 配置文件**

```javascript
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com'
    : 'http://localhost:3000',
  timeout: 10000
}
```

**Step 2: 验证文件创建**

Run: `cat api/config.js`
Expected: 看到完整的配置内容

---

## Task 11: 创建 API 封装文件

**Files:**
- Create: `miniprogram/src/api/index.js`

**Step 1: 创建 API 封装文件**

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

**Step 2: 验证文件创建**

Run: `cat api/index.js | head -20`
Expected: 看到文件内容的前 20 行

---

## Task 12: 更新全局样式文件

**Files:**
- Modify: `miniprogram/src/app.scss`

**Step 1: 读取现有样式**

Read: `miniprogram/src/app.scss`
Expected: 看到默认的全局样式

**Step 2: 更新全局样式**

Replace entire content with:

```scss
@import './styles/variables.scss';

page {
  background-color: $color-bg-primary;
  color: $color-text-primary;
  font-size: $font-md;
  line-height: 1.5;
}

* {
  box-sizing: border-box;
}
```

**Step 3: 验证样式文件**

Run: `cat app.scss`
Expected: 看到更新后的内容

---

## Task 13: 创建项目 README

**Files:**
- Create: `miniprogram/README.md`

**Step 1: 创建 README 文件**

```markdown
# 狼人乱斗微信小程序

基于 Taro 3.6+ 开发的微信小程序版本。

## 开发环境

- Node.js 16+
- Taro CLI 3.6+
- 微信开发者工具

## 安装依赖

\`\`\`bash
npm install
\`\`\`

## 开发

\`\`\`bash
npm run dev:weapp
\`\`\`

然后在微信开发者工具中打开 `miniprogram/` 目录。

## 构建

\`\`\`bash
npm run build:weapp
\`\`\`

## 项目结构

\`\`\`
src/
├── pages/          # 页面
├── components/     # 组件
├── stores/         # 状态管理
├── api/            # API 封装
├── utils/          # 工具函数
├── assets/         # 静态资源
├── styles/         # 全局样式
├── app.jsx         # 应用入口
├── app.config.js   # 应用配置
└── app.scss        # 全局样式
\`\`\`

## 技术栈

- Taro 3.6+
- React 18.3+
- Zustand 5.0+
- SCSS

## 开发规范

- 使用 SCSS 编写样式
- 使用 rpx 单位
- 使用 `@` 别名引用 src 目录
- API 调用统一使用 `api/index.js` 封装

## 相关文档

- [设计方案](../../docs/plans/2026-03-09-phase1-initialization-design.md)
- [实施计划](../../docs/plans/2026-03-09-miniprogram-implementation-plan.md)
```

**Step 2: 验证文件创建**

Run: `cat README.md | head -20`
Expected: 看到文件内容的前 20 行

---

## Task 14: 测试构建

**Files:**
- 无需创建文件

**Step 1: 清理之前的构建**

Run: `rm -rf dist/`
Expected: dist 目录被删除（如果存在）

**Step 2: 运行开发构建**

Run: `npm run dev:weapp`
Expected: 构建成功，生成 dist/ 目录，显示 "Compiled successfully"

**Step 3: 检查构建输出**

Run: `ls -la dist/`
Expected: 看到编译后的文件，包括 app.js, app.json 等

**Step 4: 停止构建进程**

Run: `Ctrl+C` (手动停止)
Expected: 构建进程停止

---

## Task 15: 创建 AI 审核材料文档

**Files:**
- Create: `docs/plans/miniprogram-audit-materials.md`

**Step 1: 返回项目根目录**

Run: `cd /volume2/homes/aaron/project/wolfgame`
Expected: 当前目录切换到项目根目录

**Step 2: 创建审核材料文档**

```markdown
# 微信小程序 AI 功能审核材料

## 文档信息

- **创建日期**: 2026-03-09
- **小程序名称**: 狼人乱斗
- **功能类型**: 游戏娱乐

## AI 功能说明

### 功能概述

本小程序是一款狼人杀游戏，AI 功能仅用于模拟游戏中的虚拟玩家，提供以下功能：

1. **AI 玩家对话**: 在游戏过程中，AI 玩家会根据游戏规则生成符合角色身份的发言
2. **游戏复盘分析**: 游戏结束后，AI 生成游戏过程的分析和总结

### 使用场景

- 单人游戏时，AI 扮演其他玩家角色
- 多人游戏时，AI 补充不足的玩家位置
- 游戏结束后，AI 提供复盘分析

### 内容限制

AI 生成的内容严格限制在游戏场景内：
- 仅生成游戏相关的对话和分析
- 不涉及政治、色情、暴力等敏感内容
- 不提供游戏外的咨询或服务
- 不收集或处理用户个人信息

## 技术实现说明

### 架构设计

```
用户 → 小程序前端 → 后端服务器 → AI API
                    ↓
                内容审核过滤
                    ↓
                返回给用户
```

### 安全措施

1. **后端代理**: AI API 调用完全在后端进行，小程序端不直接调用
2. **内容过滤**: 后端对所有 AI 生成内容进行关键词过滤
3. **预设模板**: 用户无法自定义 prompt，只能使用预设的游戏场景
4. **审核日志**: 记录所有 AI 生成内容，便于审查

### 敏感词过滤

后端实现了敏感词过滤机制，包括但不限于：
- 政治敏感词
- 色情暴力词汇
- 违法违规内容
- 其他不适宜内容

如检测到敏感内容，系统会：
1. 拒绝返回该内容
2. 记录日志
3. 返回默认安全内容

## 内容安全承诺

### 我们承诺

1. AI 功能仅用于游戏娱乐，不涉及任何敏感话题
2. 所有 AI 生成内容经过严格审核和过滤
3. 建立完善的内容审核机制和应急响应流程
4. 定期审查 AI 生成内容，及时发现和处理问题

### 应急措施

如发现 AI 生成不当内容：
1. 立即停止该内容的展示
2. 记录问题内容和场景
3. 优化过滤规则
4. 必要时临时关闭 AI 功能

### 用户举报

预留用户举报功能（后续版本实现）：
- 用户可举报不当内容
- 24 小时内响应处理
- 根据举报优化系统

## 测试说明

### 测试账号

- 测试环境: 开发版小程序
- 测试方式: 扫码体验

### 测试流程

1. **创建游戏**
   - 打开小程序
   - 选择玩家数量和 AI 配置
   - 点击"开始游戏"

2. **体验 AI 玩家**
   - 进入游戏后，AI 玩家会自动发言
   - 观察 AI 发言内容是否符合游戏规则
   - 验证内容健康、无敏感信息

3. **查看复盘分析**
   - 游戏结束后进入结果页面
   - 点击"AI 复盘"按钮
   - 查看 AI 生成的游戏分析

### 预期效果

- AI 发言符合狼人杀游戏规则
- 内容健康、积极、娱乐性强
- 无任何敏感或不当内容
- 用户体验流畅自然

## 补充说明

### 为什么需要 AI 功能

狼人杀是一款多人游戏，通常需要 6-12 人参与。AI 功能可以：
- 让单人用户也能体验游戏
- 在人数不足时补充玩家
- 提供游戏教学和复盘分析
- 提升用户体验和留存

### AI 功能的价值

- 降低游戏门槛，让更多用户能够体验
- 提供个性化的游戏体验
- 帮助新手学习游戏规则和策略
- 增加游戏的趣味性和可玩性

### 社会责任

我们深知 AI 技术的责任，承诺：
- 严格遵守相关法律法规
- 建立完善的内容审核机制
- 积极响应监管要求
- 持续优化和改进系统

## 联系方式

如有任何问题或建议，请联系：
- 邮箱: [your-email@example.com]
- 电话: [your-phone-number]

---

**文档版本**: v1.0
**创建日期**: 2026-03-09
**更新日期**: 2026-03-09
```

**Step 3: 验证文件创建**

Run: `cat docs/plans/miniprogram-audit-materials.md | head -30`
Expected: 看到文件内容的前 30 行

---

## Task 16: 提交代码

**Files:**
- 所有新创建和修改的文件

**Step 1: 查看 Git 状态**

Run: `git status`
Expected: 看到所有新增和修改的文件

**Step 2: 添加所有文件到暂存区**

Run: `git add miniprogram/ docs/plans/miniprogram-audit-materials.md docs/plans/2026-03-09-phase1-initialization-design.md docs/plans/2026-03-09-phase1-implementation.md`
Expected: 文件添加到暂存区

**Step 3: 查看暂存区状态**

Run: `git status`
Expected: 看到文件已暂存（绿色）

**Step 4: 提交代码**

Run:
```bash
git commit -m "$(cat <<'EOF'
feat: 初始化微信小程序项目

- 创建 Taro 项目结构
- 配置开发和生产环境
- 搭建样式系统（SCSS + 变量 + Mixins）
- 封装 API 请求层
- 准备 AI 功能审核材料

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
EOF
)"
```

Expected: 提交成功，显示提交信息和文件统计

**Step 5: 查看提交历史**

Run: `git log --oneline -1`
Expected: 看到刚才的提交记录

---

## 验收标准

完成所有任务后，验证以下内容：

### 项目结构验收

- [ ] `miniprogram/` 目录存在
- [ ] `miniprogram/src/` 包含所有子目录（pages, components, stores, api, utils, assets, styles）
- [ ] `miniprogram/config/` 包含 index.js, dev.js, prod.js
- [ ] `miniprogram/project.config.json` 配置正确

### 配置文件验收

- [ ] Taro 配置文件语法正确
- [ ] 路径别名 `@` 配置正确
- [ ] 开发和生产环境配置分离
- [ ] 微信开发者工具配置正确

### 样式系统验收

- [ ] `styles/variables.scss` 包含所有颜色、间距、字体变量
- [ ] `styles/mixins.scss` 包含常用 Mixins
- [ ] `app.scss` 引用了变量文件

### API 封装验收

- [ ] `api/config.js` 配置正确
- [ ] `api/index.js` 包含完整的请求封装
- [ ] 支持 GET/POST/PUT/DELETE 方法
- [ ] 包含错误处理和 Toast 提示

### 文档验收

- [ ] `miniprogram/README.md` 包含开发说明
- [ ] `docs/plans/miniprogram-audit-materials.md` 审核材料完整
- [ ] 设计文档和实施计划已创建

### 构建验收

- [ ] `npm run dev:weapp` 可以成功构建
- [ ] 生成 `dist/` 目录
- [ ] 无构建错误

### Git 验收

- [ ] 所有文件已提交
- [ ] 提交信息规范
- [ ] 包含 Co-Authored-By 信息

---

## 后续步骤

第一阶段完成后，可以：

1. 在微信开发者工具中打开项目
2. 验证热更新功能
3. 开始第二阶段：公共模块迁移
   - 迁移状态管理（Zustand store）
   - 迁移工具函数
   - 准备图标资源

---

**计划版本**: v1.0
**创建日期**: 2026-03-09
**预计时间**: 2-3 小时
