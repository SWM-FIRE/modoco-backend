import { ROLE } from '../constants/role.enum';
import { STATUS } from '../constants/status.enum';
import { TYPES } from '../constants/types.enum';

export type FriendshipResult = {
  status: FriendshipStatus;
  friendship_friendFromTousers?: {
    uid: number;
    nickname: string;
    email: string;
    avatar: number;
  };
  friendship_friendToTousers?: {
    uid: number;
    nickname: string;
    email: string;
    avatar: number;
  };
};

export type FriendshipDTO = {
  status: STATUS;
  role?: ROLE;
  sender?: {
    uid: number;
    nickname: string;
    email: string;
    avatar: number;
  };
  receiver?: {
    uid: number;
    nickname: string;
    email: string;
    avatar: number;
  };
};

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'YOU';

export type FriendshipQueryParams = {
  status?: FriendshipStatus;
  type?: TYPES;
  friend?: number;
};
