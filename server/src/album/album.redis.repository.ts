import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '@/common/redis/redis.module';
import { RedisClientType } from 'redis';

@Injectable()
export class AlbumRedisRepository {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  private roomKey(roomId: string): string {
    return `rooms:${roomId}`;
  }

  async getCurrentUsers(roomId: string): Promise<number> {
    const roomKey = this.roomKey(roomId);
    const currentUsers = await this.redisClient.hGet(roomKey, 'currentUsers');
    return parseInt(currentUsers || '0', 10);
  }

  async getCurrentUsersAll(roomIds: string[]): Promise<number[]> {
    if (roomIds.length === 1) {
      const count = await this.getCurrentUsers(roomIds[0]);
      return [count];
    }

    const pipeline = this.redisClient.multi();
    roomIds.forEach((roomId) => {
      const roomKey = this.roomKey(roomId);
      pipeline.hGet(roomKey, 'currentUsers');
    });
    const results = await pipeline.exec();
    return results.map((result) => (result ? parseInt(String(result), 10) : 0));
  }
}
