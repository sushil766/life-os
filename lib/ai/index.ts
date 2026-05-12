import type { AIProvider } from "./provider";
import { mockProvider } from "./mock";
import { makeAnthropicProvider } from "./anthropic";

export function getProvider(): AIProvider {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  if (key && key.trim()) {
    try {
      return makeAnthropicProvider(key, model);
    } catch {
      return mockProvider;
    }
  }
  return mockProvider;
}

export * from "./provider";
