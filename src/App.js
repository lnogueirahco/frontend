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
import { ModalResumoChamado } from './_components/ModalResumoChamado';
import LoadingOverlay from './_components/LoadingOverlay';

const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
})

function AppContent({ chamados, onRefresh }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: buscarChamados, 
    refetchInterval: 5000, 
  });

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Note que renomeei para 'isServiceLoading' para não conflitar com a prop do componente
  const { loading: isServiceLoading, modal, abrirModal, fecharModal } = useChamadosService();

  return (
    <BrowserRouter>
      <MantineProvider forceColorScheme={isDark ? "dark" : "light"}>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 relative">
          
          {/* O Loading aparece por cima de tudo se estiver carregando a IA */}
          {isServiceLoading && <LoadingOverlay />}

          <MenuBar isLoading={isLoading} onSearch={setFilter}/>

          {/* O Modal só monta quando termina o loading e tem dado */}
          {modal.open && (
            <ModalResumoChamado 
              response={modal.response} 
              chamado={modal.chamado} 
              onClose={fecharModal}
            />
          )}

          <div className="p-4 space-y-4 flex-1">            
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/40 overflow-hidden shadow-sm">
              <Routes>
                <Route path="/chamados" element={
                  <TabelaChamados 
                    chamados={data} 
                    filter={filter} 
                    abrirModal={abrirModal} 
                  />
                } />                 
              </Routes>
            </div>
          </div>
        </div>
      </MantineProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark"> 
        <AppContent/>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
export default App;