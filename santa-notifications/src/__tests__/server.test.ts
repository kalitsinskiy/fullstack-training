import { server } from '../server';

describe('santa-notification server in tests', () => {
  afterAll(async () => {
    await server.close();
  });

  test('/health is returing status: ok', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.json()).toEqual({ status: 'ok' });
  });

  test('the unknown should retur 404', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/non-existing-url',
    });

    expect(response.statusCode).toBe(404);
  });
});
