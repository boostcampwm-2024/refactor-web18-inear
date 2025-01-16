import io from 'socket.io-client';

describe('Socket.IO Redis Test', () => {
  let client1, client2;

  beforeAll(async () => {
    client1 = io('http://localhost:3000/rooms', {
      autoConnect: false,
      reconnectionAttempts: 3,
      query: {
        roomId: 'room-1',
      },
    });

    client2 = io('http://localhost:3001/rooms', {
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

  afterAll(() => {
    client1.disconnect();
    client2.disconnect();
    client1.removeAllListeners();
    client2.removeAllListeners();
  });
});
