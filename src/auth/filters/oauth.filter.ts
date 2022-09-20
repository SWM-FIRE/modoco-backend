import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class OAuthFilter implements ExceptionFilter {
  private FE_URL: string = this.configService.get('FRONTEND_URL');
  constructor(private readonly configService: ConfigService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.redirect(
      `${this.FE_URL}/error?statusCode=${403}&message=Invalid%20Credentials`,
    );
  }
}
