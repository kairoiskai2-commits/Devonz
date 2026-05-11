import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { redirect, useLoaderData } from 'react-router';
import { auth } from '~/lib/.server/auth';
import { db } from '~/lib/.server/db';
import { user, session, account } from '~/lib/.server/db/schema';
import { desc, count, sql } from 'drizzle-orm';

const ADMIN_EMAIL = 'karasmina2511@gmail.com';

export const meta: MetaFunction = () => [{ title: 'Admin Dashboard — Veyra' }];

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionData = await auth.api.getSession({ headers: request.headers });

  if (!sessionData?.user) {
    throw redirect('/login');
  }

  if (sessionData.user.email !== ADMIN_EMAIL) {
    throw redirect('/');
  }

  const [totalUsers] = await db.select({ count: count() }).from(user);
  const [totalSessions] = await db.select({ count: count() }).from(session);
  const [totalAccounts] = await db.select({ count: count() }).from(account);

  const oauthCount = await db
    .select({ count: count() })
    .from(account)
    .where(sql`${account.providerId} != 'credential'`);

  const recentUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(20);

  return {
    adminUser: sessionData.user,
    stats: {
      totalUsers: totalUsers.count,
      totalSessions: totalSessions.count,
      totalAccounts: totalAccounts.count,
      oauthUsers: oauthCount[0]?.count ?? 0,
    },
    recentUsers,
  };
}

export default function AdminDashboard() {
  const { adminUser, stats, recentUsers } = useLoaderData<typeof loader>();

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: 'i-ph:users-three-fill', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Active Sessions', value: stats.totalSessions, icon: 'i-ph:clock-fill', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'OAuth Users', value: stats.oauthUsers, icon: 'i-ph:shield-check-fill', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Linked Accounts', value: stats.totalAccounts, icon: 'i-ph:link-fill', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <div className="min-h-screen bg-veyra-elements-background-depth-1 text-veyra-elements-textPrimary">
      {/* Header */}
      <div className="border-b border-veyra-elements-borderColor bg-veyra-elements-background-depth-2">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
              <div className="i-ph:shield-star-fill text-accent-400 text-sm" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Admin Dashboard</h1>
              <p className="text-xs text-veyra-elements-textTertiary">Veyra Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-veyra-elements-textPrimary">{adminUser.name}</p>
              <p className="text-xs text-veyra-elements-textTertiary">{adminUser.email}</p>
            </div>
            {adminUser.image ? (
              <img src={adminUser.image} alt={adminUser.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-accent-500/30" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-300 text-xs font-semibold ring-2 ring-accent-500/30">
                {adminUser.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <a
              href="/"
              className="ml-2 px-3 py-1.5 text-xs bg-veyra-elements-background-depth-3 border border-veyra-elements-borderColor rounded-lg hover:border-accent-500/40 transition-all text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary"
            >
              ← Back to app
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div>
          <h2 className="text-sm font-medium text-veyra-elements-textSecondary mb-4 uppercase tracking-wide">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className={`p-5 rounded-xl border ${card.bg} flex flex-col gap-3`}>
                <div className={`${card.icon} ${card.color} text-2xl`} />
                <div>
                  <p className="text-2xl font-bold text-veyra-elements-textPrimary">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-veyra-elements-textSecondary mt-0.5">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div>
          <h2 className="text-sm font-medium text-veyra-elements-textSecondary mb-4 uppercase tracking-wide">
            Recent Users ({recentUsers.length})
          </h2>
          <div className="bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-veyra-elements-borderColor bg-veyra-elements-background-depth-3">
                  <th className="text-left px-5 py-3 text-xs font-medium text-veyra-elements-textTertiary uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-veyra-elements-textTertiary uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-veyra-elements-textTertiary uppercase tracking-wide">Verified</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-veyra-elements-textTertiary uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-veyra-elements-textTertiary">
                      No users yet
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-veyra-elements-borderColor last:border-0 hover:bg-veyra-elements-background-depth-3 transition-colors ${i % 2 === 0 ? '' : 'bg-veyra-elements-background-depth-1/50'}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.image ? (
                            <img src={u.image} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-veyra-elements-background-depth-4 border border-veyra-elements-borderColor flex items-center justify-center text-xs font-semibold text-veyra-elements-textSecondary">
                              {u.name?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                          )}
                          <span className="text-sm font-medium text-veyra-elements-textPrimary">{u.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-veyra-elements-textSecondary">{u.email}</td>
                      <td className="px-5 py-3.5">
                        {u.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                            <div className="i-ph:check-circle-fill text-xs" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                            <div className="i-ph:warning-fill text-xs" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-veyra-elements-textTertiary">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-medium text-veyra-elements-textSecondary mb-4 uppercase tracking-wide">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'View App', href: '/', icon: 'i-ph:house-fill', desc: 'Go to main application' },
              { label: 'Sign In Page', href: '/login', icon: 'i-ph:sign-in-fill', desc: 'Preview login flow' },
              { label: 'Sign Up Page', href: '/signup', icon: 'i-ph:user-plus-fill', desc: 'Preview signup flow' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="p-4 rounded-xl bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor hover:border-accent-500/40 hover:bg-veyra-elements-background-depth-3 transition-all group"
              >
                <div className={`${action.icon} text-xl text-veyra-elements-textSecondary group-hover:text-accent-400 transition-colors mb-2`} />
                <p className="text-sm font-medium text-veyra-elements-textPrimary">{action.label}</p>
                <p className="text-xs text-veyra-elements-textTertiary mt-0.5">{action.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
