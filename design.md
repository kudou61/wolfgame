设计文档
视觉风格
采用现代化深邃科技感与极简主义相结合的设计语言。整体界面以深色调为底，通过高饱和度的强调色（如靛青、血红、金黄）来区分不同阵营与状态，打造一个专业、冷静且富有沉浸感的智力博弈空间。

核心理念： 玻璃拟态 (Glassmorphism) 与 极简布局。
背景设计： 使用深蓝黑色渐变 (#0f172a)，营造深夜博弈的静谧感。
卡片设计： 采用半透明毛玻璃效果，配合细微的边框发光，增强层次感。
舞台聚焦： 中央舞台区作为视觉中心，动态展示当前关键行动与焦点人物。
字体和排版
主字体： Inter 或系统默认无衬线字体（-apple-system, BlinkMacSystemFont）。
代码/日志字体： JetBrains Mono 或 monospace，用于展示 AI 的思考逻辑与详细日志。
排版策略：
层级分明： 标题使用粗体大字号，正文保持适中的行间距，确保长篇日志的可读性。
流体布局： 适配不同尺寸屏幕，玩家卡片在宽屏下自动平铺，窄屏下支持平滑滚动。
色彩体系 (基于 Tailwind CSS v4)
背景色 (Background): #0f172a (Deep Slate)
前景色 (Foreground): #f8fafc (Slate 50)
主色调 (Primary): #6366f1 (Indigo 500) - 用于品牌、主按钮及关键提示。
辅助色 (Secondary): #1e293b (Slate 800) - 用于容器背景。
强调色 (Accent): #d4af37 (Gold) - 用于发言者、警长等特殊状态。
状态色
狼人阵营: #ef4444 (Red 500)
好人阵营: #22c55e (Green 500)
夜晚氛围: #1e1b4b (Indigo 950)
白天氛围: #fef08a (Yellow 200)
核心交互动效
呼吸灯效果： 当前发言玩家的卡片边缘带有金色脉冲动画，引导用户注意力。
AI 思考态： AI 玩家在决策时，头像下方显示三点加载动画，模拟“深度思考”过程。
阶段平滑切换： 昼夜交替时，背景色通过 CSS Transition 进行 1s 的平滑过渡，并伴随顶部状态栏的图标切换。
出局特效： 玩家死亡时，卡片透明度降至 0.5，显示“已出局”标识，并应用置灰滤镜。
界面组件规范
1. 玩家卡片 (PlayerCard)
尺寸： 响应式，最小宽度 120px。
样式： glass-morphism 类名实现，带有 1px 细边框。
内容： 编号、头像、名称、状态标签。
2. 中央竞技场 (Arena)
布局： arena-grid 类名实现，采用 CSS Grid 自动平铺。
焦点展示： 顶部大字号显示当前阶段（如：第 1 天 · 夜晚）。
3. 日志与复盘 (Prose)
表格： 优化后的 Markdown 表格样式，深色底色，高对比度表头。
引用： 用于展示 AI 的心理活动，左侧带有强调色边框。
响应式断点
Mobile (< 768px): 玩家卡片缩小，日志区域占据屏幕下方 40% 空间。
Desktop (>= 1024px): 采用宽屏布局，左侧/中间为竞技场，右侧为实时日志流。

CSS 主题变量定义 (src/theme.js)
```
@theme {
  --color-background: #0f172a;
  --color-foreground: #f8fafc;
  --color-primary: #6366f1;
  --color-secondary: #1e293b;
  --color-accent: #d4af37;
  --color-border: #334155;
  --color-werewolf: #ef4444;
  --color-good: #22c55e;
  --color-night: #1e1b4b;
  --color-day: #fef08a;
}

```