import { demoEvidence } from "../data/demoCases";
import type {
  AntiRollReport,
  CausalStep,
  DiagnosticDimension,
  EvidenceOverview,
  MechanismAnalysis,
  PriorityAction,
  ReportDataSource,
  SevenDayStep,
  SharpInsight,
  ZhihuEvidence,
} from "../types";

type EffortCategory = "creator" | "job" | "workplace" | "fitness" | "learning";

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
      body: JSON.stringify({ query, count: 10 }),
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
  category: EffortCategory,
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

  if (category === "workplace") {
    return [
      {
        title: "忙到不可替代，可能正是你无法晋升的原因。",
        detail: `${sampleLabel}揭示的是角色陷阱：团队越依赖你处理琐事和救火，越难把你从执行位移到更高杠杆的位置。`,
        action: "列出本周所有任务，只保留一项能形成长期成果的核心责任。",
      },
      {
        title: "领导能看见你的辛苦，不等于组织能归因你的价值。",
        detail: "响应快和加班多证明可靠，但晋升通常需要可归属、可量化、可复用的业务结果。",
        action: "把最近一个项目写成：我做了什么、改变了哪个指标、影响了谁。",
      },
      {
        title: "救火能力会带来更多火，不会自动带来更高职级。",
        detail: "每次临时补位都在奖励系统继续把应急工作分给你，同时挤压真正能建立晋升证据的时间。",
        action: "下一次接临时任务前，先和领导确认它替代了哪项既定优先级。",
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

type MechanismRule = {
  id: string;
  title: string;
  detail: string;
  keywords: string[];
  recommendation: string;
};

const mechanismRules: Record<EffortCategory, MechanismRule[]> = {
  learning: [
    {
      id: "passive-input",
      title: "输入挤占输出",
      detail: "阅读、听课与整理带来熟悉感，但缺少闭卷提取和独立完成。",
      keywords: ["输入", "输出", "听课", "网课", "阅读", "闭卷", "提取", "默写"],
      recommendation: "把至少 30% 的学习时间改成脱离材料后的输出测试。",
    },
    {
      id: "feedback-delay",
      title: "反馈到达太晚",
      detail: "错误没有被分类和回测，导致下一轮继续重复同一薄弱点。",
      keywords: ["反馈", "错题", "复盘", "测试", "回忆", "漏洞", "总结"],
      recommendation: "把反馈周期缩短到当天，并记录第一处卡点。",
    },
    {
      id: "attention-fragmentation",
      title: "注意力被切碎",
      detail: "频繁切换任务让表面时长远高于真正的深度工作时间。",
      keywords: ["手机", "切换", "注意力", "专注", "走神", "消息", "干扰"],
      recommendation: "为高认知任务保留一个不切换应用的完整时间块。",
    },
    {
      id: "comfort-zone",
      title: "任务停留在舒适区",
      detail: "重复熟悉内容能维持正确率，却无法暴露尚未掌握的能力。",
      keywords: ["简单题", "熟悉", "舒适区", "难题", "挑战", "卡点"],
      recommendation: "每天主动选择一项会失败的任务，并记录失败原因。",
    },
    {
      id: "recovery-debt",
      title: "恢复债务侵蚀效率",
      detail: "熬夜和疲劳让后续学习时长的边际收益迅速下降。",
      keywords: ["熬夜", "睡眠", "疲劳", "恢复", "无精打采", "休息"],
      recommendation: "先稳定睡眠与高质量时段，再讨论是否增加学习量。",
    },
  ],
  creator: [
    {
      id: "audience-blindness",
      title: "选题脱离真实需求",
      detail: "内容来自个人灵感，缺少搜索、评论和读者问题的验证。",
      keywords: ["选题", "读者", "用户", "需求", "搜索", "评论"],
      recommendation: "发布前用搜索量、评论问题或标题测试验证需求。",
    },
    {
      id: "quantity-bias",
      title: "数量偏见",
      detail: "把更新频率当作增长变量，却没有确认当前方向是否有效。",
      keywords: ["日更", "更新", "数量", "频率", "持续产出"],
      recommendation: "停止加量，先比较不同主题的点击、收藏和关注转化。",
    },
    {
      id: "weak-feedback",
      title: "发布后没有复盘",
      detail: "标题、开头、完读和互动没有被拆开分析，失败无法沉淀。",
      keywords: ["复盘", "数据", "反馈", "标题", "点击", "完读"],
      recommendation: "每周只复盘一个变量，并形成可复用的内容模板。",
    },
    {
      id: "positioning-drift",
      title: "账号主题漂移",
      detail: "内容之间缺少稳定主题，用户无法形成清晰预期。",
      keywords: ["定位", "垂直", "主题", "系列", "标签", "领域"],
      recommendation: "连续三篇围绕同一问题族发布，验证系列效应。",
    },
    {
      id: "distribution-gap",
      title: "只创作、不分发",
      detail: "内容完成后缺少渠道适配与二次传播设计。",
      keywords: ["分发", "渠道", "传播", "推荐", "流量", "曝光"],
      recommendation: "为同一内容准备三个渠道版本，并记录各自转化。",
    },
  ],
  job: [
    {
      id: "generic-resume",
      title: "同一份简历批量投递",
      detail: "简历没有针对岗位重写，投递次数没有带来新信息。",
      keywords: ["同一份", "批量", "海投", "简历", "投递"],
      recommendation: "按岗位族制作不同版本，并分别记录回复率。",
    },
    {
      id: "matching-gap",
      title: "岗位匹配没有验证",
      detail: "经历与 JD 的关键能力没有逐项对应。",
      keywords: ["匹配", "岗位", "jd", "要求", "能力", "关键词"],
      recommendation: "让每条经历对应一项岗位要求和一个结果证据。",
    },
    {
      id: "weak-proof",
      title: "成果证据不足",
      detail: "描述停留在职责，缺少结果、规模与个人贡献。",
      keywords: ["结果", "量化", "项目", "成果", "数据", "贡献"],
      recommendation: "把职责句改写为动作、难点、结果和证据。",
    },
    {
      id: "no-funnel",
      title: "没有求职漏斗",
      detail: "只记录投递量，没有比较回复、笔试和面试转化。",
      keywords: ["回复率", "转化", "面试", "笔试", "漏斗", "记录"],
      recommendation: "建立投递到 offer 的分阶段转化表，每 20 次复盘。",
    },
    {
      id: "channel-concentration",
      title: "渠道过于单一",
      detail: "只依赖公开投递，缺少内推、社群和直接沟通。",
      keywords: ["内推", "渠道", "招聘网站", "社群", "联系", "猎头"],
      recommendation: "用三种渠道投递同类岗位，比较有效回复成本。",
    },
  ],
  workplace: [
    {
      id: "reactive-work",
      title: "响应型工作吞噬核心产出",
      detail: "临时需求、协调与救火占据主要时间，却很少沉淀为个人负责的长期成果。",
      keywords: ["临时", "救火", "协调", "响应", "琐事", "支持", "配合"],
      recommendation: "记录一周响应型工作占比，并为核心项目预留不可被临时占用的时间。",
    },
    {
      id: "invisible-value",
      title: "价值没有形成可归因证据",
      detail: "工作被描述成辛苦和支持，缺少个人动作、业务指标与影响范围。",
      keywords: ["汇报", "成果", "绩效", "量化", "指标", "贡献", "转化"],
      recommendation: "把每项成果改写为个人动作、指标变化和组织影响。",
    },
    {
      id: "promotion-ambiguity",
      title: "晋升标准长期模糊",
      detail: "只收到“多承担”之类抽象反馈，没有明确职级差距和验收标准。",
      keywords: ["晋升", "职级", "标准", "承担", "反馈", "预期", "责任"],
      recommendation: "与直属领导确认三个可验收的晋升条件、证据形式和复盘时间。",
    },
    {
      id: "low-leverage",
      title: "工作杠杆没有提升",
      detail: "大量重复执行没有转化为流程、方法、工具或可复制机制。",
      keywords: ["重复", "流程", "方法", "工具", "自动化", "沉淀", "复用"],
      recommendation: "把一个高频任务沉淀为模板或流程，并记录节省的团队时间。",
    },
    {
      id: "boundary-erosion",
      title: "即时响应侵蚀工作边界",
      detail: "随叫随到让所有任务都显得紧急，个人优先级被他人需求持续重排。",
      keywords: ["加班", "随时", "消息", "拒绝", "边界", "优先级", "回复"],
      recommendation: "接新任务时明确截止时间、优先级，以及它将替代的既有任务。",
    },
  ],
  fitness: [
    {
      id: "untracked-variables",
      title: "关键变量没有记录",
      detail: "训练量、强度、饮食和恢复同时变化，结果无法归因。",
      keywords: ["记录", "强度", "饮食", "恢复", "变量", "训练量"],
      recommendation: "固定其他条件，每周只调整一个训练变量。",
    },
    {
      id: "checkin-bias",
      title: "打卡替代训练质量",
      detail: "完成次数被当作结果，但动作质量和渐进负荷没有提升。",
      keywords: ["打卡", "次数", "动作", "质量", "重量", "负荷"],
      recommendation: "用重量、次数和动作标准记录有效训练量。",
    },
    {
      id: "recovery-gap",
      title: "恢复不足",
      detail: "睡眠与休息无法支持当前训练刺激。",
      keywords: ["睡眠", "恢复", "休息", "疲劳", "酸痛"],
      recommendation: "为高强度训练安排固定恢复日，并记录表现变化。",
    },
    {
      id: "nutrition-gap",
      title: "营养与目标不匹配",
      detail: "饮食没有围绕增肌、减脂或表现目标进行量化。",
      keywords: ["蛋白质", "热量", "饮食", "营养", "增肌", "减脂"],
      recommendation: "先连续记录七天热量与蛋白质，再调整训练量。",
    },
    {
      id: "program-drift",
      title: "计划变化过快",
      detail: "训练动作和计划频繁切换，无法判断适应是否发生。",
      keywords: ["计划", "更换", "动作", "周期", "坚持", "方案"],
      recommendation: "保持核心计划四周，只根据记录做小幅调整。",
    },
  ],
};

function buildEvidenceOverview(evidence: ZhihuEvidence[]): EvidenceOverview {
  const totalVotes = evidence.reduce((sum, item) => sum + (item.voteUpCount || 0), 0);
  const totalComments = evidence.reduce((sum, item) => sum + (item.commentCount || 0), 0);
  const topVotes = Math.max(0, ...evidence.map((item) => item.voteUpCount || 0));
  const authors = new Set(evidence.map((item) => item.authorName).filter(Boolean));
  const contentTypes = new Set(evidence.map((item) => item.tags[0]).filter(Boolean));

  return {
    sampleCount: evidence.length,
    authorCount: authors.size || evidence.length,
    contentTypeCount: contentTypes.size,
    totalVotes,
    totalComments,
    averageVotes: evidence.length ? Math.round(totalVotes / evidence.length) : 0,
    topResultVoteShare: totalVotes ? Math.round((topVotes / totalVotes) * 100) : 0,
  };
}

function buildMechanisms(category: EffortCategory, evidence: ZhihuEvidence[]): MechanismAnalysis[] {
  const totalEngagement = evidence.reduce(
    (sum, item) => sum + (item.voteUpCount || 0) + (item.commentCount || 0) * 2,
    0,
  );

  return mechanismRules[category]
    .map((rule) => {
      const matches = evidence.filter((item) => {
        const text = `${item.title} ${item.effortPattern} ${item.insight || ""}`.toLowerCase();
        return rule.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
      });
      const engagement = matches.reduce(
        (sum, item) => sum + (item.voteUpCount || 0) + (item.commentCount || 0) * 2,
        0,
      );

      return {
        id: rule.id,
        title: rule.title,
        detail: rule.detail,
        sampleCount: matches.length,
        sampleShare: evidence.length ? Math.round((matches.length / evidence.length) * 100) : 0,
        engagement,
        engagementShare: totalEngagement ? Math.round((engagement / totalEngagement) * 100) : 0,
        recommendation: rule.recommendation,
        basis: matches.length ? ("observed" as const) : ("hypothesis" as const),
      };
    })
    .sort((a, b) => {
      if (a.basis !== b.basis) {
        return a.basis === "observed" ? -1 : 1;
      }
      return b.sampleCount - a.sampleCount || b.engagement - a.engagement;
    });
}

function buildDiagnosticMatrix(mechanisms: MechanismAnalysis[]): DiagnosticDimension[] {
  return mechanisms.map((mechanism) => {
    const riskScore =
      mechanism.basis === "observed"
        ? Math.min(95, Math.round(25 + mechanism.sampleShare * 0.55 + mechanism.engagementShare * 0.25))
        : 25;
    const level = riskScore >= 70 ? "高风险" : riskScore >= 45 ? "需关注" : "待验证";

    return {
      dimension: mechanism.title,
      riskScore,
      level,
      finding:
        mechanism.basis === "observed"
          ? `${mechanism.sampleCount} 条样本出现该机制，样本出现率 ${mechanism.sampleShare}%，互动覆盖 ${mechanism.engagementShare}%。`
          : "当前检索样本没有直接覆盖这一机制，仍需用个人记录验证。",
      validation: mechanism.recommendation,
    };
  });
}

const causalChains: Record<EffortCategory, CausalStep[]> = {
  learning: [
    { stage: "表层动作", title: "继续增加学习时长", detail: "用更多输入缓解没有进步的焦虑。" },
    { stage: "隐藏机制", title: "输出与反馈被挤压", detail: "能力漏洞没有在练习中及时暴露。" },
    { stage: "可见结果", title: "熟悉感上升，成绩不动", detail: "主观努力感与客观表现逐渐分离。" },
    { stage: "破局变量", title: "缩短反馈周期", detail: "先输出、再定位卡点、最后补充输入。" },
  ],
  creator: [
    { stage: "表层动作", title: "继续提高更新频率", detail: "把低增长归因于内容数量不够。" },
    { stage: "隐藏机制", title: "需求与反馈缺席", detail: "选题没有经过市场验证，发布后也不复盘。" },
    { stage: "可见结果", title: "产出稳定，增长停滞", detail: "每篇内容都在重复同一种不确定性。" },
    { stage: "破局变量", title: "建立选题实验", detail: "先验证需求，再写作，再复盘单一变量。" },
  ],
  job: [
    { stage: "表层动作", title: "继续批量投递", detail: "把没有面试归因于投递数量不足。" },
    { stage: "隐藏机制", title: "岗位匹配没有变化", detail: "同一份简历重复进入不同岗位漏斗。" },
    { stage: "可见结果", title: "投递量上升，回复率不变", detail: "动作数量掩盖了匹配问题。" },
    { stage: "破局变量", title: "分组验证匹配", detail: "按岗位族改写简历并比较回复率。" },
  ],
  workplace: [
    { stage: "表层动作", title: "继续接活并延长在线时间", detail: "用更快响应证明可靠和责任心。" },
    { stage: "隐藏机制", title: "核心成果被响应工作挤压", detail: "时间被切碎，价值停留在支持与救火。" },
    { stage: "可见结果", title: "团队依赖你，却无法为你晋升", detail: "辛苦可见，但职级所需的结果证据不足。" },
    { stage: "破局变量", title: "把努力变成可归因资产", detail: "对齐标准、主导结果、量化影响并沉淀机制。" },
  ],
  fitness: [
    { stage: "表层动作", title: "继续增加训练次数", detail: "把变化慢归因于练得不够多。" },
    { stage: "隐藏机制", title: "关键变量不可追踪", detail: "强度、饮食、恢复和计划同时变化。" },
    { stage: "可见结果", title: "打卡很多，身体变化不明", detail: "无法判断哪个动作真正有效。" },
    { stage: "破局变量", title: "单变量训练实验", detail: "固定其他条件，每周只调整一个变量。" },
  ],
};

const priorityActions: Record<EffortCategory, PriorityAction[]> = {
  learning: [
    { priority: "P0", title: "先输出，再输入", reason: "最快暴露真实知识漏洞。", metric: "闭卷正确率", firstStep: "明天第一小时完成一次闭卷测试。" },
    { priority: "P1", title: "建立错因档案", reason: "把失败变成下一轮练习依据。", metric: "重复错误率", firstStep: "给每道错题标注知识、策略或粗心。" },
    { priority: "P2", title: "保护高质量时段", reason: "降低注意力切换造成的隐性损耗。", metric: "完整专注块数量", firstStep: "每天预留一个 60 分钟无切换时段。" },
  ],
  creator: [
    { priority: "P0", title: "验证选题需求", reason: "避免继续放大错误方向。", metric: "标题点击与收藏", firstStep: "为同一问题写三个标题并先收集反馈。" },
    { priority: "P1", title: "拆解高反馈内容", reason: "找到可重复的主题与结构。", metric: "系列内容相对表现", firstStep: "复盘历史前三篇内容的共同点。" },
    { priority: "P2", title: "固定复盘节奏", reason: "让每次发布产生下一次决策。", metric: "每周完成复盘次数", firstStep: "建立标题、开头、完读、互动四项记录。" },
  ],
  job: [
    { priority: "P0", title: "按岗位族重写简历", reason: "直接提升岗位匹配信号。", metric: "有效回复率", firstStep: "选择三个岗位族并各做一版简历。" },
    { priority: "P1", title: "建立投递漏斗", reason: "定位问题发生在哪个阶段。", metric: "投递到面试转化", firstStep: "补录最近 30 次投递的阶段结果。" },
    { priority: "P2", title: "扩展求职渠道", reason: "降低单一平台的流量偏差。", metric: "各渠道回复成本", firstStep: "增加内推和直接联系两种渠道。" },
  ],
  workplace: [
    { priority: "P0", title: "对齐晋升证据", reason: "先确认组织真正认可什么结果。", metric: "明确可验收条件数", firstStep: "约一次 30 分钟沟通，确认三个晋升条件和复盘日期。" },
    { priority: "P1", title: "建立个人成果账本", reason: "让价值可以被归因、比较和复述。", metric: "量化成果条目数", firstStep: "补写最近三个项目的个人动作、指标变化和影响范围。" },
    { priority: "P2", title: "降低响应型工作占比", reason: "为核心项目释放连续时间。", metric: "核心项目时间占比", firstStep: "记录一周临时任务，并与领导确认一项可停止或移交的工作。" },
  ],
  fitness: [
    { priority: "P0", title: "记录关键训练变量", reason: "没有记录就无法判断有效动作。", metric: "有效训练量", firstStep: "从下一次训练记录重量、次数和动作标准。" },
    { priority: "P1", title: "固定恢复条件", reason: "避免疲劳掩盖训练效果。", metric: "睡眠与表现变化", firstStep: "连续七天固定睡眠窗口。" },
    { priority: "P2", title: "一次只改一个变量", reason: "让结果可以归因。", metric: "单变量周变化", firstStep: "本周只调整训练强度，不改饮食和动作。" },
  ],
};

function buildSevenDayPlan(category: EffortCategory): SevenDayStep[] {
  const action = priorityActions[category][0];
  return [
    { day: "D1", title: "建立基线", task: "记录当前动作、结果和最常见失败。", output: "一页现状快照" },
    { day: "D2", title: "停止加量", task: "保持投入不变，只移除一个最低收益动作。", output: "停止清单" },
    { day: "D3", title: "执行 P0", task: action.firstStep, output: action.metric },
    { day: "D4", title: "收集反馈", task: "记录卡点、结果和意外信号，不急着下结论。", output: "反馈日志" },
    { day: "D5", title: "重复验证", task: "在相似场景重复同一动作，确认结果能否复现。", output: "第二次样本" },
    { day: "D6", title: "比较差异", task: "对比基线与两次实验，找出最可能的有效变量。", output: "差异表" },
    { day: "D7", title: "做出决策", task: "保留有效动作，停止无效动作，并设定下一周指标。", output: "下一轮实验卡" },
  ];
}

export async function analyzeEffortPainPoint(
  query: string,
  provider: ZhihuSearchProvider = createDefaultProvider(),
): Promise<AntiRollReport> {
  const rawEvidence = await provider.searchSimilarCases(query);
  const lowerQuery = query.toLowerCase();
  const isCreator = ["公众号", "写作", "创作", "文章", "日更", "发布", "读者", "选题"].some(
    (keyword) => lowerQuery.includes(keyword),
  );
  const isJob = lowerQuery.includes("简历") || lowerQuery.includes("投递") || lowerQuery.includes("面试");
  const isWorkplace = ["职场", "晋升", "加班", "领导", "绩效", "救火"].some((keyword) =>
    lowerQuery.includes(keyword),
  );
  const isFitness = lowerQuery.includes("运动") || lowerQuery.includes("健身");
  const evidence = rawEvidence.map((item) => ({
    ...item,
    effortPattern: condenseExcerpt(item.effortPattern),
    insight: item.insight || deriveEvidenceInsight(item.effortPattern, query),
  }));
  const category = isCreator
    ? "creator"
    : isJob
      ? "job"
      : isWorkplace
        ? "workplace"
        : isFitness
          ? "fitness"
          : "learning";
  const evidenceOverview = buildEvidenceOverview(evidence);
  const mechanisms = buildMechanisms(category, rawEvidence);

  const objectType = isCreator
    ? "内容创作增长问题"
    : isJob
      ? "求职匹配效率问题"
      : isWorkplace
        ? "职场价值与晋升问题"
        : isFitness
          ? "训练反馈管理问题"
          : "学习与成长效率问题";

  const effortScore = isCreator ? 86 : isJob ? 82 : isWorkplace ? 91 : 88;
  const directionScore = isCreator ? 52 : isJob ? 48 : isWorkplace ? 44 : 56;
  const feedbackScore = isCreator ? 41 : isJob ? 45 : isWorkplace ? 35 : 38;
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
        : isWorkplace
          ? "你不是承担得不够多，而是努力没有转化成可归因的晋升证据。"
          : isFitness
            ? "你不是练得太少，而是关键变量没有被记录。"
            : "你不是不努力，而是在重复低反馈行为。",
    effortScore,
    directionScore,
    feedbackScore,
    antiRollScore,
    evidenceCount: evidence.length,
    successPattern: isWorkplace
      ? ["主动对齐职级标准和验收证据", "主导可量化的核心业务结果", "把重复执行沉淀为可复用机制"]
      : ["把大目标拆成可验证假设", "每周复盘一次数据或反馈", "只放大已经被证明有效的动作"],
    failurePattern: isWorkplace
      ? ["用在线时长证明投入，缺少归因", "被临时需求持续重排优先级", "只听到抽象评价，没有晋升标准"]
      : ["用时长证明努力，缺少结果指标", "只增加数量，不改变方法", "没有对失败样本做原因归档"],
    stopDoing: isWorkplace
      ? ["无条件接下所有临时任务", "用即时回复证明责任心", "等待领导自动发现贡献"]
      : ["继续堆时间", "用打卡替代复盘", "把所有失败归因于不够努力"],
    startDoing: isWorkplace
      ? ["对齐三个晋升验收条件", "记录个人动作和业务指标", "每周保护一个核心项目时间块"]
      : ["记录每次行动的反馈", "每周只测试一个变量", "把成功样本拆成可模仿动作"],
    oneWeekExperiment: isWorkplace
      ? ["第 1 天：统计响应型工作占比", "第 3 天：与领导确认晋升证据", "第 7 天：提交一页成果与优先级复盘"]
      : ["第 1 天：写下当前目标和可衡量结果", "第 3 天：对照 3 个相似案例找差异", "第 7 天：保留有效动作，停止最低收益动作"],
    sharpInsights: buildSharpInsights(category, evidence),
    evidenceOverview,
    mechanisms,
    diagnosticMatrix: buildDiagnosticMatrix(mechanisms),
    causalChain: causalChains[category],
    priorityActions: priorityActions[category],
    sevenDayPlan: buildSevenDayPlan(category),
    evidence,
  };
}
