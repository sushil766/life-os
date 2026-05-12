"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AIMessage } from "@/lib/types";
import { uid } from "@/lib/utils";

interface AssistantState {
  messages: AIMessage[];
  append: (role: AIMessage["role"], text: string) => void;
  clear: () => void;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      messages: [
        {
          id: uid("m"),
          role: "assistant",
          text:
            "Hey — I'm your Life OS assistant. Ask me to plan your day, analyze your habits, or summarize the week. Try the quick actions below.",
          at: Date.now(),
        },
      ],
      append: (role, text) =>
        set((s) => ({ messages: [...s.messages, { id: uid("m"), role, text, at: Date.now() }] })),
      clear: () => set({ messages: [] }),
    }),
    { name: "lifeos:assistant:v1", storage: createJSONStorage(() => localStorage) },
  ),
);
