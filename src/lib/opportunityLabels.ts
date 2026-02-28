/**
 * Human-friendly opportunity labels.
 * Replaces raw percentages with intuitive language for all user types.
 */

export interface OpportunityLabel {
  text: string;
  shortText: string;
  emoji: string;
  tone: "excellent" | "good" | "fair" | "neutral" | "expensive";
}

export function getOpportunityLabel(score: number): OpportunityLabel {
  if (score >= 40) return { text: "Muy buen precio para la zona", shortText: "Muy buen precio", emoji: "🔥", tone: "excellent" };
  if (score >= 25) return { text: "Buen precio para la zona", shortText: "Buen precio", emoji: "⭐", tone: "good" };
  if (score >= 10) return { text: "Precio razonable", shortText: "Precio razonable", emoji: "👍", tone: "fair" };
  if (score >= -10) return { text: "Precio de mercado", shortText: "Precio justo", emoji: "", tone: "neutral" };
  return { text: "Caro para la zona", shortText: "Caro para la zona", emoji: "📈", tone: "expensive" };
}

export function getOpportunityBadgeClasses(tone: OpportunityLabel["tone"]): string {
  switch (tone) {
    case "excellent": return "bg-primary/20 text-primary border-primary/30";
    case "good": return "bg-primary/15 text-primary border-primary/20";
    case "fair": return "bg-muted text-muted-foreground border-border";
    case "neutral": return "bg-muted text-muted-foreground border-border";
    case "expensive": return "bg-destructive/10 text-destructive border-destructive/20";
  }
}
