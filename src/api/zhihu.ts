import { demoEvidence } from "../data/demoCases";
import type { AntiRollReport, ReportDataSource, SharpInsight, ZhihuEvidence } from "../types";

type LiveZhihuItem = {
  id: string;
  title: string;
  contentType: string;
  contentText: string;
  url: string;
  commentCount: number;
  voteUpCount: number;
  authorName: string;
  authorityLevel: string;
};

type LiveZhihuResponse = {
  items: LiveZhihuItem[];
};

export interface ZhihuSearchProvider {
  readonly source: ReportDataSource;
  searchSimilarCases(query: string): Promise<ZhihuEvidence[]>;
}

export class MockZhihuProvider implements ZhihuSearchProvider {
  readonly source = "mock" as const;

  async searchSimilarCases(query: string) {
    const normalizedQuery = query.toLowerCase();
    const weighted = demoEvidence.filter((item) =>
      item.tags.some((tag) => normalizedQuery.includes(tag.toLowerCase())),
    );

    return weighted.length >= 2 ? weighted : demoEvidence;
  }
}

export class ApiZhihuProvider implements ZhihuSearchProvider {
  readonly source = "live" as const;

  constructor(private readonly endpoint: string) {}

  async searchSimilarCases(query: string): Promise<ZhihuEvidence[]> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, count: 6 }),
    });

    const payload = (await response.json()) as LiveZhihuResponse & { error?: string };

    if (!response.ok) {
      throw new Error(payload.error || "知乎数据暂时不可用，请稍后重试。");
    }

    if (!payload.items?.length) {
      throw new Error("没有找到相关知乎经历，请换一种描述后重试。");
    }

    return payload.items.map((item) => ({
      id: item.id,
      title: item.title,
      sourceType: "真实知乎样本",
      effortPattern: item.contentText,
      feedbackSignal: `${item.voteUpCount} 赞同 · ${item.commentCount} 评论`,
      result: `${item.authorName || "知乎用户"} · ${item.contentType}`,
      tags: [item.contentType, item.authorityLevel ? `权威等级 ${item.authorityLevel}` : "知乎内容"],
      url: item.url,
      authorName: item.authorName,
      voteUpCount: item.voteUpCount,
      commentCount: item.commentCount,
    }));
  }
}

const liveApiUrl = import.meta.env.VITE_ZHIHU_API_URL?.trim();

export const isLiveZhihuConfigured = Boolean(liveApiUrl);

function createDefaultProvider(): ZhihuSearchProvider {
  return liveApiUrl ? new ApiZhihuProvider(liveApiUrl) : new MockZhihuProvider();
}

function condenseExcerpt(value: string) {
  const cleaned = value
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= 170) {
    return cleaned;
  }

  const sentence = cleaned.slice(0, 190).match(/^(.{80,170}?[。！？])/);
  return sentence?.[1] || `${cleaned.slice(0, 166)}…`;
}

function deriveEvidenceInsight(text: string, query: string) {
  const source = `${text} ${query}`.toLowerCase();

  if (/日更|选题|读者|标题|公众号|内容|写作/.test(source)) {
    return "发布频率只能放大方向，不能替你找到方向。";
  }
  if (/简历|投递|岗位|面试/.test(source)) {
    return "投递量不是进度；岗位匹配后的回复率才是。";
  }
  if (/健身|训练|运动|打卡/.test(source)) {
    return "打卡只能证明你出现过，不能证明身体收到了有效刺激。";
  }
  if (/熟悉感|主动检索|闭卷|默写|提取/.test(source)) {
    return "熟悉不等于掌握；只有脱离材料后的输出，才会暴露真实能力。";
  }
  if (/输入|输出|网课|看课|听课/.test(source)) {
    return "输入让一天显得充实，输出才让能力发生变化。";
  }
  if (/手机|切换|注意力|专注/.test(source)) {
    return "被频繁切碎的两小时，可能不如一个完整的四十分钟。";
  }
  if (/错题|简单题|舒适区|复盘/.test(source)) {
    return "重复会做的题是在巩固自信，不是在修补能力缺口。";
  }
  if (/熬夜|睡眠|疲劳|恢复/.test(source)) {
    return "用睡眠换来的学习时长，会从第二天的认知效率里连本带利扣回去。";
  }
  return "真正有效的努力，会更早暴露问题，而不是更久地维持忙碌。";
}

