import './App.css';
import '@mantine/core/styles.css'; 
import 'mantine-datatable/styles.css'; 
import { MantineProvider } from '@mantine/core';
import useChamadosService from './_services/ChamadosService';
import TabelaChamados from './_components/TabelaChamados';
import { ThemeProvider } from './components/theme-provider';
import { useTheme } from './components/theme-provider';
import buscarChamados from "./_services/buscarChamados"; 
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import MenuBar from './_components/MenuBar';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import React, { useState, useRef, useEffect } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
})

function AppContent({ chamados, onRefresh, loading }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: buscarChamados, 
    refetchInterval: 5000, 
  });

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MantineProvider forceColorScheme={isDark ? "dark" : "light"}>
          {/* Container Principal */}
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
            {/* 1. MenuBar  */}
            <MenuBar isLoading={isLoading} onSearch={setFilter}/>
            {/* 2. Conteúdo do "Body" */}
            <div className="p-4 space-y-4 flex-1">            
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/40 overflow-hidden shadow-sm">
                <Routes>
                  <Route path="/chamados" element={<TabelaChamados chamados={data} filter={filter} />} />                
                </Routes>
              </div>
            </div>
          </div>
        </MantineProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

function App() {
  const { chamados, CarregarChamados} = useChamadosService();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark"> 
        <AppContent chamados={chamados} onRefresh={CarregarChamados}/>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
export default App;