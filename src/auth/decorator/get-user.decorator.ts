import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request: Express.Request = ctx
      .switchToHttp()
      .getRequest();
    // Return particular field from user if passed in
    if (data) return request.user[data];
    // Otherwise, return the entire user object
    return request.user;
  },
);
