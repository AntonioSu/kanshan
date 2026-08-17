import { FlaskConical } from "lucide-react";

type KanshanMascotProps = {
  compact?: boolean;
};

export function KanshanMascot({ compact = false }: KanshanMascotProps) {
  return (
    <div className={compact ? "mascot mascot--compact" : "mascot"} aria-label="看山狐狸实验助手">
      <div className="mascot__ears">
        <span />
        <span />
      </div>
      <div className="mascot__head">
        <div className="mascot__eyes">
          <span />
          <span />
        </div>
        <div className="mascot__snout">
          <span />
        </div>
      </div>
      <div className="mascot__coat">
        <FlaskConical size={compact ? 18 : 24} aria-hidden="true" />
      </div>
    </div>
  );
}
