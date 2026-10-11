const repo = 'nextjs-docs-sample';
const isPages = process.env.GITHUB_ACTIONS === 'true';

/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isPages ? `/${repo}` : '',
};
