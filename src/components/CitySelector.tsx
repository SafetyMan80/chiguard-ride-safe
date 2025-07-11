import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Train } from "lucide-react";
import { CITIES_WITH_RAIL } from "@/data/cities";
import { CityCard } from "./CityCard";
import { useLanguage } from "@/hooks/useLanguage";

interface CitySelectorProps {
  onCitySelect: (cityId: string, available: boolean) => void;
}

export const CitySelector = ({ onCitySelect }: CitySelectorProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            {t("Rail Transit Schedules")}
          </CardTitle>
          <CardDescription>
            {t("Select a city to view real-time rail schedules and station information")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {CITIES_WITH_RAIL.map((city) => (
              <CityCard 
                key={city.id} 
                city={city} 
                onCitySelect={onCitySelect} 
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t("About Multi-City Rail Support")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t("🚊 Currently Available:")}</strong> {t("Chicago CTA, New York City MTA, Denver RTD, Washington D.C. Metro, Atlanta MARTA, Boston MBTA, Los Angeles Metro, and San Francisco BART/MUNI with real-time schedules, station search, and system information.")}
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>{t("🚧 Coming Soon:")}</strong> {t("Real-time integration for Philadelphia SEPTA with the same features.")}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">{t("Features for Each City:")}</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>{t("• Real-time arrival predictions")}</li>
              <li>{t("• Interactive system maps")}</li>
              <li>{t("• Station search and stop IDs")}</li>
              <li>{t("• Service alerts and delays")}</li>
              <li>{t("• Route information and schedules")}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};