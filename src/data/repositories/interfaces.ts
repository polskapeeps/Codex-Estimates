// Repository interfaces — the mandatory data-access seam (spec §4).
// Feature code depends ONLY on these interfaces, never on Dexie directly,
// so the cloud-sync layer can reconcile records without feature rewrites.
import type {
  Client,
  Estimate,
  LibraryItem,
  Project,
  ProjectStatus,
  Property,
  RateEntry,
  Rates,
} from '../../lib/types';

export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type ClientPatch = Partial<Omit<Client, 'id' | 'createdAt'>>;

export type ProjectInput = Omit<
  Project,
  'id' | 'createdAt' | 'updatedAt' | 'estimateIds' | 'photoIds' | 'tags' | 'notes'
> &
  Partial<Pick<Project, 'tags' | 'notes'>>;
export type ProjectPatch = Partial<Omit<Project, 'id' | 'createdAt'>>;

export type EstimateInput = Omit<
  Estimate,
  'id' | 'createdAt' | 'updatedAt' | 'version'
> &
  Partial<Pick<Estimate, 'version'>>;
export type EstimatePatch = Partial<Omit<Estimate, 'id' | 'projectId' | 'createdAt'>>;

export type LibraryItemInput = Omit<LibraryItem, 'id'>;
export type LibraryItemPatch = Partial<Omit<LibraryItem, 'id'>>;

export type RateEntryInput = Omit<RateEntry, 'id'> & Partial<Pick<RateEntry, 'id'>>;
export type RateEntryPatch = Partial<Omit<RateEntry, 'id'>>;

export type PropertyInput = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;
export type PropertyPatch = Partial<Omit<Property, 'id' | 'clientId' | 'createdAt'>>;

export interface ClientRepository {
  getAll(): Promise<Client[]>;
  get(id: string): Promise<Client | undefined>;
  create(input: ClientInput): Promise<Client>;
  update(id: string, patch: ClientPatch): Promise<Client>;
  remove(id: string): Promise<void>;
}

export interface ProjectRepository {
  getAll(): Promise<Project[]>;
  get(id: string): Promise<Project | undefined>;
  byClient(clientId: string): Promise<Project[]>;
  create(input: ProjectInput): Promise<Project>;
  update(id: string, patch: ProjectPatch): Promise<Project>;
  /** Status change with the bidSentAt/decisionAt side-effects (spec §3). */
  setStatus(id: string, status: ProjectStatus): Promise<Project>;
  remove(id: string): Promise<void>;
}

export interface EstimateRepository {
  get(id: string): Promise<Estimate | undefined>;
  getAll(): Promise<Estimate[]>;
  byProject(projectId: string): Promise<Estimate[]>;
  /** Next version number for a project's estimates (1-based). */
  nextVersion(projectId: string): Promise<number>;
  create(input: EstimateInput): Promise<Estimate>;
  update(id: string, patch: EstimatePatch): Promise<Estimate>;
  remove(id: string): Promise<void>;
}

export interface LibraryRepository {
  getAll(): Promise<LibraryItem[]>;
  create(input: LibraryItemInput): Promise<LibraryItem>;
  update(id: string, patch: LibraryItemPatch): Promise<LibraryItem>;
  remove(id: string): Promise<void>;
}

export interface RatesRepository {
  /** READ-ONLY: the persisted singleton, or defaults if not yet seeded. */
  get(): Promise<Rates>;
  /** Persist the defaults row on first run (call once at app boot). */
  ensureSeeded(): Promise<void>;
  update(patch: Partial<Rates>): Promise<Rates>;
  reset(): Promise<Rates>;
}

export interface RateBookRepository {
  getAll(): Promise<RateEntry[]>;
  byCategory(category: RateEntry['category']): Promise<RateEntry[]>;
  /** Seed any missing default entries (call once at app boot). Never clobbers edits. */
  ensureSeeded(): Promise<void>;
  create(input: RateEntryInput): Promise<RateEntry>;
  update(id: string, patch: RateEntryPatch): Promise<RateEntry>;
  remove(id: string): Promise<void>;
  /** Restore the full default Rate Book (used by Settings reset). */
  resetToDefaults(): Promise<void>;
}

export interface PropertyRepository {
  getAll(): Promise<Property[]>;
  get(id: string): Promise<Property | undefined>;
  byClient(clientId: string): Promise<Property[]>;
  create(input: PropertyInput): Promise<Property>;
  update(id: string, patch: PropertyPatch): Promise<Property>;
  remove(id: string): Promise<void>;
}

export interface Repositories {
  clients: ClientRepository;
  projects: ProjectRepository;
  estimates: EstimateRepository;
  library: LibraryRepository;
  rates: RatesRepository;
  rateBook: RateBookRepository;
  properties: PropertyRepository;
}
