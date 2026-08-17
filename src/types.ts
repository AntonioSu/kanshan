export type StageId = "home" | "lab" | "report";

export type AnalysisMode = "effort" | "profile";

export type ReportDataSource = "live" | "mock";

export type LabStep = {
  title: string;
  detail: string;
};

export type ZhihuEvidence = {
  id: string;
  title: string;
  sourceType: "真实知乎样本" | "高增长样本" | "低收益样本" | "转折样本";
  effortPattern: string;
  feedbackSignal: string;
  result: string;
  tags: string[];
  url?: string;
  authorName?: string;
  voteUpCount?: number;
  commentCount?: number;
  insight?: string;
};

export type SharpInsight = {
  title: string;
  detail: string;
  action: string;
};

export type AntiRollReport = {
  kind: "effort";
  query: string;
  dataSource: ReportDataSource;
  objectType: string;
  coreDiagnosis: string;
  effortScore: number;
  directionScore: number;
  feedbackScore: number;
  antiRollScore: number;
  evidenceCount: number;
  successPattern: string[];
  failurePattern: string[];
  stopDoing: string[];
  startDoing: string[];
  oneWeekExperiment: string[];
  sharpInsights: SharpInsight[];
  evidence: ZhihuEvidence[];
};

export type ZhihuProfileContent = {
  id: string;
  contentType: "answer" | "article" | "zvideo" | "pin" | "question" | string;
  url: string;
  createdAt: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  title: string;
  summary: string;
};

export type ContentMixItem = {
  type: string;
  label: string;
  count: number;
  share: number;
};

export type TopicInsight = {
  name: string;
  count: number;
};

export type ProfileAnalysisReport = {
  kind: "profile";
  dataSource: ReportDataSource;
  profileUrl: string;
  profileSlug: string;
  authorizationMode: "owner" | "oauth";
  sampledCount: number;
  totalContentCount: number;
  summary: string;
  metrics: {
    influence: number;
    depth: number;
    interaction: number;
    consistency: number;
  };
  engagement: {
    totalLikes: number;
    totalComments: number;
    totalFavorites: number;
    averageLikes: number;
  };
  contentMix: ContentMixItem[];
  topTopics: TopicInsight[];
  voiceTraits: string[];
  strengths: string[];
  opportunities: string[];
  nextActions: string[];
  topContent: ZhihuProfileContent[];
};

export type AnalysisReport = AntiRollReport | ProfileAnalysisReport;
