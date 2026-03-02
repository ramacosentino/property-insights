import { AlertCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UsageBannerProps {
  used: number;
  limit: number;
  label: string;
}

const UsageBanner = ({ used, limit, label }: UsageBannerProps) => {
  const navigate = useNavigate();
  const remaining = Math.max(0, limit - used);
  const isLow = remaining <= Math.ceil(limit * 0.2) && remaining > 0;
  const isExhausted = remaining === 0;

  if (!isLow && !isExhausted) return null;

  return (
    <div
      className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm ${
        isExhausted
          ? "bg-destructive/10 text-destructive border border-destructive/20"
          : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>
          {isExhausted
            ? `Sin ${label} disponibles este mes`
            : `Quedan ${remaining} ${label} este mes`}
        </span>
      </div>
      <button
        onClick={() => navigate("/planes")}
        className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-all flex-shrink-0"
      >
        <Zap className="h-3 w-3" />
        Upgrade
      </button>
    </div>
  );
};

export default UsageBanner;
