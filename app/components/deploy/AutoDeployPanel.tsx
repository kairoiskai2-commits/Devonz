/**
 * AutoDeployPanel — persistent deployment status bar shown in the
 * workbench header whenever a project is building or has been deployed.
 *
 * States:
 *   idle        → nothing shown
 *   uploading   → "Uploading…" spinner
 *   building    → "Building…"  spinner
 *   ready       → "Live" badge + URL + "Open App" + "Redeploy" buttons
 *   error       → red "Deploy Failed" + error message + "Retry" button
 */

import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { autoDeployState, type AutoDeployPhase } from '~/lib/stores/auto-deploy';
import { useAutoDeploy } from '~/lib/hooks/useAutoDeploy';

interface AutoDeployPanelProps {
  chatId: string;
}

export function AutoDeployPanel({ chatId }: AutoDeployPanelProps) {
  const state = useStore(autoDeployState);
  const { deploy, cancel } = useAutoDeploy();

  const { phase, url, errorMessage, projectName } = state;

  if (phase === 'idle') {
    return null;
  }

  const isInProgress = phase === 'uploading' || phase === 'building';

  const phaseLabel: Record<AutoDeployPhase, string> = {
    idle: '',
    uploading: 'Uploading…',
    building: 'Building…',
    ready: 'Live',
    error: 'Deploy Failed',
  };

  return (
    <AnimatePresence>
      <motion.div
        key="auto-deploy-panel"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 ml-1"
      >
        {/* Status pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            phase === 'ready'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : phase === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-accent-500/10 border-accent-500/30 text-accent-400'
          }`}
        >
          {isInProgress && (
            <span className="i-svg-spinners:ring-resize text-xs shrink-0" />
          )}
          {phase === 'ready' && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse" />
          )}
          {phase === 'error' && (
            <span className="i-ph:warning-circle text-xs shrink-0" />
          )}
          <span>{phaseLabel[phase]}</span>
        </div>

        {/* Live URL + Open App button */}
        {phase === 'ready' && url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors max-w-[180px] group"
            title={url}
          >
            <span className="i-ph:arrow-square-out text-xs shrink-0" />
            <span className="truncate">Open App</span>
          </a>
        )}

        {/* Copy URL */}
        {phase === 'ready' && url && (
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-veyra-elements-background-depth-3 border border-veyra-elements-borderColor text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary hover:border-accent-500/40 transition-colors"
            title="Copy URL"
          >
            <span className="i-ph:copy text-xs" />
          </button>
        )}

        {/* Redeploy button */}
        {phase === 'ready' && (
          <button
            onClick={() => deploy({ chatId })}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-veyra-elements-background-depth-3 border border-veyra-elements-borderColor text-veyra-elements-textSecondary hover:text-accent-400 hover:border-accent-500/40 transition-colors"
          >
            <span className="i-ph:arrows-clockwise text-xs" />
            Redeploy
          </button>
        )}

        {/* Error: show message + retry */}
        {phase === 'error' && (
          <>
            {errorMessage && (
              <span
                className="text-xs text-red-400 max-w-[160px] truncate"
                title={errorMessage}
              >
                {errorMessage}
              </span>
            )}
            <button
              onClick={() => deploy({ chatId })}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-veyra-elements-background-depth-3 border border-veyra-elements-borderColor text-veyra-elements-textSecondary hover:text-accent-400 hover:border-accent-500/40 transition-colors"
            >
              <span className="i-ph:arrows-clockwise text-xs" />
              Retry
            </button>
          </>
        )}

        {/* Cancel in-progress */}
        {isInProgress && (
          <button
            onClick={cancel}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-veyra-elements-textTertiary hover:text-veyra-elements-textSecondary transition-colors"
            title="Cancel deployment"
          >
            <span className="i-ph:x text-xs" />
          </button>
        )}

        {/* Project name tooltip for ready state */}
        {phase === 'ready' && projectName && (
          <span className="text-[10px] text-veyra-elements-textTertiary hidden xl:block truncate max-w-[100px]" title={projectName}>
            {projectName}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
