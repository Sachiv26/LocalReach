import { spawn } from 'node:child_process';
import http from 'node:http';

const proc = spawn('node', ['node_modules/next/dist/bin/next', 'dev'], { stdio: ['ignore','pipe','pipe'] });
let ready = false;
proc.stdout.on('data', d => {
  const s = d.toString();
  process.stdout.write(s);
  if (s.includes('Ready')) ready = true;
});
proc.stderr.on('data', d => process.stderr.write(d));

async function waitFor(fn, ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { if (await fn()) return true; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

const ok = waitFor(() => get('http://localhost:3000/ads').then(r => r.status === 200).catch(() => false));
await ok;
const r = await get('http://localhost:3000/ads');
console.log(`\n\nSTATUS: ${r.status}`);
console.log('Has "Browse Local Ads":', r.body.includes('Browse Local Ads'));
console.log('Has sort options:', r.body.includes('price_asc'));
console.log('Has ad card:', r.body.includes('R') || r.body.includes('Free'));
console.log('Has client component marker:', r.body.includes('SortSelect') || r.body.includes('Newest'));

proc.kill('SIGTERM');
process.exit(0);
