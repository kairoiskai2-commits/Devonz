import * as Sentry from '@sentry/react';
import { useStore } from '@nanostores/react';
import type { LinksFunction } from 'react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError, isRouteErrorResponse } from 'react-router';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { useSentryUser } from './hooks/useSentryUser';
import { Toaster } from 'sonner';

import globalStyles from './styles/index.scss?url';
import liquidMetalStyles from './styles/liquid-metal.css?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

const DndWrapper = lazy(async () => {
  if (typeof window === 'undefined') {
    return { default: ({ children }: { children: ReactNode }) => <>{children}</> };
  }

  return import('./components/DndWrapper.client');
});

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  {
    rel: 'apple-touch-icon',
    href: '/apple-touch-icon.png',
  },
  {
    rel: 'manifest',
    href: '/manifest.json',
  },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: liquidMetalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://cdn.simpleicons.org',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://api.github.com',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://api.netlify.com',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://gitlab.com',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://vercel.com',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('veyra_theme');

    if (!theme) {
      theme = 'dark';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
  }
`;

const criticalCSS = `
  :root, :root[data-theme=dark] {
    --veyra-elements-borderColor: rgba(255,255,255,0.08);
    --veyra-elements-borderColorActive: #7c3aed;
    --veyra-elements-bg-depth-1: #09090b;
    --veyra-elements-bg-depth-2: #0f0f12;
    --veyra-elements-bg-depth-3: #161620;
    --veyra-elements-bg-depth-4: rgba(255,255,255,0.03);
    --veyra-elements-textPrimary: #f1f5f9;
    --veyra-elements-textSecondary: #94a3b8;
    --veyra-elements-textTertiary: #64748b;
    --veyra-elements-prompt-background: rgba(15,15,18,0.88);
    --veyra-chat-bg: rgba(15,15,20,0.7);
    --veyra-chat-border: rgba(255,255,255,0.08);
    --veyra-chat-shadow: rgba(0,0,0,0.4);
    --header-height: 62px;
    --chat-max-width: 42rem;
    --chat-min-width: min(533px,100vw);
  }
  :root[data-theme=light] {
    --veyra-elements-borderColor: #131a241a;
    --veyra-elements-borderColorActive: #7c3aed;
    --veyra-elements-bg-depth-1: #fafafa;
    --veyra-elements-bg-depth-2: #f0f4f8;
    --veyra-elements-bg-depth-3: #bcccdc;
    --veyra-elements-bg-depth-4: #131a240d;
    --veyra-elements-textPrimary: #0d1117;
    --veyra-elements-textSecondary: #486581;
    --veyra-elements-textTertiary: #627d98;
    --veyra-elements-prompt-background: #FFFFFFcc;
    --veyra-chat-bg: linear-gradient(145deg,rgba(200,215,235,0.3),rgba(245,245,245,0.95));
    --header-height: 62px;
    --chat-max-width: 42rem;
    --chat-min-width: min(533px,100vw);
  }
  html, body {
    height: 100%;
    min-height: 100dvh;
    width: 100%;
    overflow: hidden;
    background-color: var(--veyra-elements-bg-depth-1);
    color: var(--veyra-elements-textPrimary);
  }
  html[data-theme=dark] { color-scheme: dark; }
  html[data-theme=light] { color-scheme: light; }

  @keyframes veyra-blob-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.65; transform: scale(1.06); }
  }
  @keyframes veyra-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .veyra-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    animation: veyra-blob-pulse 5s ease-in-out infinite;
  }
  .veyra-blob-purple {
    top: -120px; left: -90px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%);
    animation-delay: 0s;
  }
  .veyra-blob-blue {
    bottom: -50px; right: -70px;
    width: 460px; height: 460px;
    background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%);
    animation-delay: 1.5s;
  }
  .veyra-blob-pink {
    top: 40%; left: 30%;
    width: 340px; height: 340px;
    background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%);
    animation-delay: 3s;
  }
  .veyra-dot-grid {
    position: absolute;
    inset: 0;
    opacity: 0.03;
    background-image: radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }
  .veyra-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 22px;
    animation: veyra-fade-up 0.45s ease forwards;
    cursor: default;
    white-space: nowrap;
  }
  .veyra-hero-title {
    font-size: clamp(32px, 5.5vw, 68px);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.06;
    color: #ffffff;
    margin-bottom: 18px;
    animation: veyra-fade-up 0.45s ease forwards 0.08s;
  }
  .veyra-gradient-text {
    background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #f472b6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .veyra-hero-sub {
    color: rgba(255,255,255,0.42);
    font-size: 16px;
    line-height: 1.85;
    max-width: 560px;
    margin: 0 auto 10px;
    animation: veyra-fade-up 0.45s ease forwards 0.16s;
  }
  .veyra-logo-icon {
    width: 32px; height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, #7c3aed, #3b82f6, #ec4899);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(124,58,237,0.4);
    flex-shrink: 0;
  }
