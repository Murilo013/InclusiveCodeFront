import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PullRequestIssue = {
  filename?: string;
  line?: number | null;
  snippet?: string;
  issue?: string;
  improvement?: string;
};

type PullRequestPayload = {
  repoUrl?: string;
  title?: string;
  body?: string;
  baseBranch?: string;
  issues?: PullRequestIssue[];
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asMessage(value: unknown) {
  if (!isObjectRecord(value)) return undefined;
  return typeof value.message === "string" ? value.message : undefined;
}

function getStringProp(value: unknown, key: string) {
  if (!isObjectRecord(value)) return undefined;
  const prop = value[key];
  return typeof prop === "string" ? prop : undefined;
}

function getNumberProp(value: unknown, key: string) {
  if (!isObjectRecord(value)) return undefined;
  const prop = value[key];
  return typeof prop === "number" ? prop : undefined;
}

function getUnknownProp(value: unknown, key: string) {
  if (!isObjectRecord(value)) return undefined;
  return value[key];
}

function parseGitHubRepo(url: string) {
  try {
    const normalizedUrl = url.endsWith(".git") ? url.slice(0, -4) : url;
    const parsed = new URL(normalizedUrl);

    if (parsed.hostname.toLowerCase() !== "github.com") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    return {
      owner: parts[0],
      repo: parts[1],
    };
  } catch {
    return null;
  }
}

function normalizeRepoFilePath(rawPath?: string) {
  if (!rawPath) return "";

  const trimmed = rawPath.trim().replace(/^['\"]|['\"]$/g, "");
  const noLineSuffix = trimmed.replace(/:(\d+)$/, "");

  return noLineSuffix
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/\s+/g, " ");
}

function decodeBase64Utf8(input: string) {
  return Buffer.from(input, "base64").toString("utf8");
}

function encodeBase64Utf8(input: string) {
  return Buffer.from(input, "utf8").toString("base64");
}

function buildPullRequestBody(defaultBody: string | undefined, issues: PullRequestIssue[]) {
  if (defaultBody && defaultBody.trim().length > 0) {
    return defaultBody;
  }

  const lines: string[] = [
    "## InclusiveCode - Correcoes automáticas de acessibilidade",
    "",
    "Este PR foi gerado automaticamente com base na análise de acessibilidade.",
    "",
    "### Itens considerados",
  ];

  issues.slice(0, 20).forEach((item, index) => {
    const path = normalizeRepoFilePath(item.filename) || "arquivo-desconhecido";
    const problem = item.issue?.trim() || "Problema de acessibilidade";
    lines.push(`${index + 1}. ${path}: ${problem}`);
  });

  if (issues.length > 20) {
    lines.push(`... e mais ${issues.length - 20} item(ns).`);
  }

  return lines.join("\n");
}

async function githubRequest<T>(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "inclusive-code-app",
      ...(init?.headers ?? {}),
    },
  });

  const raw = await response.text();
  let data: T | { message?: string } | null = null;

  if (raw) {
    try {
      data = JSON.parse(raw) as T | { message?: string };
    } catch {
      data = { message: raw };
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return NextResponse.json({ message: "Token do GitHub ausente." }, { status: 401 });
  }

  const body = (await req.json()) as PullRequestPayload;
  const repoUrl = body.repoUrl?.trim();

  if (!repoUrl) {
    return NextResponse.json({ message: "URL do repositório é obrigatória." }, { status: 400 });
  }

  const parsedRepo = parseGitHubRepo(repoUrl);
  if (!parsedRepo) {
    return NextResponse.json({ message: "URL inválida. Use um repositório github.com/owner/repo." }, { status: 400 });
  }

  const owner = parsedRepo.owner;
  const repo = parsedRepo.repo;

  const repoDetails = await githubRequest<{ default_branch?: string; private?: boolean; permissions?: Record<string, boolean> }>(
    `https://api.github.com/repos/${owner}/${repo}`,
    token
  );

  const repoData = repoDetails.data;

  if (!repoDetails.ok || !isObjectRecord(repoData)) {
    const message = asMessage(repoDetails.data) ?? "Não foi possível acessar o repositório no GitHub.";
    return NextResponse.json({ message }, { status: repoDetails.status || 403 });
  }

  const defaultBranchCandidate = getStringProp(repoData, "default_branch");
  const defaultBranch =
    defaultBranchCandidate && defaultBranchCandidate.trim().length > 0
      ? defaultBranchCandidate
      : undefined;

  const resolvedBaseBranch = body.baseBranch?.trim() || defaultBranch || "main";

  const baseRef = await githubRequest(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(resolvedBaseBranch)}`,
    token
  );

  const baseRefData = baseRef.data;
  const baseRefObject = getUnknownProp(baseRefData, "object");
  const baseSha = getStringProp(baseRefObject, "sha");
  if (!baseRef.ok || !baseSha) {
    const message = asMessage(baseRef.data) ?? "Não foi possível ler a branch base do repositório.";
    return NextResponse.json({ message }, { status: baseRef.status || 400 });
  }

  let branchName = `inclusivecode/a11y-${Date.now()}`;

  const branchCreation = await githubRequest(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    }
  );

  if (!branchCreation.ok) {
    branchName = `${branchName}-${Math.floor(Math.random() * 10000)}`;

    const retryCreation = await githubRequest(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      }
    );

    if (!retryCreation.ok) {
      const message = asMessage(retryCreation.data) ?? "Não foi possível criar branch para as correções.";
      return NextResponse.json({ message }, { status: retryCreation.status || 400 });
    }
  }

  const issues = Array.isArray(body.issues) ? body.issues : [];

  const issuesByFile = new Map<string, PullRequestIssue[]>();
  issues.forEach((item) => {
    const path = normalizeRepoFilePath(item.filename);
    if (!path) return;

    if (!item.improvement || item.improvement.trim().length === 0) {
      return;
    }

    const existing = issuesByFile.get(path) ?? [];
    existing.push(item);
    issuesByFile.set(path, existing);
  });

  let changedFiles = 0;
  const skippedFiles: string[] = [];

  for (const [path, fileIssues] of issuesByFile.entries()) {
    const fileResponse = await githubRequest(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branchName)}`,
      token
    );

    const fileData = fileResponse.data;
    const fileEncoding = getStringProp(fileData, "encoding");
    const fileSha = getStringProp(fileData, "sha");
    const fileContent = getStringProp(fileData, "content");

    if (!fileResponse.ok || fileEncoding !== "base64" || !fileSha || !fileContent) {
      skippedFiles.push(path);
      continue;
    }

    const currentContent = decodeBase64Utf8(fileContent);
    let updatedContent = currentContent;

    fileIssues.forEach((issue) => {
      const snippet = issue.snippet?.trim();
      const improvement = issue.improvement?.trim();
      const line = typeof issue.line === "number" ? issue.line : null;

      if (!improvement) return;

      if (snippet && updatedContent.includes(snippet)) {
        updatedContent = updatedContent.replace(snippet, improvement);
        return;
      }

      if (line && line > 0) {
        const lines = updatedContent.split("\n");
        const index = line - 1;
        if (index >= 0 && index < lines.length) {
          lines[index] = improvement;
          updatedContent = lines.join("\n");
        }
      }
    });

    if (updatedContent === currentContent) {
      skippedFiles.push(path);
      continue;
    }

    const updateResponse = await githubRequest(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `InclusiveCode: aplicar correcoes sugeridas em ${path}`,
          content: encodeBase64Utf8(updatedContent),
          sha: fileSha,
          branch: branchName,
        }),
      }
    );

    if (updateResponse.ok) {
      changedFiles += 1;
    } else {
      skippedFiles.push(path);
    }
  }

  if (changedFiles === 0) {
    const fallbackFilePath = `.inclusivecode/sugestoes-a11y-${Date.now()}.md`;
    const fallbackContent = [
      "# Sugestoes de acessibilidade",
      "",
      "Nenhum trecho foi alterado automaticamente. Confira os pontos abaixo:",
      "",
      ...issues.map((item, index) => {
        const file = normalizeRepoFilePath(item.filename) || "arquivo-desconhecido";
        const problem = item.issue?.trim() || "Problema sem descrição";
        const suggestion = item.improvement?.trim() || "Sem sugestão de melhoria.";
        return `${index + 1}. **${file}**\n   - Problema: ${problem}\n   - Sugestão: ${suggestion}`;
      }),
    ].join("\n");

    await githubRequest(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(fallbackFilePath)}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({
          message: "docs(a11y): adicionar relatorio de melhorias sugeridas",
          content: encodeBase64Utf8(fallbackContent),
          branch: branchName,
        }),
      }
    );
    changedFiles = 1;
  }

  const pullRequest = await githubRequest(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        title:
          body.title?.trim() ||
          `chore(a11y): aplicar correções sugeridas (${new Date().toISOString().slice(0, 10)})`,
        head: branchName,
        base: resolvedBaseBranch,
        body: buildPullRequestBody(body.body, issues),
        maintainer_can_modify: true,
      }),
    }
  );

  if (!pullRequest.ok || !pullRequest.data) {
    const message = asMessage(pullRequest.data) ?? "Não foi possível criar o Pull Request.";
    return NextResponse.json(
      {
        message,
        branchName,
        changedFiles,
      },
      { status: pullRequest.status || 400 }
    );
  }

  const pullRequestData = pullRequest.data;
  const pullRequestUrl = getStringProp(pullRequestData, "html_url");
  const pullRequestNumber = getNumberProp(pullRequestData, "number");

  return NextResponse.json({
    message: "Pull Request criado com sucesso.",
    pullRequestUrl,
    pullRequestNumber,
    branchName,
    baseBranch: resolvedBaseBranch,
    changedFiles,
    skippedFiles,
  });
}
