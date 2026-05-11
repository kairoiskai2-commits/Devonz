import { atom, map } from 'nanostores';

/** When true, AI generation runs server-side and survives tab close */
export const backgroundModeAtom = atom<boolean>(false);

export interface BackgroundJob {
  id: string;
  status: 'pending' | 'running' | 'done' | 'error';
  userMessage: string;
  result?: string;
  error?: string;
  chatId?: string;
}

/** Active background jobs keyed by job ID */
export const backgroundJobsMap = map<Record<string, BackgroundJob>>({});

export function addBackgroundJob(job: BackgroundJob) {
  backgroundJobsMap.setKey(job.id, job);
}

export function updateBackgroundJob(id: string, patch: Partial<BackgroundJob>) {
  const current = backgroundJobsMap.get()[id];

  if (current) {
    backgroundJobsMap.setKey(id, { ...current, ...patch });
  }
}
