import { Card, CardContent } from "@/components/ui/card";
import type { City } from "@/data/cities";

interface CityCardProps {
  city: City;
  onCitySelect: (cityId: string, available: boolean) => void;
}

export const CityCard = ({ city, onCitySelect }: CityCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 touch-target-large ${
        city.available
          ? "hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/20 active:scale-100"
          : "opacity-60 cursor-not-allowed"
      }`}
      onClick={() => onCitySelect(city.id, city.available)}
    >
      <CardContent className="p-6 min-h-[120px] flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${city.color}`} />
            <div>
              <h3 className="font-bold text-lg">{city.name}</h3>
              <p className="text-sm text-muted-foreground">{city.agency}</p>
            </div>
          </div>
          {city.available ? (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              Available
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
              Coming Soon
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          {city.description}
        </p>
        
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Rail Lines:</p>
          <div className="flex flex-wrap gap-1">
            {city.railLines.slice(0, 6).map((line, index) => (
              <span
                key={index}
                className="bg-muted px-2 py-1 rounded text-xs font-medium"
              >
                {line}
              </span>
            ))}
            {city.railLines.length > 6 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{city.railLines.length - 6} more
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};