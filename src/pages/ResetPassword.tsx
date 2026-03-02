import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import UrbbanLogo from "@/components/UrbbanLogo";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a recovery session from the URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValidSession(true);
    } else {
      // Also check if there's already a session (user clicked the link)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setValidSession(!!session);
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/mapa", { replace: true }), 2000);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <UrbbanLogo size="lg" />
          <p className="text-sm text-muted-foreground">
            Este link expiró o no es válido. Solicitá un nuevo link de recuperación.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <UrbbanLogo size="lg" />
          <p className="text-sm text-muted-foreground">
            {success ? "¡Contraseña actualizada!" : "Elegí tu nueva contraseña"}
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="h-12 w-12 text-primary" />
            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Actualizar contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
