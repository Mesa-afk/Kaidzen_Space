export type ThemeMode = "light" | "dark" | "focus";

export const themes = {
  light: {
    // Editorial light theme
    background: "#fdfdf9",
    surface: "#ffffff",
    surfaceHover: "#fafbf8",
    border: "#e8ebe3",
    borderStrong: "#d4d8cc",
    
    // Text
    text: "#2a2d26",
    textMuted: "#73766d",
    textSubtle: "#9a9d93",
    
    // Sage green
    sage: "#7d9170",
    sageDark: "#5c6e50",
    sageLight: "#a8c095",
    sageBg: "#f1f5ed",
    
    // Warm accents
    warmYellow: "#f0c94e",
    warmYellowLight: "#fff4c2",
    cream: "#fef9f0",
    
    // States
    completed: "#b7d4a5",
    completedBg: "#eef6e8",
  },
  
  dark: {
    // Standard dark mode (for general UI)
    background: "#1a1d18",
    surface: "#24272",
    surfaceHover: "#2c2f28",
    border: "#35382f",
    borderStrong: "#484b40",
    
    text: "#e4e6df",
    textMuted: "#9ca098",
    textSubtle: "#6e716a",
    
    sage: "#92a880",
    sageDark: "#7d9170",
    sageLight: "#b0c79e",
    sageBg: "#262a23",
    
    warmYellow: "#f5d665",
    warmYellowLight: "#fff9d5",
    cream: "#34362f",
    
    completed: "#8ba677",
    completedBg: "#2a2f26",
  },
  
  focus: {
    // Deep matte-black focus mode (for Day Focus)
    background: "#0f110d",
    surface: "#1a1c18",
    surfaceHover: "#22241f",
    border: "#2d2f28",
    borderStrong: "#3a3d35",
    
    // Extremely subdued text
    text: "#d5d7ce",
    textMuted: "#85877d",
    textSubtle: "#5a5c54",
    
    // Dark sage for focus mode
    sage: "#7a9068",
    sageDark: "#5f7350",
    sageLight: "#96a885",
    sageBg: "#1c1e1a",
    
    // Solar reward yellow in focus mode
    warmYellow: "#f7d95f",
    warmYellowLight: "#fffadb",
    cream: "#26271f",
    
    completed: "#7a9068",
    completedBg: "#1f221c",
  },
};
