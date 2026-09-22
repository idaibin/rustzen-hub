import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  validateUiRegistryAndBoundaries,
  defaultAppRoot,
  moduleSpecifiers,
  staticBarePackages,
} from './validate-ui-components.mjs';

test('UI Components: production registry passes all checks', () => {
  const { passed, errors } = validateUiRegistryAndBoundaries();
  assert.equal(passed, true, `Expected validation to pass but got: ${errors.join(', ')}`);
  assert.equal(errors.length, 0);
});

test('Registry Validation: duplicate component id fails', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'reg-test-dup-id-'));
  try {
    const regFile = join(tmpDir, 'components.registry.json');
    writeFileSync(
      regFile,
      JSON.stringify({
        contract_id: 'urn:rustzen-hub:ui-component-registry:v1',
        version: 'ui-component-governance-v1',
        owner: 'src/components/ui',
        adapter_roots: ['src/components/ui'],
        restricted_third_party_package_patterns: [],
        escape_hatches: [],
        components: [
          {
            id: 'btn',
            source: 'src/components/ui/button.tsx',
            public_import: '@/components/ui/button',
            status: 'active',
            category: 'action',
            accessibility: 'button',
            usage: 'actions',
            semantic_roles: ['action'],
            required_states: ['default'],
            token_groups: ['action'],
            underlying_packages: ['react', 'class-variance-authority'],
          },
          {
            id: 'btn',
            source: 'src/components/ui/input.tsx',
            public_import: '@/components/ui/input',
            status: 'active',
            category: 'form',
            accessibility: 'input',
            usage: 'forms',
            semantic_roles: ['input'],
            required_states: ['default'],
            token_groups: ['input'],
            underlying_packages: ['react'],
          },
        ],
      }),
    );

    const { passed, errors } = validateUiRegistryAndBoundaries(defaultAppRoot, regFile);
    assert.equal(passed, false);
    assert.ok(errors.some((e) => e.includes('Duplicate component id: btn')));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Registry Validation: source outside owner root fails', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'reg-test-escape-'));
  try {
    const regFile = join(tmpDir, 'components.registry.json');
    writeFileSync(
      regFile,
      JSON.stringify({
        contract_id: 'urn:rustzen-hub:ui-component-registry:v1',
        version: 'ui-component-governance-v1',
        owner: 'src/components/ui',
        adapter_roots: ['src/components/ui'],
        restricted_third_party_package_patterns: [],
        escape_hatches: [],
        components: [
          {
            id: 'outside',
            source: 'src/components/admin/data-table.tsx',
            public_import: '@/components/admin/data-table',
            status: 'active',
            category: 'data',
            accessibility: 'table',
            usage: 'table',
            semantic_roles: ['table'],
            required_states: ['default'],
            token_groups: ['table'],
            underlying_packages: ['react'],
          },
        ],
      }),
    );

    const { passed, errors } = validateUiRegistryAndBoundaries(defaultAppRoot, regFile);
    assert.equal(passed, false);
    assert.ok(errors.some((e) => e.includes('must reside within owner root')));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Registry Validation: duplicate public import fails', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'reg-test-dup-import-'));
  try {
    const regFile = join(tmpDir, 'components.registry.json');
    writeFileSync(
      regFile,
      JSON.stringify({
        contract_id: 'urn:rustzen-hub:ui-component-registry:v1',
        version: 'ui-component-governance-v1',
        owner: 'src/components/ui',
        adapter_roots: ['src/components/ui'],
        restricted_third_party_package_patterns: [],
        escape_hatches: [],
        components: [
          {
            id: 'btn1',
            source: 'src/components/ui/button.tsx',
            public_import: '@/components/ui/button',
            status: 'active',
            category: 'action',
            accessibility: 'btn',
            usage: 'btn',
            semantic_roles: ['action'],
            required_states: ['default'],
            token_groups: ['action'],
            underlying_packages: ['react', 'class-variance-authority'],
          },
          {
            id: 'btn2',
            source: 'src/components/ui/input.tsx',
            public_import: '@/components/ui/button',
            status: 'active',
            category: 'form',
            accessibility: 'input',
            usage: 'input',
            semantic_roles: ['input'],
            required_states: ['default'],
            token_groups: ['input'],
            underlying_packages: ['react'],
          },
        ],
      }),
    );

    const { passed, errors } = validateUiRegistryAndBoundaries(defaultAppRoot, regFile);
    assert.equal(passed, false);
    assert.ok(errors.some((e) => e.includes('Duplicate public import: @/components/ui/button')));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Registry Validation: underlying packages mismatch fails', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'reg-test-pkg-drift-'));
  try {
    const regFile = join(tmpDir, 'components.registry.json');
    writeFileSync(
      regFile,
      JSON.stringify({
        contract_id: 'urn:rustzen-hub:ui-component-registry:v1',
        version: 'ui-component-governance-v1',
        owner: 'src/components/ui',
        adapter_roots: ['src/components/ui'],
        restricted_third_party_package_patterns: [],
        escape_hatches: [],
        components: [
          {
            id: 'dialog',
            source: 'src/components/ui/dialog.tsx',
            public_import: '@/components/ui/dialog',
            status: 'active',
            category: 'overlay',
            accessibility: 'dialog',
            usage: 'dialog',
            semantic_roles: ['modal'],
            required_states: ['open'],
            token_groups: ['overlay'],
            underlying_packages: ['react'], // missing lucide-react
          },
        ],
      }),
    );

    const { passed, errors } = validateUiRegistryAndBoundaries(defaultAppRoot, regFile);
    assert.equal(passed, false);
    assert.ok(errors.some((e) => e.includes('Underlying package mismatch for \'dialog\'')));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Registry Validation: invalid status fails', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'reg-test-status-'));
  try {
    const regFile = join(tmpDir, 'components.registry.json');
    writeFileSync(
      regFile,
      JSON.stringify({
        contract_id: 'urn:rustzen-hub:ui-component-registry:v1',
        version: 'ui-component-governance-v1',
        owner: 'src/components/ui',
        adapter_roots: ['src/components/ui'],
        restricted_third_party_package_patterns: [],
        escape_hatches: [],
        components: [
          {
            id: 'btn',
            source: 'src/components/ui/button.tsx',
            public_import: '@/components/ui/button',
            status: 'stable', // invalid status
            category: 'action',
            accessibility: 'btn',
            usage: 'btn',
            semantic_roles: ['action'],
            required_states: ['default'],
            token_groups: ['action'],
            underlying_packages: ['react', 'class-variance-authority'],
          },
        ],
      }),
    );

    const { passed, errors } = validateUiRegistryAndBoundaries(defaultAppRoot, regFile);
    assert.equal(passed, false);
    assert.ok(errors.some((e) => e.includes('Invalid status \'stable\'')));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Registry Validation: deprecated status requires replacement and migration', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'reg-test-dep-'));
  try {
    const regFile = join(tmpDir, 'components.registry.json');
    writeFileSync(
      regFile,
      JSON.stringify({
        contract_id: 'urn:rustzen-hub:ui-component-registry:v1',
        version: 'ui-component-governance-v1',
        owner: 'src/components/ui',
        adapter_roots: ['src/components/ui'],
        restricted_third_party_package_patterns: [],
        escape_hatches: [],
        components: [
          {
            id: 'btn',
            source: 'src/components/ui/button.tsx',
            public_import: '@/components/ui/button',
            status: 'deprecated',
            category: 'action',
            accessibility: 'btn',
            usage: 'btn',
            semantic_roles: ['action'],
            required_states: ['default'],
            token_groups: ['action'],
            underlying_packages: ['react', 'class-variance-authority'],
          },
        ],
      }),
    );

    const { passed, errors } = validateUiRegistryAndBoundaries(defaultAppRoot, regFile);
    assert.equal(passed, false);
    assert.ok(errors.some((e) => e.includes('Deprecated component \'btn\' must declare a \'replacement\'')));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Registry Validation: incomplete escape hatch fails', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'reg-test-hatch-'));
  try {
    const regFile = join(tmpDir, 'components.registry.json');
    writeFileSync(
      regFile,
      JSON.stringify({
        contract_id: 'urn:rustzen-hub:ui-component-registry:v1',
        version: 'ui-component-governance-v1',
        owner: 'src/components/ui',
        adapter_roots: ['src/components/ui'],
        restricted_third_party_package_patterns: [],
        escape_hatches: [
          {
            owner: 'UI Team',
            reason: 'Testing',
            // missing consumer, package, review_by
          },
        ],
        components: [],
      }),
    );

    const { passed, errors } = validateUiRegistryAndBoundaries(defaultAppRoot, regFile);
    assert.equal(passed, false);
    assert.ok(errors.some((e) => e.includes('Escape hatch requires')));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Import Boundary: parses static, dynamic, require, export from, and import equals without false positives in comments', () => {
  const code = `
    // import antd from 'antd';
    /* import { Button } from '@mui/material'; */
    const msg = "import { Dialog } from '@radix-ui/react-dialog'";
    import { Button } from '@/components/ui/button';
    export { Card } from '@/components/ui/card';
    const dyn = import('antd');
    const req = require('@mui/core');
    import Eq = require('element-plus');
  `;

  const specifiers = moduleSpecifiers(code, 'test.tsx');
  assert.ok(specifiers.has('@/components/ui/button'));
  assert.ok(specifiers.has('@/components/ui/card'));
  assert.ok(specifiers.has('antd'));
  assert.ok(specifiers.has('@mui/core'));
  assert.ok(specifiers.has('element-plus'));

  // Comments and string literals must NOT be detected
  assert.ok(!specifiers.has('@mui/material'));
  assert.ok(!specifiers.has('@radix-ui/react-dialog'));
});

test('Import Boundary: bare packages correctly filtered from relative and alias imports', () => {
  const code = `
    import * as React from 'react';
    import { cva } from 'class-variance-authority';
    import { cn } from '@/lib/utils';
    import { helper } from './local-helper';
    import { readFileSync } from 'node:fs';
  `;

  const packages = staticBarePackages(code, 'test.tsx');
  assert.deepEqual([...packages].sort(), ['class-variance-authority', 'react']);
});
