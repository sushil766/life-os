"use client";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { useCloudSync } from "@/lib/sync/useCloudSync";

function CloudSyncBridge({ children }: { children: ReactNode }) {
  useCloudSync();
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CloudSyncBridge>{children}</CloudSyncBridge>
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#15151f",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#ededf2",
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
