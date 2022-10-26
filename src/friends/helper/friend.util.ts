import { ForbiddenException } from '@nestjs/common';
import { UsersDatabaseHelper } from 'src/users/helper/users-database.helper';

export const validateAddFriendParams = async (
  userUid,
  friendUid,
  usersDatabaseHelper: UsersDatabaseHelper,
) => {
  if (userUid === friendUid) {
    throw new ForbiddenException('Invalid friendship creation request');
  }

  // friend 존재 여부 체크
  const isFriendExists = await usersDatabaseHelper.checkUserExistsByUid(
    friendUid,
  );
  if (!isFriendExists) {
    throw new ForbiddenException('Friend does not exist');
  }
};
