#!/usr/bin/env node
/**
 * Regression for the local braces 3.0.3 patch (CVE-2026-93687).
 * Upstream has no fixed release: the patch limits parsed and caller-supplied AST
 * nesting to 100, including parentheses, before recursive walkers exhaust the
 * stack. npm audit will still identify the upstream version; it is not suppressed.
 * Run after installation: node scripts/security/check-braces.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--child')) {
  // This branch runs in a disposable, time-bounded process so an accidental
  // reintroduction of the vulnerable walkers cannot hang the verification job.
} else {
  const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--child'], {
    encoding: 'utf8',
    timeout: 10_000,
    maxBuffer: 64 * 1024,
  });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message ?? result.stderr ?? 'braces security check failed');
    process.exit(1);
  }
  process.stdout.write(result.stdout);
  process.exit(0);
}

const require = createRequire(import.meta.url);
const braces = require(process.env.NEWBEE_BRACES_MODULE ?? 'braces');
let checks = 0;
const verify = (run) => {
  run();
  checks++;
};
const rejectsDepth = (run) => verify(() => assert.throws(run, {
  name: 'RangeError',
  message: 'Input nesting exceeds max depth (100)',
}));
const nestedAst = (depth) => {
  const root = { type: 'root', nodes: [] };
  let parent = root;
  for (let i = 0; i < depth; i++) {
    const child = { type: 'paren', nodes: [], parent };
    parent.nodes.push(child);
    parent = child;
  }
  parent.nodes.push({ type: 'text', value: 'a', parent });
  return root;
};

const patterns = [
  '{'.repeat(4000) + 'a,b' + '}'.repeat(4000),
  '('.repeat(4000) + 'a' + ')'.repeat(4000),
  '{('.repeat(2000) + 'a,b' + ')}'.repeat(2000),
  '{'.repeat(101) + 'a,b' + '}'.repeat(101),
  '('.repeat(101) + 'a' + ')'.repeat(101),
  '{'.repeat(101),
];
for (const pattern of patterns) {
  assert.ok(pattern.length < 10_000, 'payload must remain below the upstream character cap');
  for (const operation of [braces, braces.parse, braces.compile, braces.expand, braces.stringify]) {
    rejectsDepth(() => operation(pattern));
  }
}

for (const operation of [braces.compile, braces.expand, braces.stringify]) {
  rejectsDepth(() => operation(nestedAst(4000)));
  const cycle = { type: 'root', nodes: [] };
  cycle.nodes.push(cycle);
  rejectsDepth(() => operation(cycle));
  verify(() => assert.deepEqual(operation(nestedAst(100)), operation(nestedAst(1))));
}

verify(() => assert.deepEqual(braces('src/**/*.{ts,tsx}'), ['src/**/*.(ts|tsx)']));
verify(() => assert.deepEqual(braces.expand('a/{b,{c,d}}/e'), ['a/b/e', 'a/c/e', 'a/d/e']));
verify(() => assert.deepEqual(braces.expand('v{01..03}'), ['v01', 'v02', 'v03']));
verify(() => assert.deepEqual(braces.expand('{a,a,b}', { nodupes: true }), ['a', 'b']));
verify(() => assert.equal(braces.compile('foo/{bar,baz}/qux'), 'foo/(bar|baz)/qux'));
verify(() => assert.equal(braces.stringify('foo/{bar,baz}/qux'), 'foo/{bar,baz}/qux'));
verify(() => assert.equal(braces.compile('\\{a,b\\}'), '{a,b}'));
verify(() => assert.equal(braces.compile('[{a,b}]'), '[{a,b}]'));
verify(() => assert.equal(braces.compile('"{a,b}"'), '{a,b}'));
verify(() => assert.equal(braces.compile('\\{'.repeat(2000)), '{'.repeat(2000)));
verify(() => assert.equal(braces.compile('"' + '{'.repeat(2000) + '"'), '{'.repeat(2000)));
verify(() => assert.doesNotThrow(() => braces.compile('{'.repeat(100) + 'a,b' + '}'.repeat(100))));
verify(() => assert.doesNotThrow(() => braces.expand('('.repeat(100) + 'a' + ')'.repeat(100))));
verify(() => assert.throws(() => braces.parse('abc', { maxLength: 2 }), /exceeds max characters/));
verify(() => assert.throws(() => braces.expand('{1..2000}'), /exceeds range limit/));
process.stdout.write(`braces security regression: ${checks} checks passed\n`);
