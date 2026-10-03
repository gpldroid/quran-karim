const repositoryName = "quran-karim";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

module.exports = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGitHubPages ? `/${repositoryName}` : "",
  assetPrefix: isGitHubPages ? `/${repositoryName}/` : "",
};
