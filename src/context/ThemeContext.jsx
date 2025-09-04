// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useMemo } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light"); // default light mode

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#f58220" },
          secondary: { main: "#06b6d4" },
          background: {
            default: mode === "dark" ? "#0f172a" : "#f9fafb",
            paper: mode === "dark" ? "#1e293b" : "#ffffff",
          },
          text: {
            primary: mode === "dark" ? "#ffffff" : "#111827",
            secondary: mode === "dark" ? "#94a3b8" : "#4b5563",
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: "16px",
                backgroundImage:
                  mode === "dark"
                    ? "linear-gradient(145deg, #1e293b, #0f172a)"
                    : "linear-gradient(145deg, #ffffff, #f3f4f6)",
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
