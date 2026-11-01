/**
 * Contract smoke test for the Portfolio & Blog API.
 * Run the API first (npm start), then in a second terminal:
 *
 *   npm run smoke
 *
 * Optional environment overrides:
 *   API_URL, ADMIN_EMAIL, ADMIN_PASSWORD, CLIENT_ORIGIN
 */
const BASE_URL = (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@portfolio.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

let passed = 0;
let failed = 0;
const failures = [];

function check(condition, label, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(label + (detail ? ` -> ${detail}` : ''));
    console.error(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function api(path, { method = 'GET', body, token, headers = {} } = {}) {
  const response = await fetch(BASE_URL + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data, headers: response.headers };
}

async function main() {
  console.log(`\nPortfolio & Blog API contract smoke test\nTarget: ${BASE_URL}\n`);
  const suffix = Date.now().toString(36);

  // --- health, root, CORS ---
  console.log('Health and CORS');
  let r = await api('/health');
  check(r.status === 200, 'GET /health -> 200', r.status);
  check(r.data?.db === 'connected', 'health reports MongoDB connected', JSON.stringify(r.data));

  r = await api('/');
  check(r.status === 200 && Boolean(r.data?.name), 'GET / -> API info');

  r = await api('/health', { headers: { Origin: CLIENT_ORIGIN } });
  check(
    r.headers.get('access-control-allow-origin') === CLIENT_ORIGIN,
    'CORS allows CLIENT_ORIGIN',
    r.headers.get('access-control-allow-origin')
  );

  const preflight = await fetch(`${BASE_URL}/api/blog`, {
    method: 'OPTIONS',
    headers: {
      Origin: CLIENT_ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization'
    }
  });
  check(preflight.status === 204 || preflight.status === 200, 'OPTIONS preflight succeeds', preflight.status);
  check(
    (preflight.headers.get('access-control-allow-headers') || '').toLowerCase().includes('authorization'),
    'preflight allows Authorization header'
  );

  // --- auth ---
  console.log('\nAuthentication');
  r = await api('/api/users/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  check(r.status === 200 && Boolean(r.data?.token), 'POST /api/users/login (admin)', JSON.stringify(r.data));
  const adminToken = r.data?.token;
  if (!adminToken) {
    console.error('\nCannot continue: admin login failed. Run "npm run seed" first.');
    process.exit(1);
  }

  r = await api('/api/users/me', { token: adminToken });
  check(r.status === 200 && r.data?.user?.role === 'admin', 'GET /api/users/me returns admin');
  check(!('password' in (r.data?.user || {})), 'password hash never returned');

  const userBody = {
    username: `smoke_${suffix}`,
    email: `smoke_${suffix}@example.com`,
    password: 'Smoke123!'
  };
  r = await api('/api/users/register', { method: 'POST', body: userBody });
  check(r.status === 201 && Boolean(r.data?.token), 'POST /api/users/register -> 201 + token', r.status);
  const userToken = r.data?.token;
  check(r.data?.user?.role === 'user', 'registered account role is user');

  r = await api('/api/users/register', { method: 'POST', body: userBody });
  check(r.status === 409, 'duplicate registration -> 409', r.status);

  r = await api('/api/users/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: 'wrong-password' } });
  check(r.status === 401, 'wrong password -> 401', r.status);

  r = await api('/api/users/login', { method: 'POST', body: { email: { $ne: null }, password: 'x' } });
  check(r.status === 400, 'object email is rejected -> 400', r.status);

  r = await api('/api/projects', { method: 'POST', body: { title: 'Nope project', description: 'Unauthorised attempt' } });
  check(r.status === 401, 'protected route without token -> 401', r.status);

  r = await api('/api/projects', { method: 'POST', body: { title: 'Nope project', description: 'Unauthorised attempt' }, token: 'invalid.token.value' });
  check(r.status === 401, 'invalid token -> 401', r.status);

  // --- public reads and populate ---
  console.log('\nPublic reads');
  r = await api('/api/projects');
  check(r.status === 200 && Array.isArray(r.data), 'GET /api/projects -> array');
  check(r.data?.length > 0, 'seeded projects exist (run npm run seed)', String(r.data?.length));
  check(Boolean(r.data?.[0]?.user?.username), 'project user username populated');

  r = await api('/api/blog');
  check(r.status === 200 && Array.isArray(r.data), 'GET /api/blog -> array');
  check(r.data?.length > 0, 'seeded blog posts exist (run npm run seed)', String(r.data?.length));
  check(Boolean(r.data?.[0]?.author?.username), 'post author username populated');

  // --- project CRUD + admin authorisation ---
  console.log('\nProject CRUD and admin authorisation');
  r = await api('/api/projects', {
    method: 'POST',
    body: { title: 'Smoke project', description: 'Created by the contract smoke test.' },
    token: userToken
  });
  check(r.status === 403, 'non-admin create project -> 403', r.status);

  r = await api('/api/projects', {
    method: 'POST',
    body: { title: 'Smoke project', description: 'Created by the contract smoke test.', repoUrl: 'not-a-url' },
    token: adminToken
  });
  check(r.status === 400, 'invalid https URL -> 400', r.status);

  r = await api('/api/projects', {
    method: 'POST',
    body: {
      title: `Smoke Test Project ${suffix}`,
      description: 'Created by the automated contract smoke test.',
      repoUrl: 'https://github.com/example/smoke-test'
    },
    token: adminToken
  });
  check(r.status === 201 && Boolean(r.data?._id), 'admin create project -> 201', r.status);
  const projectId = r.data?._id;
  check(r.data?.user?.username === 'kaicheng', 'created project owner populated');

  r = await api(`/api/projects/${projectId}`);
  check(r.status === 200 && String(r.data?.title).includes('Smoke Test Project'), 'GET project detail');

  r = await api(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: { title: `Smoke Test Project Updated ${suffix}` },
    token: adminToken
  });
  check(r.status === 200 && String(r.data?.title).includes('Updated'), 'admin update project', r.status);

  r = await api(`/api/projects/${projectId}`, { method: 'DELETE', token: adminToken });
  check(r.status === 204, 'admin delete project -> 204', r.status);

  r = await api(`/api/projects/${projectId}`);
  check(r.status === 404, 'deleted project -> 404', r.status);

  r = await api('/api/projects/not-an-id');
  check(r.status === 400, 'invalid project id -> 400', r.status);

  // --- blog CRUD + ownership ---
  console.log('\nBlog CRUD and ownership rules');
  r = await api('/api/blog', {
    method: 'POST',
    body: { title: `Smoke Post ${suffix}`, content: 'A short post created by the smoke test to verify the blog endpoints.' },
    token: userToken
  });
  check(r.status === 201 && Boolean(r.data?._id), 'authenticated user create post -> 201', r.status);
  const postId = r.data?._id;
  check(r.data?.author?.username === userBody.username, 'created post author populated');

  r = await api(`/api/blog/${postId}`);
  check(r.status === 200, 'GET post detail');
  check(Array.isArray(r.data?.comments), 'post detail includes comments array');

  r = await api(`/api/blog/${postId}`, {
    method: 'PUT',
    body: { title: 'Hijacked title' },
    token: adminToken
  });
  check(r.status === 403, 'non-author update post -> 403', r.status);

  r = await api(`/api/blog/${postId}`, { method: 'DELETE', token: adminToken });
  check(r.status === 403, 'non-author delete post -> 403', r.status);

  r = await api(`/api/blog/${postId}`, {
    method: 'PUT',
    body: { title: `Smoke Post Updated ${suffix}` },
    token: userToken
  });
  check(r.status === 200 && String(r.data?.title).includes('Updated'), 'author update post -> 200', r.status);

  // --- comments ---
  console.log('\nComments');
  r = await api(`/api/blog/${postId}/comments`, {
    method: 'POST',
    body: { body: 'Nice smoke test comment.' },
    token: userToken
  });
  check(r.status === 201 && Boolean(r.data?._id), 'create comment -> 201', r.status);
  const commentId = r.data?._id;

  r = await api(`/api/blog/${postId}/comments`);
  check(r.status === 200 && r.data?.some(comment => comment._id === commentId), 'GET comments contains new comment');
  check(Boolean(r.data?.[0]?.author?.username), 'comment author username populated');

  r = await api(`/api/blog/${postId}/comments`, { method: 'POST', body: { body: 'Anonymous comment' } });
  check(r.status === 401, 'anonymous comment -> 401', r.status);

  r = await api(`/api/blog/${postId}/comments`, { method: 'POST', body: { body: '' }, token: userToken });
  check(r.status === 400, 'empty comment -> 400', r.status);

  // --- contact ---
  console.log('\nContact endpoints');
  r = await api('/api/contact', {
    method: 'POST',
    body: { name: 'Smoke Tester', email: 'smoke-tester@example.com', message: 'Automated smoke test contact message.' }
  });
  check(r.status === 201 && Boolean(r.data?.id), 'POST /api/contact -> 201 receipt', r.status);

  r = await api('/api/contact');
  check(r.status === 401, 'inbox without token -> 401', r.status);

  r = await api('/api/contact', { token: userToken });
  check(r.status === 403, 'inbox as non-admin -> 403', r.status);

  r = await api('/api/contact', { token: adminToken });
  check(r.status === 200 && Array.isArray(r.data) && r.data.length > 0, 'admin inbox list');
  check(r.headers.get('cache-control') === 'no-store', 'inbox response is no-store');

  // --- body limits and unknown routes ---
  console.log('\nSecurity limits and 404s');
  const oversized = await fetch(`${BASE_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Big', email: 'big@example.com', message: 'x'.repeat(40000) })
  });
  check(oversized.status === 413, '32 KB JSON body limit -> 413', oversized.status);

  r = await api('/api/does-not-exist');
  check(r.status === 404, 'unknown route -> 404', r.status);

  // --- cleanup ---
  r = await api(`/api/blog/${postId}`, { method: 'DELETE', token: userToken });
  check(r.status === 204, 'author delete post -> 204', r.status);

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('Failures:');
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log('All contract checks passed.');
}

main().catch(error => {
  console.error('\nSMOKE TEST CRASHED:', error);
  process.exit(1);
});
