import fp from 'fastify-plugin';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { valkey } from '../valkey.js';
import { env } from '../env.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

interface SocketHandshakeAuth {
  tenantId?: string;
  sessionId?: string;
}

const socketPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const pubClient = valkey.duplicate();
  const subClient = valkey.duplicate();

  // FIX: Because valkey uses lazyConnect: true, we MUST tell the duplicates to connect
  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  fastify.log.info('Valkey pub/sub clients ready for Socket.io adapter');

  const io = new Server(fastify.server, {
    adapter: createAdapter(pubClient, subClient),
    cors: {
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    pingInterval: 25_000,
    pingTimeout:  20_000,
    cookie: {
      name:     'io',
      httpOnly: true,
      sameSite: 'strict',
      secure:   env.NODE_ENV === 'production',
    },
    path: '/socket.io/',
  });

  fastify.decorate('io', io);

  io.use((socket: Socket, next) => {
    const { tenantId, sessionId } = socket.handshake.auth as SocketHandshakeAuth;

    if (!tenantId || typeof tenantId !== 'string') {
      return next(new Error('AUTH_MISSING_TENANT_ID'));
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return next(new Error('AUTH_MISSING_SESSION_ID'));
    }

    socket.data.tenantId  = tenantId;
    socket.data.sessionId = sessionId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const { tenantId, sessionId } = socket.data as {
      tenantId: string;
      sessionId: string;
    };

    const logger = fastify.log.child({
      tenant_id: tenantId,
      session_id: sessionId,
      socket_id:  socket.id,
    });

    logger.info('socket connected');

    const tenantRoom  = `tenant:${tenantId}`;
    const sessionRoom = `tenant:${tenantId}:session:${sessionId}`;

    socket.join(tenantRoom);
    socket.join(sessionRoom);

    socket.on('disconnect', (reason) => {
      logger.info({ reason }, 'socket disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err }, 'socket error');
    });
  });

  fastify.addHook('onClose', async () => {
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await Promise.all([pubClient.quit(), subClient.quit()]);
    fastify.log.info('socket.io and valkey pub/sub clients shut down cleanly');
  });
};

export const socketIoPlugin = fp(socketPlugin, {
  name:    'socket-io',
  fastify: '5.x',
});