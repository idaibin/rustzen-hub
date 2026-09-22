import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = resolve(__dirname, '..');

export const defaultPaths = {
  primitiveJson: resolve(appRoot, 'design-system/tokens/primitive.tokens.json'),
  semanticJson: resolve(appRoot, 'design-system/tokens/semantic.tokens.json'),
  outputCss: resolve(appRoot, 'src/styles/generated/tokens.css'),
  sourceRoot: resolve(appRoot, 'src'),
};

const sourceExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx']);
const foundationAliasPattern = /^(?:brand-\d+|ink(?:-\d+)?|line|panel|paper|surface|glass-\d+-.+|ambient-.+)$/;
const hardCodedColorPattern = /#[\da-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

function walkSource(directory) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.next' || entry.name === 'node_modules') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkSource(path));
    else if (entry.isFile() && sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) files.push(path);
  }
  return files;
}

function isInside(path, root) {
  const fromRoot = relative(root, path);
  return fromRoot === '' || (!fromRoot.startsWith(`..${sep}`) && fromRoot !== '..');
}

export function parseAndValidateJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Token file not found: ${filePath}`);
  }
  const raw = readFileSync(filePath, 'utf8');

  // Check for duplicate keys at same level
  const seenKeysByPath = new Map();
  function checkDuplicateKeys(text) {
    const lines = text.split('\n');
    const keyStack = [];
    const duplicates = [];
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\s*"([^"]+)"\s*:/);
      if (match) {
        const key = match[1];
        const indent = lines[i].search(/\S/);
        while (keyStack.length > 0 && keyStack[keyStack.length - 1].indent >= indent) {
          keyStack.pop();
        }
        const parentPath = keyStack.map((k) => k.key).join('.');
        const fullPath = parentPath ? `${parentPath}.${key}` : key;
        if (seenKeysByPath.has(fullPath)) {
          duplicates.push(`Duplicate key '${fullPath}' at line ${i + 1}`);
        } else {
          seenKeysByPath.set(fullPath, i + 1);
        }
        keyStack.push({ key, indent });
      }
    }
    if (duplicates.length > 0) {
      throw new Error(`Duplicate tokens found in ${filePath}:\n- ${duplicates.join('\n- ')}`);
    }
  }

  checkDuplicateKeys(raw);

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON syntax error in ${filePath}: ${err.message}`);
  }
}

export function flattenPrimitives(obj, prefix = 'primitive') {
  const map = new Map();
  function traverse(current, path) {
    if (!current || typeof current !== 'object') return;
    if ('value' in current && typeof current.value === 'string') {
      map.set(path, current.value);
      return;
    }
    for (const [key, val] of Object.entries(current)) {
      if (key.startsWith('$')) continue;
      const nextPath = path ? `${path}.${key}` : key;
      traverse(val, nextPath);
    }
  }
  traverse(obj.primitive || obj, prefix);
  return map;
}

export function resolveValue(valueStr, primitiveMap, semanticDefs, currentKey, visited = new Set()) {
  if (visited.has(currentKey)) {
    throw new Error(`Circular reference detected in token '${currentKey}': ${[...visited, currentKey].join(' -> ')}`);
  }
  visited.add(currentKey);

  // Match {primitive.a.b.c} or {semantic.a}
  const refMatch = valueStr.match(/^\{([^}]+)\}$/);
  if (!refMatch) {
    // Also support embedded refs like "calc({primitive.radius.base} - 4px)"
    const embedded = valueStr.replace(/\{([^}]+)\}/g, (match, refPath) => {
      if (refPath.startsWith('primitive.')) {
        if (!primitiveMap.has(refPath)) {
          throw new Error(`Unknown primitive reference '${refPath}' in token '${currentKey}'`);
        }
        return primitiveMap.get(refPath);
      }
      if (semanticDefs && semanticDefs[refPath]) {
        return resolveValue(semanticDefs[refPath].value, primitiveMap, semanticDefs, refPath, new Set(visited));
      }
      throw new Error(`Unknown reference '${refPath}' in token '${currentKey}'`);
    });
    return embedded;
  }

  const refPath = refMatch[1];
  if (refPath.startsWith('primitive.')) {
    if (!primitiveMap.has(refPath)) {
      throw new Error(`Unknown primitive reference '${refPath}' in token '${currentKey}'`);
    }
    return primitiveMap.get(refPath);
  }

  if (semanticDefs && semanticDefs[refPath]) {
    return resolveValue(semanticDefs[refPath].value, primitiveMap, semanticDefs, refPath, new Set(visited));
  }

  throw new Error(`Unknown reference '${refPath}' in token '${currentKey}'`);
}

