"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasksStore } from "@/store/tasksStore";
import { useAssistantStore } from "@/store/assistantStore";
import { pullTasks } from "./tasks";
import { pullMessages } from "./assistant";
import { hasMigrated } from "./migrate";

// One-shot hydration: when a user signs in, pull their cloud data into the
// local Zustand stores.
//
// IMPORTANT: We only pull AFTER migration has been acknowledged (either run
// or explicitly skipped). Otherwise pulling an empty cloud snapshot — or one
// that diverges from local — would clobber the user's existing data before
// they had a chance to import it.
//
// Subsequent edits push back via the per-action helpers (called from store
// actions and page components).
export function useCloudSync() {
  const { user, ready } = useAuth();
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    if (!hasMigrated(user.id)) return;
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
