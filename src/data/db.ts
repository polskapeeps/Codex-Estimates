import Dexie, { type Table } from 'dexie';
import type {
  Attachment,
  Client,
  Estimate,
  LibraryItem,
  Project,
  Rates,
} from '../lib/types';

/** The rates singleton is stored as one row with a fixed id. */
export const RATES_ID = 'default';
export type RatesRow = Rates & { id: string };

/**
 * IndexedDB schema (spec §14). This is the ONLY module that defines Dexie
 * tables; all access goes through /src/data/repositories/*.
 *
 * Indexes on `projects` (updatedAt, clientId, status, trade) back fast
 * sort/filter in the Jobs list.
 */
export class EstimatorDB extends Dexie {
  clients!: Table<Client, string>;
  projects!: Table<Project, string>;
  estimates!: Table<Estimate, string>;
  libraryItems!: Table<LibraryItem, string>;
  attachments!: Table<Attachment, string>;
  rates!: Table<RatesRow, string>;

  constructor() {
    super('estimator');
    this.version(1).stores({
      clients: 'id, name, updatedAt',
      projects: 'id, clientId, status, trade, updatedAt',
      estimates: 'id, projectId, updatedAt',
      libraryItems: 'id, category, description',
      attachments: 'id, projectId',
      rates: 'id',
    });
  }
}

export const db = new EstimatorDB();
