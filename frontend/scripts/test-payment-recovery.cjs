/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS Node runner. */
// Uses the project's existing compiler and Node test runner; no test dependency.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'propmanager-payment-tests-'));
try {
  const compile = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'),
    '--target', 'ES2020', '--module', 'commonjs', '--lib', 'ES2020,DOM', '--strict',
    '--esModuleInterop', '--skipLibCheck', '--outDir', temp, '--rootDir', 'src',
    'src/lib/paymentRecovery.ts'], { cwd: root, stdio: 'inherit' });
  if (compile.status !== 0) process.exitCode = compile.status || 1;
  else {
    const tests = spawnSync(process.execPath, ['--test', 'tests/payment-recovery.test.cjs'], {
      cwd: root, stdio: 'inherit', env: { ...process.env, PAYMENT_TEST_BUILD: temp },
    });
    process.exitCode = tests.status || (tests.error ? 1 : 0);
  }
} finally {
  const resolved = path.resolve(temp);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('propmanager-payment-tests-')) {
    throw new Error('Unexpected test output directory; refusing cleanup');
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}
