import { io, Socket } from 'socket.io-client';
import { INestApplication } from '@nestjs/common';
import { RedisIoAdapter } from '@/common/redis-adapter/redis-io.adapter';
import { Test } from '@nestjs/testing';
import { RoomGateway } from '@/room/room.gateway';
import { TestRoomGateway } from '../../../test/mock/room-gateway.mock';

describe('Socket.IO Redis Test', () => {
  let server1: INestApplication;
  let server2: INestApplication;
  let client1: Socket;
  let client2: Socket;
  let redisAdapter1: RedisIoAdapter;
  let redisAdapter2: RedisIoAdapter;

  beforeAll(async () => {
    const moduleRef1 = await Test.createTestingModule({
      providers: [
        {
          provide: RoomGateway,
          useClass: TestRoomGateway,
        },
      ],
    }).compile();
    const moduleRef2 = await Test.createTestingModule({
      providers: [
        {
          provide: RoomGateway,
          useClass: TestRoomGateway,
        },
      ],
    }).compile();

    server1 = moduleRef1.createNestApplication();
    server2 = moduleRef2.createNestApplication();

    redisAdapter1 = new RedisIoAdapter(server1);
    redisAdapter2 = new RedisIoAdapter(server2);
    await redisAdapter1.connectToRedis();
    await redisAdapter2.connectToRedis();

    server1.useWebSocketAdapter(redisAdapter1);
    server2.useWebSocketAdapter(redisAdapter2);

    await Promise.all([server1.listen(3001), server2.listen(3002)]);

    client1 = io('http://localhost:3001/rooms', {
      autoConnect: false,
      reconnectionAttempts: 3,
      query: {
        roomId: 'room-1',
      },
    });

    client2 = io('http://localhost:3002/rooms', {
      autoConnect: false,
      reconnectionAttempts: 3,
      query: {
        roomId: 'room-1',
      },
    });

    await Promise.all([client1.connect(), client2.connect()]);
  });

  test('메시지가 모든 클라이언트에 전달되어야 함', (done) => {
    client2.on('broadcast', (data) => {
      expect(data.message).toBe('test message');
      done();
    });

    client1.emit('message', {
      roomId: 'room-1',
      message: 'test message',
    });
  });

  afterAll(async () => {
    // 소켓 클라이언트 정리
    client1.removeAllListeners();
    client2.removeAllListeners();
    client1.disconnect();
    client2.disconnect();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Redis 어댑터 정리
    await redisAdapter1.disconnectFromRedis();
    await redisAdapter2.disconnectFromRedis();

    // 서버 종료
    await server1.close();
    await server2.close();
  });
});
