import { Injectable, Logger } from '@nestjs/common';
import { CreateRoomDTO } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import { RoomsDatabaseHelper } from './helper/rooms-database.helper';
import { isNotFoundError } from '../common/util/prisma-error.util';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsDatabaseHelper: RoomsDatabaseHelper,
  ) {}

  private logger = new Logger('RoomsService');

  /**
   * Create a room and return the room object
   * @param {User} user
   * @param {CreateRoomDTO} dto create room dto
   * @returns {Promise<CreateRoomDTO>}
   */
  createRoom(user: User, dto: CreateRoomDTO) {
    return this.roomsDatabaseHelper.createRoom(
      user.uid,
      dto.title,
      dto.details,
      dto.tags,
      dto.total,
      dto.theme,
    );
  }

  /**
   * return all rooms
   * @returns {Promise<GetRoomDTO[]>}
   */
  findAllRooms() {
    return this.roomsDatabaseHelper.findAllRooms();
  }

  /**
   * find one room and return room object
   * @param {number} roomId roomId(=itemId in DB)
   * @returns {Promise<GetRoomDTO>}
   */
  findRoomById(roomId: number) {
    return this.roomsDatabaseHelper.findRoomById(roomId);
  }

  /**
   * delete one room
   * @param {user} user moderator uid
   * @param {number} roomId roomId(=itemId in DB)
   */
  async deleteRoomById(user: User, roomId: number) {
    try {
      // check if user is moderator :TODO

      await this.roomsDatabaseHelper.deleteRoomById(roomId);
    } catch (error) {
      if (isNotFoundError(error)) {
        this.logger.debug('[Delete] Room not found');
      }
    }
  }
}