export function validateSemanticReferences(semanticData, primitiveMap) {
  for (const [mode, definitions] of Object.entries({ light: semanticData.light, dark: semanticData.dark || {} })) {
    for (const [key, item] of Object.entries(definitions || {})) {
      if (!item || typeof item !== 'object' || typeof item.value !== 'string') {
        throw new Error(`Invalid token definition for '${key}' in ${mode} tokens`);
      }
      const match = item.value.match(/^\{([^}]+)\}$/);
      if (!match) {
        throw new Error(`Semantic token '${mode}.${key}' must reference a Primitive or Semantic token; literal values are not allowed`);
      }
      const reference = match[1];
      if (!reference.startsWith('primitive.') && !Object.hasOwn(definitions, reference)) {
        throw new Error(`Unknown semantic reference '${reference}' in token '${mode}.${key}'`);
      }
      if (reference.startsWith('primitive.') && !primitiveMap.has(reference)) {
        throw new Error(`Unknown primitive reference '${reference}' in token '${mode}.${key}'`);
      }
    }
  }
}

export function generateTokensCss(primitiveJsonPath, semanticJsonPath) {
  const primitiveData = parseAndValidateJson(primitiveJsonPath);
  const semanticData = parseAndValidateJson(semanticJsonPath);

  if (!semanticData.light || typeof semanticData.light !== 'object') {
    throw new Error('Semantic tokens must define a "light" object');
  }

  const primitiveMap = flattenPrimitives(primitiveData);
  validateSemanticReferences(semanticData, primitiveMap);

  // Resolve light mode tokens
  const lightResolved = [];
  const lightKeys = Object.keys(semanticData.light).sort();
  for (const key of lightKeys) {
    const item = semanticData.light[key];
    if (!item || typeof item !== 'object' || typeof item.value !== 'string') {
      throw new Error(`Invalid token definition for '${key}' in light tokens`);
    }
    const resolved = resolveValue(item.value, primitiveMap, semanticData.light, key);
    lightResolved.push(`  --${key}: ${resolved};`);
  }

  // Resolve dark mode tokens
  const darkResolved = [];
  if (semanticData.dark && typeof semanticData.dark === 'object') {
    const darkKeys = Object.keys(semanticData.dark).sort();
    for (const key of darkKeys) {
      const item = semanticData.dark[key];
      if (!item || typeof item !== 'object' || typeof item.value !== 'string') {
        throw new Error(`Invalid token definition for '${key}' in dark tokens`);
      }
      const resolved = resolveValue(item.value, primitiveMap, semanticData.dark, key);
      darkResolved.push(`  --${key}: ${resolved};`);
    }
  }

  const header = [
    '/**',
    ' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY',
    ' * Generated deterministically from design-system/tokens/*.tokens.json',
    ' * Run: npm run tokens:build --workspace @rustzen/console',
    ' */',
  ].join('\n');

  const lightBlock = [
    ':root {',
    '  color-scheme: light;',
    '',
    ...lightResolved,
    '}',
  ].join('\n');

  const darkBlock = [
    '.dark {',
    '  color-scheme: dark;',
    '',
    ...darkResolved,
    '}',
  ].join('\n');

  return `${header}\n\n${lightBlock}\n\n${darkBlock}\n`;
}

export function validateTokens(paths = defaultPaths) {
  generateTokensCss(paths.primitiveJson, paths.semanticJson);
  console.log('Design tokens validated successfully. No errors found.');
}

