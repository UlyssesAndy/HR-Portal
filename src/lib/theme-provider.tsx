"use client";

import { useEffect, useState } from "react";

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  spacing: {
    cardGap: string;
    sectionPadding: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  borderRadius: {
    card: string;
    button: string;
    input: string;
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    // Fetch theme config from API
    fetch("/api/theme-config")
      .then((res) => res.json())
      .then((data) => {
        setTheme(data);
        applyTheme(data);
      })
      .catch((err) => console.error("Failed to load theme:", err));
  }, []);

  const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;

    // Apply colors
    if (config.colors) {
      Object.entries(config.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }

    // Apply spacing
    if (config.spacing) {
      Object.entries(config.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--spacing-${key}`, value);
      });
    }

    // Apply typography
    if (config.typography) {
      Object.entries(config.typography).forEach(([key, value]) => {
        root.style.setProperty(`--font-${key}`, value);
      });
    }

    // Apply border radius
    if (config.borderRadius) {
      Object.entries(config.borderRadius).forEach(([key, value]) => {
        root.style.setProperty(`--radius-${key}`, value);
      });
    }
  };

  return <>{children}</>;
}
