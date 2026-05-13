import './App.css';
import '@mantine/core/styles.css'; 
import 'mantine-datatable/styles.css'; 
import { MantineProvider } from '@mantine/core';
import { ThemeProvider } from './components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MenuBar from './_components/MenuBar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChamadosPage from './_components/ChamadosPage';
import { useState } from 'react';
import PlanejamentoPage from './_components/PlanejamentoPage';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
})

function AppContent() {
  const [filter, setFilter] = useState('');

  return (
    <BrowserRouter>
      <MantineProvider forceColorScheme={"dark"}>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 relative">
          {/* MENU BAR */}
          <MenuBar isLoading={false} onSearch={setFilter}/>
          {/* BODY + ROTAS */}
          <div className="p-4 space-y-4 flex-1">            
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/40 overflow-hidden shadow-sm">
              <Routes>
                <Route path="/chamados" element={ <ChamadosPage filter={filter}/> } />                 
                <Route path="/planejamento" element={ <PlanejamentoPage/> } />                 
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