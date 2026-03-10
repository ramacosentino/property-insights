import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/lib/propertyData";
import { TrendingDown, ExternalLink, Star, XCircle, RotateCcw, EyeOff } from "lucide-react";
import { usePreselection } from "@/hooks/usePreselection";
import { useIgnoredOpportunities } from "@/hooks/useIgnoredOpportunities";
import { getOpportunityLabel, getOpportunityBadgeClasses } from "@/lib/opportunityLabels";
import { useSurfacePreference } from "@/contexts/SurfacePreferenceContext";

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
  onDiscard?: (id: string) => void;
  onRestore?: (id: string) => void;
  isDiscarded?: boolean;
}

const PropertyCard = ({ property, compact = false, onDiscard, onRestore, isDiscarded }: PropertyCardProps) => {
  const { isSelected, toggle } = usePreselection();
  const { isIgnored, ignore, restore } = useIgnoredOpportunities();
  const { getM2, m2ShortLabel } = useSurfacePreference();
  const isHighlighted = property.isTopOpportunity || property.isNeighborhoodDeal;
  const isPinned = isSelected(property.id);
  const activeM2 = getM2(property.pricePerM2Total, property.pricePerM2Covered);

  return (
    <div
      className={`rounded-2xl border p-4 transition-all hover:translate-y-[-2px] hover:shadow-lg relative ${
        isDiscarded
          ? "border-destructive/20 bg-card opacity-75"
          : isHighlighted
          ? "border-primary/30 bg-card"
          : "border-border bg-card"
      }`}
    >
      {/* Top row: title + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {property.isTopOpportunity && (
              <Star className="h-3.5 w-3.5 text-primary fill-primary flex-shrink-0" />
            )}
            <h3 className="text-sm font-semibold truncate">
              {property.neighborhood !== "Sin barrio" ? property.neighborhood : property.location}
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {[
              property.propertyType ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) : "",
              [property.street, property.city].filter(Boolean).join(", ")
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Discard / Restore small button */}
          {isDiscarded && onRestore ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRestore(property.id); }}
              className="p-1 rounded-full text-primary hover:bg-primary/10 transition-colors"
              title="Restaurar"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          ) : onDiscard ? (
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard(property.id); }}
              className="p-1 rounded-full text-muted-foreground hover:text-destructive transition-colors"
              title="Descartar"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {/* Ignore opportunity button */}
          {(property.isTopOpportunity || property.isNeighborhoodDeal) && (
            isIgnored(property.id) ? (
              <button
                onClick={(e) => { e.stopPropagation(); restore(property.id); }}
                className="p-1 rounded-full text-primary hover:bg-primary/10 transition-colors"
                title="Restaurar oportunidad"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); ignore(property.id); }}
                className="p-1 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                title="Ignorar oportunidad"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            )
          )}
          <button
            onClick={(e) => { e.stopPropagation(); toggle(property.id); }}
            className={`p-1 rounded-full transition-colors ${
              isPinned ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"
            }`}
            title={isPinned ? "Quitar de preselección" : "Agregar a preselección"}
          >
            <Star className={`h-3.5 w-3.5 ${isPinned ? "fill-yellow-500" : ""}`} />
          </button>
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Discarded badge */}
      {isDiscarded && (
        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30">
          Descartado
        </span>
      )}

      {/* Price row */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Precio</p>
          <p className="text-sm font-mono font-semibold">
            USD {property.price.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">{m2ShortLabel}</p>
          <p className={`text-sm font-mono font-bold ${isHighlighted ? "text-primary" : ""}`}>
            {activeM2 ? `$${activeM2.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {!compact && (
        <>
          {/* Main specs - 5 columns */}
          <div className="mt-2.5 grid grid-cols-5 gap-1.5 text-xs text-muted-foreground">
            <div>
              <span className="block text-foreground font-mono">{property.surfaceTotal ?? "—"}</span>
              m² tot
            </div>
            <div>
              <span className="block text-foreground font-mono">{property.surfaceCovered ?? "—"}</span>
              m² cub
            </div>
            <div>
              <span className="block text-foreground font-mono">{property.rooms ?? "—"}</span>
              amb
            </div>
            <div>
              <span className="block text-foreground font-mono">{property.bedrooms ?? "—"}</span>
              dorm
            </div>
            <div>
              <span className="block text-foreground font-mono">{property.bathrooms ?? "—"}</span>
              baños
            </div>
          </div>

          {/* Extra details inline - denser 4-col layout */}
          <div className="mt-2 grid grid-cols-4 gap-x-2 gap-y-0.5 text-[10px]">
            {property.propertyType && (
              <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{property.propertyType}</span></div>
            )}
            {property.ageYears != null && (
              <div><span className="text-muted-foreground">Antig:</span> <span className="font-mono font-medium">{property.ageYears}a</span></div>
            )}
            {property.parking != null && (
              <div><span className="text-muted-foreground">Coch:</span> <span className="font-mono font-medium">{property.parking}</span></div>
            )}
            {property.expenses != null && property.expenses > 0 && (
              <div><span className="text-muted-foreground">Exp:</span> <span className="font-mono font-medium">${property.expenses.toLocaleString()}</span></div>
            )}
            {property.disposition && (
              <div><span className="text-muted-foreground">Disp:</span> <span className="font-medium">{property.disposition}</span></div>
            )}
            {property.orientation && (
              <div><span className="text-muted-foreground">Orient:</span> <span className="font-medium">{property.orientation}</span></div>
            )}
            {property.luminosity && (
              <div><span className="text-muted-foreground">Luz:</span> <span className="font-medium">{property.luminosity}</span></div>
            )}
            {property.pricePerM2Covered != null && (
              <div><span className="text-muted-foreground">USD/m²c:</span> <span className="font-mono font-medium">${property.pricePerM2Covered.toLocaleString()}</span></div>
            )}
          </div>

          {/* Badges */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {property.isTopOpportunity && (
              <Badge variant="default" className="text-xs bg-primary/20 text-primary border-primary/30 rounded-full">
                🔥 {getOpportunityLabel(property.opportunityScore).shortText} ({Math.abs(property.opportunityScore).toFixed(0)}% {property.opportunityScore >= 0 ? "bajo" : "sobre"} mediana)
              </Badge>
            )}
            {property.isNeighborhoodDeal && !property.isTopOpportunity && (() => {
              const lbl = getOpportunityLabel(property.opportunityScore);
              return (
                <Badge variant="outline" className={`text-xs rounded-full ${getOpportunityBadgeClasses(lbl.tone)}`}>
                  {lbl.emoji} {lbl.shortText} ({Math.abs(property.opportunityScore).toFixed(0)}% {property.opportunityScore >= 0 ? "bajo" : "sobre"} mediana)
                </Badge>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyCard;
