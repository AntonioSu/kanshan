import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/zhihu-search.mjs";

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

test("returns a clear error when the access secret is missing", async () => {
  const originalSecret = process.env.ZHIHU_ACCESS_SECRET;
  delete process.env.ZHIHU_ACCESS_SECRET;
  const response = createResponse();

  await handler({ method: "POST", headers: {}, body: { query: "学习效率" } }, response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.error, "知乎真实数据服务尚未配置。");
  process.env.ZHIHU_ACCESS_SECRET = originalSecret;
});

test("forwards the official headers and normalizes Zhihu results", async () => {
  const originalSecret = process.env.ZHIHU_ACCESS_SECRET;
  const originalFetch = globalThis.fetch;
  process.env.ZHIHU_ACCESS_SECRET = "test-secret";

  globalThis.fetch = async (url, options) => {
    assert.equal(url.searchParams.get("Query"), "学习效率");
    assert.equal(url.searchParams.get("Count"), "10");
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    assert.match(options.headers["X-Request-Timestamp"], /^\d+$/);

    return new Response(
      JSON.stringify({
        Code: 0,
        Message: "success",
        Data: {
          SearchHashId: "search-1",
          Items: [
            {
              Title: "如何建立学习反馈循环",
              ContentType: "Answer",
              ContentID: "123",
              ContentText: "先测试，再根据错题调整下一轮练习。",
              Url: "https://www.zhihu.com/question/1/answer/123",
              CommentCount: 18,
              VoteUpCount: 256,
              AuthorName: "测试作者",
              AuthorityLevel: "2",
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
      body: { query: "学习效率", count: 99 },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["Access-Control-Allow-Origin"], "https://antoniosu.github.io");
  assert.deepEqual(response.body.items[0], {
    id: "Answer:123",
    title: "如何建立学习反馈循环",
    contentType: "Answer",
    contentText: "先测试，再根据错题调整下一轮练习。",
    url: "https://www.zhihu.com/question/1/answer/123",
    commentCount: 18,
    voteUpCount: 256,
    authorName: "测试作者",
    authorityLevel: "2",
  });

  globalThis.fetch = originalFetch;
  process.env.ZHIHU_ACCESS_SECRET = originalSecret;
});
