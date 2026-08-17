import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
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
import { EvidenceCard } from "./components/EvidenceCard";
import { KanshanMascot } from "./components/KanshanMascot";
import { LabTimeline } from "./components/LabTimeline";
import { ProfileReportView } from "./components/ProfileReportView";
import { ScoreMeter } from "./components/ScoreMeter";
import { createLabSteps, createProfileLabSteps } from "./data/demoCases";
import type { AnalysisMode, AnalysisReport, StageId } from "./types";

const examples = [
  "我每天学习10小时，为什么还是没进步？",
  "我每天写公众号，但是没人看",
  "我投了200份简历，为什么没有面试？",
];

const effortLabSteps = createLabSteps(isLiveZhihuConfigured);
const profileLabSteps = createProfileLabSteps(isLiveZhihuProfileConfigured);

export default function App() {
  const [stage, setStage] = useState<StageId>("home");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("effort");
  const [query, setQuery] = useState(examples[0]);
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
                  <button className="ghost-button" onClick={() => setQuery(examples[1])} type="button">
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
                <button key={example} onClick={() => startEffortLab(example)} type="button">
                  {example}
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
        <section className="report-section">
          <div className="section-heading">
            <span>
              <BarChart3 size={20} />
              实验报告
            </span>
            <h2>努力尸检报告</h2>
            <p>{report.query}</p>
          </div>

          <div className="report-grid">
            <div className="diagnosis-panel">
              <span className="panel-label">实验对象</span>
              <h3>{report.objectType}</h3>
              <blockquote>{report.coreDiagnosis}</blockquote>
              <div className="score-stack">
                <ScoreMeter label="努力指数" value={report.effortScore} tone="effort" />
                <ScoreMeter label="方向匹配" value={report.directionScore} tone="direction" />
                <ScoreMeter label="反馈强度" value={report.feedbackScore} tone="feedback" />
                <ScoreMeter label="反卷指数" value={report.antiRollScore} tone="anti" />
              </div>
            </div>

            <div className="pattern-panel">
              <div>
                <span className="panel-label">成功样本共同动作</span>
                <ul>
                  {report.successPattern.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="panel-label">低收益样本共同问题</span>
                <ul>
                  {report.failurePattern.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="advice-panel">
              <div>
                <span className="panel-label">停止</span>
                {report.stopDoing.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              <div>
                <span className="panel-label">开始</span>
                {report.startDoing.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              <div>
                <span className="panel-label">一周实验</span>
                {report.oneWeekExperiment.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          </div>

          <section className="sharp-insights-section">
            <div className="sharp-insights-heading">
              <span className="panel-label">看山的反常识结论</span>
              <h3>真正的问题，不在你以为的地方</h3>
            </div>
            <div className="sharp-insights-grid">
              {report.sharpInsights.map((insight, index) => (
                <article key={insight.title}>
                  <span className="sharp-insight-index">0{index + 1}</span>
                  <h4>{insight.title}</h4>
                  <p>{insight.detail}</p>
                  <div>
                    <strong>立刻验证</strong>
                    <span>{insight.action}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="evidence-section">
            <div className="evidence-section__heading">
              <span className={`source-badge source-badge--${report.dataSource}`}>
                {report.dataSource === "live"
                  ? `${report.evidenceCount} 条可追溯知乎证据`
                  : `${report.evidenceCount} 个演示证据样本`}
              </span>
              <button className="ghost-button" onClick={() => setStage("lab")} type="button">
                <ArrowLeft size={18} />
                回看流程
              </button>
            </div>
            <div className="evidence-grid">
              {report.evidence.slice(0, 3).map((item) => (
                <EvidenceCard evidence={item} key={item.id} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
