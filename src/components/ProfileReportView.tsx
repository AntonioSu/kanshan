import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  ExternalLink,
  FileStack,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import type { ProfileAnalysisReport } from "../types";
import { ProfileContentCard } from "./ProfileContentCard";
import { ScoreMeter } from "./ScoreMeter";

type ProfileReportViewProps = {
  report: ProfileAnalysisReport;
  onBack: () => void;
};

export function ProfileReportView({ report, onBack }: ProfileReportViewProps) {
  return (
    <section className="report-section profile-report-section">
      <div className="section-heading profile-report-heading">
        <span>
          <BarChart3 size={20} />
          创作者分析报告
        </span>
        <h2>知乎内容体检</h2>
        <div className="profile-identity-row">
          <strong>@{report.profileSlug}</strong>
          <a href={report.profileUrl} rel="noreferrer" target="_blank">
            查看主页
            <ExternalLink size={14} />
          </a>
          <span className={`source-badge source-badge--${report.dataSource}`}>
            {report.dataSource === "live" ? "真实授权数据" : "演示数据"}
          </span>
        </div>
      </div>

      <div className="profile-report-grid">
        <section className="profile-summary-panel">
          <span className="panel-label">综合总结</span>
          <blockquote>{report.summary}</blockquote>
          <div className="score-stack">
            <ScoreMeter label="内容影响" value={report.metrics.influence} tone="effort" />
            <ScoreMeter label="表达深度" value={report.metrics.depth} tone="direction" />
            <ScoreMeter label="互动能力" value={report.metrics.interaction} tone="feedback" />
            <ScoreMeter label="更新稳定" value={report.metrics.consistency} tone="anti" />
          </div>
        </section>

        <section className="profile-stats-panel" aria-label="公开内容数据概览">
          <div>
            <FileStack size={19} />
            <strong>{report.totalContentCount}</strong>
            <span>公开内容</span>
          </div>
          <div>
            <ThumbsUp size={19} />
            <strong>{report.engagement.totalLikes}</strong>
            <span>样本赞同</span>
          </div>
          <div>
            <MessageCircle size={19} />
            <strong>{report.engagement.totalComments}</strong>
            <span>样本评论</span>
          </div>
          <div>
            <Bookmark size={19} />
            <strong>{report.engagement.totalFavorites}</strong>
            <span>样本收藏</span>
          </div>
        </section>

        <section className="profile-mix-panel">
          <div>
            <span className="panel-label">内容结构</span>
            <div className="content-mix-list">
              {report.contentMix.map((item) => (
                <div className="content-mix-row" key={item.type}>
                  <span>{item.label}</span>
                  <div aria-hidden="true">
                    <span style={{ width: `${item.share}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="panel-label">主题聚类</span>
            <div className="topic-cloud">
              {report.topTopics.map((topic) => (
                <span key={topic.name}>
                  {topic.name}
                  <strong>{topic.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-insights-panel">
          <div>
            <span className="panel-label">表达画像</span>
            <ul>
              {report.voiceTraits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="panel-label">可放大的优势</span>
            <ul>
              {report.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="panel-label">当前增长阻力</span>
            <ul>
              {report.opportunities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="profile-actions-panel">
          <span className="panel-label">下一轮内容实验</span>
          <ol>
            {report.nextActions.map((item, index) => (
              <li key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="evidence-section">
        <div className="evidence-section__heading">
          <span className={`source-badge source-badge--${report.dataSource}`}>
            已分析 {report.sampledCount} 条公开创作，展示代表内容
          </span>
          <button className="ghost-button" onClick={onBack} type="button">
            <ArrowLeft size={18} />
            回看流程
          </button>
        </div>
        <div className="profile-content-grid">
          {report.topContent.map((content) => (
            <ProfileContentCard content={content} key={content.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
