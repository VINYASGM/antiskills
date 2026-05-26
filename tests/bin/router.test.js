/**
 * Router Tests
 * Tests dynamic task classification and agent role selection.
 */

describe('Router — routeTask', () => {
  let router;

  beforeEach(() => {
    const routerPath = require.resolve('../../bin/router.js');
    delete require.cache[routerPath];
    router = require('../../bin/router.js');
  });

  test('bug fix routes to backend + testing', () => {
    const result = router.routeTask('fix login validation bug');
    expect(result.roles).toContain('backend-engineer');
    expect(result.roles).toContain('testing-engineer');
    expect(result.roles.length).toBeLessThanOrEqual(3);
  });

  test('feature request routes to planner + engineer + testing', () => {
    const result = router.routeTask('add user profile page');
    expect(result.roles).toContain('planner');
    expect(result.roles).toContain('testing-engineer');
    expect(result.roles.length).toBeGreaterThanOrEqual(2);
  });

  test('documentation task routes to doc-writer only', () => {
    const result = router.routeTask('update README documentation');
    expect(result.roles).toContain('documentation-writer');
    expect(result.roles.length).toBeLessThanOrEqual(2);
  });

  test('security audit routes to security + code-reviewer', () => {
    const result = router.routeTask('security audit for auth module');
    expect(result.roles).toContain('security-reviewer');
    expect(result.roles).toContain('code-reviewer');
  });

  test('UI task routes to frontend + vlm-ui-reviewer', () => {
    const result = router.routeTask('fix CSS layout on dashboard');
    expect(result.roles).toContain('frontend-engineer');
    expect(result.roles).toContain('vlm-ui-reviewer');
  });

  test('refactor routes to architect + code-reviewer', () => {
    const result = router.routeTask('refactor database connection pool');
    expect(result.roles).toContain('architect');
    expect(result.roles).toContain('code-reviewer');
  });

  test('test task routes to testing-engineer', () => {
    const result = router.routeTask('add unit tests for auth service');
    expect(result.roles).toContain('testing-engineer');
  });

  test('returns parallel flag', () => {
    const result = router.routeTask('fix login bug');
    expect(typeof result.parallel).toBe('boolean');
  });
});
