import './App.css';
import '@mantine/core/styles.css'; // Importante: Estilos base do Mantine
import 'mantine-datatable/styles.css'; // Estilos da Tabela
import { MantineProvider } from '@mantine/core';
import useChamadosService from './_services/ChamadosService';
import TabelaChamados from './_components/TabelaChamados';
import { ThemeProvider } from './components/theme-provider';
import { useTheme } from './components/theme-provider';
import ThemeToggle from "./_components/ThemeToggle";

function AppContent({ chamados }) {
  const { theme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <MantineProvider forceColorScheme={isDark ? "dark" : "light"}>
      <div className="p-4 space-y-4">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <TabelaChamados chamados={chamados} />
      </div>
    </MantineProvider>
  );
}

function App() {
  const { chamados } = useChamadosService();

  return (
    <ThemeProvider defaultTheme="dark">
      <AppContent chamados={chamados} />
    </ThemeProvider>
  );
}
export default App;