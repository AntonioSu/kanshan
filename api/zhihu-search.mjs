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

function normalizeItem(item) {
  return {
    id: `${item.ContentType || "Content"}:${item.ContentID || item.Url}`,
    title: item.Title || "知乎内容",
    contentType: item.ContentType || "Content",
    contentText: item.ContentText || "",
    url: item.Url || "",
    commentCount: Number(item.CommentCount) || 0,
    voteUpCount: Number(item.VoteUpCount) || 0,
    authorName: item.AuthorName || "知乎用户",
    authorityLevel: item.AuthorityLevel || "",
  };
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

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const requestedCount = Number(body.count) || 6;
  const count = Math.min(10, Math.max(1, Math.trunc(requestedCount)));

  if (!query) {
    return sendError(response, 400, "请输入需要分析的问题。");
  }

  const url = new URL(ZHIHU_SEARCH_URL);
  url.searchParams.set("Query", query);
  url.searchParams.set("Count", String(count));

  try {
    const upstreamResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessSecret}`,
        "Content-Type": "application/json",
        "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
      },
    });
    const payload = await upstreamResponse.json();

    if (!upstreamResponse.ok || payload.Code !== 0) {
      const status = payload.Code === 20001 ? 401 : payload.Code === 30001 ? 429 : 502;
      const message =
        payload.Code === 20001
          ? "知乎接口鉴权失败，请检查 Access Secret。"
          : payload.Code === 30001
            ? "知乎接口调用频率已达上限，请稍后重试。"
            : "知乎接口暂时不可用，请稍后重试。";
      return sendError(response, status, message);
    }

    return response.status(200).json({
      items: (payload.Data?.Items || []).map(normalizeItem),
      searchHashId: payload.Data?.SearchHashId || "",
      emptyReason: payload.Data?.EmptyReason || "",
    });
  } catch {
    return sendError(response, 502, "连接知乎接口失败，请稍后重试。");
  }
}
