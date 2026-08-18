import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  ClipboardList,
  FileSearch,
  FlaskConical,
  Link2,
  MessageSquareText,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { analyzeZhihuProfile, isLiveZhihuProfileConfigured, parseZhihuProfileUrl } from "./api/profile";
import { analyzeEffortPainPoint, isLiveZhihuConfigured } from "./api/zhihu";
import { EffortReportView } from "./components/EffortReportView";
import { KanshanMascot } from "./components/KanshanMascot";
import { LabTimeline } from "./components/LabTimeline";
import { ProfileReportView } from "./components/ProfileReportView";
import { createLabSteps, createProfileLabSteps } from "./data/demoCases";
import type { AnalysisMode, AnalysisReport, StageId } from "./types";

const examples = [
  {
    label: "考研数学 · 3 个月",
    preview: "每天 10 小时，70% 在看课和抄笔记，模拟题仍在 85 分左右。",
    query:
      "我准备考研数学已经 3 个月，每天学习 8 到 10 小时，其中大约 70% 的时间在看网课、整理笔记和重做熟悉题。最近做了 4 套模拟卷，成绩一直在 82 到 88 分之间；遇到综合题经常没有思路，错题订正后隔一周还会再错。我试过延长学习时间和换老师，但分数没有明显变化。问题到底出在哪里？",
  },
  {
    label: "公众号日更 · 60 天",
    preview: "职场号发了 60 篇，平均阅读 120，选题主要依靠个人感觉。",
    query:
      "我运营一个面向工作 3 到 5 年职场人的公众号，已经连续日更 60 天，共发布 60 篇文章，每篇投入约 3 小时。现在有 1,800 个关注者，但平均阅读量只有 120 左右，新增关注通常不到 5 个。我主要根据自己的职场经历选题，很少分析搜索需求，也没有测试标题；我试过增加篇幅和提高更新频率，数据反而更差。下一步应该继续日更，还是调整选题和内容结构？",
  },
  {
    label: "职场晋升 · 3 年",
    preview: "每周加班 4 天，评价一直是靠谱，却连续两次没有进入晋升名单。",
    query:
      "我在一家互联网公司做运营已经 3 年，近半年平均每周加班 4 天，大约 70% 的时间都在处理临时需求、拉数据、跨部门协调和替团队救火。领导一直评价我靠谱、响应快，但最近连续两次晋升都没有我的名字，只说我还需要承担更大的责任。我负责过 12 场活动，其中一次让转化率提升了 8%，但绩效汇报里经常被写成支持项目。我试过接更多任务、随时回复消息，结果越来越忙，却还是没有核心项目和明确的晋升标准。我应该继续证明执行力，还是改变工作方式？",
  },
];

const effortLabSteps = createLabSteps(isLiveZhihuConfigured);
const profileLabSteps = createProfileLabSteps(isLiveZhihuProfileConfigured);