function buildSharpInsights(
  category: "creator" | "job" | "fitness" | "learning",
  evidence: ZhihuEvidence[],
): SharpInsight[] {
  const sampleLabel = evidence.length ? `${evidence.length} 条可追溯样本` : "相似样本";

  if (category === "creator") {
    return [
      {
        title: "日更不是增长策略，它只是把当前方向乘以更多次数。",
        detail: `${sampleLabel}指向同一件事：没有选题验证和发布后复盘，更新越勤，错误方向被放大得越快。`,
        action: "下一篇发布前先写出目标读者、核心问题和唯一验证指标。",
      },
      {
        title: "没人看，不代表写得少；更可能是你从未让市场参与选题。",
        detail: "个人灵感负责产生想法，搜索、评论和数据才负责判断哪些想法值得写。",
        action: "从读者问题中做 3 个标题版本，只写反馈最强的那个。",
      },
      {
        title: "高增长作者最重要的工作，往往发生在写作之外。",
        detail: "研究需求、拆解高反馈样本和复盘数据，决定了下一小时写作是否值得。",
        action: "把一周创作时间重新分配为：40%研究、40%写作、20%复盘。",
      },
    ];
  }

  if (category === "job") {
    return [
      {
        title: "投 200 份相同简历，不是扩大样本，是复制同一个错误 200 次。",
        detail: `${sampleLabel}真正提醒的是匹配质量：不针对岗位重写，投递次数不会产生新的信息。`,
        action: "把岗位分成 3 类，每类制作一版简历并分别记录回复率。",
      },
      {
        title: "回复率才是求职进度条，投递量只是动作计数器。",
        detail: "没有回复时，继续加量只会掩盖简历、岗位或渠道中的具体问题。",
        action: "每 20 次投递复盘一次；回复率不升，就先停止加量。",
      },
      {
        title: "简历不是个人传记，而是一份岗位匹配假设。",
        detail: "项目经历是否优秀并不独立存在，它必须回答招聘方此刻最关心的问题。",
        action: "让每条经历都对应 JD 中的一项能力，并补上可验证结果。",
      },
    ];
  }

  if (category === "fitness") {
    return [
      {
        title: "打卡只能证明你出现过，不能证明身体收到有效刺激。",
        detail: `${sampleLabel}更看重强度、动作质量、饮食和恢复，而不是连续打卡天数。`,
        action: "下一周只记录 4 个变量：重量、次数、睡眠和蛋白质。",
      },
      {
        title: "训练越勤、变量越乱，你越不知道什么真正有效。",
        detail: "同时改变训练量、饮食和作息，会让任何结果都无法归因。",
        action: "每周只调整一个变量，至少保持 7 天再判断。",
      },
      {
        title: "恢复不是训练的间隙，它就是训练的一部分。",
        detail: "适应发生在训练之后；持续疲劳会把更多训练变成更差表现。",
        action: "为高强度日安排固定恢复日，并用表现变化决定是否加量。",
      },
    ];
  }

  return [
    {
      title: "你记录的是坐在书桌前的时间，不是大脑真正改变的时间。",
      detail: `${sampleLabel}反复出现同一结构：输入很多、独立输出很少，于是“学过”的感觉替代了“会用”的证据。`,
      action: "把明天第一小时改成闭卷输出；不会的地方才进入下一轮学习。",
    },
    {
      title: "熟悉感，是学习里最昂贵的幻觉。",
      detail: "反复阅读会让材料越来越顺眼，却不会自动提高脱离材料后的调用能力。",
      action: "每学 30 分钟，合上材料写 10 分钟；用卡住的位置决定复习内容。",
    },
    {
      title: "把一天排满的人，往往最晚才开始真正困难的任务。",
      detail: "准备、整理和输入会消耗最清醒的时段，真正需要思考的输出被推到精力最低点。",
      action: "每天先完成一个可检查的锚点产出，其余任务都排在它之后。",
    },
  ];
}

export async function analyzeEffortPainPoint(
  query: string,
  provider: ZhihuSearchProvider = createDefaultProvider(),
): Promise<AntiRollReport> {
  const rawEvidence = await provider.searchSimilarCases(query);
  const lowerQuery = query.toLowerCase();
  const isCreator = lowerQuery.includes("公众号") || lowerQuery.includes("写") || lowerQuery.includes("内容");
  const isJob = lowerQuery.includes("简历") || lowerQuery.includes("投递") || lowerQuery.includes("面试");
  const isFitness = lowerQuery.includes("运动") || lowerQuery.includes("健身");
  const evidence = rawEvidence.map((item) => ({
    ...item,
    effortPattern: condenseExcerpt(item.effortPattern),
    insight: item.insight || deriveEvidenceInsight(item.effortPattern, query),
  }));
  const category = isCreator ? "creator" : isJob ? "job" : isFitness ? "fitness" : "learning";

  const objectType = isCreator
    ? "内容创作增长问题"
    : isJob
      ? "求职匹配效率问题"
      : isFitness
        ? "训练反馈管理问题"
        : "学习与成长效率问题";

  const effortScore = isCreator ? 86 : isJob ? 82 : 88;
  const directionScore = isCreator ? 52 : isJob ? 48 : 56;
  const feedbackScore = isCreator ? 41 : isJob ? 45 : 38;
  const antiRollScore = Math.round((directionScore + feedbackScore + 100 - Math.abs(effortScore - 72)) / 3);

  return {
    kind: "effort",
    query,
    dataSource: provider.source,
    objectType,
    coreDiagnosis: isCreator
      ? "你不是更新太少，而是缺少反馈循环。"
      : isJob
        ? "你不是投得不够多，而是岗位匹配没有被验证。"
        : isFitness
          ? "你不是练得太少，而是关键变量没有被记录。"
          : "你不是不努力，而是在重复低反馈行为。",
    effortScore,
    directionScore,
    feedbackScore,
    antiRollScore,
    evidenceCount: evidence.length,
    successPattern: [
      "把大目标拆成可验证假设",
      "每周复盘一次数据或反馈",
      "只放大已经被证明有效的动作",
    ],
    failurePattern: [
      "用时长证明努力，缺少结果指标",
      "只增加数量，不改变方法",
      "没有对失败样本做原因归档",
    ],
    stopDoing: ["继续堆时间", "用打卡替代复盘", "把所有失败归因于不够努力"],
    startDoing: ["记录每次行动的反馈", "每周只测试一个变量", "把成功样本拆成可模仿动作"],
    oneWeekExperiment: ["第 1 天：写下当前目标和可衡量结果", "第 3 天：对照 3 个相似案例找差异", "第 7 天：保留有效动作，停止最低收益动作"],
    sharpInsights: buildSharpInsights(category, evidence),
    evidence,
  };
}
