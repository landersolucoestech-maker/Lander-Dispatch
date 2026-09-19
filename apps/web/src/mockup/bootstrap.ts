import { createMockAgendaEvents } from "./agenda";
import { createMockInternalConversations, createMockSupportConversations } from "./chat";
import { createMockMarketingState } from "./marketing";
import { createMockSettingsData } from "./settings";
import { createMockOperationalTasks } from "./tasks";

const MOCKUP_VERSION = "2026-09-19.1";
const VERSION_KEY = "lander:mockup-version";

function parsedValue(key: string) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isEffectivelyEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    const entries = Object.values(value as Record<string, unknown>);
    return entries.length === 0 || entries.every((entry) => {
      if (Array.isArray(entry)) return entry.length === 0;
      return entry == null || entry === "";
    });
  }
  return false;
}

function seedIfEmpty(key: string, value: unknown) {
  const current = parsedValue(key);
  if (!isEffectivelyEmpty(current)) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function bootstrapMockupData() {
  if (typeof window === "undefined") return;
  if (import.meta.env.VITE_MOCKUP_DATA !== "true") return;

  const settings = createMockSettingsData();

  seedIfEmpty("lander:agenda-events", createMockAgendaEvents());
  seedIfEmpty("lander:tasks", createMockOperationalTasks());
  seedIfEmpty("lander:marketing-state", createMockMarketingState());
  seedIfEmpty("lander:chat-internal", createMockInternalConversations());
  seedIfEmpty("lander:chat-support", createMockSupportConversations());
  seedIfEmpty("lander:settings:automations", settings.automations);
  seedIfEmpty("lander:settings:integrations", settings.integrations);
  seedIfEmpty("lander:settings:public", settings.publicRegistration);
  seedIfEmpty("lander:settings:users", settings.users);
  seedIfEmpty("lander:settings:roles", settings.roles);

  window.localStorage.setItem(VERSION_KEY, MOCKUP_VERSION);
}
