import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  requiredPlan?: "pro" | "premium";
  currentUsed?: number;
  currentLimit?: number;
}

const UpgradeModal = ({
  open,
  onOpenChange,
  feature,
  requiredPlan = "pro",
  currentUsed,
  currentLimit,
}: UpgradeModalProps) => {
  const navigate = useNavigate();
  const Icon = requiredPlan === "premium" ? Crown : Zap;
  const planName = requiredPlan === "premium" ? "Premium" : "Pro";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 mb-2">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Límite alcanzado</DialogTitle>
          <DialogDescription className="text-center">
            {currentUsed !== undefined && currentLimit !== undefined
              ? `Usaste ${currentUsed} de ${currentLimit} ${feature} este mes.`
              : `${feature} requiere el plan ${planName}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/planes");
            }}
          >
            Ver planes
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Ahora no
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
