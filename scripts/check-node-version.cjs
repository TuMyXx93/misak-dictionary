#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const nodeVersionFilePath = path.join(projectRoot, '.node-version');

function parseVersion(raw) {
  const sanitized = String(raw).trim().replace(/^v/i, '');
  const match = sanitized.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    raw: sanitized,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareVersions(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(messageLines) {
  console.error('\nNode.js runtime validation failed:\n');
  for (const line of messageLines) {
    console.error(`- ${line}`);
  }
  console.error('');
  process.exit(1);
}

if (!fs.existsSync(nodeVersionFilePath)) {
  fail([
    "Missing '.node-version' file in project root.",
    'Create it with the minimum project runtime version, for example: 24.15.0.',
  ]);
}

const packageJson = readJson(packageJsonPath);
const declaredEngine = packageJson.engines && packageJson.engines.node;
const nodeVersionFileRaw = fs.readFileSync(nodeVersionFilePath, 'utf8').trim();

const runtimeVersion = parseVersion(process.version);
const nodeVersionFile = parseVersion(nodeVersionFileRaw);

if (!runtimeVersion) {
  fail([
    `Current Node.js version '${process.version}' has an unsupported format.`,
    'Expected format: x.y.z',
  ]);
}

if (!nodeVersionFile) {
  fail([
    `Invalid '.node-version' content: '${nodeVersionFileRaw}'.`,
    'Expected exact semver format: x.y.z',
  ]);
}

if (declaredEngine) {
  const engineMatch = String(declaredEngine)
    .trim()
    .match(/^>=\s*(\d+\.\d+\.\d+)$/);
  if (!engineMatch) {
    fail([
      `Unsupported engines.node value in package.json: '${declaredEngine}'.`,
      "Use format '>=x.y.z' to keep checks deterministic.",
    ]);
  }

  const engineVersion = parseVersion(engineMatch[1]);
  if (!engineVersion) {
    fail([`Unable to parse engines.node value '${declaredEngine}'.`, "Use format '>=x.y.z'."]);
  }

  if (compareVersions(nodeVersionFile, engineVersion) < 0) {
    fail([
      `'.node-version' (${nodeVersionFile.raw}) is lower than engines.node minimum (${engineVersion.raw}).`,
      'Keep both values aligned to avoid runtime drift between local and CI.',
    ]);
  }
}

if (compareVersions(runtimeVersion, nodeVersionFile) < 0) {
  fail([
    `Current runtime: ${runtimeVersion.raw}`,
    `Minimum required by .node-version: ${nodeVersionFile.raw}`,
    'Use this version or higher within the same major support policy.',
    'Run: fnm install && fnm use',
  ]);
}

console.log(`Node.js runtime valid: v${runtimeVersion.raw}`);
