import http from 'node:http';

function getCsrf() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001/api/auth/csrf', (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        const csrf = JSON.parse(d).csrfToken;
        const cookie = res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
        resolve({ csrf, cookie });
      });
    }).on('error', reject);
  });
}

function postLogin(csrf, cookie) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      csrfToken: csrf,
      email: 'admin@localreach.test',
      password: 'Admin123!',
      callbackUrl: '/dashboard',
      json: 'true',
    });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/callback/credentials',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          Cookie: cookie,
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: d,
          });
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getSession(cookie) {
  return new Promise((resolve, reject) => {
    http.get(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/session',
        headers: { Cookie: cookie },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    ).on('error', reject);
  });
}

const { csrf, cookie } = await getCsrf();
console.log('CSRF obtained:', csrf.substring(0, 20) + '...');

const login = await postLogin(csrf, cookie);
console.log('Login status:', login.status);
const cookies = login.headers['set-cookie'];
if (cookies) {
  console.log('Cookies set:', cookies.length);
  cookies.forEach((c) => console.log('  ', c.split(';')[0]));
}

// Now try to get session with the new cookies
const allCookies = cookie;
const session = await getSession(allCookies);
console.log('Session status:', session.status);
console.log('Session body:', session.body.substring(0, 500));
