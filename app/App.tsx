"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import UsageSidebar from "@/components/UsageSidebar";
import PromptSidebar from "@/components/PromptSidebar";
import type { ColorScheme } from "@/hooks/useColorScheme";

const FORCED_SCHEME: ColorScheme = "light";

type SidebarMode = "none" | "templates" | "usage";

export default function App() {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("none");
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [sessionTokens, setSessionTokens] = useState(0);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    root.dataset.colorScheme = FORCED_SCHEME;
    root.classList.remove("dark");
    root.style.colorScheme = FORCED_SCHEME;

    // Load sidebar mode from localStorage
    const savedMode = localStorage.getItem("sidebar-mode") as SidebarMode;
    if (savedMode && ["none", "templates", "usage"].includes(savedMode)) {
      setSidebarMode(savedMode);
    }
  }, []);

  useEffect(() => {
    // Save sidebar mode to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-mode", sidebarMode);
    }
  }, [sidebarMode]);

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ChatKitPanel] widget action", action);
    }
  }, []);

  const handleResponseEnd = useCallback(async (sessionId?: string, tokens?: number) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end", sessionId, tokens);
    }
    if (sessionId) {
      setCurrentSessionId(sessionId);
    }
    if (tokens && sessionId) {
      setSessionTokens(prev => prev + tokens);

      // Report usage to server for tracking
      try {
        await fetch("/api/usage/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            model: "gpt-4o-mini", // Default model, should be passed from ChatKit if available
            promptTokens: Math.floor(tokens * 0.4), // Rough estimate: 40% input, 60% output
            completionTokens: Math.ceil(tokens * 0.6),
            totalTokens: tokens,
          }),
        });
      } catch (error) {
        console.error("Failed to report usage:", error);
      }
    }
  }, []);

  const handleInsertPrompt = useCallback(async (text: string) => {
    // This will be passed to ChatKitPanel to handle prompt insertion
    console.log("Insert prompt:", text);
  }, []);

  return (
    <main className="flex min-h-screen bg-white">
      {/* Main Content with Chat Panel */}
      <div className="flex-1 flex flex-col">
        <ChatKitPanel
          theme={FORCED_SCHEME}
          onWidgetAction={handleWidgetAction}
          onResponseEnd={handleResponseEnd}
          onThemeRequest={() => {}}
          onInsertPrompt={handleInsertPrompt}
        />
      </div>

      {/* Left Sidebar Area - Positioned Absolutely */}
      <div className="fixed left-4 top-4 flex flex-col gap-2 z-40">
        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setSidebarMode(sidebarMode === "templates" ? "none" : "templates")}
            className={`p-2 rounded-md transition-colors ${
              sidebarMode === "templates"
                ? "bg-[#bb0a30] text-white"
                : "text-gray-400 hover:text-gray-600"
            }`}
            aria-label="Vorlagen"
            title="Vorlagen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setSidebarMode(sidebarMode === "usage" ? "none" : "usage")}
            className={`p-2 rounded-md transition-colors ${
              sidebarMode === "usage"
                ? "bg-[#bb0a30] text-white"
                : "text-gray-400 hover:text-gray-600"
            }`}
            aria-label="Token-Nutzung"
            title="Token-Nutzung"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        {/* Sidebar Panel - Below Buttons */}
        {sidebarMode === "templates" && (
          <div className="w-64 h-[calc(100vh-5rem)] bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-auto">
            <PromptSidebar onInsert={handleInsertPrompt} />
          </div>
        )}

        {sidebarMode === "usage" && (
          <div className="w-64 h-[calc(100vh-5rem)] bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-auto">
            <UsageSidebar
              isOpen={true}
              currentSessionId={currentSessionId}
              sessionTokens={sessionTokens}
            />
          </div>
        )}
      </div>
    </main>
  );
}
