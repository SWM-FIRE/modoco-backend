import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Get user from request
 * will be user from prisma which is done by auth guard validate method
 * @usage use it as decorator @GetUser()
 * @Get('me')
 * getMe(@GetUser('') user){
 *  service.getMe(user);
 * }
 */
export const GetUserDecorator = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request: Express.Request = ctx.switchToHttp().getRequest();
    console.log({ user: request.user });
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
