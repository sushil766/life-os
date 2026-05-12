// Notion integration stub.
// TODO: use `@notionhq/client` server-side with NOTION_TOKEN.
// Suggested mapping: assignment → row in a Notion database; tasks → daily journal.
export async function pushAssignment(_a: { title: string; due: string; classCode?: string }) {
  throw new Error("Not implemented. See lib/integrations/notion.ts");
}
