import { Injectable } from '@nestjs/common';
import { RoomsDatabaseHelper } from '../../rooms/helper/rooms-database.helper';

@Injectable()
export class RoomGatewayHelper {
  constructor(private readonly roomsDatabaseHelper: RoomsDatabaseHelper) {}

  updateRoomInformationByDelta = (
    roomId: string,
    current: number,
    delta: number,
  ) => {
    return this.roomsDatabaseHelper.updateRoomInfoByDelta(
      parseInt(roomId, 10),
      current,
      delta,
    );
  };
}
