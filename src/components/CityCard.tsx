import { Card, CardContent } from "@/components/ui/card";
import type { City } from "@/data/cities";
import { useLanguage } from "@/hooks/useLanguage";

interface CityCardProps {
  city: City;
  onCitySelect: (cityId: string, available: boolean) => void;
}

export const CityCard = ({ city, onCitySelect }: CityCardProps) => {
  const { t } = useLanguage();
  
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 touch-target ${
        city.available
          ? "hover:scale-[1.02] hover:shadow-[var(--shadow-elevated)] border border-border/50 hover:border-chicago-blue/30 active:scale-[0.98]"
          : "opacity-60 cursor-not-allowed"
      }`}
      onClick={() => onCitySelect(city.id, city.available)}
    >
      <CardContent className="p-4 min-h-[140px] flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${city.color} flex-shrink-0`} />
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-tight">{t(city.name)}</h3>
              <p className="text-sm text-muted-foreground leading-tight">{t(city.agency)}</p>
            </div>
          </div>
          {city.available ? (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
              {t("Live Data")}
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
              {t("Coming Soon!")}
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(city.description)}
        </p>
        
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">{t("Rail Lines:")}</p>
          <div className="flex flex-wrap gap-2">
            {city.railLines.slice(0, 6).map((line, index) => (
              <span
                key={index}
                className="bg-muted px-2 py-1 rounded-md text-xs font-medium"
              >
                {t(line)}
              </span>
            ))}
            {city.railLines.length > 6 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{city.railLines.length - 6} {t("more")}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};