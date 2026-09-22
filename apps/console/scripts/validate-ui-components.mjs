import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const defaultAppRoot = resolve(__dirname, '..');

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

export function isContained(path, root) {
  const pathFromRoot = relative(root, path);
  return (
    pathFromRoot &&
    !pathFromRoot.startsWith(`..${sep}`) &&
    pathFromRoot !== '..' &&
    !pathFromRoot.startsWith('..')
  );
}

export function matchesPattern(specifier, pattern) {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1);
    return specifier.startsWith(prefix);
  }
  return specifier === pattern;
}

export function packageName(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }
  return specifier.split('/')[0];
}

export function moduleSpecifiers(source, filePath) {
  const specifiers = new Set();
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    }
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const expression = node.moduleReference.expression;
      if (expression && ts.isStringLiteralLike(expression)) {
        specifiers.add(expression.text);
      }
    }
    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')
      ) {
        specifiers.add(node.arguments[0].text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

export function staticBarePackages(source, filePath) {
  const packages = new Set();
  for (const specifier of moduleSpecifiers(source, filePath)) {
    if (specifier.startsWith('@/') || specifier.startsWith('.') || specifier.startsWith('node:')) continue;
    packages.add(packageName(specifier));
  }
  return packages;
}

export function walk(directory) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'));
      if (sourceExtensions.has(ext)) {
        files.push(path);
      }
    }
  }
  return files;
}

