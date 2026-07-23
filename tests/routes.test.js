import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

describe('Route Tests', () => {
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

  it('GET / should return 200 OK and render HTML', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<html'), 'Response should contain HTML');
  });

  it('GET /car-loan should return 200 OK', async () => {
    const res = await fetch(`${baseUrl}/car-loan`);
    assert.strictEqual(res.status, 200);
  });

  it('GET legacy redirect URL should redirect (301)', async () => {
    const res = await fetch(`${baseUrl}/working-capital-business-loan.html`, { redirect: 'manual' });
    assert.strictEqual(res.status, 301);
    assert.strictEqual(res.headers.get('location'), '/business-loan-for-working-capital.html');
  });

  it('GET /non-existent-page-12345 should return 404', async () => {
    const res = await fetch(`${baseUrl}/non-existent-page-12345`);
    assert.strictEqual(res.status, 404);
    const text = await res.text();
    assert.ok(text.includes('Page Not Found') || text.includes('404'), 'Response should contain 404 text');
  });
});
