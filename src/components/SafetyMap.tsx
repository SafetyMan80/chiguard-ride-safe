import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, AlertTriangle } from 'lucide-react';

// Token will be handled securely in the edge function

interface SafetyMapProps {
  selectedCity?: string;
}

export const SafetyMap: React.FC<SafetyMapProps> = ({ selectedCity }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [incidentCount, setIncidentCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        // Get Mapbox token from edge function first
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('mapbox-safety-zones', {
          body: { action: 'get_token' }
        });
        
        if (tokenError) {
          console.error('Token fetch error:', tokenError);
          throw new Error(`Failed to fetch token: ${tokenError.message}`);
        }
        
        if (!tokenData?.token) {
          console.error('No token in response:', tokenData);
          throw new Error("No Mapbox token received from server");
        }

        console.log('Successfully got Mapbox token');
        
        // Initialize map with secure token
        mapboxgl.accessToken = tokenData.token;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-87.6298, 41.8781], // Chicago center
          zoom: 11,
          pitch: 30,
        });

        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        // Load safety zones when map loads
        map.current.on('load', () => {
          loadSafetyZones();
          setIsLoading(false);
        });

      } catch (error) {
        console.error('Map initialization error:', error);
        toast({
          title: "Map Error",
          description: error instanceof Error ? error.message : "Failed to initialize map",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  const loadSafetyZones = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('mapbox-safety-zones');
      
      if (error) throw error;

      const geoJsonData = data;
      setIncidentCount(geoJsonData.features.length);

      if (!map.current) return;

      // Add incident points source
      map.current.addSource('incidents', {
        type: 'geojson',
        data: geoJsonData
      });

      // Add safety zones (circles around incidents)
      map.current.addLayer({
        id: 'safety-zones',
        type: 'circle',
        source: 'incidents',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, ['/', ['get', 'zone_radius'], 50], // Scale radius based on zoom
            15, ['/', ['get', 'zone_radius'], 10]
          ],
          'circle-color': ['get', 'zone_color'],
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': ['get', 'zone_color'],
          'circle-stroke-opacity': 0.8
        }
      });

      // Add incident markers
      map.current.addLayer({
        id: 'incident-markers',
        type: 'circle',
        source: 'incidents',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 6,
            15, 10
          ],
          'circle-color': ['get', 'zone_color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add incident labels
      map.current.addLayer({
        id: 'incident-labels',
        type: 'symbol',
        source: 'incidents',
        layout: {
          'text-field': ['get', 'incident_type'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      // Add click handlers for incident details
      map.current.on('click', 'incident-markers', (e) => {
        if (!e.features?.[0]) return;
        
        const feature = e.features[0];
        const properties = feature.properties;
        
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3 min-w-[200px]">
              <h3 class="font-bold text-lg mb-2">${properties?.incident_type}</h3>
              <p class="text-sm mb-1"><strong>Location:</strong> ${properties?.location_name}</p>
              <p class="text-sm mb-1"><strong>Transit Line:</strong> ${properties?.transit_line}</p>
              <p class="text-sm mb-1"><strong>Reported:</strong> ${new Date(properties?.created_at).toLocaleDateString()}</p>
              <p class="text-sm text-yellow-600"><strong>⚠️ Safety Zone:</strong> ${properties?.zone_radius}m radius</p>
            </div>
          `)
          .addTo(map.current!);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'incident-markers', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'incident-markers', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      toast({
        title: "Safety Map Loaded",
        description: `Showing ${geoJsonData.features.length} active safety zones`,
      });

    } catch (error) {
      console.error('Error loading safety zones:', error);
      toast({
        title: "Error Loading Safety Zones",
        description: "Failed to load incident data for the map",
        variant: "destructive"
      });
    }
  };

  const refreshMap = () => {
    setIsLoading(true);
    loadSafetyZones().finally(() => setIsLoading(false));
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Map Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Safety Zone Map</CardTitle>
            </div>
            <Button onClick={refreshMap} disabled={isLoading} size="sm">
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>{incidentCount} Active Safety Zones</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Real-time Incident Tracking</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="destructive">High Risk (500m)</Badge>
            <Badge variant="secondary" className="bg-orange-500 text-white">Medium Risk (300m)</Badge>
            <Badge variant="secondary" className="bg-yellow-500 text-black">Caution (400m)</Badge>
            <Badge variant="secondary" className="bg-blue-500 text-white">Medical (200m)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading safety zones...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};