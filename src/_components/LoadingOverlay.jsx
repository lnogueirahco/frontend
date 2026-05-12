function LoadingOverlay (){
    return (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/20 dark:bg-black/40 backdrop-blur-md transition-all">
    <div className="flex flex-col items-center p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800">
      {/* Spinner animado do Mantine ou customizado */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-zinc-800"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Carregando...
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 animate-pulse">
        Buscando dados e populando tabelas...
      </p>
    </div>
  </div>
    );
}

export default LoadingOverlay;