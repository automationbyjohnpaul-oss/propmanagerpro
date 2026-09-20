/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS permits isolated compiled-module reloads. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const compiled = process.env.PAYMENT_TEST_BUILD;
const recovery = require(path.join(compiled, 'lib/paymentRecovery.js'));
const auth = require(path.join(compiled, 'lib/auth.js'));
const { ApiError } = require(path.join(compiled, 'services/api.js'));
const payload = { amount: 100.25, method: 'cash', status: 'pending', leaseId: 'lease-a', tenantId: 'tenant-a' };
const name = (owner, key) => `propmanager_payment_attempt:v1:${encodeURIComponent(owner)}:${key}`;
class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
function signIn(owner = 'owner-a') {
  auth.setUser({ id: owner, name: owner, email: 'fixture@example.test', role: 'landlord' });
  auth.setToken(`token-${owner}`);
}
function response(data = payload, overrides = {}) {
  return new Response(JSON.stringify({ ...data, id: 'payment-a', reference: data.reference ?? null, notes: data.notes ?? null,
    paymentDate: data.paymentDate ?? '2026-09-19T10:00:00.000Z', createdAt: '2026-09-19T10:00:00.000Z', updatedAt: '2026-09-19T10:00:00.000Z', ...overrides }), { status: 201 });
}
function seed(owner = 'owner-a', data = payload) {
  const attempt = { version: 1, userId: owner, key: randomUUID(), createdAt: '2026-01-01T00:00:00.000Z', data };
  localStorage.setItem(name(owner, attempt.key), JSON.stringify(attempt));
  return attempt;
}
let calls;
beforeEach(() => {
  const store = new MemoryStorage();
  const browser = new EventTarget();
  browser.localStorage = store;
  browser.location = { href: '/' };
  global.window = browser;
  global.localStorage = store;
  const held = new Set();
  Object.defineProperty(global, 'navigator', { configurable: true, value: { locks: {
    async request(key, options, callback) {
      assert.equal(options.ifAvailable, true);
      if (held.has(key)) return callback(null);
      held.add(key);
      try { return await callback({ name: key }); } finally { held.delete(key); }
    },
  } } });
  calls = [];
  global.fetch = async (url, config) => { calls.push({ url, ...config }); return response(JSON.parse(config.body)); };
  signIn();
});

test('persists before network, sends key and captured owner, clears only after valid confirmation', async () => {
  global.fetch = async (url, config) => {
    const [attempt] = recovery.listPaymentAttempts('owner-a');
    assert.deepEqual(JSON.parse(config.body), attempt.data);
    assert.equal(config.headers['Idempotency-Key'], attempt.key);
    assert.equal(config.headers.Authorization, 'Bearer token-owner-a');
    return response();
  };
  assert.equal((await recovery.startPayment('owner-a', payload)).id, 'payment-a');
  assert.deepEqual(recovery.listPaymentAttempts('owner-a'), []);
  assert.ok([...localStorage.values.keys()].some(key => key.endsWith(':resolved')));
});

test('lost response and module reload keep original key and exact details without automatic fetch', async () => {
  let original;
  global.fetch = async (_, config) => { original = config; throw new TypeError('Connection lost'); };
  await assert.rejects(recovery.startPayment('owner-a', { ...payload, reference: '  ref  ', notes: '' }), /Connection lost/);
  const modulePath = path.join(compiled, 'lib/paymentRecovery.js');
  delete require.cache[require.resolve(modulePath)];
  const restored = require(modulePath);
  const [attempt] = restored.listPaymentAttempts('owner-a');
  assert.equal(attempt.createdAt.length, 24);
  assert.equal(attempt.data.paymentDate, undefined);
  global.fetch = async (_, config) => {
    assert.equal(config.body, original.body);
    assert.equal(config.headers['Idempotency-Key'], original.headers['Idempotency-Key']);
    return response(JSON.parse(config.body));
  };
  await restored.submitSavedPayment('owner-a', attempt.key);
});

