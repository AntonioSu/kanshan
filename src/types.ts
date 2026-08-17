export type StageId = "home" | "lab" | "report";

export type LabStep = {
  title: string;
  detail: string;
};

export type ZhihuEvidence = {
  id: string;
  title: string;
  sourceType: "高增长样本" | "低收益样本" | "转折样本";
  effortPattern: string;
  feedbackSignal: string;
  result: string;
  tags: string[];
};

export type AntiRollReport = {
  query: string;
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
  evidence: ZhihuEvidence[];
};
