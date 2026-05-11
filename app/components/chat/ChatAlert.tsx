import { AnimatePresence, motion } from 'framer-motion';
import type { ActionAlert } from '~/types/actions';
import { cn } from '~/utils/cn';
import { workbenchStore } from '~/lib/stores/workbench';
import { resetTerminalErrorDetector } from '~/utils/terminalErrorDetector';
import { resetPreviewErrorHandler } from '~/utils/previewErrorHandler';

interface Props {
  alert: ActionAlert;
  clearAlert: () => void;
  postMessage: (message: string) => void;
}

export default function ChatAlert({ alert, clearAlert, postMessage }: Props) {
  const { description, content, source } = alert;

  const isPreview = source === 'preview';
  const title = isPreview ? 'Preview Error' : 'Terminal Error';
  const message = isPreview
    ? 'We encountered an error while running the preview. Would you like Veyra to analyze and help resolve this issue?'
    : 'We encountered an error while running terminal commands. Would you like Veyra to analyze and help resolve this issue?';

  const handleAskVeyra = () => {
    /*
     * Reset error handlers so the same error can be caught again after fix.
     * For terminal errors, also interrupt any running process (Ctrl+C).
     * Clear the alert immediately — user has engaged, no need to keep showing it.
     */
    if (isPreview) {
      resetPreviewErrorHandler();
    } else {
      resetTerminalErrorDetector();
      workbenchStore.interruptTerminal();
    }

    clearAlert();

    postMessage(
      `*Fix this ${isPreview ? 'preview' : 'terminal'} error* \n\`\`\`${isPreview ? 'js' : 'sh'}\n${content}\n\`\`\`\n`,
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`rounded-lg border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 p-4 mb-2`}
      >
        <div className="flex items-start">
          {/* Icon */}
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`i-ph:warning-duotone text-xl text-veyra-elements-button-danger-text`}></div>
          </motion.div>
          {/* Content */}
          <div className="ml-3 flex-1">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`text-sm font-medium text-veyra-elements-textPrimary`}
            >
              {title}
            </motion.h3>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`mt-2 text-sm text-veyra-elements-textSecondary`}
            >
              <p>{message}</p>
              {description && (
                <div className="text-xs text-veyra-elements-textSecondary p-2 bg-veyra-elements-background-depth-3 rounded mt-4 mb-4">
                  Error: {description}
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={cn(' flex gap-2')}>
                <button
                  onClick={handleAskVeyra}
                  className={cn(
                    `px-2 py-1.5 rounded-md text-sm font-medium`,
                    'bg-veyra-elements-button-primary-background',
                    'hover:bg-veyra-elements-button-primary-backgroundHover',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-veyra-elements-button-danger-background',
                    'text-veyra-elements-button-primary-text',
                    'flex items-center gap-1.5',
                  )}
                >
                  <div className="i-ph:chat-circle-duotone"></div>
                  Ask Veyra
                </button>
                <button
                  onClick={clearAlert}
                  className={cn(
                    `px-2 py-1.5 rounded-md text-sm font-medium`,
                    'bg-veyra-elements-button-secondary-background',
                    'hover:bg-veyra-elements-button-secondary-backgroundHover',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-veyra-elements-button-secondary-background',
                    'text-veyra-elements-button-secondary-text',
                  )}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
