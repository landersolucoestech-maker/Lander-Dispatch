import { installMockApiFetch } from "./api";
import { createMockAgendaEvents } from "./agenda";
import { createMockInternalConversations, createMockSupportConversations } from "./chat";
import { createMockMarketingState } from "./marketing";
import { createMockSettingsData } from "./settings";
import { createMockOperationalTasks } from "./tasks";

const MOCKUP_VERSION = "2026-09-19.3";
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

function resetPreviewStateWhenVersionChanges() {
  const currentVersion = window.localStorage.getItem(VERSION_KEY);
  const forceReset = new URLSearchParams(window.location.search).get("mockReset") === "1";
  if (currentVersion === MOCKUP_VERSION && !forceReset) return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("lander:")) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

function clearLegacyBrowserCaches() {
  if ("caches" in window) {
    void window.caches.keys().then((keys) => Promise.all(keys.map((key) => window.caches.delete(key)))).catch(() => undefined);
  }
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch(() => undefined);
  }
}

export function bootstrapMockupData() {
  if (typeof window === "undefined") return;
  if (import.meta.env.VITE_MOCKUP_DATA !== "true") return;

  try {
    resetPreviewStateWhenVersionChanges();
    clearLegacyBrowserCaches();
    installMockApiFetch();
  } catch (error) {
    console.error("[mockup] preview reset failed", error);
  }

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
  seedObjectIfMissing("lander:settings:billing", settings.billing);
  mergeRecordStore("lander:settings:integrations", settings.integrations);
  mergeRecordStore("lander:settings:users", settings.users);
  mergeRecordStore("lander:settings:roles", settings.roles);

  try {
    window.localStorage.setItem(VERSION_KEY, MOCKUP_VERSION);
  } catch (error) {
    console.error("[mockup] unable to persist preview version", error);
  }
}
