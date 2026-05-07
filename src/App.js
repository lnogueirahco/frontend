import './App.css';
import '@mantine/core/styles.css'; // Importante: Estilos base do Mantine
import 'mantine-datatable/styles.css'; // Estilos da Tabela
import { MantineProvider } from '@mantine/core';
import useChamadosService from './_services/ChamadosService';
import TabelaChamados from './_components/TabelaChamados';
import { ThemeProvider } from './components/theme-provider';
import { useTheme } from './components/theme-provider';
import ThemeToggle from "./_components/ThemeToggle";

function AppContent({ chamados, onRefresh, loading }) {
  const { theme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <MantineProvider forceColorScheme={isDark ? "dark" : "light"}>
      <div className="p-4 space-y-4">
        <div className="flex justify-end items-center gap-2">
          {/* Botão de Atualizar */}
          <button
            onClick={onRefresh}
            className="px-3 py-1 rounded-md border text-sm bg-background text-foreground hover:bg-muted transition"
          >
            Atualizar
          </button>

          <ThemeToggle />
        </div>

        <TabelaChamados chamados={chamados} />
      </div>
    </MantineProvider>
  );
}

function App() {
  const { chamados, CarregarChamados} = useChamadosService();

  return (
    <ThemeProvider defaultTheme="dark">
      <AppContent chamados={chamados} onRefresh={CarregarChamados}/>
    </ThemeProvider>
  );
}
export default App;