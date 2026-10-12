/**
 * AIWA v2 - SSE Event Stream
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function eventRoutes(app: FastifyInstance) {
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    await req.jwtVerify();
    const { tenantId } = req.user as any;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send keepalive every 30 seconds
    const keepalive = setInterval(() => {
      reply.raw.write(': keepalive\n\n');
    }, 30000);

    // Initial event
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', tenantId })}\n\n`);

    // TODO: Subscribe to Redis pub/sub for tenant-specific events
    // Events: new_message, import_progress, handoff_request, etc.

    req.raw.on('close', () => {
      clearInterval(keepalive);
    });
  });
}
