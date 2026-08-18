import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Database,
  Layers3,
  MessageCircle,
  ThumbsUp,
  Users,
} from "lucide-react";
import type { AntiRollReport } from "../types";
import { EvidenceCard } from "./EvidenceCard";
import { ScoreMeter } from "./ScoreMeter";

type EffortReportViewProps = {
  report: AntiRollReport;
  onBack: () => void;
};

const numberFormatter = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });

export function EffortReportView({ report, onBack }: EffortReportViewProps) {
  const overview = report.evidenceOverview;
  const concentrationNote =
    overview.topResultVoteShare >= 55
      ? "热度明显集中在少数内容，适合提炼方向，但不能直接视为广泛共识。"
      : "热度分布相对分散，多个作者与内容共同支持当前判断。";

  return (
    <section className="report-section effort-report-section">
      <div className="section-heading">
        <span>
          <BarChart3 size={20} />
          深度实验报告
        </span>
        <h2>努力尸检报告</h2>
        <p>{report.query}</p>
      </div>

      <div className="report-grid">
        <div className="diagnosis-panel">
          <span className="panel-label">核心诊断</span>
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
            <span className="panel-label">高收益路径</span>
            <ul>
              {report.successPattern.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="panel-label">低收益路径</span>
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
            <span className="panel-label">观察</span>
            {report.oneWeekExperiment.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </div>

      <section className="sharp-insights-section">
        <div className="sharp-insights-heading">
          <div>
            <span className="panel-label">看山的反常识结论</span>
            <h3>真正的问题，不在你以为的地方</h3>
          </div>
          <span className="analysis-basis analysis-basis--inference">基于样本的解释性推断</span>
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

      <section className="deep-report-section">
        <div className="deep-section-heading">
          <div>
            <span className="panel-label">样本数据全景</span>
            <h3>这些结论建立在什么数据上</h3>
          </div>
          <span className="analysis-basis analysis-basis--fact">可直接核对的数据事实</span>
        </div>
        <div className="evidence-overview-grid">
          <div>
            <Database size={19} />
            <strong>{overview.sampleCount}</strong>
            <span>知乎样本</span>
          </div>
          <div>
            <Users size={19} />
            <strong>{overview.authorCount}</strong>
            <span>作者覆盖</span>
          </div>
          <div>
            <Layers3 size={19} />
            <strong>{overview.contentTypeCount}</strong>
            <span>内容类型</span>
          </div>
          <div>
            <ThumbsUp size={19} />
            <strong>{numberFormatter.format(overview.totalVotes)}</strong>
            <span>累计赞同</span>
          </div>
          <div>
            <MessageCircle size={19} />
            <strong>{numberFormatter.format(overview.totalComments)}</strong>
            <span>累计评论</span>
          </div>
          <div>
            <Activity size={19} />
            <strong>{overview.topResultVoteShare}%</strong>
            <span>Top 1 热度占比</span>
          </div>
        </div>
        <div className="evidence-quality-note">
          <strong>证据结构判断</strong>
          <p>{concentrationNote}</p>
          <span>平均每条 {overview.averageVotes} 次赞同；互动数据用于衡量关注度，不等于结论正确率。</span>
        </div>
      </section>

      <section className="deep-report-section">
        <div className="deep-section-heading">
          <div>
            <span className="panel-label">失败机制聚类</span>
            <h3>问题反复出现在哪些环节</h3>
          </div>
          <span className="analysis-basis analysis-basis--mixed">样本统计 + 待验证假设</span>
        </div>
        <div className="mechanism-list">
          {report.mechanisms.map((mechanism) => (
            <article className={mechanism.basis === "hypothesis" ? "is-hypothesis" : ""} key={mechanism.id}>
              <div className="mechanism-main">
                <div>
                  <span className={`mechanism-badge mechanism-badge--${mechanism.basis}`}>
                    {mechanism.basis === "observed" ? "样本已出现" : "个人待验证"}
                  </span>
                  <h4>{mechanism.title}</h4>
                  <p>{mechanism.detail}</p>
                </div>
                <strong>{mechanism.sampleShare}%</strong>
              </div>
              <div className="mechanism-bars">
                <div>
                  <span>样本出现率</span>
                  <div><span style={{ width: `${mechanism.sampleShare}%` }} /></div>
                  <strong>{mechanism.sampleCount}/{overview.sampleCount}</strong>
                </div>
                <div>
                  <span>互动覆盖</span>
                  <div><span style={{ width: `${mechanism.engagementShare}%` }} /></div>
                  <strong>{mechanism.engagementShare}%</strong>
                </div>
              </div>
              <div className="mechanism-action">
                <span>验证方向</span>
                <p>{mechanism.recommendation}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="method-note">样本出现率表示包含该机制的结果比例；同一结果可能支持多个机制，因此比例之和不等于 100%。</p>
      </section>

      <section className="deep-report-section">
        <div className="deep-section-heading">
          <div>
            <span className="panel-label">因果链</span>
            <h3>为什么越努力，结果反而越不动</h3>
          </div>
          <span className="analysis-basis analysis-basis--inference">需要用个人数据验证</span>
        </div>
        <div className="causal-chain">
          {report.causalChain.map((step, index) => (
            <div className="causal-step" key={step.stage}>
              <span>{step.stage}</span>
              <h4>{step.title}</h4>
              <p>{step.detail}</p>
              {index < report.causalChain.length - 1 && <ArrowRight aria-hidden="true" size={20} />}
            </div>
          ))}
        </div>
      </section>

      <section className="deep-report-section">
        <div className="deep-section-heading">
          <div>
            <span className="panel-label">诊断矩阵</span>
            <h3>先验证风险最高的变量</h3>
          </div>
          <span className="analysis-basis analysis-basis--mixed">启发式优先级，不是医学评分</span>
        </div>
        <div className="diagnostic-matrix">
          {report.diagnosticMatrix.map((item) => (
            <article key={item.dimension}>
              <div className="diagnostic-score">
                <strong>{item.riskScore}</strong>
                <span>{item.level}</span>
              </div>
              <div>
                <h4>{item.dimension}</h4>
                <p>{item.finding}</p>
                <span>{item.validation}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="deep-report-section">
        <div className="deep-section-heading">
          <div>
            <span className="panel-label">行动优先级</span>
            <h3>不是什么都做，而是按顺序验证</h3>
          </div>
          <span className="analysis-basis analysis-basis--action">行动建议</span>
        </div>
        <div className="priority-action-grid">
          {report.priorityActions.map((action) => (
            <article key={action.priority}>
              <span>{action.priority}</span>
              <h4>{action.title}</h4>
              <p>{action.reason}</p>
              <dl>
                <div><dt>判断指标</dt><dd>{action.metric}</dd></div>
                <div><dt>第一步</dt><dd>{action.firstStep}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="deep-report-section">
        <div className="deep-section-heading">
          <div>
            <span className="panel-label">7 天验证计划</span>
            <h3>一周后，你应该得到证据，而不只是感觉</h3>
          </div>
          <span className="analysis-basis analysis-basis--action">最小可行实验</span>
        </div>
        <div className="seven-day-plan">
          {report.sevenDayPlan.map((step) => (
            <article key={step.day}>
              <span>{step.day}</span>
              <h4>{step.title}</h4>
              <p>{step.task}</p>
              <strong>{step.output}</strong>
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
          <button className="ghost-button" onClick={onBack} type="button">
            <ArrowLeft size={18} />
            回看流程
          </button>
        </div>
        <div className="evidence-grid">
          {report.evidence.map((item) => (
            <EvidenceCard evidence={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
