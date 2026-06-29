import { createContext, useContext, useState, useMemo } from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const getInitialMode = () => {
    const saved = localStorage.getItem("themeMode");

    if (saved) return saved;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [mode, setMode] = useState(getInitialMode());

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,

          primary: {
            main: "#f58220",
            light: "#ff9f4d",
            dark: "#d46d13",
            contrastText: "#fff",
          },

          secondary: {
            main: "#0f766e",
          },

          background: {
            default: mode === "dark" ? "#0f172a" : "#f4f6f8",
            paper: mode === "dark" ? "#1e293b" : "#ffffff",
          },

          text: {
            primary: mode === "dark" ? "#f1f5f9" : "#111827",
            secondary: mode === "dark" ? "#94a3b8" : "#6b7280",
          },

          divider: mode === "dark" ? "#334155" : "#e5e7eb",

          success: {
            main: "#2e7d32",
          },

          warning: {
            main: "#ed6c02",
          },

          error: {
            main: "#d32f2f",
          },
        },

        shape: {
          borderRadius: 12,
        },

        typography: {
          fontFamily: "Roboto, Arial, sans-serif",

          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 700 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },

          button: {
            textTransform: "none",
            fontWeight: 600,
          },
        },

        components: {
          MuiCssBaseline: {
            styleOverrides: (theme) => ({
              body: {
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
              },

              "*::-webkit-scrollbar": {
                width: "8px",
                height: "8px",
              },

              "*::-webkit-scrollbar-thumb": {
                background:
                  theme.palette.mode === "dark" ? "#475569" : "#cbd5e1",
                borderRadius: "10px",
              },
            }),
          },

          MuiPaper: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundImage: "none",
                backgroundColor: theme.palette.background.paper,
              }),
            },
          },

          MuiCard: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
                backgroundImage: "none",
                border:
                  theme.palette.mode === "dark"
                    ? "1px solid #334155"
                    : "1px solid #e5e7eb",

                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 6px 18px rgba(0,0,0,0.35)"
                    : "0 4px 12px rgba(0,0,0,0.08)",
              }),
            },
          },

          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                textTransform: "none",
                fontWeight: 600,
              },
            },
          },

          MuiTextField: {
            defaultProps: {
              variant: "outlined",
              size: "small",
            },
          },

          MuiOutlinedInput: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,

                "& fieldset": {
                  borderColor: theme.palette.divider,
                },

                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },

                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              }),

              input: ({ theme }) => ({
                color: theme.palette.text.primary,
              }),
            },
          },

          MuiInputLabel: {
            styleOverrides: {
              root: ({ theme }) => ({
                color: theme.palette.text.secondary,
              }),
            },
          },

          MuiTableContainer: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
              }),
            },
          },

          MuiTableCell: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
              }),

              head: {
                backgroundColor: "#0f766e",
                color: "#fff",
                fontWeight: 700,
              },
            },
          },

          MuiDrawer: {
            styleOverrides: {
              paper: ({ theme }) => ({
                backgroundColor:
                  theme.palette.mode === "dark" ? "#111827" : "#ffffff",

                color: theme.palette.text.primary,

                borderRight: `1px solid ${theme.palette.divider}`,
              }),
            },
          },

          MuiAppBar: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor:
                  theme.palette.mode === "dark" ? "#111827" : "#ffffff",

                color: theme.palette.text.primary,
              }),
            },
          },

          MuiListItemButton: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: 10,

                "&.Mui-selected": {
                  backgroundColor: theme.palette.primary.main,
                  color: "#fff",
                },

                "&.Mui-selected:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }),
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleTheme,
      }}
    >
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
