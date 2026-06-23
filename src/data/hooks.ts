// React hooks for reactive data reads. These wrap dexie-react-hooks'
// useLiveQuery around the repository methods so components stay reactive
// without ever touching Dexie directly (spec §5).
import { useLiveQuery } from 'dexie-react-hooks';
import {
  clientRepo,
  estimateRepo,
  libraryRepo,
  projectRepo,
  propertyRepo,
  rateBookRepo,
  ratesRepo,
} from './repositories';
import type {
  Client,
  Estimate,
  LibraryItem,
  Project,
  Property,
  RateCategory,
  RateEntry,
  Rates,
} from '../lib/types';

export function useClients(): Client[] | undefined {
  return useLiveQuery(() => clientRepo.getAll(), []);
}

export function useClient(id: string | undefined): Client | undefined {
  return useLiveQuery(() => (id ? clientRepo.get(id) : undefined), [id]);
}

export function useProjects(): Project[] | undefined {
  return useLiveQuery(() => projectRepo.getAll(), []);
}

export function useProject(id: string | undefined): Project | undefined {
  return useLiveQuery(() => (id ? projectRepo.get(id) : undefined), [id]);
}

export function useProjectsByClient(clientId: string | undefined): Project[] | undefined {
  return useLiveQuery(() => (clientId ? projectRepo.byClient(clientId) : []), [clientId]);
}

export function useEstimatesByProject(
  projectId: string | undefined,
): Estimate[] | undefined {
  return useLiveQuery(() => (projectId ? estimateRepo.byProject(projectId) : []), [projectId]);
}

export function useEstimate(id: string | undefined): Estimate | undefined {
  return useLiveQuery(() => (id ? estimateRepo.get(id) : undefined), [id]);
}

export function useAllEstimates(): Estimate[] | undefined {
  return useLiveQuery(() => estimateRepo.getAll(), []);
}

export function useLibraryItems(): LibraryItem[] | undefined {
  return useLiveQuery(() => libraryRepo.getAll(), []);
}

export function useRates(): Rates | undefined {
  return useLiveQuery(() => ratesRepo.get(), []);
}

export function useRateBook(): RateEntry[] | undefined {
  return useLiveQuery(() => rateBookRepo.getAll(), []);
}

export function useRateBookByCategory(
  category: RateCategory | undefined,
): RateEntry[] | undefined {
  return useLiveQuery(
    () => (category ? rateBookRepo.byCategory(category) : []),
    [category],
  );
}

export function usePropertiesByClient(
  clientId: string | undefined,
): Property[] | undefined {
  return useLiveQuery(() => (clientId ? propertyRepo.byClient(clientId) : []), [clientId]);
}

export function useProperty(id: string | undefined): Property | undefined {
  return useLiveQuery(() => (id ? propertyRepo.get(id) : undefined), [id]);
}
