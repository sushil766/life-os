// Gmail integration stub. Use Google OAuth + `googleapis` to fetch important
// messages (e.g. course announcements). Filter by labels and feed summaries
// into the assistant context.
export async function recentImportant(_opts: { sinceIso: string }) {
  throw new Error("Not implemented. See lib/integrations/gmail.ts");
}
