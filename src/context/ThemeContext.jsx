// src/context/ThemeContext.jsx

import { createContext, useContext, useState, useMemo, useEffect } from "react";
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      if (!localStorage.getItem("themeMode")) {
        setMode(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,

          primary: {
            main: "#f58220",
            light: "#ff9f4d",
            dark: "#c56700",
            contrastText: "#ffffff",
          },

          secondary: {
            main: "#06b6d4",
          },

          background: {
            default: mode === "dark" ? "#111827" : "#f8fafc",
            paper: mode === "dark" ? "#1f2937" : "#ffffff",
          },

          text: {
            primary: mode === "dark" ? "#f9fafb" : "#111827",
            secondary: mode === "dark" ? "#9ca3af" : "#6b7280",
          },

          divider: mode === "dark" ? "#374151" : "#e5e7eb",

          action: {
            hover:
              mode === "dark"
                ? "rgba(245,130,32,0.12)"
                : "rgba(245,130,32,0.08)",
          },
        },

        shape: {
          borderRadius: 12,
        },

        typography: {
          fontFamily: '"Roboto","Helvetica","Arial",sans-serif',

          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
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
            styleOverrides: {
              body: {
                backgroundColor: mode === "dark" ? "#111827" : "#f8fafc",
              },
            },
          },

          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                backgroundColor: mode === "dark" ? "#1f2937" : "#ffffff",
              },
            },
          },

          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,

                backgroundImage: "none",

                backgroundColor: mode === "dark" ? "#1f2937" : "#ffffff",

                boxShadow:
                  mode === "dark"
                    ? "0 10px 30px rgba(0,0,0,0.35)"
                    : "0 10px 30px rgba(0,0,0,0.08)",
              },
            },
          },

          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
              },
            },
          },

          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor:
                  mode === "dark" ? "rgba(255,255,255,0.03)" : "#ffffff",

                "& fieldset": {
                  borderColor: mode === "dark" ? "#4b5563" : "#d1d5db",
                },

                "&:hover fieldset": {
                  borderColor: "#f58220",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#f58220",
                },
              },

              input: {
                color: mode === "dark" ? "#f9fafb" : "#111827",
              },
            },
          },

          MuiInputLabel: {
            styleOverrides: {
              root: {
                color: mode === "dark" ? "#9ca3af" : "#6b7280",

                "&.Mui-focused": {
                  color: "#f58220",
                },
              },
            },
          },

          MuiSelect: {
            styleOverrides: {
              select: {
                color: mode === "dark" ? "#f9fafb" : "#111827",
              },
            },
          },

          MuiMenu: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === "dark" ? "#1f2937" : "#ffffff",
              },
            },
          },

          MuiMenuItem: {
            styleOverrides: {
              root: {
                color: mode === "dark" ? "#f9fafb" : "#111827",
              },
            },
          },

          MuiTableCell: {
            styleOverrides: {
              root: {
                borderColor: mode === "dark" ? "#374151" : "#e5e7eb",

                color: mode === "dark" ? "#f9fafb" : "#111827",
              },

              head: {
                fontWeight: 700,
                backgroundColor: mode === "dark" ? "#111827" : "#f8fafc",
              },
            },
          },

          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                fontSize: "0.85rem",
              },
            },
          },

          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
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
        theme,
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
