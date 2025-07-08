import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useVisibilityAwareInterval } from "@/hooks/useVisibilityAwareInterval";
import { useRobustScheduleFetch } from "@/hooks/useRobustScheduleFetch";
import { StandardScheduleLayout } from "@/components/shared/StandardScheduleLayout";
import { StandardArrival, CITY_CONFIGS } from "@/types/schedule";

interface CTAResponse {
  success: boolean;
  data: StandardArrival[];
  error?: string;
  timestamp: string;
  source: string;
}

export const CTASchedule = () => {
  const [arrivals, setArrivals] = useState<StandardArrival[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  
  // Use robust fetch hook with CTA-specific config
  const { fetchWithRetry, loading, error, clearError } = useRobustScheduleFetch('CTA', {
    maxRetries: 4, // Extra retry for CTA
    retryDelay: 2000, // Longer delay for CTA API
    timeout: 20000, // Longer timeout
    rateLimit: {
      maxRequests: 8, // Conservative rate limiting
      timeWindow: 60000
    }
  });

  const config = CITY_CONFIGS.chicago;

  // Component mount debugging
  console.log('🚆 CTASchedule component mounted!');
  console.log('🚆 CTASchedule config:', config);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const fetchArrivals = async () => {
    console.log('🚆 CTA fetchArrivals called with:', { selectedLine, selectedStation, isOnline });
    
    if (!isOnline) {
      console.log('🚆 CTA offline, showing toast');
      toast({
        title: "No Internet Connection",
        description: "Please check your connection and try again.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    clearError(); // Clear any previous errors

    try {
      const requestBody: any = {};
      
      // Only send parameters if they're actually selected (not "all")
      if (selectedLine !== "all") {
        // Map UI line names to CTA API route identifiers
        const routeMapping: { [key: string]: string } = {
          'red': 'Red',
          'blue': 'Blue', 
          'brown': 'Brn',
          'green': 'G',
          'orange': 'Org',
          'purple': 'P',
          'pink': 'Pink',
          'yellow': 'Y'
        };
        requestBody.routeId = routeMapping[selectedLine.toLowerCase()] || selectedLine;
      }
      if (selectedStation !== "all") {
        const stationMapping: { [key: string]: string } = {
          // Blue Line stations
          "ohare": "30171",
          "rosemont": "30890",
          "cumberland": "30170",
          "harlem-blue": "30230",
          "jefferson-park": "30081",
          "montrose-blue": "30076",
          "irving-park-blue": "30075",
          "addison-blue": "30074",
          "belmont-blue": "30073",
          "logan-square": "30077",
          "california-blue": "30071",
          "western-blue": "30220",
          "damen-blue": "30069",
          "division": "30068",
          "chicago-blue": "30067",
          "grand-blue": "30066",
          "clark-lake": "30131",
          "washington": "30064",
          "monroe": "30212",
          "jackson-blue": "30212",
          "lasalle-van-buren": "30031",
          "clinton": "30033",
          "uic-halsted": "30034",
          "racine": "30035",
          "illinois-medical-district": "30036",
          "western-forest-park": "30220",
          "kedzie-homan": "30038",
          "pulaski": "30039",
          "cicero": "30040",
          "austin": "30041",
          "oak-park": "30042",
          "harlem-forest-park": "30043",
          "forest-park": "30044",
          
          // Red Line stations
          "howard": "30173",
          "jarvis": "30251",
          "morse": "30252",
          "loyola": "30253",
          "granville": "30254",
          "thorndale": "30255",
          "bryn-mawr": "30256",
          "berwyn": "30257",
          "argyle": "30258",
          "lawrence": "30259",
          "wilson": "30256",
          "sheridan": "30261",
          "addison": "30278",
          "belmont-red": "30254",
          "fullerton": "30057",
          "north-clybourn": "30017",
          "clark-division": "30018",
          "chicago-state": "30013",
          "grand-red": "30014",
          "lake": "30015",
          "monroe-red": "30016",
          "jackson-red": "30001",
          "harrison": "30002",
          "roosevelt": "30001",
          "cermak-chinatown": "30003",
          "sox-35th": "30004",
          "47th": "30005",
          "garfield": "30006",
          "63rd": "30007",
          "69th": "30008",
          "79th": "30009",
          "87th": "30010",
          "95th-dan-ryan": "30089",
          
          // Orange Line stations
          "midway": "30063",
          "pulaski-orange": "30062",
          "kedzie-orange": "30061",
          "western-orange": "30060",
          "35th-archer": "30059",
          "ashland": "30058",
          "halsted": "30031",
          "roosevelt-orange": "30001",
          "lasalle": "30031",
          "library": "30056",
          "quincy": "30055",
          "washington-wells": "30054",
          "clark-lake-orange": "30131",
          
          // Brown Line stations
          "kimball": "30297",
          "kedzie-brown": "30296",
          "francisco": "30295",
          "rockwell": "30294",
          "western-brown": "30293",
          "damen-brown": "30292",
          "montrose-brown": "30291",
          "irving-park-brown": "30290",
          "addison-brown": "30289",
          "paulina": "30288",
          "southport": "30287",
          "belmont-brown": "30286",
          "wellington": "30285",
          "diversey": "30284",
          "fullerton-brown": "30057",
          "armitage": "30283",
          "sedgwick": "30282",
          "chicago-brown": "30281",
          "merchandise-mart": "30768",
          
          // Green Line stations
          "harlem-lake": "30047",
          "oak-park-green": "30048",
          "ridgeland": "30049",
          "austin-green": "30050",
          "central": "30051",
          "laramie": "30052",
          "cicero-green": "30053",
          "pulaski-green": "30054",
          "conservatory": "30055",
          "kedzie-green": "30056",
          "california-green": "30057",
          "ashland-63rd": "30058",
          "halsted-green": "30059",
          "indiana": "30060",
          "35th-bronzeville": "30061",
          "king-drive": "30062",
          "cottage-grove": "30063",
          
          // Pink Line stations
          "54th-cermak": "30098",
          "cicero-pink": "30097",
          "kostner": "30096",
          "pulaski-pink": "30095",
          "central-park": "30094",
          "kedzie-pink": "30093",
          "california-pink": "30092",
          "western-pink": "30091",
          "damen-pink": "30090",
          "18th": "30089",
          "polk": "30088",
          "ashland-pink": "30087",
          "morgan": "30086",
          "clinton-pink": "30085",
          "lasalle-pink": "30031",
          "clark-lake-pink": "30131",
          
          // Purple Line stations
          "linden": "30307",
          "central-evanston": "30306",
          "noyes": "30305",
          "foster": "30304",
          "davis": "30303",
          "dempster": "30302",
          "main": "30301",
          "south-boulevard": "30300",
          "howard-purple": "30173",
          
          // Yellow Line stations
          "dempster-skokie": "30308",
          "oakton-skokie": "30309",
          "howard-yellow": "30173"
        };
        requestBody.stopId = stationMapping[selectedStation] || selectedStation;
      }
      
      console.log('🚆 CTA calling robust fetch with body:', requestBody);
      
      // Use robust fetch instead of direct supabase call
      const response: CTAResponse = await fetchWithRetry(
        'cta-schedule',
        Object.keys(requestBody).length > 0 ? requestBody : { stopId: '30173' }
      );

      console.log('🚆 CTA Robust fetch response:', response);
      console.log('🚆 CTA Response success:', response.success);
      console.log('🚆 CTA Response data length:', response.data?.length || 0);
      
      if (response.success) {
        setArrivals(response.data || []);
        
        // Format timestamp with Central Time (CTA timezone)
        const now = new Date();
        const centralTime = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Chicago',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(now);
        setLastUpdated(centralTime);
        
        if (response.data && response.data.length > 0) {
          toast({
            title: "CTA Schedule Updated",
            description: `Found ${response.data.length} upcoming arrivals at ${centralTime} CT`,
            duration: 2000
          });
        } else {
          toast({
            title: "No Current Arrivals",
            description: "No trains currently scheduled at this location",
            duration: 2000
          });
        }
      } else {
        console.log('🚆 CTA API returned error:', response.error);
        setArrivals([]);
        toast({
          title: "CTA Data Issue", 
          description: response.error || "Unable to fetch train data",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('🚆 CTA Complete error:', error);
      setArrivals([]);
      
      toast({
        title: "CTA Service Issue",
        description: "Having trouble connecting to train data. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const getLineColor = (line: string) => {
    const lineData = config.lines.find(l => l.name.toLowerCase().includes(line.toLowerCase()));
    return lineData?.color || "bg-gray-500";
  };

  const formatArrivalTime = (arrivalTime: string) => {
    if (arrivalTime === "Boarding" || arrivalTime === "Arrived") {
      return arrivalTime;
    }
    const minutes = parseInt(arrivalTime);
    if (!isNaN(minutes)) {
      return minutes <= 1 ? "Arriving" : `${minutes} min`;
    }
    return arrivalTime;
  };

  // Use visibility-aware interval for better performance
  useVisibilityAwareInterval(fetchArrivals, 120000); // Increased to 2 minutes to avoid rate limiting

  useEffect(() => {
    console.log('🚆 CTA useEffect triggered with selectedLine/selectedStation change', { selectedLine, selectedStation });
    console.log('🚆 CTA calling fetchArrivals now');
    fetchArrivals();
  }, [selectedLine, selectedStation]); // Removed fetchWithRetry dependency to prevent infinite loops

  // Initial load
  useEffect(() => {
    console.log('🚆 CTA component mounted, initial fetchArrivals call');
    fetchArrivals();
  }, []); // Empty dependency array for mount only

  // Add debugging for component render
  console.log('🚆 CTA Component rendering with state:', {
    arrivals: arrivals.length,
    loading,
    selectedLine,
    selectedStation,
    lastUpdated,
    isOnline
  });

  // Reset station when line changes
  const handleLineChange = (newLine: string) => {
    setSelectedLine(newLine);
    if (newLine !== selectedLine && selectedStation !== "all") {
      setSelectedStation("all");
    }
  };

  return (
    <StandardScheduleLayout
      config={config}
      selectedLine={selectedLine}
      selectedStation={selectedStation}
      arrivals={arrivals}
      loading={loading}
      lastUpdated={lastUpdated}
      isOnline={isOnline}
      onLineChange={handleLineChange}
      onStationChange={setSelectedStation}
      onRefresh={fetchArrivals}
      formatArrivalTime={formatArrivalTime}
      getLineColor={getLineColor}
    />
  );
};