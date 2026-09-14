/* Verifies pending-advert preview behaviour on /ads/[slug] */
const http = require("http");

const BASE = "http://localhost:3001";
const PENDING_SLUG = "test123456-8b0twh";
const PUBLISHED_SLUG = "3-bedroom-house-for-sale-umgeni-park";

function get(path, cookies) {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE}${path}`, { headers: cookies ? { cookie: cookies } : {} }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, location: res.headers.location, body })
        );
      })
      .on("error", reject);
  });
}

function post(path, data, cookies) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = { "content-type": "application/json", "content-length": Buffer.byteLength(payload) };
    if (cookies) headers.cookie = cookies;
    const req = http.request(
      `${BASE}${path}`,
      { method: "POST", headers },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/** NextAuth credentials flow: csrf -> callback -> session cookie (with retries for cold dev compile) */
async function getJsonWithRetry(path, tries = 8) {
  for (let i = 0; i < tries; i++) {
    const res = await get(path);
    if (res.status === 200 && res.body.trim().startsWith("{")) {
      return { status: res.status, json: JSON.parse(res.body), setCookie: res.headers["set-cookie"] };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`GET ${path} never returned JSON`);
}

async function login(email, password) {
  const csrf = await getJsonWithRetry("/api/auth/csrf");
  const { csrfToken } = csrf.json;
  const preCookie = (csrf.setCookie || []).map((c) => c.split(";")[0]).join("; ");
  const res = await post(
    "/api/auth/callback/credentials",
    { email, password, csrfToken, callbackUrl: `${BASE}/dashboard`, json: true },
    preCookie
  );
  const setCookies = res.headers["set-cookie"] || [];
  const sessionCookie = setCookies
    .map((c) => c.split(";")[0])
    .filter((c) => c.includes("session-token") || c.includes("next-auth.session-token"))
    .join("; ");
  if (!sessionCookie) {
    throw new Error(`login failed for ${email} (POST status ${res.status})`);
  }
  // sanity: session endpoint must identify the user
  const sess = await get("/api/auth/session", sessionCookie);
  const sessJson = JSON.parse(sess.body || "{}");
  if (!sessJson.user) throw new Error(`session not established for ${email}`);
  return sessionCookie;
}

(async () => {
  // 1. Anonymous: pending advert must 404, published must 200
  const anonPending = await get(`/ads/${PENDING_SLUG}`);
  console.log(`anonymous  pending   -> ${anonPending.status} ${anonPending.status === 404 ? "(404 as intended)" : "UNEXPECTED"}`);
  const anonPub = await get(`/ads/${PUBLISHED_SLUG}`);
  console.log(`anonymous  published -> ${anonPub.status}`);

  // 2. Owner of the community: pending advert should render preview with banner
  const ownerCookie = await login("owner@localreach.test", "Demo1234!");
  const ownerPending = await get(`/ads/${PENDING_SLUG}`, ownerCookie);
  console.log(`owner      pending   -> ${ownerPending.status} banner=${ownerPending.body.includes("Awaiting moderation")}`);

  // 3. Moderator: also gets preview
  const modCookie = await login("moderator@localreach.test", "Demo1234!");
  const modPending = await get(`/ads/${PENDING_SLUG}`, modCookie);
  console.log(`moderator  pending   -> ${modPending.status} banner=${modPending.body.includes("Awaiting moderation")}`);

  // 4. Unrelated member (thandi): should still 404 unless she owns the ad
  const thandiCookie = await login("thandi@example.com", "Demo1234!");
  const thandiPending = await get(`/ads/${PENDING_SLUG}`, thandiCookie);
  console.log(`thandi     pending   -> ${thandiPending.status} ${thandiPending.status === 404 ? "(404 — not owner)" : "(owner preview)"}`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
