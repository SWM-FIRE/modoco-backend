type FriendshipResult = {
  status: 'PENDING' | 'ACCEPTED' | 'YOU';
  friendship_friendFromTousers: {
    uid: number;
    nickname: string;
    email: string;
    avatar: number;
  };
  friendship_friendToTousers: {
    uid: number;
    nickname: string;
    email: string;
    avatar: number;
  };
};

type FriendshipDTO = {
  status: string;
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
