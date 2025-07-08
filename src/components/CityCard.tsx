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
      <CardContent className="p-6 min-h-[140px] flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${city.color} flex-shrink-0`} />
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-tight">{city.name}</h3>
              <p className="text-sm text-muted-foreground leading-tight">{city.agency}</p>
            </div>
          </div>
          {city.available ? (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
              Live Data
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
              Coming Soon!
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {city.description}
        </p>
        
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Rail Lines:</p>
          <div className="flex flex-wrap gap-2">
            {city.railLines.slice(0, 6).map((line, index) => (
              <span
                key={index}
                className="bg-muted px-2 py-1 rounded-md text-xs font-medium"
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