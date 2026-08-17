import { Check, LoaderCircle } from "lucide-react";
import type { LabStep } from "../types";

type LabTimelineProps = {
  steps: LabStep[];
  activeIndex: number;
};

export function LabTimeline({ steps, activeIndex }: LabTimelineProps) {
  return (
    <ol className="lab-timeline">
      {steps.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <li className={isActive ? "is-active" : isDone ? "is-done" : ""} key={step.title}>
            <div className="lab-timeline__icon">
              {isDone ? <Check size={18} /> : <LoaderCircle size={18} />}
            </div>
            <div>
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
