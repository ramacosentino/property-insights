import { Badge } from "@/components/ui/badge";
import { Property } from "@/lib/propertyData";
import { TrendingDown, ExternalLink, Star } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
}

const PropertyCard = ({ property, compact = false }: PropertyCardProps) => {
  const isHighlighted = property.isTopOpportunity || property.isNeighborhoodDeal;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all hover:translate-y-[-2px] hover:shadow-lg ${
        isHighlighted
          ? "border-primary/30 bg-card"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {property.isTopOpportunity && (
              <Star className="h-4 w-4 text-primary fill-primary flex-shrink-0" />
            )}
            <h3 className="text-sm font-semibold truncate">{property.location}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {property.neighborhood}, {property.city}
          </p>
        </div>
        <a
          href={property.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 p-1.5 rounded-full hover:bg-secondary"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Precio</p>
          <p className="text-sm font-mono font-semibold">
            USD {property.price.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">USD/m²</p>
          <p className={`text-sm font-mono font-bold ${isHighlighted ? "text-primary" : ""}`}>
            {property.pricePerM2Total ? `$${property.pricePerM2Total.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="block text-foreground font-mono">{property.surfaceTotal ?? "—"}</span>
              m² tot
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

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {property.isTopOpportunity && (
              <Badge variant="default" className="text-xs bg-primary/20 text-primary border-primary/30 rounded-full">
                Top Oportunidad
              </Badge>
            )}
            {property.isNeighborhoodDeal && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary rounded-full">
                <TrendingDown className="h-3 w-3 mr-1" />
                {property.opportunityScore.toFixed(0)}% bajo mediana
              </Badge>
            )}
            {property.parking && property.parking > 0 && (
              <Badge variant="secondary" className="text-xs rounded-full">
                {property.parking} cochera{property.parking > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyCard;
