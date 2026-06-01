import fs from 'fs';
import path from 'path';

function shouldAddJs(spec) {
  if (!spec.startsWith('.')) return false;
  if (spec.endsWith('.js') || spec.endsWith('.json') || spec.endsWith('.node')) return false;
  return true;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(/(from\s+['"])(\.\/|\.\.\/[^'"]*?)(['"])/g, (m, p1, p2, p3) => {
    const spec = p2;
    if (shouldAddJs(spec)) {
      return `${p1}${spec}.js${p3}`;
    }
    return m;
  });
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('Patched', filePath);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.js')) fixFile(full);
  }
}

const dist = path.join(process.cwd(), 'dist');
if (fs.existsSync(dist)) {
  walk(dist);
} else {
  console.error('No dist directory found');
  process.exitCode = 1;
}
