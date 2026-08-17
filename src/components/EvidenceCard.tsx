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
      {evidence.insight && <blockquote>{evidence.insight}</blockquote>}
      <div className="evidence-card__excerpt">
        <span>证据片段</span>
        <p>{evidence.effortPattern}</p>
      </div>
      <div className="evidence-card__footer">
        <strong>{evidence.feedbackSignal}</strong>
        <span>{evidence.result}</span>
      </div>
    </article>
  );
}
