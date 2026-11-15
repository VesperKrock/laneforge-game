import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// This explicit public allowlist is reviewed with the Owner before staging.
const publicFiles = [
  '.gitignore', '.nvmrc', '.github/workflows/deploy-pages.yml', 'README.md',
  'docs/GAME_DESIGN.md', 'docs/UNITS.md', 'docs/SPELL_CARDS.md',
  'docs/DECISIONS.md', 'docs/ROADMAP.md', 'docs/R0B_REVIEW.md',
  'index.html', 'package.json', 'package-lock.json', 'tsconfig.json',
  'vite.config.ts', 'playwright.config.ts', 'src/main.ts', 'src/style.css',
  'src/game/Battle.ts', 'src/game/BattleScene.ts',
  'src/game/WeaponCatalog.ts', 'src/game/UnitBuild.ts',
  'src/game/WeaponVisual.ts', 'src/game/WorkshopScene.ts',
  'tests/modular.spec.ts', 'docs/R2A_REVIEW.md',
  'scripts/security-gate.mjs', 'tests/smoke.spec.ts',
];
// R2W1: exactly five Owner-supplied PNGs. Changes to bytes require a separate review.
const publicAssets = [
  { path: 'src/assets/visuals/Actor1_1.png', stem: 'Actor1_1', bytes: 19601, width: 576, height: 384, sha256: '0081f2fb57d53d9719951680876d05116c387d05d3806c83a62acfb07d1db86e' },
  { path: 'src/assets/visuals/ShortSword1.png', stem: 'ShortSword1', bytes: 1749, width: 288, height: 64, sha256: 'fa7079aa8fe50569fb14cf4147515f45b0d78946cc87a2bdd46111a1ec350fbe' },
  { path: 'src/assets/visuals/Axe1.png', stem: 'Axe1', bytes: 2017, width: 288, height: 64, sha256: 'fb0f6093587573f5310c92162a0afdfa30bb4d587bd59b1f822b82a973721150' },
  { path: 'src/assets/visuals/Spear1.png', stem: 'Spear1', bytes: 731, width: 288, height: 64, sha256: '05816bbc1b07fbb6a8e7c38d2550d90e2d661c94ff1a6a87f3d825dd150c5268' },
  { path: 'src/assets/visuals/elemental_hammer_1.png', stem: 'elemental_hammer_1', bytes: 5629, width: 288, height: 64, sha256: '2ee7f9d24de5dff80c3dddc38dddddd63e37a7b1666ca388c0f26cd1e5fe6580' },
];
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
process.chdir(root);
const git = (...args) => execFileSync('git', ['--no-optional-locks', ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const paths = output => output.split('\0').filter(Boolean);
const failures = [];
const fail = (file, rule) => failures.push({ file, rule }); // Never print matched values.
const privatePath = /(^|\/)(prompts|node_modules|dist|coverage|test-results|playwright-report|\.git|\.codex|\.vscode|\.idea|\.ssh|\.aws|\.azure|\.kube|secrets|credentials|private|local-data)(\/|$)|(^|\/)(\.env(?:\..*)?|\.npmrc|\.netrc|id_rsa|id_ed25519)$|credentials.*\.json$|\.(pem|p12|pfx|key|p8|crt|cer|jks|keystore|har|dump|sql|log|tmp|bak|code-workspace)$/i;
const allowed = new Set([...publicFiles, ...publicAssets.map(asset => asset.path)]);

const currentRoot = resolve(git('rev-parse', '--show-toplevel').trim());
if (currentRoot !== root) fail('.', 'Git root does not match project root');
const tracked = paths(git('ls-files', '-z'));
const staged = paths(git('diff', '--cached', '--name-only', '-z'));
const untracked = paths(git('ls-files', '--others', '--exclude-standard', '-z'));
for (const file of new Set([...tracked, ...staged, ...untracked])) {
  if (!allowed.has(file) || privatePath.test(file)) fail(file, 'Outside public allowlist or sensitive/generated path');
}
for (const file of paths(git('ls-files', '--cached', '--ignored', '--exclude-standard', '-z'))) fail(file, 'Ignored file already in index');
for (const file of git('log', '--all', '--format=', '--name-only').split(/\r?\n/).filter(Boolean)) {
  if (privatePath.test(file)) fail(file, 'Sensitive/generated path in reachable history: stop for separately approved remediation');
}

const ignoreChecks = [
  'prompts/v0/19102026/r0a-repo-root-and-design-baseline.md',
  'prompts/v0/19102026/r0b-public-pages-and-safe-bootstrap.md',
  '.env', '.env.local', '.env.production', 'credentials.json', 'id_rsa', 'id_ed25519',
  'local.pem', 'local.key', '.npmrc', '.codex/local.json', '.vscode/settings.json',
  'private/data.json', 'node_modules/example.js', 'dist/index.html', 'test-results/example.png',
];
for (const file of ignoreChecks) {
  try { git('check-ignore', '-q', '--', file); }
  catch { fail(file, 'Required ignore rule ineffective'); }
}

const patterns = [
  ['Private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['AWS access identifier', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Google API key', /\bAIza[A-Za-z0-9_-]{30,}\b/],
  ['Live payment secret', /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/],
  ['Hardcoded credential-like assignment', /\b(?:api[_-]?key|secret|password|access[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_+/.=-]{12,}['"]/i],
  ['Personal email address', /\b[A-Z0-9._%+-]+@(?:gmail|outlook|hotmail|yahoo|icloud|student\.[A-Z0-9.-]+)\.[A-Z]{2,}\b/i],
  ['Personal home path', /(?:[A-Z]:\\Users\\|\/Users\/)[A-Za-z0-9_.-]+[\\/]/i],
];
function inspect(file, content) {
  for (const [rule, pattern] of patterns) if (pattern.test(content)) fail(file, rule);
}
for (const file of publicFiles) {
  if (!existsSync(file)) { fail(file, 'Missing allowlisted file'); continue; }
  if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) { fail(file, 'Not a regular source file'); continue; }
  inspect(file, readFileSync(file, 'utf8'));
}
// Binary PNGs are validated as bytes, not decoded as UTF-8 or exempted from checks.
function inspectAsset(file, bytes, expected) {
  if (bytes.length !== expected.bytes || bytes.length < 24
    || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    || bytes.subarray(12, 16).toString('ascii') !== 'IHDR'
    || bytes.readUInt32BE(16) !== expected.width || bytes.readUInt32BE(20) !== expected.height) {
    fail(file, 'Approved PNG signature, dimensions or byte count mismatch');
  }
  if (createHash('sha256').update(bytes).digest('hex') !== expected.sha256) fail(file, 'Approved PNG SHA-256 mismatch');
}
for (const asset of publicAssets) {
  if (!existsSync(asset.path)) { fail(asset.path, 'Missing allowlisted asset'); continue; }
  const info = lstatSync(asset.path);
  if (!info.isFile() || info.isSymbolicLink()) { fail(asset.path, 'Not a regular asset file'); continue; }
  inspectAsset(asset.path, readFileSync(asset.path), asset);
}
// Review the staged bytes as well: they can differ from the worktree.
for (const file of staged) {
  if (publicFiles.includes(file)) {
    try { inspect(`index:${file}`, git('show', `:${file}`)); }
    catch { fail(file, 'Staged deletion or unreadable staged content'); }
  } else {
    const asset = publicAssets.find(candidate => candidate.path === file);
    if (asset) {
      try { inspectAsset(`index:${file}`, execFileSync('git', ['--no-optional-locks', 'show', `:${file}`], { maxBuffer: 1024 * 1024 }), asset); }
      catch { fail(file, 'Staged deletion or unreadable staged asset'); }
    }
  }
}

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
for (const [name, pkg] of Object.entries(lock.packages ?? {})) {
  if (!name) continue;
  if (!pkg.resolved || !pkg.integrity) { fail('package-lock.json', 'Dependency without registry resolution/integrity'); continue; }
  const url = new URL(pkg.resolved);
  if (url.protocol !== 'https:' || url.hostname !== 'registry.npmjs.org' || url.username || url.password) fail('package-lock.json', 'Non-public registry resolution or embedded URL credentials');
}
const workflow = readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
const expectedActions = new Map([
  ['checkout', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
  ['setup-node', '949feb2413d6458794dcd2491c4babbbce0c15c1'],
  ['configure-pages', '45bfe0192ca1faeb007ade9deae92b16b8254a0d'],
  ['upload-pages-artifact', 'fc324d3547104276b827a68afc52ff2a11cc49c9'],
  ['deploy-pages', '368f82528645a54fb793d4d04e342629a3f51346'],
]);
const uses = [...workflow.matchAll(/uses:\s*([^\s#]+)/g)].map(match => match[1]);
if (uses.length !== expectedActions.size) fail('.github/workflows/deploy-pages.yml', 'Unexpected action count');
for (const action of uses) {
  const match = /^actions\/([\w-]+)@([a-f0-9]{40})$/.exec(action);
  if (!match || expectedActions.get(match[1]) !== match[2]) fail('.github/workflows/deploy-pages.yml', 'Unverified or mutable action reference');
}
if (!/path: dist\s/.test(workflow) || !/persist-credentials: false/.test(workflow)) fail('.github/workflows/deploy-pages.yml', 'Upload path or checkout credential policy changed');

const artifacts = [];
const artifactAssetCounts = new Map(publicAssets.map(asset => [asset.path, 0]));
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const absolute = resolve(directory, name);
    const info = lstatSync(absolute);
    const file = relative(root, absolute).split(sep).join('/');
    if (info.isSymbolicLink()) { fail(file, 'Symlink in artifact'); continue; }
    if (info.isDirectory()) walk(absolute);
    else {
      artifacts.push(file);
      const asset = publicAssets.find(candidate => new RegExp('^dist/assets/' + candidate.stem + '-[A-Za-z0-9_-]+\\.png$').test(file));
      if (asset) {
        inspectAsset(file, readFileSync(absolute), asset);
        artifactAssetCounts.set(asset.path, artifactAssetCounts.get(asset.path) + 1);
        continue;
      }
      if (!/^dist\/(?:index\.html|assets\/[A-Za-z0-9_-]+\.(?:js|css))$/.test(file)) fail(file, 'Unexpected artifact path');
      const content = readFileSync(absolute, 'utf8');
      inspect(file, content);
      if (/r0[ab]-(?:repo-root|public-pages)|prompts\/v0\/|sourceMappingURL=/.test(content)) fail(file, 'Internal prompt or source map reference in artifact');
    }
  }
}
if (!existsSync('dist/index.html')) fail('dist/index.html', 'Build before running security gate');
else {
  walk('dist');
  for (const asset of publicAssets) {
    if (artifactAssetCounts.get(asset.path) !== 1) fail(asset.path, 'Expected exactly one unchanged PNG in build artifacts');
  }
  const html = readFileSync('dist/index.html', 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\/laneforge-game\/assets\/[^"?#]+)"/g)].map(match => match[1]);
  if (assets.length < 2) fail('dist/index.html', 'Missing project-subpath JS/CSS references');
  for (const asset of assets) if (!existsSync(resolve('dist', asset.slice('/laneforge-game/'.length)))) fail('dist/index.html', 'Unresolved asset reference');
}

console.log(JSON.stringify({
  status: failures.length ? 'HOLD_PUSH_SECURITY' : 'PASS_HEURISTIC',
  candidateFiles: publicFiles.length + publicAssets.length, binaryAssets: publicAssets.length, trackedFiles: tracked.length, stagedFiles: staged.length,
  trackedPrompts: tracked.filter(file => /(^|\/)prompts\//.test(file)).length,
  ignoreChecks: ignoreChecks.length, artifacts, findings: failures,
  limits: 'Allowlist, filename/content heuristics and history filenames; not an exhaustive secret/PII/history audit. No matched values are logged.',
}, null, 2));
if (failures.length) process.exitCode = 1;
