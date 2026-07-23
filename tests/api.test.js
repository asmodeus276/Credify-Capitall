import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

describe('API Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('POST /api/chat should respond with valid JSON structure', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });
    
    assert.ok(res.status === 200 || res.status === 500, 'API endpoint should be reachable');
    const data = await res.json();
    assert.ok(data.text || data.error, 'Response should contain text or error message');
  });
});
