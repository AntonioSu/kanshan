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
