import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  defaultPaths,
  generateTokensCss,
  parseAndValidateJson,
  flattenPrimitives,
  resolveValue,
  assertGenerated,
  validateSemanticReferences,
  validateTokenUsage,
} from './build-design-tokens.mjs';

test('Token Pipeline: normal token graph generates valid deterministic CSS', () => {
  const css1 = generateTokensCss(defaultPaths.primitiveJson, defaultPaths.semanticJson);
  const css2 = generateTokensCss(defaultPaths.primitiveJson, defaultPaths.semanticJson);

  assert.equal(css1, css2, 'Output must be strictly byte-for-byte identical across runs');
  assert.ok(css1.includes(':root {'), 'CSS must include :root block');
  assert.ok(css1.includes('.dark {'), 'CSS must include .dark block');
  assert.ok(css1.includes('--brand-400: #77a8f7;'), 'CSS must resolve brand-400 to #77a8f7');
  assert.ok(css1.includes('--background: #f7faff;'), 'CSS must resolve the semantic background role');
  assert.ok(css1.includes('--radius: 14px;'), 'CSS must resolve radius to 14px');
});

test('Token Pipeline: unknown primitive reference fails with descriptive error', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'token-test-unknown-'));
  try {
    const primFile = join(tmpDir, 'primitive.json');
    const semFile = join(tmpDir, 'semantic.json');

    writeFileSync(primFile, JSON.stringify({ primitive: { color: { blue: { value: '#00f' } } } }));
    writeFileSync(semFile, JSON.stringify({
      light: {
        accent: { value: '{primitive.color.red}' },
      },
    }));

    assert.throws(
      () => generateTokensCss(primFile, semFile),
      /Unknown primitive reference 'primitive\.color\.red' in token 'light\.accent'/,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Token Pipeline: circular reference fails with descriptive cycle path', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'token-test-cycle-'));
  try {
    const primFile = join(tmpDir, 'primitive.json');
    const semFile = join(tmpDir, 'semantic.json');

    writeFileSync(primFile, JSON.stringify({ primitive: { base: { value: '10px' } } }));
    writeFileSync(semFile, JSON.stringify({
      light: {
        tokenA: { value: '{tokenB}' },
        tokenB: { value: '{tokenA}' },
      },
    }));

    assert.throws(
      () => generateTokensCss(primFile, semFile),
      /Circular reference detected/,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Token Pipeline: duplicate token keys fail with line info', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'token-test-dup-'));
  try {
    const semFile = join(tmpDir, 'semantic.json');
    const rawWithDup = `{\n  "light": {\n    "item": { "value": "1" },\n    "item": { "value": "2" }\n  }\n}`;
    writeFileSync(semFile, rawWithDup);

    assert.throws(
      () => parseAndValidateJson(semFile),
      /Duplicate tokens found/,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Token Pipeline: modified generated CSS fails drift check', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'token-test-drift-'));
  try {
    const primFile = join(tmpDir, 'primitive.json');
    const semFile = join(tmpDir, 'semantic.json');
    const cssFile = join(tmpDir, 'tokens.css');

    writeFileSync(primFile, JSON.stringify({ primitive: { color: { blue: { value: '#00f' } } } }));
    writeFileSync(semFile, JSON.stringify({
      light: {
        accent: { value: '{primitive.color.blue}' },
      },
    }));

    const generated = generateTokensCss(primFile, semFile);
    writeFileSync(cssFile, generated + '\n/* manual edit */\n');

    assert.throws(
      () => assertGenerated({ primitiveJson: primFile, semanticJson: semFile, outputCss: cssFile }),
      /out of date/,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Token Pipeline: Semantic literals fail the one-way dependency contract', () => {
  const primitives = new Map([['primitive.color.blue', '#00f']]);
  assert.throws(
    () => validateSemanticReferences({ light: { accent: { value: '#00f' } } }, primitives),
    /must reference a Primitive or Semantic token/,
  );
});

test('Token Usage: production source passes the Semantic-only boundary', () => {
  assert.doesNotThrow(() => validateTokenUsage(defaultPaths));
});

test('Token Usage: business foundation aliases, unknown variables, and hard-coded colors fail', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'token-usage-negative-'));
  try {
    const sourceRoot = join(tmpDir, 'src');
    mkdirSync(join(sourceRoot, 'app'), { recursive: true });
    writeFileSync(
      join(sourceRoot, 'app/page.tsx'),
      `export const Page = () => <div className="bg-brand-600" style={{ color: '#fff' }}>bad</div>;\n`,
    );
    writeFileSync(join(sourceRoot, 'app/page.css'), `.bad { color: var(--missing-role); }\n`);

    assert.throws(
      () => validateTokenUsage({
        ...defaultPaths,
        sourceRoot,
        outputCss: join(sourceRoot, 'styles/generated/tokens.css'),
      }),
      (error) => {
        assert.match(error.message, /foundation utility 'bg-brand-600'/);
        assert.match(error.message, /hard-coded color '#fff'/);
        assert.match(error.message, /unknown token '--missing-role'/);
        return true;
      },
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Token Usage: authored CSS self-references fail', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'token-usage-self-reference-'));
  try {
    const sourceRoot = join(tmpDir, 'src');
    mkdirSync(join(sourceRoot, 'app'), { recursive: true });
    writeFileSync(join(sourceRoot, 'app/globals.css'), `:root { --radius-sm: var(--radius-sm); }\n`);

    assert.throws(
      () => validateTokenUsage({
        ...defaultPaths,
        sourceRoot,
        outputCss: join(sourceRoot, 'styles/generated/tokens.css'),
      }),
      /self-referencing CSS custom property '--radius-sm'/,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