export default function App() {
  const [stage, setStage] = useState<StageId>("home");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("effort");
  const [query, setQuery] = useState(examples[2].query);
  const [profileUrl, setProfileUrl] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [homeError, setHomeError] = useState("");

  const stageIndex = useMemo(() => ["home", "lab", "report"].indexOf(stage), [stage]);
  const activeLabSteps = analysisMode === "profile" ? profileLabSteps : effortLabSteps;

  useEffect(() => {
    if (stage !== "lab") {
      return;
    }

    setActiveStep(0);
    setIsAnalyzing(true);
    setReport(null);
    setAnalysisError("");

    let isCancelled = false;
    const analysis =
      analysisMode === "profile" ? analyzeZhihuProfile(profileUrl) : analyzeEffortPainPoint(query);

    analysis
      .then((nextReport) => {
        if (!isCancelled) {
          setReport(nextReport);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setAnalysisError(error instanceof Error ? error.message : "分析失败，请稍后重试。");
        }
      });

    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= activeLabSteps.length) {
          window.clearInterval(timer);
          setIsAnalyzing(false);
          return current;
        }
        return current + 1;
      });
    }, 760);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [activeLabSteps.length, analysisMode, profileUrl, query, stage]);

  function selectMode(nextMode: AnalysisMode) {
    setAnalysisMode(nextMode);
    setStage("home");
    setReport(null);
    setAnalysisError("");
    setHomeError("");
  }

  function startEffortLab(nextQuery = query) {
    setAnalysisMode("effort");
    setQuery(nextQuery);
    setHomeError("");
    setStage("lab");
  }

  function showNextExample() {
    const currentIndex = examples.findIndex((example) => example.query === query);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % examples.length;
    setQuery(examples[nextIndex].query);
  }

  function startProfileLab() {
    if (!parseZhihuProfileUrl(profileUrl)) {
      setHomeError("请输入完整的知乎个人主页链接，例如 https://www.zhihu.com/people/username");
      return;
    }

    setHomeError("");
    setStage("lab");
  }

  function openReport() {
    if (report) {
      setStage("report");
    }
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="页面导航">
        <button className="brand-button" onClick={() => setStage("home")} type="button">
          <KanshanMascot compact />
          <span>看山反卷实验室</span>
        </button>
        <div className="stage-tabs" aria-label="实验阶段">
          {[
            { id: "home" as const, label: "首页", icon: Sparkles },
            { id: "lab" as const, label: "实验", icon: FlaskConical },
            { id: "report" as const, label: "报告", icon: ClipboardList },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                className={stage === item.id ? "is-selected" : ""}
                disabled={item.id === "report" && !report}
                key={item.id}
                onClick={() => setStage(item.id)}
                type="button"
                aria-label={item.label}
                title={item.label}
              >
                <Icon size={18} />
                <span>{index + 1}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="progress-line" aria-hidden="true">
        <span style={{ width: `${Math.max(18, (stageIndex + 1) * 33.33)}%` }} />
      </div>

      {stage === "home" && (
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">
              {analysisMode === "profile" ? <User size={18} /> : <BrainCircuit size={18} />}
              {analysisMode === "profile"
                ? isLiveZhihuProfileConfigured
                  ? "真实知乎创作者分析 Agent"
                  : "知乎主页分析演示 Agent"
                : isLiveZhihuConfigured
                  ? "真实知乎案例分析 Agent"
                  : "知乎案例演示 Agent"}
            </div>
            <h1>{analysisMode === "profile" ? "读懂你的知乎内容" : "找出你的无效努力"}</h1>
            <p>
              {analysisMode === "profile"
                ? "汇总授权账号的公开创作，识别主题、内容结构、互动表现与下一步增长机会。"
                : "输入一句努力困惑，看山会把它拆成实验样本，检索相似经历，并生成一份能行动的反卷报告。"}
            </p>
            <div className="query-panel">
              <div className="analysis-mode-toggle" aria-label="选择分析模式">
                <button
                  className={analysisMode === "effort" ? "is-selected" : ""}
                  onClick={() => selectMode("effort")}
                  type="button"
                >
                  <MessageSquareText size={17} />
                  问题分析
                </button>
                <button
                  className={analysisMode === "profile" ? "is-selected" : ""}
                  onClick={() => selectMode("profile")}
                  type="button"
                >
                  <FileSearch size={17} />
                  主页分析
                </button>
              </div>

              {analysisMode === "effort" ? (
                <>
                  <label htmlFor="effort-query">努力样本</label>
                  <textarea
                    id="effort-query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    rows={4}
                  />
                </>
              ) : (
                <>
                  <label htmlFor="profile-url">当前已授权账号的知乎主页</label>
                  <div className="url-input-wrap">
                    <Link2 size={18} />
                    <input
                      id="profile-url"
                      inputMode="url"
                      onChange={(event) => {
                        setProfileUrl(event.target.value);
                        setHomeError("");
                      }}
                      placeholder="https://www.zhihu.com/people/username"
                      type="url"
                      value={profileUrl}
                    />
                  </div>
                  <div className="profile-auth-note">
                    <ShieldCheck size={17} />
                    <span>当前支持 Access Secret 所属账号；其他用户需完成知乎 OAuth 授权。</span>
                  </div>
                  {homeError && <p className="form-error">{homeError}</p>}
                </>
              )}

              <div className="query-panel__actions">
                <button
                  className="primary-button"
                  onClick={analysisMode === "profile" ? startProfileLab : () => startEffortLab()}
                  type="button"
                >
                  <Play size={18} />
                  {analysisMode === "profile" ? "分析主页" : "开始实验"}
                </button>
                {analysisMode === "effort" && (
                  <button className="ghost-button" onClick={showNextExample} type="button">
                    换个样本
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`hero-lab ${analysisMode === "profile" ? "hero-lab--profile" : ""}`} aria-label="看山实验台">
            <KanshanMascot />
            <div className="lab-glass">
              <span>{analysisMode === "profile" ? "分析维度" : "努力指数"}</span>
              <strong>{analysisMode === "profile" ? "8" : "86"}</strong>
            </div>
            <div className="lab-note">
              <Search size={18} />
              {analysisMode === "profile" ? "等待授权主页" : "正在等待样本"}
            </div>
          </div>

          {analysisMode === "effort" ? (
            <div className="example-strip" aria-label="示例问题">
              {examples.map((example) => (
                <button key={example.label} onClick={() => setQuery(example.query)} type="button">
                  <strong>{example.label}</strong>
                  <span>{example.preview}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="profile-scope-strip" aria-label="主页分析范围">
              <span><strong>50</strong>近期内容</span>
              <span><strong>20</strong>高赞内容</span>
              <span><strong>8</strong>分析维度</span>
            </div>
          )}
        </section>
      )}

      {stage === "lab" && (
        <section className="lab-section">
          <div className="section-heading">
            <span>
              <FlaskConical size={20} />
              {analysisMode === "profile" ? "主页分析流程" : "实验流程"}
            </span>
            <h2>
              {analysisMode === "profile" ? "看山正在整理你的公开创作" : "看山正在分析你的努力样本"}
            </h2>
            <p>{analysisMode === "profile" ? profileUrl : query}</p>
          </div>

          <div className="lab-workspace">
            <LabTimeline steps={activeLabSteps} activeIndex={activeStep} />
            <aside className="agent-console">
              <KanshanMascot compact />
              <div>
                <strong>{analysisError ? "数据获取失败" : isAnalyzing ? "Agent 工作中" : "分析完成"}</strong>
                <p>
                  {analysisError
                    ? analysisError
                    : isAnalyzing
                      ? analysisMode === "profile"
                        ? "正在把公开创作转成内容结构与反馈信号。"
                        : "正在把知乎经验样本转成可比较的证据。"
                      : analysisMode === "profile"
                        ? "已生成创作者简报，可以查看内容画像。"
                        : "已生成反卷报告，可以查看诊断结果。"}
                </p>
              </div>
              {analysisError ? (
                <button className="ghost-button agent-error" onClick={() => setStage("home")} type="button">
                  <AlertCircle size={18} />
                  返回修改
                </button>
              ) : (
                <button className="primary-button" disabled={!report || isAnalyzing} onClick={openReport} type="button">
                  查看报告
                  <ArrowRight size={18} />
                </button>
              )}
            </aside>
          </div>
        </section>
      )}

      {stage === "report" && report?.kind === "profile" && (
        <ProfileReportView report={report} onBack={() => setStage("lab")} />
      )}

      {stage === "report" && report?.kind === "effort" && (
        <EffortReportView report={report} onBack={() => setStage("lab")} />
      )}
    </main>
  );
}
