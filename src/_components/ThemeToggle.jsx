import { useTheme } from "../components/theme-provider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-3 py-1 rounded-md border text-sm bg-background text-foreground hover:bg-muted transition"
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}