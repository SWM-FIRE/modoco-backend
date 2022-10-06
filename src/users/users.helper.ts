import * as uuid from 'uuid';

export const generateSignupVerifyToken = () => {
  return uuid.v1();
};
