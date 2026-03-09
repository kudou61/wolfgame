# 狼人乱斗微信小程序

基于 Taro 3.6+ 开发的微信小程序版本。

## 开发环境

- Node.js 16+
- Taro CLI 3.6+
- 微信开发者工具

## 安装依赖

```bash
npm install
```

## 开发

```bash
npm run dev:weapp
```

然后在微信开发者工具中打开 `miniprogram/` 目录。

## 构建

```bash
npm run build:weapp
```

## 项目结构

```
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
```

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