`;

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useSentryUser();

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <meta name="theme-color" content="#0a0a0a" />
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
      </head>
      <body>
        <noscript>
          <p style={{ padding: '2rem', color: '#fff', background: '#0a0a0a', textAlign: 'center' }}>
            JavaScript is required to use Veyra.
          </p>
        </noscript>
        <div id="root" className="w-full h-full">
          <Suspense fallback={<>{children}</>}>
            <DndWrapper>{children}</DndWrapper>
          </Suspense>
          <Toaster position="bottom-right" theme="dark" richColors closeButton duration={3000} />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { logStore } from './lib/stores/logs';

export function SentryErrorBoundary() {
  const error = useRouteError();
  Sentry.captureException(error);

  useEffect(() => {
    console.error('[Veyra:RouteError]', {
      type: isRouteErrorResponse(error) ? 'route-response' : 'exception',
      timestamp: new Date().toISOString(),
      ...(isRouteErrorResponse(error)
        ? { status: error.status, statusText: error.statusText, data: error.data }
        : error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { raw: String(error) }),
    });
  }, [error]);

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-veyra-elements-background-depth-1 text-veyra-elements-textPrimary px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <div className="i-ph:warning-circle-duotone text-3xl text-red-400" />
          </div>
          <h1 className="text-5xl font-bold mb-2 text-red-400">{error.status}</h1>
          <h2 className="text-xl font-semibold mb-3 text-veyra-elements-textPrimary">{error.statusText}</h2>
          <p className="text-sm text-veyra-elements-textSecondary mb-8">{error.data}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-5 py-2.5 rounded-lg text-sm font-medium border border-veyra-elements-borderColor bg-transparent text-veyra-elements-textPrimary hover:bg-veyra-elements-background-depth-2 transition-colors duration-200"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-veyra-elements-button-primary-background text-veyra-elements-button-primary-text hover:bg-veyra-elements-button-primary-backgroundHover transition-colors duration-200"
            >
              Reload Page
            </button>
          </div>
          {!import.meta.env.PROD && (
            <details className="mt-8 text-left w-full">
              <summary className="cursor-pointer text-xs text-veyra-elements-textTertiary hover:text-veyra-elements-textSecondary transition-colors">
                Response Details
              </summary>
              <div className="mt-3 p-4 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg overflow-auto">
                <pre className="text-xs text-veyra-elements-textSecondary font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify({ status: error.status, statusText: error.statusText, data: error.data }, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  const errorName = error instanceof Error ? error.name : 'Error';
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-veyra-elements-background-depth-1 text-veyra-elements-textPrimary px-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <div className="i-ph:warning-circle-duotone text-3xl text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Unexpected Error</h1>
        <p className="text-sm text-veyra-elements-textSecondary mb-2">
          {import.meta.env.PROD ? 'An unexpected error occurred.' : errorMessage}
        </p>
        <p className="text-xs text-veyra-elements-textTertiary mb-8">
          {import.meta.env.PROD
            ? 'Please try again or reload the page.'
            : 'Something went wrong while rendering this page. Check the details below for debugging info.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-veyra-elements-borderColor bg-transparent text-veyra-elements-textPrimary hover:bg-veyra-elements-background-depth-2 transition-colors duration-200"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-veyra-elements-button-primary-background text-veyra-elements-button-primary-text hover:bg-veyra-elements-button-primary-backgroundHover transition-colors duration-200"
          >
            Reload Page
          </button>
        </div>
        {!import.meta.env.PROD && (
          <details className="mt-8 text-left w-full" open>
            <summary className="cursor-pointer text-xs text-veyra-elements-textTertiary hover:text-veyra-elements-textSecondary transition-colors">
              Error Details
            </summary>
            <div className="mt-3 p-4 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg overflow-auto max-h-80">
              <p className="text-xs text-red-400 font-mono font-semibold mb-2">
                {errorName}: {errorMessage}
              </p>
              {errorStack && (
                <pre className="text-xs text-veyra-elements-textTertiary font-mono whitespace-pre-wrap break-words">
                  {errorStack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export { SentryErrorBoundary as ErrorBoundary };

function App() {
  const theme = useStore(themeStore);

  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => window.removeEventListener('unhandledrejection', onUnhandledRejection);
  }, []);

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Initialize debug logging with improved error handling
    import('./utils/debugLogger')
      .then(({ debugLogger }) => {
        /*
         * The debug logger initializes itself and starts disabled by default
         * It will only start capturing when enableDebugMode() is called
         */
        const status = debugLogger.getStatus();
        logStore.logSystem('Debug logging ready', {
          initialized: status.initialized,
          capturing: status.capturing,
          enabled: status.enabled,
        });
      })
      .catch((error) => {
        logStore.logError('Failed to initialize debug logging', error);
      });
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-500 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>
      <Sentry.ErrorBoundary
        showDialog={false}
        onError={(error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          console.error('[Veyra:AppError]', {
            timestamp: new Date().toISOString(),
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
        }}
        fallback={({ error, resetError }) => (
          <div className="flex flex-col items-center justify-center min-h-screen bg-veyra-elements-background-depth-1 text-center px-6">
            <div className="max-w-lg w-full">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <div className="i-ph:warning-circle-duotone text-3xl text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-veyra-elements-textPrimary mb-2">Application Error</h3>
              <p className="text-sm text-veyra-elements-textSecondary mb-6">
                An unexpected error occurred in the application. You can try again or reload the page.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetError}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-veyra-elements-button-primary-background text-veyra-elements-button-primary-text hover:bg-veyra-elements-button-primary-backgroundHover transition-colors duration-200"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border border-veyra-elements-borderColor bg-transparent text-veyra-elements-textPrimary hover:bg-veyra-elements-background-depth-2 transition-colors duration-200"
                >
                  Reload Page
                </button>
              </div>
              {!import.meta.env.PROD && error instanceof Error && (
                <details className="mt-8 w-full text-left" open>
                  <summary className="cursor-pointer text-xs text-veyra-elements-textTertiary hover:text-veyra-elements-textSecondary transition-colors">
                    Error Details
                  </summary>
                  <div className="mt-3 p-4 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg overflow-auto max-h-80">
                    <p className="text-xs text-red-400 font-mono font-semibold mb-2">
                      {error.name}: {error.message}
                    </p>
                    {error.stack && (
                      <pre className="text-xs text-veyra-elements-textTertiary font-mono whitespace-pre-wrap break-words">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}
      >
        <Outlet />
      </Sentry.ErrorBoundary>
    </>
  );
}

export default App;
