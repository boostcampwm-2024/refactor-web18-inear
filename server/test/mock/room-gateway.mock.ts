import { UseFilters } from '@nestjs/common';
import { CustomWsExceptionFilter } from '@/common/exceptions/ws-exception.filter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UseFilters(CustomWsExceptionFilter)
@WebSocketGateway({
  namespace: 'rooms',
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
})
export class TestRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {}

  async handleConnection(client: Socket) {
    const roomId = client.handshake.query.roomId as string;
    await client.join(roomId);
  }

  async handleDisconnect(client: Socket) {
    const roomId = client.handshake.query.roomId as string;
    await client.leave(roomId);
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; message: string },
  ) {
    this.server.to(data.roomId).emit('broadcast', {
      message: data.message,
      userName: client.data.name,
      userId: 'testName',
    });
  }
}
