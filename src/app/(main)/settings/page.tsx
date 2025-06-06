
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, RotateCcw } from "lucide-react";

type HSLColor = { h: number; s: number; l: number };
type ThemeSettings = Record<string, HSLColor>;

interface ColorConfigEntry {
  label: string;
  cssVar: string;
  defaultHSL: HSLColor;
}

const colorConfigurations: Record<string, ColorConfigEntry> = {
  primary: { label: "Primary", cssVar: "--primary", defaultHSL: { h: 231, s: 48, l: 48 } },
  primaryForeground: { label: "Primary Foreground", cssVar: "--primary-foreground", defaultHSL: { h: 0, s: 0, l: 98 } },
  accent: { label: "Accent", cssVar: "--accent", defaultHSL: { h: 174, s: 100, l: 29 } },
  accentForeground: { label: "Accent Foreground", cssVar: "--accent-foreground", defaultHSL: { h: 0, s: 0, l: 98 } },
  background: { label: "Background", cssVar: "--background", defaultHSL: { h: 0, s: 0, l: 93 } },
  foreground: { label: "Foreground", cssVar: "--foreground", defaultHSL: { h: 0, s: 0, l: 10 } },
  card: { label: "Card Background", cssVar: "--card", defaultHSL: { h: 0, s: 0, l: 100 } },
  cardForeground: { label: "Card Foreground", cssVar: "--card-foreground", defaultHSL: { h: 0, s: 0, l: 10 } },
  ring: { label: "Ring", cssVar: "--ring", defaultHSL: { h: 231, s: 48, l: 48 } },
};

const LOCAL_STORAGE_KEY = 'campusConnectThemeSettings';

const getDefaultThemeSettings = (): ThemeSettings => {
  const defaults: ThemeSettings = {};
  for (const key in colorConfigurations) {
    defaults[key] = { ...colorConfigurations[key].defaultHSL };
  }
  return defaults;
};

export default function SettingsPage() {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(getDefaultThemeSettings());
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const applyTheme = useCallback((settings: ThemeSettings) => {
    if (typeof window !== 'undefined') {
      for (const key in settings) {
        const config = colorConfigurations[key];
        const color = settings[key];
        if (config && color) {
          document.documentElement.style.setProperty(config.cssVar, `${color.h} ${color.s}% ${color.l}%`);
        }
      }
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Ensure parsed settings have all keys from current config, fill missing with defaults
        const completeSettings = getDefaultThemeSettings();
        for (const key in parsedSettings) {
          if (colorConfigurations[key] && parsedSettings[key]) {
            completeSettings[key] = parsedSettings[key];
          }
        }
        setThemeSettings(completeSettings);
      } catch (error) {
        console.error("Failed to parse theme settings from localStorage", error);
        setThemeSettings(getDefaultThemeSettings());
      }
    } else {
        setThemeSettings(getDefaultThemeSettings());
    }
  }, []);
  
  useEffect(() => {
    if(isMounted) { // Apply theme only after loading from local storage
        applyTheme(themeSettings);
    }
  }, [themeSettings, applyTheme, isMounted]);


  const handleColorChange = (colorName: string, hslKey: keyof HSLColor, value: number) => {
    setThemeSettings(prev => ({
      ...prev,
      [colorName]: {
        ...prev[colorName],
        [hslKey]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(themeSettings));
    toast({
      title: "Settings Saved",
      description: "Your theme preferences have been saved locally.",
    });
  };

  const handleResetSettings = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setThemeSettings(getDefaultThemeSettings());
    toast({
      title: "Settings Reset",
      description: "Theme has been reset to defaults.",
    });
  };

  if (!isMounted) {
    return <div className="p-6">Loading settings...</div>; // Or a skeleton loader
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <SettingsIcon className="text-primary h-7 w-7" /> Theme Customization
          </CardTitle>
          <CardDescription>Adjust the application's color scheme. Changes are applied live and can be saved locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {Object.entries(colorConfigurations).map(([key, config]) => {
            const currentColor = themeSettings[key] || config.defaultHSL;
            return (
              <div key={key} className="space-y-3 p-4 border rounded-lg shadow-sm bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">{config.label}</Label>
                  <div 
                    style={{ backgroundColor: `hsl(${currentColor.h}, ${currentColor.s}%, ${currentColor.l}%)` }} 
                    className="w-10 h-10 rounded-md border shadow"
                  />
                </div>
                
                {(['h', 's', 'l'] as Array<keyof HSLColor>).map(hslKey => (
                  <div key={hslKey} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`${key}-${hslKey}`} className="capitalize">{hslKey}:</Label>
                      <Input
                        id={`${key}-${hslKey}-value`}
                        type="number"
                        value={currentColor[hslKey]}
                        onChange={(e) => handleColorChange(key, hslKey, parseInt(e.target.value, 10) || 0)}
                        min={0}
                        max={hslKey === 'h' ? 360 : 100}
                        className="w-20 h-8 text-sm"
                      />
                    </div>
                    <Slider
                      id={`${key}-${hslKey}`}
                      value={[currentColor[hslKey]]}
                      onValueChange={([val]) => handleColorChange(key, hslKey, val)}
                      max={hslKey === 'h' ? 360 : 100}
                      step={1}
                      className="my-1"
                    />
                  </div>
                ))}
              </div>
            );
          })}
          <div className="flex gap-4 pt-6 border-t">
            <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" /> Save Settings
            </Button>
            <Button onClick={handleResetSettings} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
