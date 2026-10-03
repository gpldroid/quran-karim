/** @type {import('next').NextConfig} */
const repo = "quran-karim";
const isPages = process.env.GITHUB_ACTIONS === "true";
export default {
  output:"export",
  trailingSlash:true,
  images:{unoptimized:true},
  basePath:isPages?`/${repo}`:"",
  assetPrefix:isPages?`/${repo}/`:""
};
