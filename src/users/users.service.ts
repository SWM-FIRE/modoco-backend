import { Injectable } from '@nestjs/common';
import { User } from './dto';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  create(user: User): User {
    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.users;
  }

  update(user: User) {
    const index = this.users.findIndex((u) => u.uid === user.uid);
    this.users[index] = user;
  }

  delete(uid: string) {
    console.log(`Deleting user with uid: ${uid}`);
    const index = this.users.findIndex((u) => u.uid === uid);
    if (index !== -1) {
      this.users.splice(index, 1);
    } else {
      //throw new Error('User not found');
      console.log('User not found');
    }
  }
}
