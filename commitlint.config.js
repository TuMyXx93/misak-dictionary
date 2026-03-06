export default {
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
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // Workspace scopes (monorepo apps/packages)
        'web-client',
        'backend',
        'shared',
        // Operational scopes
        'deps',
        'release',
        // Domain scopes
        'agents',
        'ci',
        'config',
        'infra',
      ],
    ],
    'scope-empty': [1, 'never'],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 200],
  },
};
