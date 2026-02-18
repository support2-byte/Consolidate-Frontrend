import { useThemeContext } from "../context/ThemeContext";
import { IconButton } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";

export default function Navbar() {
  const { mode, toggleTheme } = useThemeContext();

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 shadow-md">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
        Consolidate Dashboard
      </h1>

      <IconButton onClick={toggleTheme} color="inherit">
        {mode === "dark" ? (
          <Brightness7 sx={{ color: "white" }} />
        ) : (
          <Brightness4 sx={{ color: "black" }} />
        )}
      </IconButton>
      
    </nav>
  );
}
