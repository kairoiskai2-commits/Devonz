import { Link } from 'react-router';
import { authClient } from '~/lib/auth-client';
import { HeaderAvatar } from './HeaderAvatar.client';

export function HeaderAuthButtons() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-veyra-elements-background-depth-3 animate-pulse" />
      </div>
    );
  }

  if (session?.user) {
    return <HeaderAvatar />;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="px-3.5 py-1.5 text-sm text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary border border-veyra-elements-borderColor hover:border-veyra-elements-borderColorActive rounded-lg transition-all"
      >
        Sign in
      </Link>
      <Link
        to="/signup"
        className="px-3.5 py-1.5 text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-all"
      >
        Get started
      </Link>
    </div>
  );
}
