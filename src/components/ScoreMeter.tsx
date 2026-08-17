type ScoreMeterProps = {
  label: string;
  value: number;
  tone?: "effort" | "direction" | "feedback" | "anti";
};

export function ScoreMeter({ label, value, tone = "anti" }: ScoreMeterProps) {
  return (
    <div className={`score-meter score-meter--${tone}`}>
      <div className="score-meter__top">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="score-meter__track" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
