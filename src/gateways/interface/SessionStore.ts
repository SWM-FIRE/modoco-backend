export interface SessionStore {
  findSession(id);
  saveSession(id, session);
}
