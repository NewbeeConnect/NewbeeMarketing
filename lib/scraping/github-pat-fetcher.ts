/**
 * GitHub PAT-authenticated repository fetcher.
 * Fetches repo structure, README, and package.json from private repos
 * using a Personal Access Token (no OAuth needed).
 */

type GitHubRepoInfo = {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  defaultBranch: string;
};

type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

/**
 * Parse a GitHub URL into owner and repo.
 */
function parseGithubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL format. Expected: https://github.com/owner/repo");
  }
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

/**
 * Make an authenticated GitHub API request.
 */
async function githubFetch(path: string, pat: string): Promise<Response> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "NewbeeMarketing-Bot/1.0",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (response.status === 401) {
    throw new Error("Invalid GitHub Personal Access Token");
  }
  if (response.status === 403) {
    throw new Error("GitHub API rate limit exceeded or insufficient permissions");
  }
  if (response.status === 404) {
    throw new Error("Repository not found. Check the URL and token permissions.");
  }

  return response;
}

/**
 * Fetch a file's content from a GitHub repo.
 */
async function fetchFileContent(owner: string, repo: string, path: string, pat: string): Promise<string | null> {
  try {
    const response = await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, pat);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.encoding === "base64" && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch repository info, file tree, README, and package.json using a PAT.
 * Assembles them into a single text document for code analysis.
 */
export async function fetchRepoWithPat(repoUrl: string, pat: string): Promise<{
  assembledText: string;
  repoName: string;
}> {
  const { owner, repo } = parseGithubUrl(repoUrl);

  // 1. Fetch repo metadata
  const repoResponse = await githubFetch(`/repos/${owner}/${repo}`, pat);
  if (!repoResponse.ok) {
    throw new Error(`Failed to fetch repository: ${repoResponse.status}`);
  }
  const repoInfo: GitHubRepoInfo = await repoResponse.json();

  // 2. Fetch file tree (recursive)
  const treeResponse = await githubFetch(
    `/repos/${owner}/${repo}/git/trees/${repoInfo.defaultBranch}?recursive=1`,
    pat
  );

  let fileTree = "";
  if (treeResponse.ok) {
    const treeData = await treeResponse.json();
    const items: GitHubTreeItem[] = treeData.tree ?? [];

    // Filter out common non-relevant files
    const skipPatterns = [
      /node_modules\//,
      /\.git\//,
      /dist\//,
      /build\//,
      /\.next\//,
      /coverage\//,
      /\.DS_Store/,
      /\.lock$/,
      /package-lock\.json/,
    ];

    const filteredItems = items.filter(
      (item) => !skipPatterns.some((pattern) => pattern.test(item.path))
    );

    fileTree = "File Tree:\n" + filteredItems
      .map((item) => `${item.type === "tree" ? "📁" : "📄"} ${item.path}`)
      .join("\n");
  }

  // 3. Fetch README
  const readme = await fetchFileContent(owner, repo, "README.md", pat)
    ?? await fetchFileContent(owner, repo, "readme.md", pat)
    ?? "";

  // 4. Fetch package.json (for dependencies)
  const packageJson = await fetchFileContent(owner, repo, "package.json", pat);

  // 5. Try to fetch other key files
  const appConfig = await fetchFileContent(owner, repo, "capacitor.config.ts", pat)
    ?? await fetchFileContent(owner, repo, "next.config.ts", pat)
    ?? await fetchFileContent(owner, repo, "next.config.js", pat)
    ?? "";

  // 6. Assemble into a single document
  const parts: string[] = [
    `# Repository: ${owner}/${repo}`,
    `Description: ${repoInfo.description ?? "No description"}`,
    `Primary Language: ${repoInfo.language ?? "Unknown"}`,
    repoInfo.topics.length > 0 ? `Topics: ${repoInfo.topics.join(", ")}` : "",
    "",
    fileTree,
    "",
  ];

  if (readme) {
    parts.push("# README", readme.slice(0, 50000), "");
  }

  if (packageJson) {
    parts.push("# package.json", packageJson, "");
  }

  if (appConfig) {
    parts.push("# App Config", appConfig, "");
  }

  return {
    assembledText: parts.filter(Boolean).join("\n"),
    repoName: repoInfo.name || repo,
  };
}
