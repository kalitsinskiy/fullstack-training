import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { method, url } = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => this.logger.log(`${method} ${url} - ${Date.now() - start}ms`)),
      catchError((err) => {
        this.logger.warn(`${method} ${url} — ${Date.now() - start}ms - ERROR`);
        return throwError(() => err);
      }),
    );
  }
}
