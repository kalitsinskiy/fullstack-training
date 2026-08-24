import { execSync } from 'node:child_process';

const apps = ['santa-api', 'santa-notifications', 'santa-app'];

for (const app of apps) {
  console.log(`▶ CI: ${app}`);
  execSync('npm run lint && npm run type-check && npm test', {
    cwd: app,
    stdio: 'inherit',
    shell: true,
  });
}
