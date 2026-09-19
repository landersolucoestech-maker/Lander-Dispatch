import { createMockAgendaEvents } from "./agenda";
import { createMockInternalConversations, createMockSupportConversations } from "./chat";
import { createMockMarketingState } from "./marketing";
import { createMockSettingsData } from "./settings";
import { createMockOperationalTasks } from "./tasks";

const MOCKUP_VERSION = "2026-09-19.2";
const VERSION_KEY = "lander:mockup-version";

function parsedValue<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeValue(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mergeRecords<T extends { id: string }>(current: T[] | null, mock: T[]) {
  const existing = Array.isArray(current) ? current : [];
  const mockIds = new Set(mock.map((item) => item.id));
  return [...mock, ...existing.filter((item) => !mockIds.has(item.id))];
}

function mergeRecordStore<T extends { id: string }>(key: string, mock: T[]) {
  writeValue(key, mergeRecords(parsedValue<T[]>(key), mock));
}

function seedObjectIfMissing<T extends object>(key: string, mock: T) {
  const current = parsedValue<T>(key);
  writeValue(key, current && typeof current === "object" ? { ...mock, ...current } : mock);
}

export function bootstrapMockupData() {
  if (typeof window === "undefined") return;
  if (import.meta.env.VITE_MOCKUP_DATA !== "true") return;

  const marketing = createMockMarketingState();
  const existingMarketing = parsedValue<typeof marketing>("lander:marketing-state");
  writeValue("lander:marketing-state", {
    ...marketing,
    ...(existingMarketing ?? {}),
    briefings: mergeRecords(existingMarketing?.briefings ?? null, marketing.briefings),
    campaigns: mergeRecords(existingMarketing?.campaigns ?? null, marketing.campaigns),
    contents: mergeRecords(existingMarketing?.contents ?? null, marketing.contents),
    tasks: mergeRecords(existingMarketing?.tasks ?? null, marketing.tasks),
    aiHistory: mergeRecords(existingMarketing?.aiHistory ?? null, marketing.aiHistory),
  });

  mergeRecordStore("lander:agenda-events", createMockAgendaEvents());
  mergeRecordStore("lander:tasks", createMockOperationalTasks());
  mergeRecordStore("lander:chat-internal", createMockInternalConversations());
  mergeRecordStore("lander:chat-support", createMockSupportConversations());

  const settings = createMockSettingsData();
  seedObjectIfMissing("lander:settings:automations", settings.automations);
  seedObjectIfMissing("lander:settings:public", settings.publicRegistration);
  mergeRecordStore("lander:settings:integrations", settings.integrations);
  mergeRecordStore("lander:settings:users", settings.users);
  mergeRecordStore("lander:settings:roles", settings.roles);

  window.localStorage.setItem(VERSION_KEY, MOCKUP_VERSION);
}
