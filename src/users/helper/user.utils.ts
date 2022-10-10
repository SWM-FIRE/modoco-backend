import { v1 } from 'uuid';

export const generateSignupVerifyToken = () => {
  return v1();
};
