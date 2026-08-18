import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/zhihu-profile.mjs";

function createResponse() {
  return {
    body: null,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

test("profile endpoint requires the server access secret", async () => {
  const originalSecret = process.env.ZHIHU_ACCESS_SECRET;
  delete process.env.ZHIHU_ACCESS_SECRET;
  const response = createResponse();

  await handler(
    { method: "POST", headers: {}, body: { profileUrl: "https://www.zhihu.com/people/demo" } },
    response,
  );

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.error, "知乎真实数据服务尚未配置。");

  if (originalSecret === undefined) {
    delete process.env.ZHIHU_ACCESS_SECRET;
  } else {
    process.env.ZHIHU_ACCESS_SECRET = originalSecret;
  }
});

test("profile endpoint rejects non-profile URLs", async () => {
  const originalSecret = process.env.ZHIHU_ACCESS_SECRET;
  process.env.ZHIHU_ACCESS_SECRET = "test-secret";
  const response = createResponse();

  await handler(
    { method: "POST", headers: {}, body: { profileUrl: "https://www.zhihu.com/question/123" } },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "请输入有效的知乎个人主页链接。");

  if (originalSecret === undefined) {
    delete process.env.ZHIHU_ACCESS_SECRET;
  } else {
    process.env.ZHIHU_ACCESS_SECRET = originalSecret;
  }
});

test("public profile analysis requires a display name", async () => {
  const originalSecret = process.env.ZHIHU_ACCESS_SECRET;
  process.env.ZHIHU_ACCESS_SECRET = "test-secret";
  const response = createResponse();

  await handler(
    {
      method: "POST",
      headers: {},
      body: { profileUrl: "https://www.zhihu.com/people/demo", scope: "public" },
    },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "分析公开账号时，请填写正确的知乎昵称。");

  if (originalSecret === undefined) {
    delete process.env.ZHIHU_ACCESS_SECRET;
  } else {
    process.env.ZHIHU_ACCESS_SECRET = originalSecret;
  }
});

test("public profile analysis aggregates exact-author search results", async () => {
  const originalSecret = process.env.ZHIHU_ACCESS_SECRET;
  const originalFetch = globalThis.fetch;
  process.env.ZHIHU_ACCESS_SECRET = "test-secret";
  const queries = [];

  globalThis.fetch = async (url, options) => {
    queries.push(url.searchParams.get("Query"));
    assert.equal(url.origin + url.pathname, "https://developer.zhihu.com/api/v1/content/zhihu_search");
    assert.equal(url.searchParams.get("Count"), "10");
    assert.equal(options.headers.Authorization, "Bearer test-secret");

    return new Response(
      JSON.stringify({
        Code: 0,
        Data: {
          Items: [
            {
              ContentType: "Answer",
              ContentID: "1",
              Url: "https://www.zhihu.com/question/1/answer/1",
              EditTime: 1745486539,
              VoteUpCount: 88,
              CommentCount: 9,
              Title: "创作者的代表回答",
              ContentText: "这是公开搜索返回的内容摘要。",
              AuthorName: "示例作者",
            },
            {
              ContentType: "Article",
              ContentID: "2",
              Url: "https://zhuanlan.zhihu.com/p/2",
              EditTime: 1745486000,
              VoteUpCount: 999,
              CommentCount: 30,
              Title: "同名提及内容",
              ContentText: "作者不是目标用户。",
              AuthorName: "其他作者",
            },
          ],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const response = createResponse();
  await handler(
    {
      method: "POST",
      headers: { origin: "https://antoniosu.github.io" },
      body: {
        profileUrl: "https://www.zhihu.com/people/example",
        scope: "public",
        displayName: "示例作者",
      },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries, ["示例作者 知乎作者"]);
  assert.equal(response.body.authorizationMode, "public-search");
  assert.equal(response.body.displayName, "示例作者");
  assert.equal(response.body.totalCount, 1);
  assert.equal(response.body.items.length, 1);
  assert.deepEqual(response.body.items[0], {
    id: "Answer:1",
    contentType: "answer",
    url: "https://www.zhihu.com/question/1/answer/1",
    createdAt: 1745486539,
    likeCount: 88,
    commentCount: 9,
    favoriteCount: 0,
    title: "创作者的代表回答",
    summary: "这是公开搜索返回的内容摘要。",
  });

  globalThis.fetch = originalFetch;
  if (originalSecret === undefined) {
    delete process.env.ZHIHU_ACCESS_SECRET;
  } else {
    process.env.ZHIHU_ACCESS_SECRET = originalSecret;
  }
});

test("profile endpoint merges recent and popular public content", async () => {
  const originalSecret = process.env.ZHIHU_ACCESS_SECRET;
  const originalFetch = globalThis.fetch;
  process.env.ZHIHU_ACCESS_SECRET = "test-secret";
  const requestedSortFields = [];

  globalThis.fetch = async (url, options) => {
    requestedSortFields.push(url.searchParams.get("SortField"));
    assert.equal(url.searchParams.get("ContentType"), "all");
    assert.equal(url.searchParams.get("SortOrder"), "desc");
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    assert.match(options.headers["X-Request-Timestamp"], /^\d+$/);

    const isRecent = url.searchParams.get("SortField") === "ts";
    return new Response(
      JSON.stringify({
        Code: 0,
        Message: "success",
        Data: {
          Items: [
            {
              ContentType: "answer",
              Url: "https://www.zhihu.com/question/1/answer/1",
              CreatedAt: 1745486539,
              LikeCount: isRecent ? 128 : 130,
              CommentCount: 12,
              FavoriteCount: 20,
              Title: "如何建立反馈循环？",
              Summary: "先测试，再复盘。",
            },
            ...(isRecent
              ? [
                  {
                    ContentType: "article",
                    Url: "https://zhuanlan.zhihu.com/p/2",
                    CreatedAt: 1745486000,
                    LikeCount: 80,
                    CommentCount: 4,
                    FavoriteCount: 35,
                    Title: "复盘方法",
                    Summary: "记录证据和下一步。",
                  },
                ]
              : []),
          ],
          Paging: { IsEnd: true, Totals: 26 },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const response = createResponse();
  await handler(
    {
      method: "POST",
      headers: { origin: "https://antoniosu.github.io" },
      body: { profileUrl: "https://www.zhihu.com/people/demo" },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(requestedSortFields.sort(), ["like_count", "ts"]);
  assert.equal(response.body.authorizationMode, "owner");
  assert.equal(response.body.totalCount, 26);
  assert.equal(response.body.items.length, 2);
  assert.deepEqual(response.body.items[0], {
    id: "https://www.zhihu.com/question/1/answer/1",
    contentType: "answer",
    url: "https://www.zhihu.com/question/1/answer/1",
    createdAt: 1745486539,
    likeCount: 130,
    commentCount: 12,
    favoriteCount: 20,
    title: "如何建立反馈循环？",
    summary: "先测试，再复盘。",
  });

  globalThis.fetch = originalFetch;
  if (originalSecret === undefined) {
    delete process.env.ZHIHU_ACCESS_SECRET;
  } else {
    process.env.ZHIHU_ACCESS_SECRET = originalSecret;
  }
});
