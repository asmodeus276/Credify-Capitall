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

  it('POST /api/submit-lead should validate required fields', async () => {
    const res = await fetch(`${baseUrl}/api/submit-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  it('POST /api/submit-contact should validate required fields', async () => {
    const res = await fetch(`${baseUrl}/api/submit-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });
});
