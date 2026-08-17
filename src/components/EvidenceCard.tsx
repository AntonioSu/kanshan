import { ExternalLink } from "lucide-react";
import type { ZhihuEvidence } from "../types";

type EvidenceCardProps = {
  evidence: ZhihuEvidence;
};

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  return (
    <article className="evidence-card">
      <div className="evidence-card__meta">
        <span>{evidence.sourceType}</span>
        {evidence.url ? (
          <a href={evidence.url} rel="noreferrer" target="_blank" title="查看知乎原文">
            原文
            <ExternalLink size={14} />
          </a>
        ) : (
          <span>{evidence.tags.join(" / ")}</span>
        )}
      </div>
      <h3>{evidence.title}</h3>
      <dl>
        <div>
          <dt>努力模式</dt>
          <dd>{evidence.effortPattern}</dd>
        </div>
        <div>
          <dt>反馈信号</dt>
          <dd>{evidence.feedbackSignal}</dd>
        </div>
        <div>
          <dt>结果</dt>
          <dd>{evidence.result}</dd>
        </div>
      </dl>
    </article>
  );
}
