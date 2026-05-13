import {
  HttpException,
  NotFoundException,
  ArgumentsHost,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let status: jest.Mock;
  let send: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    send = jest.fn();
    status = jest.fn().mockReturnValue({ send });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, send }),
        getRequest: () => ({ urls: '/test' }),
      }),
    };
  });

  test('shapes an HttpException response with success=false, status, message, timestamp', () => {
    filter.catch(new NotFoundException('User abc not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 404,
        message: 'User abc not found',
        timestamp: expect.any(String),
      }),
    );

    const body = send.mock.calls[0][0];
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });

  test('falls back to 500 + "Internal server error" for non-HttpException errors', () => {
    filter.catch(new Error('something went wrong'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });

  test('handles non-Error throws (e.g. a string) without crashing', () => {
    filter.catch('weird', host);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });

  test('extracts the message from HttpException response objects (e.g. ValidationPipe arrays)', () => {
    const ex = new HttpException(
      {
        message: ['name must be longer than or equal to 2 characters'],
        error: 'Bad Request',
      },
      400,
    );
    filter.catch(ex, host);

    const body = send.mock.calls[0][0];
    expect(status).toHaveBeenCalledWith(400);
    expect(body.message).toEqual([
      'name must be longer than or equal to 2 characters',
    ]);
  });
});
