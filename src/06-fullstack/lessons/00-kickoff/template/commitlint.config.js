/**
 * Conventional Commits, enforced by the commit-msg hook (.husky/commit-msg).
 * Format:  <type>(<scope>): <subject>     e.g.  feat(rooms): add gift budget
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'ci',
        'perf',
      ],
    ],
    'subject-max-length': [2, 'always', 72],
  },
};
