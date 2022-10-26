export interface MessageStore {
  saveMessage(message);
  findMessagesForUser(userID);
}
