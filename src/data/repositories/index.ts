// The single import surface for all data access. Feature code imports from
// here (or the individual repos) and never touches Dexie directly.
import { clientRepo } from './clientRepo';
import { projectRepo } from './projectRepo';
import { estimateRepo } from './estimateRepo';
import { libraryRepo } from './libraryRepo';
import { ratesRepo } from './ratesRepo';
import { rateBookRepo } from './rateBookRepo';
import { propertyRepo } from './propertyRepo';
import type { Repositories } from './interfaces';

export {
  clientRepo,
  projectRepo,
  estimateRepo,
  libraryRepo,
  ratesRepo,
  rateBookRepo,
  propertyRepo,
};
export { exportAll, importAll, BACKUP_SCHEMA_VERSION } from './backup';
export * from './interfaces';

/** Bundled repositories — the swappable seam for a future sync backend (§11). */
export const repositories: Repositories = {
  clients: clientRepo,
  projects: projectRepo,
  estimates: estimateRepo,
  library: libraryRepo,
  rates: ratesRepo,
  rateBook: rateBookRepo,
  properties: propertyRepo,
};
