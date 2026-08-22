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

  it('POST /api/admin/login should validate admin credentials', async () => {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amitkumartrp321@gmail.com', password: 'Admin@123' })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
  });

  it('GET /api/admin/leads should return list of leads', async () => {
    const res = await fetch(`${baseUrl}/api/admin/leads`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.leads));
  });

  it('POST /api/admin/update-lead should update bank assignment', async () => {
    const res = await fetch(`${baseUrl}/api/admin/update-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'CC-APP-8104',
        assignedBank: 'Kotak Mahindra Bank',
        status: 'Forwarded to Bank',
        notes: 'Assigned to Kotak SME Desk'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.lead.assignedBank, 'Kotak Mahindra Bank');
  });
});
