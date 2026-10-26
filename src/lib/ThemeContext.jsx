import { createContext, useContext } from "react";

// Provider-nya di ThemeProvider.jsx.
export const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}
