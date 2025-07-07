import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export const CTAHelpSection = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          How to Find Your Stop ID
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>• Look for the 5-digit number on CTA stop signs</p>
        <p>• Use the CTA app or website to find stop IDs</p>
        <p>• Popular stops: Union Station (30161), O'Hare (40890)</p>
        <p>• Search stations above to find Stop IDs</p>
      </CardContent>
    </Card>
  );
};