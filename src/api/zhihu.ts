import { demoEvidence } from "../data/demoCases";
import type { AntiRollReport, ZhihuEvidence } from "../types";

export interface ZhihuSearchProvider {
  searchSimilarCases(query: string): Promise<ZhihuEvidence[]>;
}

export class MockZhihuProvider implements ZhihuSearchProvider {
  async searchSimilarCases(query: string) {
    const normalizedQuery = query.toLowerCase();
    const weighted = demoEvidence.filter((item) =>
      item.tags.some((tag) => normalizedQuery.includes(tag.toLowerCase())),
    );

    return weighted.length >= 2 ? weighted : demoEvidence;
  }
}

export class CliZhihuProvider implements ZhihuSearchProvider {
  async searchSimilarCases(_query: string): Promise<ZhihuEvidence[]> {
    // Future hook: call the Zhihu CLI here and map raw answers into ZhihuEvidence.
    // Example shape: zhihu search "<query>" --limit 20 --json
    throw new Error("CliZhihuProvider is a placeholder for the competition integration.");
  }
}

export async function analyzeEffortPainPoint(
  query: string,
  provider: ZhihuSearchProvider = new MockZhihuProvider(),
): Promise<AntiRollReport> {
  const evidence = await provider.searchSimilarCases(query);
  const lowerQuery = query.toLowerCase();
  const isCreator = lowerQuery.includes("公众号") || lowerQuery.includes("写") || lowerQuery.includes("内容");
  const isJob = lowerQuery.includes("简历") || lowerQuery.includes("投递") || lowerQuery.includes("面试");
  const isFitness = lowerQuery.includes("运动") || lowerQuery.includes("健身");

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
    query,
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
    evidenceCount: 126,
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
    evidence,
  };
}
