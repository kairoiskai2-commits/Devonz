import { useState, lazy, Suspense } from 'react';
import { useStore } from '@nanostores/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion } from 'framer-motion';
import { profileStore } from '~/lib/stores/profile';
import { cn } from '~/utils/cn';
import type { TabType } from '~/components/@settings/core/types';
import { authClient } from '~/lib/auth-client';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const ControlPanel = lazy(() =>
  import('~/components/@settings/core/ControlPanel').then((m) => ({ default: m.ControlPanel })),
);

export function HeaderAvatar() {
  const profile = useStore(profileStore);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<TabType | undefined>(undefined);
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleOpenSettings = (tab?: TabType) => {
    setInitialTab(tab);
    setIsSettingsOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success('Signed out');
      navigate('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const authUser = session?.user;

  const displayName = authUser?.name || profile?.username || 'Guest User';
  const displayEmail = authUser?.email;
  const avatarSrc = authUser?.image || profile?.avatar;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <motion.button
            className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center focus:outline-none"
            aria-label="Profile menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-full h-full rounded-full object-cover ring-2 ring-veyra-elements-borderColor"
                loading="eager"
                decoding="sync"
              />
            ) : authUser ? (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-accent-500/20 text-accent-300 ring-2 ring-accent-500/40 text-xs font-semibold">
                {initials}
              </div>
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-veyra-elements-background-depth-3 text-veyra-elements-textSecondary ring-2 ring-veyra-elements-borderColor">
                <div className="i-ph:user w-4 h-4" />
              </div>
            )}
          </motion.button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={cn(
              'min-w-[200px] z-[9999]',
              'bg-veyra-elements-background-depth-2',
              'rounded-lg shadow-lg',
              'border border-veyra-elements-borderColor',
              'animate-in fade-in-0 zoom-in-95',
              'py-1',
            )}
            sideOffset={5}
            align="end"
          >
            {/* User info */}
            <div className="px-3 py-2.5 border-b border-veyra-elements-borderColor">
              <p className="text-sm font-medium text-veyra-elements-textPrimary truncate">
                {displayName}
              </p>
              {displayEmail && (
                <p className="text-xs text-veyra-elements-textTertiary truncate mt-0.5">
                  {displayEmail}
                </p>
              )}
              {!authUser && (
                <p className="text-xs text-veyra-elements-textTertiary mt-0.5">Not signed in</p>
              )}
            </div>

            {/* Sign in / sign up (when not logged in) */}
            {!authUser && (
              <>
                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2',
                    'text-sm text-veyra-elements-textPrimary',
                    'hover:bg-veyra-elements-item-backgroundActive',
                    'cursor-pointer transition-colors outline-none',
                  )}
                  onClick={() => navigate('/login')}
                >
                  <div className="i-ph:sign-in w-4 h-4 text-veyra-elements-textSecondary" />
                  Sign in
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2',
                    'text-sm text-veyra-elements-textPrimary',
                    'hover:bg-veyra-elements-item-backgroundActive',
                    'cursor-pointer transition-colors outline-none',
                  )}
                  onClick={() => navigate('/signup')}
                >
                  <div className="i-ph:user-plus w-4 h-4 text-veyra-elements-textSecondary" />
                  Create account
                </DropdownMenu.Item>
                <div className="my-1 border-t border-veyra-elements-borderColor" />
              </>
            )}

            {/* Settings */}
            <DropdownMenu.Item
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                'text-sm text-veyra-elements-textPrimary',
                'hover:bg-veyra-elements-item-backgroundActive',
                'cursor-pointer transition-colors outline-none',
              )}
              onClick={() => handleOpenSettings('profile')}
            >
              <div className="i-ph:user-circle w-4 h-4 text-veyra-elements-textSecondary" />
              Edit Profile
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                'text-sm text-veyra-elements-textPrimary',
                'hover:bg-veyra-elements-item-backgroundActive',
                'cursor-pointer transition-colors outline-none',
              )}
              onClick={() => handleOpenSettings()}
            >
              <div className="i-ph:gear-six w-4 h-4 text-veyra-elements-textSecondary" />
              Settings
            </DropdownMenu.Item>

            <div className="my-1 border-t border-veyra-elements-borderColor" />

            <DropdownMenu.Item
              className={cn(
                'flex items-center gap-2 px-3 py-2',
                'text-sm text-veyra-elements-textPrimary',
                'hover:bg-veyra-elements-item-backgroundActive',
                'cursor-pointer transition-colors outline-none',
              )}
              onClick={() =>
                window.open(
                  'https://github.com/zebbern/Veyra/issues/new?template=bug_report.yml',
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              <div className="i-ph:bug w-4 h-4 text-veyra-elements-textSecondary" />
              Report Bug
            </DropdownMenu.Item>

            {/* Sign out (only when logged in) */}
            {authUser && (
              <>
                <div className="my-1 border-t border-veyra-elements-borderColor" />
                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2',
                    'text-sm text-red-400',
                    'hover:bg-red-500/10',
                    'cursor-pointer transition-colors outline-none',
                  )}
                  onClick={handleSignOut}
                >
                  <div className="i-ph:sign-out w-4 h-4" />
                  Sign out
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {isSettingsOpen && (
        <Suspense>
          <ControlPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} initialTab={initialTab} />
        </Suspense>
      )}
    </>
  );
}