test('explicit date canonicalizes once and survives retry', async () => {
  global.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(recovery.startPayment('owner-a', { ...payload, paymentDate: '2026-09-19T11:00:00+01:00' }));
  assert.equal(recovery.listPaymentAttempts('owner-a')[0].data.paymentDate, '2026-09-19T10:00:00.000Z');
});

test('unresolved attempts have no expiry and prevent a new key', async () => {
  const attempt = seed();
  await assert.rejects(recovery.startPayment('owner-a', payload), /Resolve your saved/);
  assert.equal(recovery.listPaymentAttempts('owner-a')[0].key, attempt.key);
  assert.equal(calls.length, 0);
});

test('storage failure prevents transmission', async () => {
  localStorage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(recovery.startPayment('owner-a', payload), /Nothing was submitted/);
  assert.equal(calls.length, 0);
});

test('silent failed storage write prevents transmission', async () => {
  localStorage.setItem = () => {};
  await assert.rejects(recovery.startPayment('owner-a', payload), /Could not save/);
  assert.equal(calls.length, 0);
});

test('corrupt or future-version evidence is preserved and prevents replacement', async () => {
  const attempt = seed();
  const raw = JSON.stringify({ ...attempt, version: 2 });
  localStorage.setItem(name('owner-a', attempt.key), raw);
  await assert.rejects(recovery.startPayment('owner-a', payload), /investigation/);
  assert.equal(localStorage.getItem(name('owner-a', attempt.key)), raw);
  assert.equal(calls.length, 0);
});

test('401 retains evidence across sign-in and isolates accounts', async () => {
  const attempt = seed();
  global.fetch = async () => new Response('{}', { status: 401 });
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), error => error instanceof ApiError && error.status === 401);
  assert.equal(auth.getToken(), null);
  assert.ok(localStorage.getItem(name('owner-a', attempt.key)));
  signIn('owner-b');
  assert.deepEqual(recovery.listPaymentAttempts('owner-b'), []);
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), /account changed/);
  signIn();
  assert.equal(recovery.listPaymentAttempts('owner-a')[0].key, attempt.key);
});

test('account change during response only resolves original owner evidence', async () => {
  const other = seed('owner-b');
  global.fetch = async (_, config) => {
    assert.equal(config.headers.Authorization, 'Bearer token-owner-a');
    signIn('owner-b');
    return response();
  };
  await recovery.startPayment('owner-a', payload);
  assert.equal(recovery.listPaymentAttempts('owner-b')[0].key, other.key);
  signIn();
  assert.deepEqual(recovery.listPaymentAttempts('owner-a'), []);
});

test('503 preserves original key and exposes Retry-After without automatic retry', async () => {
  const attempt = seed();
  let count = 0;
  global.fetch = async () => { count++; return new Response(JSON.stringify({ code: 'IDEMPOTENCY_CLAIM_TIMEOUT', message: 'Try again' }), { status: 503, headers: { 'Retry-After': '2' } }); };
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), error => error.code === 'IDEMPOTENCY_CLAIM_TIMEOUT' && error.retryAfter === 2);
  assert.equal(count, 1);
  assert.equal(recovery.listPaymentAttempts('owner-a')[0].key, attempt.key);
  assert.equal(recovery.getRecoveryBlock('owner-a', attempt.key), null);
});

test('late 401 from original account does not sign out the new account', async () => {
  const attempt = seed();
  global.fetch = async () => { signIn('owner-b'); return new Response('{}', { status: 401 }); };
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key));
  assert.equal(auth.getToken(), 'token-owner-b');
  assert.equal(window.location.href, '/');
  assert.ok(localStorage.getItem(name('owner-a', attempt.key)));
});

