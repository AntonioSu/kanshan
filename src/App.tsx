import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  FlaskConical,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { analyzeEffortPainPoint, isLiveZhihuConfigured } from "./api/zhihu";
import { KanshanMascot } from "./components/KanshanMascot";
import { LabTimeline } from "./components/LabTimeline";
import { ScoreMeter } from "./components/ScoreMeter";
import { EvidenceCard } from "./components/EvidenceCard";
import { labSteps } from "./data/demoCases";
import type { AntiRollReport, StageId } from "./types";

const examples = [
  "我每天学习10小时，为什么还是没进步？",
  "我每天写公众号，但是没人看",
  "我投了200份简历，为什么没有面试？",
];

export default function App() {
  const [stage, setStage] = useState<StageId>("home");
  const [query, setQuery] = useState(examples[0]);
  const [activeStep, setActiveStep] = useState(0);
  const [report, setReport] = useState<AntiRollReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const stageIndex = useMemo(() => ["home", "lab", "report"].indexOf(stage), [stage]);

  useEffect(() => {
    if (stage !== "lab") {
      return;
    }

    setActiveStep(0);
    setIsAnalyzing(true);
    setReport(null);
    setAnalysisError("");

    let isCancelled = false;
    analyzeEffortPainPoint(query)
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
        if (current >= labSteps.length) {
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
  }, [query, stage]);

  function startLab(nextQuery = query) {
    setQuery(nextQuery);
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
              <BrainCircuit size={18} />
              {isLiveZhihuConfigured ? "真实知乎案例分析 Agent" : "知乎案例演示 Agent"}
            </div>
            <h1>找出你的无效努力</h1>
            <p>
              输入一句努力困惑，看山会把它拆成实验样本，检索相似经历，并生成一份能行动的反卷报告。
            </p>
            <div className="query-panel">
              <label htmlFor="effort-query">努力样本</label>
              <textarea
                id="effort-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                rows={4}
              />
              <div className="query-panel__actions">
                <button className="primary-button" onClick={() => startLab()} type="button">
                  <Play size={18} />
                  开始实验
                </button>
                <button className="ghost-button" onClick={() => setQuery(examples[1])} type="button">
                  换个样本
                </button>
              </div>
            </div>
          </div>

          <div className="hero-lab" aria-label="看山实验台">
            <KanshanMascot />
            <div className="lab-glass">
              <span>努力指数</span>
              <strong>86</strong>
            </div>
            <div className="lab-note">
              <Search size={18} />
              正在等待样本
            </div>
          </div>

          <div className="example-strip" aria-label="示例问题">
            {examples.map((example) => (
              <button key={example} onClick={() => startLab(example)} type="button">
                {example}
              </button>
            ))}
          </div>
        </section>
      )}

      {stage === "lab" && (
        <section className="lab-section">
          <div className="section-heading">
            <span>
              <FlaskConical size={20} />
              实验流程
            </span>
            <h2>看山正在分析你的努力样本</h2>
            <p>{query}</p>
          </div>

          <div className="lab-workspace">
            <LabTimeline steps={labSteps} activeIndex={activeStep} />
            <aside className="agent-console">
              <KanshanMascot compact />
              <div>
                <strong>{analysisError ? "真实数据获取失败" : isAnalyzing ? "Agent 工作中" : "实验完成"}</strong>
                <p>
                  {analysisError
                    ? analysisError
                    : isAnalyzing
                    ? "正在把知乎经验样本转成可比较的证据。"
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

      {stage === "report" && report && (
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

          <div className="evidence-section">
            <div className="evidence-section__heading">
              <span className={`source-badge source-badge--${report.dataSource}`}>
                {report.dataSource === "live"
                  ? `${report.evidenceCount} 条知乎真实结果`
                  : `${report.evidenceCount} 个演示样本分析`}
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
