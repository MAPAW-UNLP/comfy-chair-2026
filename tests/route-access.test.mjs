import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { build } from 'esbuild';

// Exercise the actual navigation guard with API responses and browser storage.
const bundle = await build({
  entryPoints: ['src/lib/routeAccess.ts'], bundle: true, write: false, format: 'esm',
  plugins: [{ name: 'navigation-dependencies', setup(builder) {
    builder.onResolve({ filter: /^(axios|@tanstack\/react-router|@\/services\/api)$/ }, ({ path }) => ({ path, namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, ({ path }) => ({ contents:
      path === 'axios' ? 'export default { isAxiosError: e => e?.isAxiosError === true };' :
      path === '@tanstack/react-router' ? 'export const redirect = options => ({ isRedirect: true, ...options });' :
      'export default { get: (...args) => globalThis.accessTest.get(...args) };',
    }));
  } }],
});
const { requireRouteAccess } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const user = { id: '1', role: 'user' };
let access, storage, calls;
beforeEach(() => {
  access = {
    chair_conference_ids: [], chair_session_ids: [], reviewer_conference_ids: [],
    author_conference_ids: [], author_article_ids: [], reviewer_article_ids: [], invitation_ids: [],
  };
  storage = new Map(); calls = [];
  globalThis.window = { location: { origin: 'http://localhost' } };
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null };
  globalThis.accessTest = { get: async path => {
    calls.push(path);
    if (path === '/user/access/') return { data: access };
    if (path === '/api/article/10/') return { data: { session: { conference: { id: 2 } } } };
    if (path === '/api/session/20/') return { data: { conference: { id: 2 } } };
    if (path === '/api/reviewer/articles/10/assignment/') return { data: { assigned: true } };
    throw { isAxiosError: true, response: { status: 403 } };
  } };
});
const denied = path => assert.rejects(requireRouteAccess(user, path), error => error.isRedirect && error.to === '/dashboard');

test('direct chair conference URL redirects an author before loading its data', async () => {
  access.author_conference_ids = [2];
  await denied('/chairs/conference/2/sessions');
  assert.deepEqual(calls, ['/user/access/']);
});
test('chair role in another conference grants no access', async () => {
  access.chair_conference_ids = [3];
  await denied('/chairs/conference/2/sessions');
});
test('encoded conference IDs cannot bypass the conference check', async () => {
  access.chair_conference_ids = [3]; access.chair_session_ids = [30];
  storage.set('selectedSession', '30');
  await denied('/chairs/conference/%32/sessions');
  await denied('/articles/%32');
});
test('roles accumulate within the same conference', async () => {
  access.chair_conference_ids = access.author_conference_ids = access.reviewer_conference_ids = [2];
  storage.set('comfychair:selectedRole', JSON.stringify({ role: 'autor', conferenceId: 2 }));
  await requireRouteAccess(user, '/chairs/conference/2/sessions');
  await requireRouteAccess(user, '/articles/2');
  await requireRouteAccess(user, '/reviewer');
});
test('all chair panel routes reject ordinary users', async () => {
  for (const path of ['/chairs/select-session', '/chairs/panel-session', '/chairs/reviewers',
    '/chairs/configuration?conferenceId=2', '/chairs/selection/selection-method',
    '/chairs/selection/reviewed-article-list?status=accepted', '/review/chair/reviewed', '/article/assign/10']) {
    await denied(path);
  }
});
test('stored session is a selector and does not grant permission', async () => {
  storage.set('selectedSession', '20'); access.chair_session_ids = [30];
  await denied('/chairs/panel-session');
  access.chair_session_ids = [20];
  await requireRouteAccess(user, '/chairs/panel-session');
});
test('chair article details verify the articles conference', async () => {
  access.chair_conference_ids = [3];
  await denied('/review/chair/10');
  access.chair_conference_ids = [2];
  await requireRouteAccess(user, '/article/assign/10');
});
test('reviewer pages reject an author even with forged role storage', async () => {
  storage.set('comfychair:selectedRole', JSON.stringify({ role: 'revisor', conferenceId: 2 }));
  access.author_conference_ids = [2];
  for (const path of ['/reviewer', '/reviewer/history', '/reviewer/assigned', '/reviewer/bidding?conferenceId=2']) await denied(path);
});
test('reviewer URL cannot override scope using a foreign session', async () => {
  access.reviewer_conference_ids = [3];
  await denied('/reviewer/bidding?conferenceId=3&sessionId=20');
});
test('review form requires an active assignment and server conflict checks', async () => {
  access.reviewer_conference_ids = [2];
  await denied('/reviewer/review/10');
  access.reviewer_article_ids = [10];
  await requireRouteAccess(user, '/reviewer/review/10');
  assert.equal(calls.at(-1), '/api/reviewer/articles/10/assignment/');
});
test('invitation recipients can respond before receiving a reviewer role', async () => {
  access.invitation_ids = [4];
  await requireRouteAccess(user, '/reviewer/invitations');
  await requireRouteAccess(user, '/reviewer/invitations/4');
  await denied('/reviewer/invitations/5');
});
test('author sections require conference role and article ownership', async () => {
  access.author_conference_ids = [2]; access.author_article_ids = [10];
  await requireRouteAccess(user, '/articles/2');
  await requireRouteAccess(user, '/article/edit/10');
  await denied('/articles/3'); await denied('/article/history/11');
});
test('shared article detail redirects when the API denies access', async () => {
  await denied('/article/detail/11');
});
test('role removal takes effect on the next navigation', async () => {
  access.chair_conference_ids = [2];
  await requireRouteAccess(user, '/chairs/conference/2/sessions');
  access.chair_conference_ids = [];
  await denied('/chairs/conference/2/sessions');
});
test('server errors fail closed without treating them as a role denial', async () => {
  globalThis.accessTest.get = async () => { throw new Error('API unavailable'); };
  await assert.rejects(requireRouteAccess(user, '/chairs/conference/2/sessions'), /API unavailable/);
});
test('admin and the deferred first submission flow retain their behavior', async () => {
  await requireRouteAccess({ ...user, role: 'admin' }, '/chairs/conference/2/sessions');
  await requireRouteAccess(user, '/article/create?conferenceId=2');
  await requireRouteAccess(user, '/article/select');
  await requireRouteAccess(user, '/dashboard');
  assert.deepEqual(calls, []);
});