for (const kind of ['invalid-json', 'null', 'mismatch']) test(`unusable successful response (${kind}) retains evidence`, async () => {
  const attempt = seed();
  global.fetch = async () => kind === 'mismatch' ? response(payload, { leaseId: 'other' }) : new Response(kind === 'null' ? 'null' : '{', { status: 201 });
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), /confirmation/);
  assert.equal(recovery.listPaymentAttempts('owner-a')[0].key, attempt.key);
});

for (const [status, code] of [[409, 'IDEMPOTENCY_PAYLOAD_MISMATCH'], [500, 'IDEMPOTENCY_RECORD_INCOMPLETE'], [500, 'IDEMPOTENCY_RECORD_MISSING'], [500, 'IDEMPOTENCY_FINGERPRINT_VERSION_UNSUPPORTED'], [400, undefined]]) {
  test(`${code || 'validation rejection'} requires review and survives reload`, async () => {
    const attempt = seed();
    let count = 0;
    global.fetch = async () => { count++; return new Response(JSON.stringify({ code, message: 'Review required' }), { status }); };
    await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key));
    assert.ok(recovery.getRecoveryBlock('owner-a', attempt.key));
    await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), /needs review/);
    assert.equal(count, 1);
    assert.equal(recovery.listPaymentAttempts('owner-a')[0].key, attempt.key);
  });
}

test('concurrent tabs cannot start another key, retry or reconcile during transmission', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  global.fetch = async () => { await gate; return response(); };
  const first = recovery.startPayment('owner-a', payload);
  const [attempt] = recovery.listPaymentAttempts('owner-a');
  await assert.rejects(recovery.startPayment('owner-a', payload), /another tab/);
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), /another tab/);
  await assert.rejects(recovery.reconcilePaymentAttempt('owner-a', attempt.key, 'not-recorded'), /another tab/);
  release();
  await first;
});

test('explicit reconciliation removes only selected evidence and permits a new key', async () => {
  const first = seed();
  const second = seed();
  await recovery.reconcilePaymentAttempt('owner-a', first.key, 'already-recorded');
  assert.equal(calls.length, 0);
  assert.deepEqual(recovery.listPaymentAttempts('owner-a').map(a => a.key), [second.key]);
  await recovery.reconcilePaymentAttempt('owner-a', second.key, 'not-recorded');
  await recovery.startPayment('owner-a', payload);
  assert.notEqual(calls[0].headers['Idempotency-Key'], first.key);
  assert.notEqual(calls[0].headers['Idempotency-Key'], second.key);
});

test('resolution marker defeats a stale payload and prevents resubmission', async () => {
  const attempt = seed();
  const raw = localStorage.getItem(name('owner-a', attempt.key));
  await recovery.submitSavedPayment('owner-a', attempt.key);
  localStorage.setItem(name('owner-a', attempt.key), raw);
  assert.deepEqual(recovery.listPaymentAttempts('owner-a'), []);
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), /already resolved/);
  assert.equal(calls.length, 1);
});

test('confirmation storage failure keeps original request available for safe replay', async () => {
  const attempt = seed();
  localStorage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), /quota/);
  assert.equal(recovery.listPaymentAttempts('owner-a')[0].key, attempt.key);
});

test('browser without coordination support fails before storing or sending', async () => {
  navigator.locks = undefined;
  await assert.rejects(recovery.startPayment('owner-a', payload), /cannot safely coordinate/);
  assert.deepEqual(recovery.listPaymentAttempts('owner-a'), []);
  assert.equal(calls.length, 0);
});

test('corrupt resolution marker cannot silently discard unresolved evidence', async () => {
  const attempt = seed();
  localStorage.setItem(`${name('owner-a', attempt.key)}:resolved`, '{}');
  await assert.rejects(recovery.startPayment('owner-a', payload), /investigation/);
  await assert.rejects(recovery.submitSavedPayment('owner-a', attempt.key), /investigation/);
  assert.ok(localStorage.getItem(name('owner-a', attempt.key)));
  assert.equal(calls.length, 0);
});
