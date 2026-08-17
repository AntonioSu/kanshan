import { demoProfileContent } from "../data/profileDemo";
import type {
  ContentMixItem,
  ProfileAnalysisReport,
  ReportDataSource,
  TopicInsight,
  ZhihuProfileContent,
} from "../types";

type ProfileApiResponse = {
  items: ZhihuProfileContent[];
  totalCount: number;
  authorizationMode: "owner" | "oauth";
};

const profileApiUrl = import.meta.env.VITE_ZHIHU_PROFILE_API_URL?.trim();

export const isLiveZhihuProfileConfigured = Boolean(profileApiUrl);

const contentTypeLabels: Record<string, string> = {
  answer: "回答",
  article: "文章",
  zvideo: "视频",
  pin: "想法",
  question: "问题",
};

const topicRules = [
  { name: "学习与成长", words: ["学习", "成长", "读书", "知识", "复盘", "效率", "教育"] },
  { name: "科技与 AI", words: ["AI", "人工智能", "科技", "算法", "模型", "互联网", "软件"] },
  { name: "职业与工作", words: ["职场", "工作", "职业", "面试", "公司", "管理", "创业"] },
  { name: "商业与产品", words: ["商业", "产品", "用户", "品牌", "营销", "消费", "投资"] },
  { name: "心理与关系", words: ["心理", "情绪", "关系", "焦虑", "亲密", "沟通", "自我"] },
  { name: "生活观察", words: ["生活", "习惯", "旅行", "城市", "文化", "社会", "家庭"] },
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function parseZhihuProfileUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();
    const match = url.pathname.match(/^\/people\/([^/]+)\/?$/);

    if ((hostname !== "www.zhihu.com" && hostname !== "zhihu.com") || !match) {
      return null;
    }

    return {
      normalizedUrl: `https://www.zhihu.com/people/${match[1]}`,
      slug: decodeURIComponent(match[1]),
    };
  } catch {
    return null;
  }
}

