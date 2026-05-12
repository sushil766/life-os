// Database types for Supabase.
//
// This is a permissive shape that lets the SDK accept any column. After your
// Supabase project is set up, regenerate strict types via the CLI:
//
//   npx supabase login
//   npx supabase gen types typescript --project-id <your-ref> --schema public > lib/supabase/types.ts
//
// The schema source-of-truth is `supabase/schema.sql`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AnyRow = Record<string, any>;
type AnyTable = {
  Row: AnyRow;
  Insert: AnyRow;
  Update: AnyRow;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: AnyTable;
      habits: AnyTable;
      habit_logs: AnyTable;
      tasks: AnyTable;
      calendar_events: AnyTable;
      school_classes: AnyTable;
      assignments: AnyTable;
      study_sessions: AnyTable;
      workouts: AnyTable;
      expenses: AnyTable;
      budgets: AnyTable;
      goals: AnyTable;
      reflections: AnyTable;
      ai_messages: AnyTable;
      ai_summaries: AnyTable;
      google_tokens: AnyTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
