import { Bookmark, CalendarDays, ExternalLink, MessageCircle, ThumbsUp } from "lucide-react";
import type { ZhihuProfileContent } from "../types";

type ProfileContentCardProps = {
  content: ZhihuProfileContent;
};

const contentTypeLabels: Record<string, string> = {
  answer: "回答",
  article: "文章",
  zvideo: "视频",
  pin: "想法",
  question: "问题",
};

function formatDate(timestamp: number) {
  if (!timestamp) {
    return "日期未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp * 1000));
}

export function ProfileContentCard({ content }: ProfileContentCardProps) {
  return (
    <article className="profile-content-card">
      <div className="profile-content-card__meta">
        <span>{contentTypeLabels[content.contentType] || content.contentType}</span>
        <span>
          <CalendarDays size={14} />
          {formatDate(content.createdAt)}
        </span>
      </div>
      <h3>{content.title}</h3>
      <p>{content.summary || "该内容暂无公开摘要。"}</p>
      <div className="profile-content-card__footer">
        <div className="engagement-row" aria-label="互动数据">
          <span title="赞同">
            <ThumbsUp size={15} />
            {content.likeCount}
          </span>
          <span title="评论">
            <MessageCircle size={15} />
            {content.commentCount}
          </span>
          <span title="收藏">
            <Bookmark size={15} />
            {content.favoriteCount}
          </span>
        </div>
        <a href={content.url} rel="noreferrer" target="_blank" title="查看知乎原文">
          原文
          <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}
