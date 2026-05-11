/**
 * Auto-deploy Nanostore — tracks per-session deployment state.
 *
 * Kept separate from the existing `deploymentStatus` atom so this
 * feature is fully self-contained and can be removed or swapped
 * without touching existing code.
 */

import { atom } from 'nanostores';

export type AutoDeployPhase = 'idle' | 'uploading' | 'building' | 'ready' | 'error';

export interface AutoDeployState {
  phase: AutoDeployPhase;

  /** Live URL once the deployment is ready */
  url?: string;

  /** Provider-side deployment identifier */
  deploymentId?: string;

  /** Provider-side project identifier (persisted so redeploys reuse the same project) */
  projectId?: string;

  /** Human-readable project name on the provider */
  projectName?: string;

  /** Human-readable error when phase === 'error' */
  errorMessage?: string;

  /** ISO timestamp of the last successful deployment */
  deployedAt?: string;
}

const INITIAL: AutoDeployState = { phase: 'idle' };

export const autoDeployState = atom<AutoDeployState>(INITIAL);

export function resetAutoDeploy() {
  autoDeployState.set(INITIAL);
}

export function setAutoDeployPhase(
  phase: AutoDeployPhase,
  extras?: Partial<Omit<AutoDeployState, 'phase'>>,
) {
  autoDeployState.set({ ...autoDeployState.get(), phase, ...extras });
}
