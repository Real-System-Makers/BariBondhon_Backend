import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';

export const GetCurrentUser = createParamDecorator(
  <T extends keyof User>(
    data: T | undefined,
    context: ExecutionContext,
  ): User | User[T] => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();
    const user = request.user;

    if (!data) {
      return user;
    }

    return user[data];
  },
);
