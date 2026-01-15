"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Palette, 
  Type, 
  Maximize2, 
  Save, 
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const defaultTheme: ThemeConfig = {
  colors: {
    primary: "#4F46E5",
    secondary: "#10B981",
    accent: "#F59E0B",
    background: "#FFFFFF",
    text: "#1E293B",
  },
  spacing: {
    cardGap: "24px",
    sectionPadding: "32px",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
  },
  borderRadius: {
    card: "12px",
    button: "8px",
    input: "8px",
  },
};

export function ThemeEditor() {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Load active theme
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const res = await fetch("/api/theme-config");
      if (res.ok) {
        const data = await res.json();
        setTheme(data);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (key: keyof ThemeConfig["colors"], value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  const handleSpacingChange = (key: keyof ThemeConfig["spacing"], value: string) => {
    setTheme(prev => ({
      ...prev,
      spacing: { ...prev.spacing, [key]: value }
    }));
  };

  const handleBorderRadiusChange = (key: keyof ThemeConfig["borderRadius"], value: string) => {
    setTheme(prev => ({
      ...prev,
      borderRadius: { ...prev.borderRadius, [key]: value }
    }));
  };

  const handleReset = () => {
    setTheme(defaultTheme);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch("/api/theme-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor Panel */}
      <div className="space-y-6">
        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Primary Color"
              value={theme.colors.primary}
              onChange={(val) => handleColorChange("primary", val)}
            />
            <ColorInput
              label="Secondary Color"
              value={theme.colors.secondary}
              onChange={(val) => handleColorChange("secondary", val)}
            />
            <ColorInput
              label="Accent Color"
              value={theme.colors.accent}
              onChange={(val) => handleColorChange("accent", val)}
            />
            <ColorInput
              label="Background"
              value={theme.colors.background}
              onChange={(val) => handleColorChange("background", val)}
            />
            <ColorInput
              label="Text Color"
              value={theme.colors.text}
              onChange={(val) => handleColorChange("text", val)}
            />
          </CardContent>
        </Card>

        {/* Spacing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Maximize2 className="h-5 w-5 text-green-600" />
              Spacing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextInput
              label="Card Gap"
              value={theme.spacing.cardGap}
              onChange={(val) => handleSpacingChange("cardGap", val)}
              placeholder="24px"
            />
            <TextInput
              label="Section Padding"
              value={theme.spacing.sectionPadding}
              onChange={(val) => handleSpacingChange("sectionPadding", val)}
              placeholder="32px"
            />
          </CardContent>
        </Card>

        {/* Border Radius */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-purple-600" />
              Border Radius
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextInput
              label="Card Radius"
              value={theme.borderRadius.card}
              onChange={(val) => handleBorderRadiusChange("card", val)}
              placeholder="12px"
            />
            <TextInput
              label="Button Radius"
              value={theme.borderRadius.button}
              onChange={(val) => handleBorderRadiusChange("button", val)}
              placeholder="8px"
            />
            <TextInput
              label="Input Radius"
              value={theme.borderRadius.input}
              onChange={(val) => handleBorderRadiusChange("input", val)}
              placeholder="8px"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveStatus === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </>
            ) : saveStatus === "error" ? (
              <>
                <AlertCircle className="h-4 w-4" />
                Error
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Theme
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview Card */}
            <div
              className="p-6 shadow-lg"
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.card,
                gap: theme.spacing.cardGap,
              }}
            >
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: theme.colors.text }}
              >
                Preview Card
              </h3>
              <p className="text-sm mb-4" style={{ color: theme.colors.text }}>
                This is how your theme will look
              </p>
              
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 text-white font-medium"
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.button,
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 text-white font-medium"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    borderRadius: theme.borderRadius.button,
                  }}
                >
                  Secondary Button
                </button>
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Input field preview"
                  className="w-full px-4 py-2 border-2"
                  style={{
                    borderColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.input,
                  }}
                />
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Color Palette</p>
              <div className="flex gap-2">
                <div
                  className="w-16 h-16 rounded-lg shadow-md"
                  style={{ backgroundColor: theme.colors.primary }}
                  title="Primary"
                />
                <div
                  className="w-16 h-16 rounded-lg shadow-md"
                  style={{ backgroundColor: theme.colors.secondary }}
                  title="Secondary"
                />
                <div
                  className="w-16 h-16 rounded-lg shadow-md"
                  style={{ backgroundColor: theme.colors.accent }}
                  title="Accent"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function ColorInput({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border-2 border-slate-200 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          placeholder="#4F46E5"
        />
      </div>
    </div>
  );
}

function TextInput({ 
  label, 
  value, 
  onChange,
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
      />
    </div>
  );
}
