import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

describe('Security & Static Files Tests', () => {
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

  it('should set Content-Security-Policy headers with nonces', async () => {
    const res = await fetch(`${baseUrl}/`);
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp, 'CSP header should be present');
    assert.ok(csp.includes("'nonce-"), 'CSP should include script/style nonce');
  });

  it('should generate unique CSP nonces per request', async () => {
    const res1 = await fetch(`${baseUrl}/`);
    const res2 = await fetch(`${baseUrl}/`);
    const csp1 = res1.headers.get('content-security-policy');
    const csp2 = res2.headers.get('content-security-policy');
    
    const nonce1Match = csp1.match(/'nonce-([^']+)'/);
    const nonce2Match = csp2.match(/'nonce-([^']+)'/);
    
    assert.ok(nonce1Match, 'Nonce 1 should exist');
    assert.ok(nonce2Match, 'Nonce 2 should exist');
    assert.notStrictEqual(nonce1Match[1], nonce2Match[1], 'Nonces must be unique per request');
  });

  it('should serve CSS static assets', async () => {
    const res = await fetch(`${baseUrl}/css/style.css`);
    assert.strictEqual(res.status, 200);
  });

  it('should block public access to backend files (e.g. server.js)', async () => {
    const res = await fetch(`${baseUrl}/server.js`);
    assert.strictEqual(res.status, 404);
  });

  it('should block public access to package.json', async () => {
    const res = await fetch(`${baseUrl}/package.json`);
    assert.strictEqual(res.status, 404);
  });
});
