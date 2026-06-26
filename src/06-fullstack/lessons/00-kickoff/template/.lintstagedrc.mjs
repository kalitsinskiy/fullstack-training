import path from 'node:path';

/**
 * Monorepo lint-staged: each app has its OWN eslint config (with type-aware
 * rules rooted at that app), so we can't lint from the repo root. For each
 * app's staged files we `cd` into the app and run eslint on just those files,
 * passed as paths relative to the app.
 */
const appScoped = (app) => (files) => {
  const rel = files.map((f) => path.relative(app, f)).join(' ');
  return `bash -c 'cd ${app} && npx eslint --fix ${rel}'`;
};

export default {
  'santa-api/**/*.ts': appScoped('santa-api'),
  'santa-notifications/**/*.ts': appScoped('santa-notifications'),
  'santa-app/**/*.{ts,tsx}': appScoped('santa-app'),
};