export function validateUiRegistryAndBoundaries(appRoot = defaultAppRoot, customRegistryPath = null) {
  const errors = [];
  function fail(message) {
    errors.push(message);
  }

  const registryPath = customRegistryPath || resolve(appRoot, 'docs/ui/components.registry.json');
  if (!existsSync(registryPath)) {
    fail(`Registry file not found: ${registryPath}`);
    return { passed: false, errors };
  }

  let registry;
  try {
    registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  } catch (err) {
    fail(`Cannot parse registry JSON: ${err.message}`);
    return { passed: false, errors };
  }

  // Check root fields
  const allowedRootFields = new Set([
    'contract_id',
    'version',
    'owner',
    'adapter_roots',
    'restricted_third_party_package_patterns',
    'escape_hatches',
    'components',
  ]);

  for (const key of Object.keys(registry)) {
    if (!allowedRootFields.has(key)) {
      fail(`Unknown root field in registry: ${key}`);
    }
  }

  if (registry.contract_id !== 'urn:rustzen-hub:ui-component-registry:v1') {
    fail('Registry contract_id must be urn:rustzen-hub:ui-component-registry:v1.');
  }
  if (registry.version !== 'ui-component-governance-v1') {
    fail('Registry version must be ui-component-governance-v1.');
  }
  if (typeof registry.owner !== 'string' || !registry.owner) {
    fail('Registry owner must be a non-empty path string.');
  }
  if (!Array.isArray(registry.adapter_roots) || registry.adapter_roots.length === 0) {
    fail('Registry adapter_roots must be a non-empty array.');
  }
  if (!Array.isArray(registry.restricted_third_party_package_patterns)) {
    fail('Registry restricted_third_party_package_patterns must be an array.');
  }
  if (!Array.isArray(registry.escape_hatches)) {
    fail('Registry escape_hatches must be an array.');
  }
  if (!Array.isArray(registry.components)) {
    fail('Registry components must be an array.');
  }

  const ownerRoot = resolve(appRoot, registry.owner || '');
  if (!isContained(ownerRoot, appRoot)) {
    fail(`Registry owner escapes app root: ${registry.owner}`);
  }

  const adapterRoots = (registry.adapter_roots || []).map((adapterRoot) => {
    if (typeof adapterRoot !== 'string') {
      fail('Every adapter root must be a string path.');
      return appRoot;
    }
    const resolved = resolve(appRoot, adapterRoot);
    if (!isContained(resolved, appRoot) || !existsSync(resolved) || !statSync(resolved).isDirectory()) {
      fail(`Invalid adapter root: ${adapterRoot}`);
    }
    return resolved;
  });

  const ids = new Set();
  const sources = new Set();
  const publicImports = new Set();
  const registrySources = new Set();

  const allowedComponentFields = new Set([
    'id',
    'source',
    'public_import',
    'status',
    'category',
    'semantic_roles',
    'required_states',
    'token_groups',
    'underlying_packages',
    'accessibility',
    'usage',
    'replacement',
    'migration',
  ]);

  const validStatuses = new Set(['active', 'experimental', 'deprecated']);

  for (const component of registry.components || []) {
    if (!component || typeof component !== 'object') {
      fail('Every registry component must be an object.');
      continue;
    }

    for (const key of Object.keys(component)) {
      if (!allowedComponentFields.has(key)) {
        fail(`Unknown field '${key}' in component '${component.id || 'unknown'}'`);
      }
    }

    for (const field of ['id', 'source', 'public_import', 'status', 'category', 'accessibility', 'usage']) {
      if (typeof component[field] !== 'string' || !component[field].trim()) {
        fail(`Component '${component.id || 'unknown'}' requires non-empty string '${field}'.`);
      }
    }

    if (component.status && !validStatuses.has(component.status)) {
      fail(`Invalid status '${component.status}' for component '${component.id}'. Allowed: active, experimental, deprecated.`);
    }

    if (component.status === 'deprecated') {
      if (typeof component.replacement !== 'string' || !component.replacement.trim()) {
        fail(`Deprecated component '${component.id}' must declare a 'replacement'.`);
      }
      if (typeof component.migration !== 'string' || !component.migration.trim()) {
        fail(`Deprecated component '${component.id}' must declare a 'migration' guide.`);
      }
    }

    for (const field of ['semantic_roles', 'required_states', 'token_groups', 'underlying_packages']) {
      if (!Array.isArray(component[field])) {
        fail(`Component '${component.id}' requires array field '${field}'.`);
      }
    }

    if (ids.has(component.id)) {
      fail(`Duplicate component id: ${component.id}`);
    }
    ids.add(component.id);

    if (sources.has(component.source)) {
      fail(`Duplicate component source: ${component.source}`);
    }
    sources.add(component.source);

    if (publicImports.has(component.public_import)) {
      fail(`Duplicate public import: ${component.public_import}`);
    }
    publicImports.add(component.public_import);

    const sourcePath = resolve(appRoot, component.source || '');
    if (!isContained(sourcePath, ownerRoot)) {
      fail(`Component source must reside within owner root (${registry.owner}): ${component.source}`);
    }
    if (!existsSync(sourcePath)) {
      fail(`Component source file does not exist: ${component.source}`);
    }
    registrySources.add(sourcePath);

    // Verify public_import matches source convention
    const expectedImport = `@/${component.source?.replace(/^src\//, '').replace(/\.tsx$/, '')}`;
    if (component.public_import !== expectedImport) {
      fail(`Public import does not match source for '${component.id}': expected '${expectedImport}', got '${component.public_import}'`);
    }

    // Verify underlying bare packages match
    if (existsSync(sourcePath) && Array.isArray(component.underlying_packages)) {
      const actualPackages = staticBarePackages(readFileSync(sourcePath, 'utf8'), sourcePath);
      const registeredPackages = new Set(component.underlying_packages);
      const missingPackages = [...actualPackages].filter((pkg) => !registeredPackages.has(pkg));
      const stalePackages = [...registeredPackages].filter((pkg) => !actualPackages.has(pkg));
      if (missingPackages.length > 0 || stalePackages.length > 0) {
        fail(
          `Underlying package mismatch for '${component.id}': missing [${missingPackages.join(', ')}], stale [${stalePackages.join(', ')}].`,
        );
      }
    }
  }

  // Check that all .tsx in ownerRoot are registered
  if (existsSync(ownerRoot)) {
    for (const entry of readdirSync(ownerRoot, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.tsx')) {
        const full = resolve(ownerRoot, entry.name);
        if (!registrySources.has(full)) {
          fail(`Unregistered component in owner root: ${relative(appRoot, full)}`);
        }
      }
    }
  }

  // Validate escape hatches
  for (const escapeHatch of registry.escape_hatches || []) {
    if (!escapeHatch || typeof escapeHatch !== 'object') {
      fail('Every escape hatch must be an object.');
      continue;
    }
    for (const field of ['owner', 'reason', 'consumer', 'package', 'review_by']) {
      if (typeof escapeHatch[field] !== 'string' || !escapeHatch[field].trim()) {
        fail(`Escape hatch requires non-empty string field '${field}'.`);
      }
    }
  }

  // Boundary check 1: Business code must not import restricted third-party UI libraries
  // Boundary check 2: src/components/ui must not reverse-import business layers (src/app, src/components/admin, etc.)
  const srcDir = resolve(appRoot, 'src');
  const allSourceFiles = walk(srcDir);

  const businessLayerPatterns = ['@/app', '@/app/', '@/components/admin', '@/components/admin/'];

  for (const file of allSourceFiles) {
    const isInsideAdapterRoot = adapterRoots.some((root) => isContained(file, root));
    const content = readFileSync(file, 'utf8');
    const specifiers = moduleSpecifiers(content, file);

    for (const specifier of specifiers) {
      // If outside adapter root, check restricted packages
      if (!isInsideAdapterRoot) {
        const isRestricted = (registry.restricted_third_party_package_patterns || []).some((pattern) =>
          matchesPattern(specifier, pattern),
        );
        if (isRestricted) {
          fail(`Restricted UI import outside adapter roots: ${relative(appRoot, file)} -> ${specifier}`);
        }
      }

      // If inside UI component layer, check reverse dependency on business code
      if (isInsideAdapterRoot) {
        const isBusinessImport =
          businessLayerPatterns.some((pattern) => matchesPattern(specifier, pattern)) ||
          specifier.startsWith('../app') ||
          specifier.startsWith('../../app') ||
          specifier.startsWith('../components/admin') ||
          specifier.startsWith('../../components/admin');

        if (isBusinessImport) {
          fail(`Forbidden reverse dependency in UI component layer: ${relative(appRoot, file)} -> ${specifier}`);
        }
      }
    }
  }

  return { passed: errors.length === 0, errors };
}

// CLI runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { passed, errors } = validateUiRegistryAndBoundaries();
  if (!passed) {
    console.error('UI component registry validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  } else {
    console.log('UI component registry validation passed.');
  }
}
