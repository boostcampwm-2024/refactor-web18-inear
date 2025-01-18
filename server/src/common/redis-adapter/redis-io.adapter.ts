import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private pubClient: ReturnType<typeof createClient>;
  private subClient: ReturnType<typeof createClient>;

  async connectToRedis(): Promise<void> {
    this.pubClient = createClient({ url: 'redis://localhost:6379' });
    this.subClient = this.pubClient.duplicate();

    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
  }

  // main.ts에서 redis 어댑터 생성시 호출됨
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }

  async disconnectFromRedis(): Promise<void> {
    await Promise.all([
      this.pubClient?.disconnect(),
      this.subClient?.disconnect(),
    ]);
  }
}
