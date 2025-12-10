"use client";

import { useState, useEffect, useRef } from "react";
import { getAPRAGSettings, APRAGSettings } from "@/lib/api";

interface UseAPRAGSettingsReturn {
  settings: APRAGSettings | null;
  isEnabled: boolean;
  isLoading: boolean;
  features: APRAGSettings["features"];
  refresh: () => Promise<void>;
}

// Global cache for session settings (5 minute TTL)
const settingsCache = new Map<string, { data: APRAGSettings; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useAPRAGSettings(sessionId?: string): UseAPRAGSettingsReturn {
  const [settings, setSettings] = useState<APRAGSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastSessionIdRef = useRef<string | undefined>(undefined);

  const loadSettings = async (forceRefresh = false) => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && settingsCache.has(sessionId)) {
      const cached = settingsCache.get(sessionId)!;
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL) {
        setSettings(cached.data);
        setIsLoading(false);
        return;
      }
      // Cache expired, remove it
      settingsCache.delete(sessionId);
    }

    try {
      setIsLoading(true);
      const apragSettings = await getAPRAGSettings(sessionId);
      setSettings(apragSettings);
      
      // Update cache
      settingsCache.set(sessionId, {
        data: apragSettings,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to load APRAG settings:", error);
      // Set to disabled state on error
      const errorSettings: APRAGSettings = {
        enabled: false,
        global_enabled: false,
        session_enabled: null,
        features: {
          feedback_collection: false,
          personalization: false,
          recommendations: false,
          analytics: false,
        },
      };
      setSettings(errorSettings);
      // Cache error state too (shorter TTL would be better, but keeping it simple)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only reload if sessionId actually changed
    if (lastSessionIdRef.current !== sessionId) {
      lastSessionIdRef.current = sessionId;
      loadSettings();
    }
  }, [sessionId]);

  return {
    settings,
    isEnabled: settings?.enabled ?? false,
    isLoading,
    features: settings?.features ?? {
      feedback_collection: false,
      personalization: false,
      recommendations: false,
      analytics: false,
    },
    refresh: () => loadSettings(true), // Force refresh bypasses cache
  };
}

export default useAPRAGSettings;













