/**
* 一个简易的主题色注入流程，只能注入css variables，不能使用 apply、import 等语法
* **/
function injectTailwindTheme() {
  const style = document.createElement('style');
  style.type = 'text/tailwindcss';
  style.textContent = `
    @theme {
      --color-background: #0f172a;
      --color-foreground: #f8fafc;

      --color-primary: #6366f1;
      --color-primary-foreground: #ffffff;

      --color-secondary: #1e293b;
      --color-secondary-foreground: #f8fafc;

      --color-accent: #d4af37;
      --color-accent-foreground: #1a1a2a;

      --color-border: #334155;
      --color-input: #334155;
      --color-ring: #6366f1;

      --color-werewolf: #ef4444;
      --color-good: #22c55e;
      --color-night: #1e1b4b;
      --color-day: #fef08a;

      --radius: 1rem;
    }
    
    @layer base {
      body {
        background-color: var(--color-background);
        color: var(--color-foreground);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      
      /* 自定义滚动条 */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #475569;
      }
      .bg-primary {
        background-color: #6366f1;
      }
    }


    
    .glass-morphism {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .arena-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 1.5rem;
    }

    /* Markdown 表格样式优化 */
    .prose table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.875rem;
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      overflow: hidden;
    }
    .prose th {
      background-color: var(--color-secondary);
      color: var(--color-primary);
      font-weight: 800;
      text-align: left;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .prose td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-foreground);
    }
    .prose tr:last-child td {
      border-bottom: none;
    }
    .prose tr:nth-child(even) {
      background-color: rgba(255, 255, 255, 0.02);
    }
  `;
  document.head.appendChild(style);
}
// 调用函数插入样式
injectTailwindTheme();