function buildContentMix(items: ZhihuProfileContent[]): ContentMixItem[] {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item.contentType, (counts.get(item.contentType) || 0) + 1));

  return [...counts.entries()]
    .map(([type, count]) => ({
      type,
      label: contentTypeLabels[type] || type,
      count,
      share: Math.round((count / items.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function buildTopicInsights(items: ZhihuProfileContent[]): TopicInsight[] {
  const matched = topicRules
    .map((topic) => ({
      name: topic.name,
      count: items.filter((item) => {
        const text = `${item.title} ${item.summary}`.toLowerCase();
        return topic.words.some((word) => text.includes(word.toLowerCase()));
      }).length,
    }))
    .filter((topic) => topic.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return matched.length ? matched : [{ name: "综合知识分享", count: items.length }];
}

function averagePostingGap(items: ZhihuProfileContent[]) {
  const dates = items
    .map((item) => item.createdAt)
    .filter(Boolean)
    .sort((a, b) => b - a);

  if (dates.length < 2) {
    return 30;
  }

  const gaps = dates.slice(1).map((date, index) => (dates[index] - date) / 86400);
  return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
}

function createProfileReport(
  profileUrl: string,
  items: ZhihuProfileContent[],
  totalCount: number,
  dataSource: ReportDataSource,
  authorizationMode: "owner" | "oauth",
): ProfileAnalysisReport {
  const parsedProfile = parseZhihuProfileUrl(profileUrl);
  if (!parsedProfile) {
    throw new Error("请输入完整的知乎个人主页链接，例如 https://www.zhihu.com/people/username。");
  }

  if (!items.length) {
    throw new Error("该授权账号暂未返回可分析的公开内容。");
  }

  const totalLikes = items.reduce((sum, item) => sum + item.likeCount, 0);
  const totalComments = items.reduce((sum, item) => sum + item.commentCount, 0);
  const totalFavorites = items.reduce((sum, item) => sum + item.favoriteCount, 0);
  const averageLikes = Math.round(totalLikes / items.length);
  const averageSummaryLength =
    items.reduce((sum, item) => sum + item.summary.length, 0) / items.length;
  const postingGap = averagePostingGap(items);
  const contentMix = buildContentMix(items);
  const topTopics = buildTopicInsights(items);
  const topContent = [...items]
    .sort(
      (a, b) =>
        b.likeCount + b.commentCount * 2 + b.favoriteCount * 1.5 -
        (a.likeCount + a.commentCount * 2 + a.favoriteCount * 1.5),
    )
    .slice(0, 6);
  const totalEngagement = totalLikes + totalComments + totalFavorites;
  const topEngagement = topContent[0]
    ? topContent[0].likeCount + topContent[0].commentCount + topContent[0].favoriteCount
    : 0;
  const answerShare = contentMix.find((item) => item.type === "answer")?.share || 0;
  const articleShare = contentMix.find((item) => item.type === "article")?.share || 0;

  const voiceTraits = [
    answerShare >= 55 ? "问题驱动型表达" : "主动选题型表达",
    averageSummaryLength >= 90 ? "重解释与论证" : "短观点与快速结论",
    totalFavorites > totalComments * 2 ? "内容具有收藏价值" : "内容更偏讨论互动",
    articleShare >= 25 ? "兼顾长文沉淀" : "以社区回答为主阵地",
  ];

  const strengths = [
    `代表内容获得 ${topContent[0]?.likeCount || 0} 次赞同，已有明确的高反馈样本。`,
    `${topTopics[0].name}是当前最稳定的内容主题，可继续形成系列。`,
    totalFavorites >= totalComments
      ? "收藏数高于评论数，内容更像可复用的知识资产。"
      : "评论反馈活跃，选题具备讨论与连接能力。",
  ];

  const opportunities = [
    topEngagement > totalEngagement * 0.5
      ? "互动过度集中在单篇内容，建议拆解其题型、标题和结构并连续复用。"
      : "互动分布相对均衡，可以从前 3 篇内容提炼稳定的创作模板。",
    postingGap > 18
      ? `样本平均发布间隔约 ${Math.round(postingGap)} 天，持续性是当前主要增长变量。`
      : "更新节奏稳定，下一步应优先提升主题连续性而不是单纯加量。",
    answerShare > 80
      ? "内容形态高度集中于回答，可把高赞回答整理为文章或系列内容。"
      : "内容形态已有组合，建议统一不同形态下的核心主题标签。",
  ];

  const nextActions = [
    `围绕“${topTopics[0].name}”连续发布 3 篇同主题内容，验证系列效应。`,
    "复刻最高互动内容的标题结构，但更换问题场景，比较赞同与收藏变化。",
    "每周记录发布量、赞同率、收藏率和评论问题，四周后淘汰最低反馈主题。",
  ];

  return {
    kind: "profile",
    dataSource,
    profileUrl: parsedProfile.normalizedUrl,
    profileSlug: parsedProfile.slug,
    authorizationMode,
    sampledCount: items.length,
    totalContentCount: Math.max(totalCount, items.length),
    summary: `基于 ${items.length} 条公开创作样本，这个账号以${contentMix[0].label}为主，内容重点集中在${topTopics
      .slice(0, 2)
      .map((topic) => topic.name)
      .join("、")}。当前最值得放大的不是发布数量，而是把已经获得高反馈的主题做成连续、可识别的内容系列。`,
    metrics: {
      influence: clampScore(24 + Math.log10(totalEngagement + 1) * 18),
      depth: clampScore(32 + averageSummaryLength / 3 + (totalFavorites / Math.max(1, totalLikes)) * 30),
      interaction: clampScore(28 + (totalComments / Math.max(1, totalLikes)) * 260),
      consistency: clampScore(100 - postingGap * 2.4),
    },
    engagement: {
      totalLikes,
      totalComments,
      totalFavorites,
      averageLikes,
    },
    contentMix,
    topTopics,
    voiceTraits,
    strengths,
    opportunities,
    nextActions,
    topContent,
  };
}

export async function analyzeZhihuProfile(profileUrl: string): Promise<ProfileAnalysisReport> {
  const parsedProfile = parseZhihuProfileUrl(profileUrl);
  if (!parsedProfile) {
    throw new Error("请输入完整的知乎个人主页链接，例如 https://www.zhihu.com/people/username。");
  }

  if (!profileApiUrl) {
    return createProfileReport(profileUrl, demoProfileContent, demoProfileContent.length, "mock", "owner");
  }

  const response = await fetch(profileApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileUrl: parsedProfile.normalizedUrl }),
  });
  const payload = (await response.json()) as ProfileApiResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "知乎个人内容暂时不可用，请稍后重试。");
  }

  return createProfileReport(
    profileUrl,
    payload.items,
    payload.totalCount,
    "live",
    payload.authorizationMode,
  );
}
