const ZHIHU_USER_CONTENTS_URL = "https://developer.zhihu.com/api/v1/user/contents";
const ZHIHU_SEARCH_URL = "https://developer.zhihu.com/api/v1/content/zhihu_search";
const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://antoniosu.github.io",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
]);

function applyCors(request, response) {
  const origin = request.headers?.origin;
  const configuredOrigin = process.env.ALLOWED_ORIGIN;

  if (origin && (DEFAULT_ALLOWED_ORIGINS.has(origin) || origin === configuredOrigin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function readBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
}

function sendError(response, status, error) {
  return response.status(status).json({ error });
}

function parseProfileUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const hostname = url.hostname.toLowerCase();
    const match = url.pathname.match(/^\/people\/([^/]+)\/?$/);

    if ((hostname !== "www.zhihu.com" && hostname !== "zhihu.com") || !match) {
      return null;
    }

    return `https://www.zhihu.com/people/${match[1]}`;
  } catch {
    return null;
  }
}

function normalizeItem(item) {
  return {
    id: item.Url || `${item.ContentType || "content"}:${item.CreatedAt || item.Title}`,
    contentType: String(item.ContentType || "content").toLowerCase(),
    url: item.Url || "",
    createdAt: Number(item.CreatedAt) || 0,
    likeCount: Number(item.LikeCount) || 0,
    commentCount: Number(item.CommentCount) || 0,
    favoriteCount: Number(item.FavoriteCount) || 0,
    title: item.Title || "知乎内容",
    summary: item.Summary || "",
  };
}

function normalizeSearchItem(item) {
  return {
    id: `${item.ContentType || "content"}:${item.ContentID || item.Url}`,
    contentType: String(item.ContentType || "content").toLowerCase(),
    url: item.Url || "",
    createdAt: Number(item.EditTime) || 0,
    likeCount: Number(item.VoteUpCount) || 0,
    commentCount: Number(item.CommentCount) || 0,
    favoriteCount: 0,
    title: item.Title || "知乎内容",
    summary: item.ContentText || "",
    authorName: item.AuthorName || "",
  };
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function upstreamError(payload) {
  if (payload.Code === 20001) {
    return { status: 401, message: "知乎接口鉴权失败，请检查 Access Secret。" };
  }

  if (payload.Code === 30001 || payload.Code === 30002) {
    return { status: 429, message: "知乎接口调用额度已达上限，请稍后重试。" };
  }

  return { status: 502, message: "知乎用户内容接口暂时不可用，请稍后重试。" };
}

async function fetchContents(accessSecret, sortField, limit) {
  const url = new URL(ZHIHU_USER_CONTENTS_URL);
  url.searchParams.set("ContentType", "all");
  url.searchParams.set("Limit", String(limit));
  url.searchParams.set("SortField", sortField);
  url.searchParams.set("SortOrder", "desc");

  const upstreamResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessSecret}`,
      "Content-Type": "application/json",
      "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
    },
  });
  const payload = await upstreamResponse.json();

  if (!upstreamResponse.ok || payload.Code !== 0) {
    throw upstreamError(payload);
  }

  return {
    items: (payload.Data?.Items || []).map(normalizeItem),
    totalCount: Number(payload.Data?.Paging?.Totals) || 0,
  };
}

async function searchByAuthor(accessSecret, displayName) {
  const query = `${displayName} 知乎作者`;
  const expectedAuthor = normalizeName(displayName);
  const url = new URL(ZHIHU_SEARCH_URL);
  url.searchParams.set("Query", query);
  url.searchParams.set("Count", "10");
  const upstreamResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessSecret}`,
      "Content-Type": "application/json",
      "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
    },
  });
  const payload = await upstreamResponse.json();

  if (!upstreamResponse.ok || payload.Code !== 0) {
    throw upstreamError(payload);
  }

  const results = (payload.Data?.Items || [])
    .map(normalizeSearchItem)
    .filter((item) => normalizeName(item.authorName) === expectedAuthor);
  const mergedItems = new Map();
  results.forEach((item) => {
    if (item.url) {
      mergedItems.set(item.url, item);
    }
  });

  return [...mergedItems.values()].map(({ authorName: _authorName, ...item }) => item);
}

export default async function handler(request, response) {
  applyCors(request, response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    return sendError(response, 405, "只支持 POST 请求。");
  }

  const accessSecret = process.env.ZHIHU_ACCESS_SECRET;
  if (!accessSecret) {
    return sendError(response, 503, "知乎真实数据服务尚未配置。");
  }

  let body;
  try {
    body = readBody(request.body);
  } catch {
    return sendError(response, 400, "请求内容不是有效 JSON。");
  }

  const profileUrl = parseProfileUrl(body.profileUrl);
  if (!profileUrl) {
    return sendError(response, 400, "请输入有效的知乎个人主页链接。");
  }

  const scope = body.scope === "public" ? "public" : "owner";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";

  if (scope === "public" && (!displayName || displayName.length > 40)) {
    return sendError(response, 400, "分析公开账号时，请填写正确的知乎昵称。");
  }

  try {
    if (scope === "public") {
      const items = await searchByAuthor(accessSecret, displayName);
      if (!items.length) {
        return sendError(
          response,
          404,
          "没有检索到该昵称发布的公开内容。请核对主页显示昵称，或改用授权账号分析。",
        );
      }

      return response.status(200).json({
        profileUrl,
        displayName,
        authorizationMode: "public-search",
        coverageNote: `通过一次作者定向搜索找到 ${items.length} 条昵称完全匹配的公开结果；不代表完整主页，搜索接口不提供收藏数。`,
        totalCount: items.length,
        items,
      });
    }

    const [recent, popular] = await Promise.all([
      fetchContents(accessSecret, "ts", 50),
      fetchContents(accessSecret, "like_count", 20),
    ]);
    const mergedItems = new Map();
    [...recent.items, ...popular.items].forEach((item) => {
      if (item.url) {
        mergedItems.set(item.url, item);
      }
    });

    return response.status(200).json({
      profileUrl,
      displayName,
      authorizationMode: "owner",
      coverageNote: "通过用户内容接口获取当前 Access Secret 所属账号的近期与高赞公开创作。",
      totalCount: Math.max(recent.totalCount, popular.totalCount),
      items: [...mergedItems.values()],
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      return sendError(response, error.status, error.message);
    }

    return sendError(response, 502, "连接知乎用户内容接口失败，请稍后重试。");
  }
}
