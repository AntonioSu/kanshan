import type { ZhihuEvidence } from "../types";

export const demoEvidence: ZhihuEvidence[] = [
  {
    id: "study-feedback",
    title: "每天学习 10 小时但成绩不动",
    sourceType: "转折样本",
    effortPattern: "高时长刷题，错题只订正答案",
    feedbackSignal: "把错题按知识点和失误类型复盘后，提分开始出现",
    result: "3 周后从低效重复切换到薄弱点突破",
    tags: ["学习", "反馈循环", "复盘"],
  },
  {
    id: "creator-growth",
    title: "公众号日更 60 天无人阅读",
    sourceType: "低收益样本",
    effortPattern: "持续产出，但选题来自个人灵感",
    feedbackSignal: "缺少标题测试、读者画像和数据复盘",
    result: "投入稳定，增长停滞",
    tags: ["创作", "增长", "选题"],
  },
  {
    id: "creator-user-research",
    title: "小号从 0 到 1 万关注的内容复盘",
    sourceType: "高增长样本",
    effortPattern: "30% 写作，50% 研究用户需求，20% 复盘数据",
    feedbackSignal: "每周保留 2 个可验证假设，只放大有效选题",
    result: "增长来自方向校准，而不是单纯加量",
    tags: ["创作", "用户需求", "实验"],
  },
  {
    id: "job-search",
    title: "投递 200 份简历没有面试",
    sourceType: "转折样本",
    effortPattern: "批量投递同一份简历",
    feedbackSignal: "按岗位 JD 重写项目亮点，并记录回复率",
    result: "无差别努力变成可比较实验",
    tags: ["求职", "简历", "匹配度"],
  },
  {
    id: "fitness",
    title: "每天运动但体型变化很慢",
    sourceType: "低收益样本",
    effortPattern: "只追求打卡次数",
    feedbackSignal: "没有记录强度、饮食和恢复",
    result: "行动很多，变量不可控",
    tags: ["健身", "记录", "变量"],
  },
];

export const labSteps = [
  {
    title: "拆解努力样本",
    detail: "识别投入方式、目标对象和可观测结果。",
  },
  {
    title: "检索知乎相似经历",
    detail: "用 Mock 知乎案例库模拟搜索成功与失败样本。",
  },
  {
    title: "抽取关键证据",
    detail: "标记时间投入、反馈信号、方向调整和最终结果。",
  },
  {
    title: "聚类成功路径",
    detail: "比较高增长样本的共同动作和低收益样本的共同盲区。",
  },
  {
    title: "生成反卷报告",
    detail: "把无效加量改写成一周可验证的小实验。",
  },
];