export function buildTokens(paths = defaultPaths) {
  const css = generateTokensCss(paths.primitiveJson, paths.semanticJson);
  mkdirSync(dirname(paths.outputCss), { recursive: true });
  writeFileSync(paths.outputCss, css, 'utf8');
  console.log(`Generated design tokens CSS at ${paths.outputCss}`);
}

export function assertGenerated(paths = defaultPaths) {
  if (!existsSync(paths.outputCss)) {
    throw new Error(`Generated CSS file does not exist: ${paths.outputCss}`);
  }
  const diskContent = readFileSync(paths.outputCss, 'utf8');
  const expectedContent = generateTokensCss(paths.primitiveJson, paths.semanticJson);

  if (diskContent !== expectedContent) {
    throw new Error("Generated design tokens CSS is out of date. Run 'npm run tokens:build --workspace @rustzen/console' to regenerate.");
  }
}

export function checkGenerated(paths = defaultPaths) {
  assertGenerated(paths);
  console.log('Generated design tokens CSS matches token sources exactly (byte-for-byte).');
}

export function validateTokenUsage(paths = defaultPaths) {
  const semanticData = parseAndValidateJson(paths.semanticJson);
  const semanticNames = new Set([
    ...Object.keys(semanticData.light || {}),
    ...Object.keys(semanticData.dark || {}),
  ]);
  const files = walkSource(paths.sourceRoot);
  const generatedRoot = dirname(paths.outputCss);
  const uiRoot = resolve(paths.sourceRoot, 'components/ui');
  const globalsPath = resolve(paths.sourceRoot, 'app/globals.css');
  const declaredVariables = new Set(semanticNames);
  const errors = [];

  for (const file of files) {
    if (isInside(file, generatedRoot)) continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/--([A-Za-z0-9_-]+)\s*:/g)) declaredVariables.add(match[1]);
  }

  for (const file of files) {
    if (isInside(file, generatedRoot)) continue;
    const source = readFileSync(file, 'utf8');
    const displayPath = relative(appRoot, file);
    const isAdapter = file === globalsPath || isInside(file, uiRoot);

    for (const match of source.matchAll(/--([A-Za-z0-9_-]+)\s*:\s*var\(--\1\)\s*;/g)) {
      errors.push(`${displayPath}: self-referencing CSS custom property '--${match[1]}'`);
    }

    for (const match of source.matchAll(/var\(--([A-Za-z0-9_-]+)\)/g)) {
      const token = match[1];
      if (!declaredVariables.has(token)) errors.push(`${displayPath}: unknown token '--${token}'`);
      if (!isAdapter && foundationAliasPattern.test(token)) {
        errors.push(`${displayPath}: foundation alias '--${token}' is restricted to declared adapter roots`);
      }
    }

    if (!isAdapter) {
      for (const match of source.matchAll(/(?:bg|text|border|ring|from|to|via)-(brand-\d+|ink(?:-\d+)?|line|panel|paper|surface)(?=[\s"'`/:[\]-]|$)/g)) {
        errors.push(`${displayPath}: foundation utility '${match[0]}' is restricted to declared adapter roots`);
      }
      for (const match of source.matchAll(hardCodedColorPattern)) {
        errors.push(`${displayPath}: hard-coded color '${match[0]}' must be represented by a Semantic token or owned component variant`);
      }
    }
  }

  if (errors.length > 0) throw new Error(`Token usage validation failed:\n- ${errors.join('\n- ')}`);
  console.log('Token usage validation passed. Business source consumes declared Semantic roles only.');
}

// CLI runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] || '--build';
  try {
    if (mode === '--validate') {
      validateTokens();
    } else if (mode === '--check') {
      checkGenerated();
    } else if (mode === '--check-usage') {
      validateTokenUsage();
    } else {
      buildTokens();
    }
  } catch (err) {
    console.error(`Token pipeline failed: ${err.message}`);
    process.exit(1);
  }
}
