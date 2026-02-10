import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

const Setup = lazy(() => import('@/pages/Setup/index.jsx'));
const Game = lazy(() => import('@/pages/Game/index.jsx'));
const Result = lazy(() => import('@/pages/Result/index.jsx'));

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary border-r-transparent border-b-4 border-l-transparent"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
      </div>
    </div>
    <p className="mt-6 text-sm font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Loading Werewolf Brawl</p>
  </div>
);

const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-foreground selection:bg-primary/30">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          borderRadius: '1rem',
          border: '1px solid #334155',
          fontSize: '14px',
          fontWeight: '600'
        }
      }} />
      
      {/* 响应式容器：移动端全屏，PC端居中且带背景效果 */}
      <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        {/* 背景装饰（仅PC端显著） */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        </div>

        {/* 主内容区域 */}
        <div className="w-full h-screen lg:h-[92vh] lg:max-w-[1200px] lg:rounded-[2.5rem] lg:border lg:border-slate-800 lg:shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-slate-950 relative overflow-hidden flex flex-col transition-all duration-500">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Setup />} />
              <Route path="/game/:id" element={<Game />} />
              <Route path="/result/:id" element={<Result />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;