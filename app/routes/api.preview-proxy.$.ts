import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';

async function proxyToPort(request: Request, params: Record<string, string | undefined>): Promise<Response> {
  const splat = params['*'] ?? '';
  const slashIdx = splat.indexOf('/');
  const portStr = slashIdx === -1 ? splat : splat.slice(0, slashIdx);
  const restPath = slashIdx === -1 ? '' : splat.slice(slashIdx);

  const port = parseInt(portStr, 10);

  if (!port || port < 1 || port > 65535) {
    return new Response('Invalid port', { status: 400 });
  }

  const originalUrl = new URL(request.url);
  const targetUrl = `http://localhost:${port}${restPath || '/'}${originalUrl.search}`;

  const proxyHeaders = new Headers();

  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();

    if (lower === 'host' || lower === 'connection' || lower === 'upgrade') {
      continue;
    }

    proxyHeaders.set(key, value);
  }

  proxyHeaders.set('host', `localhost:${port}`);

  let body: BodyInit | null = null;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers();

    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase();

      if (lower === 'transfer-encoding' || lower === 'connection') {
        continue;
      }

      responseHeaders.set(key, value);
    }

    responseHeaders.set('access-control-allow-origin', '*');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:2rem;background:#0f1219;color:#94a3b8;">
        <h2 style="color:#f87171">Preview not ready</h2>
        <p>The app on port <strong style="color:#60a5fa">${port}</strong> is not responding yet.</p>
        <p style="font-size:0.875rem">Start the dev server in the terminal and the preview will reload automatically.</p>
        <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;background:#3b82f6;color:#fff;border:none;border-radius:0.5rem;cursor:pointer">Retry</button>
      </body></html>`,
      { status: 502, headers: { 'content-type': 'text/html' } },
    );
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  return proxyToPort(request, params);
}

export async function action({ request, params }: ActionFunctionArgs) {
  return proxyToPort(request, params);
}
