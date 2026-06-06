import Dexie, { type Table } from "dexie";
import {
  LOCAL_USER_ID,
  type ActivityEvent,
  type BusinessSettings,
  type Client,
  type Estimate,
  type Project,
  type ProjectNote,
} from "./types";

export const nowIso = () => new Date().toISOString();

export const uid = (prefix: string) => {
  if (crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const defaultSettings = (): BusinessSettings => {
  const timestamp = nowIso();

  return {
    id: "default",
    userId: LOCAL_USER_ID,
    businessName: "Codex Estimates",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    serviceArea: "",
    defaultHourlyRate: 30,
    defaultMarkupPercent: 25,
    defaultTaxPercent: 0,
    taxEnabled: false,
    paintCoverageSqftPerGallon: 350,
    paintCostPerGallon: 45,
    wasteFactor: 1.1,
    defaultCoats: 2,
    suppliesPercent: 8,
    suppliesMinimum: 25,
    standardWindowSqft: 15,
    standardDoorSqft: 21,
    printFooter:
      "Draft estimate. Final price may change after confirmed scope, site conditions, and material selections.",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

class ContractorEstimateDb extends Dexie {
  clients!: Table<Client, string>;
  projects!: Table<Project, string>;
  projectNotes!: Table<ProjectNote, string>;
  estimates!: Table<Estimate, string>;
  businessSettings!: Table<BusinessSettings, string>;
  activityEvents!: Table<ActivityEvent, string>;

  constructor() {
    super("codex-estimates");

    this.version(1).stores({
      clients: "id, userId, name, phone, email, createdAt, updatedAt, deletedAt",
      projects:
        "id, userId, clientId, status, jobCategory, title, createdAt, updatedAt, archivedAt, deletedAt",
      projectNotes:
        "id, userId, projectId, noteType, pinned, createdAt, updatedAt, deletedAt",
      estimates:
        "id, userId, projectId, templateKey, versionNumber, createdAt, updatedAt, deletedAt",
      businessSettings: "id, userId, updatedAt",
      activityEvents: "id, userId, projectId, eventType, createdAt",
    });
  }
}

export const db = new ContractorEstimateDb();

export const ensureSettings = async () => {
  const settings = await db.businessSettings.get("default");

  if (settings) {
    return settings;
  }

  const defaults = defaultSettings();
  await db.businessSettings.put(defaults);

  return defaults;
};

export const saveActivity = async (
  projectId: string,
  eventType: string,
  eventJson: Record<string, unknown>,
) => {
  await db.activityEvents.add({
    id: uid("event"),
    userId: LOCAL_USER_ID,
    projectId,
    eventType,
    eventJson,
    createdAt: nowIso(),
  });
};
