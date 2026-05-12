"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasksStore } from "@/store/tasksStore";
import { useAssistantStore } from "@/store/assistantStore";
import { pullTasks } from "./tasks";
import { pullMessages } from "./assistant";

// One-shot hydration: when a user signs in, pull their cloud data into the
// local Zustand stores. Subsequent edits push back via the per-action helpers
// (called from the store actions / page components).
export function useCloudSync() {
  const { user, ready } = useAuth();
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    if (hydratedFor.current === user.id) return;
    hydratedFor.current = user.id;

    (async () => {
      try {
        const [cloudTasks, cloudMessages] = await Promise.all([
          pullTasks(user.id),
          pullMessages(user.id),
        ]);

        if (cloudTasks && cloudTasks.length > 0) {
          useTasksStore.setState({ tasks: cloudTasks });
        }
        if (cloudMessages && cloudMessages.length > 0) {
          useAssistantStore.setState({ messages: cloudMessages });
        }
      } catch (err) {
        console.warn("[useCloudSync] hydration failed:", err);
      }
    })();
  }, [user, ready]);
}
