import { type LoaderFunctionArgs, useRouteError, isRouteErrorResponse } from 'react-router';
import { useEffect } from 'react';
import { default as IndexRoute } from './_index';

export async function loader(args: LoaderFunctionArgs) {
  return Response.json({ id: args.params.id });
}

export function ErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    console.error('[Veyra:ChatRouteError]', {
      timestamp: new Date().toISOString(),
      route: 'chat.$id',
      ...(isRouteErrorResponse(error)
        ? { status: error.status, statusText: error.statusText, data: error.data }
        : error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { raw: String(error) }),
    });
  }, [error]);

  const title = isRouteErrorResponse(error) ? `${error.status} — ${error.statusText}` : 'Chat Error';

  const message = isRouteErrorResponse(error)
    ? error.data || 'The requested chat could not be loaded.'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred while loading this chat.';

  return (
    <main className="flex flex-col items-center justify-center h-full w-full bg-veyra-elements-background-depth-1 text-veyra-elements-textPrimary px-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <div className="i-ph:chat-circle-dots text-3xl text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-veyra-elements-textSecondary mb-8">{message}</p>
        <div className="flex gap-3 justify-center">
          <a
            href="/"
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-veyra-elements-borderColor bg-transparent text-veyra-elements-textPrimary hover:bg-veyra-elements-background-depth-2 transition-colors duration-200"
          >
            New Chat
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-veyra-elements-button-primary-background text-veyra-elements-button-primary-text hover:bg-veyra-elements-button-primary-backgroundHover transition-colors duration-200"
          >
            Reload
          </button>
        </div>
        {error instanceof Error && error.stack && (
          <details className="mt-8 text-left w-full">
            <summary className="cursor-pointer text-xs text-veyra-elements-textTertiary hover:text-veyra-elements-textSecondary transition-colors">
              Error Details
            </summary>
            <div className="mt-3 p-4 bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor rounded-lg overflow-auto max-h-64">
              <p className="text-xs text-red-400 font-mono font-semibold mb-2">
                {error.name}: {error.message}
              </p>
              <pre className="text-xs text-veyra-elements-textTertiary font-mono whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
            </div>
          </details>
        )}
      </div>
    </main>
  );
}

export default IndexRoute;
