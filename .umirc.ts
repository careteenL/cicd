import { defineConfig } from 'dumi';

const repo = 'cicd';
const ghPagesBase = process.env.NODE_ENV === 'production' ? `/${repo}/` : '/';

export default defineConfig({
  title: `@careteen/${repo}`,
  mode: 'site',
  hash: true,
  publicPath: ghPagesBase,
  base: ghPagesBase,
  navs: [
    null,
    {
      title: 'Github',
      path: 'https://github.com/careteenL/cicd',
    },
  ],
  // more config: https://d.umijs.org/config
});
