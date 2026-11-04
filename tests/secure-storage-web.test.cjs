const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const filePath = path.join(__dirname, '../src/lib/storage/secure-storage.web.ts');
const { outputText } = ts.transpileModule(readFileSync(filePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

function loadAdapter(browserWindow) {
  const exports = {};
  const sandbox = { exports };
  if (browserWindow !== undefined) sandbox.window = browserWindow;
  vm.runInNewContext(outputText, sandbox);
  return exports;
}

async function expectSaveFailure(adapter) {
  await assert.rejects(adapter.saveSessionToken('opaque-token'), (error) => {
    assert.match(error.message, /No se pudo guardar la sesión/);
    assert.doesNotMatch(error.message, /opaque-token/);
    return true;
  });
}

async function expectDeleteFailure(adapter) {
  await assert.rejects(adapter.deleteSessionToken(), (error) => {
    assert.match(error.message, /No se pudo cerrar la sesión/);
    assert.doesNotMatch(error.message, /opaque-token/);
    return true;
  });
}

test('ordinary browser storage saves, reads and deletes the session token', async () => {
  const entries = new Map();
  const adapter = loadAdapter({
    localStorage: {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
      removeItem: (key) => entries.delete(key),
    },
  });

  assert.equal(await adapter.getSessionToken(), null);
  await adapter.saveSessionToken('opaque-token');
  assert.equal(entries.get('session_token'), 'opaque-token');
  assert.equal(await adapter.getSessionToken(), 'opaque-token');
  await adapter.deleteSessionToken();
  assert.equal(await adapter.getSessionToken(), null);
});

test('throwing localStorage getter cannot crash restore and rejects delete and save', async () => {
  const browserWindow = {};
  Object.defineProperty(browserWindow, 'localStorage', {
    get() { throw new Error('storage denied'); },
  });
  const adapter = loadAdapter(browserWindow);

  assert.equal(await adapter.getSessionToken(), null);
  await expectDeleteFailure(adapter);
  await expectSaveFailure(adapter);
});

test('throwing storage operations cannot crash read and reject delete and save', async () => {
  const adapter = loadAdapter({
    localStorage: {
      getItem() { throw new Error('read denied'); },
      setItem() { throw new Error('write denied'); },
      removeItem() { throw new Error('delete denied'); },
    },
  });

  assert.equal(await adapter.getSessionToken(), null);
  await expectDeleteFailure(adapter);
  await expectSaveFailure(adapter);
});

test('failed deletion cannot claim logout when a token remains readable', async () => {
  const entries = new Map([['session_token', 'opaque-token']]);
  const adapter = loadAdapter({
    localStorage: {
      getItem: (key) => entries.get(key) ?? null,
      removeItem() { throw new Error('delete denied'); },
    },
  });

  assert.equal(await adapter.getSessionToken(), 'opaque-token');
  await expectDeleteFailure(adapter);
  assert.equal(entries.get('session_token'), 'opaque-token');
  assert.equal(await adapter.getSessionToken(), 'opaque-token');
});

test('silent deletion failure and unverifiable deletion cannot claim logout', async () => {
  const entries = new Map([['session_token', 'opaque-token']]);
  const silentAdapter = loadAdapter({
    localStorage: {
      getItem: (key) => entries.get(key) ?? null,
      removeItem() {},
    },
  });

  await expectDeleteFailure(silentAdapter);
  assert.equal(await silentAdapter.getSessionToken(), 'opaque-token');

  const unreadableAdapter = loadAdapter({
    localStorage: {
      getItem() { throw new Error('verification denied'); },
      removeItem: (key) => entries.delete(key),
    },
  });

  await expectDeleteFailure(unreadableAdapter);
});

test('SSR does not claim that the token was persisted', async () => {
  const adapter = loadAdapter();
  assert.equal(await adapter.getSessionToken(), null);
  await assert.doesNotReject(adapter.deleteSessionToken());
  await expectSaveFailure(adapter);
});
