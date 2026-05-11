import { eq } from 'drizzle-orm';
import type { LoaderFunctionArgs } from 'react-router';
import { db, schema } from '~/lib/.server/db';
import { auth } from '~/lib/.server/auth';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const jobId = params.id;

  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Missing job ID' }), { status: 400 });
  }

  const sessionData = await auth.api.getSession({ headers: request.headers });

  if (!sessionData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const job = await db
    .select()
    .from(schema.bgChatJobs)
    .where(eq(schema.bgChatJobs.id, jobId))
    .get();

  if (!job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
  }

  if (job.userId !== sessionData.user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
