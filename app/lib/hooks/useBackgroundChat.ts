import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { toast } from 'sonner';
import {
  backgroundModeAtom,
  backgroundJobsMap,
  addBackgroundJob,
  updateBackgroundJob,
} from '~/lib/stores/backgroundMode';

const POLL_INTERVAL = 4000;

export function useBackgroundChat() {
  const isBackgroundMode = useStore(backgroundModeAtom);
  const jobs = useStore(backgroundJobsMap);
  const pollTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const pollJob = useCallback((jobId: string) => {
    if (pollTimers.current[jobId]) return;

    pollTimers.current[jobId] = setInterval(async () => {
      try {
        const res = await fetch(`/api/background-chat/${jobId}`, { credentials: 'include' });
        const json = await res.json();

        if (!json.success) return;

        const { status, result, error } = json.data;
        updateBackgroundJob(jobId, { status, result, error });

        if (status === 'done' || status === 'error') {
          clearInterval(pollTimers.current[jobId]);
          delete pollTimers.current[jobId];

          if (status === 'done') {
            toast.success('Background AI response ready!');
          } else {
            toast.error(`Background AI failed: ${error ?? 'Unknown error'}`);
          }
        }
      } catch {
        // network error — keep polling
      }
    }, POLL_INTERVAL);
  }, []);

  const sendBackgroundMessage = useCallback(
    async (options: {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      provider?: string;
      chatId?: string;
    }) => {
      try {
        const res = await fetch('/api/background-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(options),
        });
        const json = await res.json();

        if (!json.success) {
          toast.error('Failed to start background AI: ' + (json.error ?? 'Unknown error'));
          return null;
        }

        const { jobId } = json;
        const lastUserMsg = options.messages.filter((m) => m.role === 'user').pop();

        addBackgroundJob({
          id: jobId,
          status: 'pending',
          userMessage: lastUserMsg?.content ?? '',
          chatId: options.chatId,
        });

        pollJob(jobId);
        toast.info('Background AI started — close the tab freely, we will keep working!', {
          duration: 5000,
        });

        return jobId;
      } catch (err) {
        toast.error('Failed to start background AI');
        return null;
      }
    },
    [pollJob],
  );

  // Clean up all poll timers on unmount
  useEffect(() => {
    const timers = pollTimers.current;
    return () => {
      Object.values(timers).forEach(clearInterval);
    };
  }, []);

  return { isBackgroundMode, sendBackgroundMessage, jobs };
}
