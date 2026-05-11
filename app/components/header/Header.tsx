import { Suspense } from 'react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { sidebarStore } from '~/lib/stores/sidebar';
import { planStore } from '~/lib/stores/plan';
import { cn } from '~/utils/cn';
import { PanelErrorBoundary } from '~/components/ui/PanelErrorBoundary';
import { clientLazy } from '~/utils/react';

const ChatDescription = clientLazy(() =>
  import('~/lib/persistence/ChatDescription.client').then((m) => ({ default: m.ChatDescription })),
);
const HeaderActionButtons = clientLazy(() =>
  import('./HeaderActionButtons.client').then((m) => ({ default: m.HeaderActionButtons })),
);

export function Header() {
  const chat = useStore(chatStore);
  const sidebarOpen = useStore(sidebarStore.open);
  const plan = useStore(planStore);

  return (
    <header
      className={cn('flex items-center px-5 border-b h-[var(--header-height)] flex-shrink-0 bg-transparent', {
        'border-transparent': !chat.started,
        'border-veyra-elements-borderColor': chat.started,
      })}
    >
      <PanelErrorBoundary panelName="header">
        <div className="flex items-center gap-3 z-logo text-veyra-elements-textPrimary cursor-pointer">
          {!sidebarOpen && (
            <button
              type="button"
              aria-label="Open sidebar"
              className="flex items-center justify-center bg-transparent border-none p-1 cursor-pointer"
              onClick={() => sidebarStore.toggle()}
            >
              <div className="i-ph:sidebar-simple text-xl text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary transition-colors" />
            </button>
          )}
          {!sidebarOpen && (
            <div className="flex items-center gap-2 select-none">
              <div className="veyra-logo-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4L10 16L17 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.5 4L10 10.5L13.5 4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-[15px] font-semibold text-white tracking-tight">Veyra</span>
                <span className="text-[10px] text-veyra-elements-textTertiary font-normal">AI App Builder</span>
              </div>
            </div>
          )}
        </div>
        {chat.started && (
          <>
            <span className="flex-1 px-4 truncate text-center text-veyra-elements-textSecondary text-sm flex items-center justify-center gap-2">
              <Suspense fallback={null}>
                <ChatDescription />
              </Suspense>
              {plan.isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-medium whitespace-nowrap">
                  <span className="i-ph:list-checks-fill text-xs" />
                  Plan
                </span>
              )}
            </span>
            <Suspense fallback={null}>
              <div className="">
                <HeaderActionButtons />
              </div>
            </Suspense>
          </>
        )}
      </PanelErrorBoundary>
    </header>
  );
}
