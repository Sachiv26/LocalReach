import http from 'node:http';

function getCookies(res) {
  const raw = res.headers['set-cookie'];
  if (!raw) return '';
  return raw.map(s => s.split(';')[0]).join('; ');
}

async function test() {
  // Step 1: Get CSRF token
  const csrfRes = await new Promise((resolve, reject) => {
    http.get('http://localhost:3001/api/auth/csrf', (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ body: d, cookies: getCookies(res) }));
    }).on('error', reject);
  });
  const { csrfToken } = JSON.parse(csrfRes.body);
  console.log('1. CSRF token obtained:', csrfToken?.substring(0, 15) + '...');

  // Step 2: Login
  const loginBody = JSON.stringify({
    email: 'moderator@localreach.test',
    password: 'Demo1234!',
    csrfToken,
    json: true,
  });
  const loginRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginBody),
        Cookie: csrfRes.cookies,
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, cookies: getCookies(res), location: res.headers.location, body: d }));
    });
    req.on('error', reject);
    req.write(loginBody);
    req.end();
  });
  console.log('2. Login status:', loginRes.status, '→', loginRes.location);
  const allCookies = [csrfRes.cookies, loginRes.cookies].filter(Boolean).join('; ');

  // Step 3: Get session
  const sessionRes = await new Promise((resolve, reject) => {
    http.get('http://localhost:3001/api/auth/session', { headers: { Cookie: allCookies } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ body: d }));
    }).on('error', reject);
  });
  console.log('3. Session:', sessionRes.body);

  // Step 4: Test dashboard
  const dashRes = await new Promise((resolve, reject) => {
    http.get('http://localhost:3001/dashboard', { headers: { Cookie: allCookies } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.substring(0, 100) }));
    }).on('error', reject);
  });
  console.log('4. Dashboard status:', dashRes.status, 'contains "My Adverts":', dashRes.body.includes('My Adverts'));

  // Step 5: Test admin page
  const adminRes = await new Promise((resolve, reject) => {
    http.get('http://localhost:3001/admin', { headers: { Cookie: allCookies } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body: d.substring(0, 100) }));
    }).on('error', reject);
  });
  console.log('5. Admin status:', adminRes.status, '→', adminRes.location || '(no redirect)');
  console.log('   Contains "Moderation":', adminRes.body?.includes('Moderation'));
}

test().catch(console.error);
