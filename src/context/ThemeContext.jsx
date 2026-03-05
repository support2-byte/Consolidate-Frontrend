// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// ────────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

/**
 * Theme Provider with light/dark mode, persistence, and system preference
 */
export function ThemeProvider({ children }) {
  // Try to load saved preference, fallback to system preference
  const getInitialMode = () => {
    const saved = localStorage.getItem("themeMode");
    if (saved) return saved;

    // System preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const [mode, setMode] = useState(getInitialMode());

  // Toggle theme & save preference
  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", newMode);
      return newMode;
    });
  };

  // Listen to system theme changes (optional but nice)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      // Only auto-switch if user has no manual preference saved
      if (!localStorage.getItem("themeMode")) {
        setMode(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // ────────────────────────────────────────────────────────────────
  // Memoized MUI Theme
  // ────────────────────────────────────────────────────────────────
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#f58220",      // your brand color
            light: "#ff9f4d",
            dark: "#c56700",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#06b6d4",
            light: "#4ed8e8",
            dark: "#0085a3",
          },
          background: {
            default: mode === "dark" ? "#0f172a" : "#f8fafc",
            paper: mode === "dark" ? "#1e293b" : "#ffffff",
          },
          text: {
            primary: mode === "dark" ? "#e2e8f0" : "#111827",
            secondary: mode === "dark" ? "#94a3b8" : "#4b5563",
          },
          divider: mode === "dark" ? "#334155" : "#e2e8f0",
          action: {
            hover: mode === "dark" ? "rgba(245,130,32,0.12)" : "rgba(245,130,32,0.08)",
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
          button: { textTransform: "none", fontWeight: 600 },
        },
        shape: {
          borderRadius: 12, // modern rounded corners
        },
        transitions: {
          duration: {
            shortest: 150,
            shorter: 200,
            standard: 300,
            complex: 375,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === "dark" 
                  ? "0 10px 30px rgba(0,0,0,0.4)" 
                  : "0 10px 30px rgba(0,0,0,0.08)",
                backgroundImage: mode === "dark"
                  ? "linear-gradient(145deg, #1e293b, #0f172a)"
                  : "linear-gradient(145deg, #ffffff, #f3f4f6)",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none", // override default gradient if needed
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
};