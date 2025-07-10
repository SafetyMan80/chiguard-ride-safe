import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, MapPinIcon, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOffline } from "@/hooks/useOffline";
import { CameraCapture } from "@/components/CameraCapture";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sanitizeInput, rateLimiter, validateLocation } from "@/lib/security";
import { DraggableIncidentCard } from "@/components/DraggableIncidentCard";

interface IncidentReportData {
  id: string;
  reporter_id: string;
  incident_type: string;
  location_name: string;
  description: string;
  created_at: string;
  transit_line: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  reporter_name: string;
}

interface City {
  id: string;
  name: string;
  agency: string;
  railLines: string[];
  lineStations?: {
    [key: string]: string[];
  };
}

interface IncidentReportProps {
  selectedCity?: City;
}

const CTA_LINES = [
  { name: "Red Line", color: "bg-chicago-red" },
  { name: "Blue Line", color: "bg-chicago-blue" },
  { name: "Green Line", color: "bg-green-600" },
  { name: "Brown Line", color: "bg-amber-700" },
  { name: "Orange Line", color: "bg-orange-500" },
  { name: "Purple Line", color: "bg-purple-600" },
  { name: "Pink Line", color: "bg-pink-500" },
  { name: "Yellow Line", color: "bg-yellow-500" }
];

const INCIDENT_TYPES = [
  "Harassment",
  "Theft/Pickpocketing", 
  "Assault",
  "Public Indecency",
  "Suspicious Activity",
  "Medical Emergency",
  "Safety Concern",
  "Other"
];

const fetchIncidentReports = async (cityId?: string): Promise<IncidentReportData[]> => {
  if (cityId) {
    // Filter by specific city using direct table query
    const { data, error } = await supabase
      .from('incident_reports')
      .select('id, reporter_id, incident_type, transit_line, location_name, description, latitude, longitude, accuracy, image_url, status, created_at, updated_at')
      .eq('status', 'active')
      .eq('transit_line', cityId)
      .order('created_at', { ascending: false })
      .limit(25);
    
    if (error) {
      console.error('Error fetching city-specific incident reports:', error);
      throw error;
    }
    
    // Add reporter_name as Anonymous User for consistency
    return (data || []).map(incident => ({
      ...incident,
      reporter_name: 'Anonymous User'
    }));
  }
  
  // Fallback to all incidents if no city specified
  const { data, error } = await supabase.rpc('get_incident_reports_with_reporter');
  
  if (error) {
    console.error('Error fetching incident reports:', error);
    throw error;
  }
  
  return data || [];
};

export const IncidentReport = ({ selectedCity }: IncidentReportProps) => {
  const [reportType, setReportType] = useState("");
  const [selectedCityId, setSelectedCityId] = useState(selectedCity?.id || "");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [line, setLine] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const { isOnline, saveOfflineReport } = useOffline();
  const queryClient = useQueryClient();

  // City data with line-specific stations
  const CITIES_WITH_RAIL = [
    {
      id: "chicago",
      name: "Chicago", 
      agency: "CTA (Chicago Transit Authority)",
      railLines: ["Red Line", "Blue Line", "Brown Line", "Green Line", "Orange Line", "Pink Line", "Purple Line", "Yellow Line"],
      lineStations: {
        "Red Line": ["Howard", "Jarvis", "Morse", "Loyola", "Granville", "Thorndale", "Bryn Mawr", "Berwyn", "Argyle", "Lawrence", "Wilson", "Sheridan", "Addison", "Belmont", "Fullerton", "North/Clybourn", "Clark/Division", "Chicago/State", "Grand/State", "Lake/State", "Monroe/State", "Jackson/State", "Harrison", "Roosevelt", "Cermak-Chinatown", "Sox-35th", "47th", "Garfield", "63rd", "69th", "79th", "87th", "95th/Dan Ryan"],
        "Blue Line": ["O'Hare", "Rosemont", "Cumberland", "Harlem (O'Hare)", "Jefferson Park", "Montrose", "Irving Park", "Addison", "Belmont", "Logan Square", "California", "Western", "Damen", "Division", "Chicago", "Grand", "Clark/Lake", "Washington", "Monroe", "Jackson", "LaSalle", "Clinton", "UIC-Halsted", "Racine", "Illinois Medical District", "Western (Forest Park)", "Kedzie-Homan", "Pulaski", "Cicero", "Austin", "Oak Park", "Harlem (Forest Park)", "Forest Park"],
        "Brown Line": ["Kimball", "Kedzie", "Francisco", "Rockwell", "Western", "Damen", "Montrose", "Irving Park", "Addison", "Paulina", "Southport", "Belmont", "Wellington", "Diversey", "Fullerton", "Armitage", "Sedgwick", "Chicago", "Merchandise Mart", "Clark/Lake", "State/Lake", "Washington/Wells", "Quincy/Wells", "LaSalle/Van Buren", "Harold Washington Library"],
        "Green Line": ["Harlem/Lake", "Oak Park", "Ridgeland", "Austin", "Central", "Laramie", "Cicero", "Pulaski", "Conservatory", "Kedzie", "California", "Ashland/63rd", "Halsted", "Indiana", "35th-Bronzeville-IIT", "Roosevelt", "Cermak-McCormick Place", "Clark/Lake"],
        "Orange Line": ["Midway", "Pulaski", "Kedzie", "Western", "35th/Archer", "Ashland", "Halsted", "Roosevelt", "Harold Washington Library", "LaSalle/Van Buren", "Quincy/Wells", "Washington/Wells", "Clark/Lake"],
        "Pink Line": ["54th/Cermak", "Cicero", "Kostner", "Pulaski", "Central Park", "Kedzie", "California", "Western", "Damen", "18th", "Polk", "Ashland", "Morgan", "Clinton", "Clark/Lake"],
        "Purple Line": ["Linden", "Central", "Noyes", "Foster", "Davis", "Dempster", "Main", "South Blvd", "Howard", "Wilson", "Belmont", "Fullerton", "Armitage", "Sedgwick", "Chicago", "Merchandise Mart", "Clark/Lake"],
        "Yellow Line": ["Howard", "Oakton-Skokie", "Dempster-Skokie"]
      }
    },
    {
      id: "nyc",
      name: "New York City",
      agency: "MTA (Metropolitan Transportation Authority)", 
      railLines: ["4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "W", "Z"],
      lineStations: {
        "4": ["Woodlawn", "161st St-Yankee Stadium", "149th St-Grand Concourse", "125th St", "86th St", "59th St-Columbus Circle", "42nd St-Times Square", "14th St-Union Square", "Brooklyn Bridge-City Hall", "Fulton St", "Wall St-William St", "Bowling Green", "Atlantic Ave-Barclays Ctr", "Crown Heights-Utica Ave"],
        "5": ["Eastchester-Dyre Ave", "149th St-Grand Concourse", "125th St", "86th St", "59th St-Columbus Circle", "42nd St-Times Square", "14th St-Union Square", "Brooklyn Bridge-City Hall", "Fulton St", "Wall St-William St", "Bowling Green", "Atlantic Ave-Barclays Ctr", "Franklin Ave-Medgar Evers College"],
        "6": ["Pelham Bay Park", "Whitlock Ave", "Elder Ave", "Morrison Ave-Soundview", "St Lawrence Ave", "Westchester Sq-E Tremont Ave", "Zerega Ave", "Castle Hill Ave", "Parkchester", "St Mary's St", "Cypress Ave", "Brook Ave", "Longwood Ave", "E 149th St", "E 143rd St-St Mary's St", "135th St", "125th St", "116th St", "110th St", "103rd St", "96th St", "86th St", "77th St", "68th St-Hunter College", "59th St", "51st St", "42nd St-Grand Central", "33rd St", "28th St", "23rd St", "14th St-Union Sq", "Astor Pl", "Bleecker St", "Spring St", "Canal St", "Brooklyn Bridge-City Hall"],
        "7": ["Flushing-Main St", "Mets-Willets Point", "111th St", "103rd St-Corona Plaza", "Junction Blvd", "90th St-Elmhurst Ave", "82nd St-Jackson Heights", "74th St-Broadway", "69th St", "61st St-Woodside", "52nd St", "46th St-Bliss St", "40th St-Lowery St", "33rd St-Rawson St", "Queensboro Plaza", "Court Sq", "Hunters Point Ave", "Vernon Blvd-Jackson Ave", "Grand Central-42nd St", "5th Ave-Bryant Park", "Times Sq-42nd St", "34th St-Hudson Yards"],
        "A": ["Inwood-207th St", "Dyckman St", "190th St", "181st St", "175th St", "168th St-Washington Hts", "163rd St-Amsterdam Ave", "155th St", "145th St", "135th St", "125th St", "116th St", "Cathedral Pkwy-110th St", "103rd St", "96th St", "86th St", "81st St-Museum of Natural History", "72nd St", "59th St-Columbus Circle", "42nd St-Port Authority", "34th St-Penn Station", "14th St", "W 4th St-Washington Sq", "Spring St", "Canal St", "Chambers St", "Fulton St", "High St-Brooklyn Bridge", "Jay St-MetroTech", "Hoyt-Schermerhorn Sts", "Nostrand Ave", "Utica Ave", "Broadway Junction", "80th St", "88th St", "Rockaway Blvd", "104th St", "111th St", "Ozone Park-Lefferts Blvd", "Aqueduct Racetrack", "Howard Beach-JFK Airport", "Broad Channel", "Beach 67th St", "Beach 60th St", "Beach 44th St", "Beach 36th St", "Beach 25th St", "Far Rockaway-Mott Ave"],
        "B": ["Bedford Park Blvd", "Kingsbridge Rd", "Fordham Rd", "182nd-183rd Sts", "Tremont Ave", "174th-175th Sts", "170th St", "167th St", "161st St-Yankee Stadium", "155th St", "145th St", "135th St", "125th St", "116th St", "Cathedral Pkwy-110th St", "103rd St", "96th St", "86th St", "81st St", "72nd St", "59th St-Columbus Circle", "47th-50th Sts-Rockefeller Ctr", "42nd St-Times Square", "34th St-Herald Sq", "W 4th St", "Broadway-Lafayette St", "Grand St", "DeKalb Ave", "Atlantic Ave-Barclays Ctr", "7th Ave", "Prospect Park", "Church Ave", "Kings Hwy", "Sheepshead Bay", "Brighton Beach"],
        "C": ["168th St", "163rd St-Amsterdam Ave", "155th St", "145th St", "135th St", "125th St", "116th St", "Cathedral Pkwy-110th St", "103rd St", "96th St", "86th St", "81st St", "72nd St", "59th St-Columbus Circle", "50th St", "42nd St-Port Authority", "34th St-Penn Station", "23rd St", "14th St", "W 4th St", "Spring St", "Canal St", "Chambers St", "Fulton St", "High St", "Jay St-MetroTech", "Hoyt-Schermerhorn Sts", "Lafayette Ave", "Clinton-Washington Aves", "Franklin Ave", "Nostrand Ave", "Kingston-Throop Aves", "Utica Ave", "Ralph Ave", "Rockaway Ave", "Broadway Junction", "Liberty Ave", "Van Siclen Ave", "Shepherd Ave", "Euclid Ave"],
        "D": ["Norwood-205th St", "Bedford Park Blvd", "Kingsbridge Rd", "Fordham Rd", "182nd-183rd Sts", "Tremont Ave", "174th-175th Sts", "170th St", "167th St", "161st St-Yankee Stadium", "155th St", "145th St", "125th St", "59th St-Columbus Circle", "47th-50th Sts", "42nd St-Times Square", "34th St-Herald Sq", "W 4th St", "Broadway-Lafayette St", "Grand St", "Atlantic Ave-Barclays Ctr", "36th St", "9th Ave", "Fort Hamilton Pkwy", "50th St", "55th St", "62nd St", "71st St", "79th St", "18th Ave", "20th Ave", "Bay Pkwy", "25th Ave", "Bay 50th St", "Stillwell Ave-Coney Island"],
        "E": ["Jamaica Center-Parsons/Archer", "Sutphin Blvd-Archer Ave-JFK Airport", "Jamaica-Van Wyck", "Briarwood", "Kew Gardens-Union Tpke", "75th Ave", "Forest Hills-71st Ave", "67th Ave", "63rd Dr-Rego Park", "Woodhaven Blvd", "Grand Ave-Newtown", "Elmhurst Ave", "Jackson Hts-Roosevelt Ave", "65th St", "Northern Blvd", "46th St", "Steinway St", "36th St", "Queens Plaza", "Lexington Ave/53rd St", "5th Ave/53rd St", "42nd St-Port Authority", "34th St-Penn Station", "23rd St", "14th St", "W 4th St", "Spring St", "Canal St", "Chambers St", "World Trade Center"],
        "F": ["Jamaica-179th St", "169th St", "Parsons Blvd", "Sutphin Blvd", "Briarwood", "Kew Gardens-Union Tpke", "75th Ave", "Forest Hills-71st Ave", "67th Ave", "63rd Dr-Rego Park", "Woodhaven Blvd", "Grand Ave-Newtown", "Elmhurst Ave", "Jackson Hts-Roosevelt Ave", "21st St-Queensbridge", "Roosevelt Island", "Lexington Ave/63rd St", "57th St", "47th-50th Sts", "42nd St-Bryant Pk", "34th St-Herald Sq", "23rd St", "14th St", "W 4th St", "Broadway-Lafayette St", "2nd Ave", "Delancey St-Essex St", "East Broadway", "York St", "Jay St-MetroTech", "Bergen St", "Carroll St", "Smith-9th Sts", "4th Ave-9th St", "7th Ave", "15th St-Prospect Park", "Fort Hamilton Pkwy", "Church Ave", "Ditmas Ave", "18th Ave", "Avenue I", "Bay Ridge Ave", "95th St", "Stillwell Ave-Coney Island"],
        "G": ["Court Sq", "21st St", "Greenpoint Ave", "Nassau Ave", "Metropolitan Ave", "Broadway", "Flushing Ave", "Myrtle-Willoughby Aves", "Bedford-Nostrand Aves", "Classon Ave", "Clinton-Washington Aves", "Fulton St", "Hoyt-Schermerhorn Sts", "Bergen St", "Carroll St", "Smith-9th Sts", "4th Ave-9th St", "7th Ave", "15th St-Prospect Park", "Fort Hamilton Pkwy", "Church Ave"],
        "J": ["Jamaica Center", "Sutphin Blvd", "121st St", "111th St", "104th St", "Woodhaven Blvd", "85th St-Forest Pkwy", "75th St", "Cypress Hills", "Crescent St", "Norwood Ave", "Cleveland St", "Van Siclen Ave", "Alabama Ave", "Broadway Junction", "Chauncey St", "Halsey St", "Gates Ave", "Kosciuszko St", "Myrtle Ave", "Flushing Ave", "Lorimer St", "Hewes St", "Marcy Ave", "Delancey St-Essex St", "Bowery", "Canal St", "Chambers St", "Fulton St", "Broad St"],
        "L": ["Canarsie-Rockaway Pkwy", "East 105th St", "New Lots Ave", "Livonia Ave", "Sutter Ave-Rutland Rd", "Atlantic Ave", "Wilson Ave", "Bushwick Ave-Aberdeen St", "Broadway Junction", "Myrtle-Wyckoff Aves", "Halsey St", "Knickerbocker Ave", "Central Ave", "Wilson Ave", "Bushwick Ave-Aberdeen St", "Montrose Ave", "Grand St", "Graham Ave", "Lorimer St", "Bedford Ave", "1st Ave", "3rd Ave", "Union Sq-14th St", "6th Ave", "8th Ave"],
        "M": ["Metropolitan Ave", "Fresh Pond Rd", "Forest Ave", "Seneca Ave", "Myrtle-Wyckoff Aves", "Knickerbocker Ave", "Central Ave", "Bushwick Ave-Aberdeen St", "Lorimer St", "Flushing Ave", "Myrtle Ave", "Kosciuszko St", "Gates Ave", "Halsey St", "Chauncey St", "Broadway Junction", "Marcy Ave", "Hewes St", "Lorimer St", "Delancey St-Essex St", "Bowery", "Canal St", "Chambers St", "Fulton St", "Broad St"],
        "N": ["Astoria-Ditmars Blvd", "Astoria Blvd", "Triboro Plaza", "31st St", "36th Ave", "39th Ave", "Queensboro Plaza", "Lexington Ave/59th St", "5th Ave/59th St", "57th St-7th Ave", "49th St", "Times Sq-42nd St", "34th St-Herald Sq", "28th St", "23rd St", "14th St-Union Sq", "Canal St", "City Hall", "Cortlandt St", "Rector St", "Whitehall St-South Ferry", "36th St", "45th St", "53rd St", "59th St", "8th Ave", "Fort Hamilton Pkwy", "New Utrecht Ave", "18th Ave", "20th Ave", "Bay Pkwy", "Kings Hwy", "Avenue U", "86th St", "Stillwell Ave-Coney Island"],
        "Q": ["96th St", "86th St", "72nd St", "Lexington Ave/63rd St", "57th St-7th Ave", "Times Sq-42nd St", "34th St-Herald Sq", "14th St-Union Sq", "Canal St", "DeKalb Ave", "Atlantic Ave-Barclays Ctr", "7th Ave", "Prospect Park", "Parkside Ave", "Church Ave", "Beverley Rd", "Cortelyou Rd", "Newkirk Plaza", "Avenue H", "Avenue J", "Avenue M", "Kings Hwy", "Avenue U", "Neck Rd", "Sheepshead Bay", "Brighton Beach", "Ocean Pkwy", "W 8th St-NY Aquarium", "Stillwell Ave-Coney Island"],
        "R": ["Forest Hills-71st Ave", "67th Ave", "63rd Dr-Rego Park", "Woodhaven Blvd", "Grand Ave-Newtown", "Elmhurst Ave", "Jackson Hts-Roosevelt Ave", "65th St", "Northern Blvd", "46th St", "Steinway St", "36th St", "Queens Plaza", "Lexington Ave/59th St", "5th Ave/59th St", "57th St-7th Ave", "49th St", "Times Sq-42nd St", "34th St-Herald Sq", "28th St", "23rd St", "14th St-Union Sq", "8th St-NYU", "Prince St", "Canal St", "City Hall", "Cortlandt St", "Rector St", "Whitehall St-South Ferry", "Court St", "Jay St-MetroTech", "DeKalb Ave", "Atlantic Ave-Barclays Ctr", "Union St", "9th St", "Prospect Ave", "25th St", "36th St", "45th St", "53rd St", "59th St", "Bay Ridge Ave", "77th St", "86th St", "Bay Ridge-95th St"],
        "W": ["Astoria-Ditmars Blvd", "Astoria Blvd", "Triboro Plaza", "31st St", "36th Ave", "39th Ave", "Queensboro Plaza", "Lexington Ave/59th St", "5th Ave/59th St", "57th St-7th Ave", "49th St", "Times Sq-42nd St", "34th St-Herald Sq", "28th St", "23rd St", "14th St-Union Sq", "8th St-NYU", "Prince St", "Canal St", "City Hall", "Cortlandt St", "Rector St", "Whitehall St-South Ferry"],
        "Z": ["Jamaica Center", "Sutphin Blvd", "121st St", "104th St", "Woodhaven Blvd", "85th St-Forest Pkwy", "75th St", "Crescent St", "Norwood Ave", "Cleveland St", "Van Siclen Ave", "Alabama Ave", "Broadway Junction", "Gates Ave", "Kosciuszko St", "Myrtle Ave", "Marcy Ave", "Delancey St-Essex St", "Bowery", "Canal St", "Chambers St", "Fulton St", "Broad St"]
      }
    },
    {
      id: "denver",
      name: "Denver",
      agency: "RTD (Regional Transportation District)",
      railLines: ["A Line", "B Line", "C Line", "D Line", "E Line", "F Line", "G Line", "H Line", "N Line", "R Line", "W Line"],
      lineStations: {
        "A Line": ["Union Station", "38th & Blake", "40th & Colorado", "Central Park-Blvd", "61st & Peña", "Airport Blvd", "Denver International Airport"],
        "B Line": ["Union Station", "27th & Welton", "25th & Welton", "Downing", "29th & Welton", "Welton", "Stapleton", "Central Park-Blvd", "Westminster"],
        "C Line": ["Union Station", "10th & Osage", "Decatur-Federal", "Lakewood", "Garrison", "Sheridan", "Knox", "Federal Center", "Littleton"],
        "D Line": ["Union Station", "Theatre District", "18th & California", "18th & Stout", "20th & Welton", "25th & Welton", "Nine Mile", "Northglenn"],
        "E Line": ["Union Station", "38th & Blake", "40th & Colorado", "Peoria", "Smith Road", "40th & Airport Way", "Lincoln"],
        "F Line": ["Union Station", "18th & California", "18th & Stout", "20th & Welton", "25th & Welton", "27th & Welton", "Dahlia", "Holly", "Ridgegate", "Sky Ridge", "Lone Tree City Center"],
        "G Line": ["Union Station", "41st & Fox", "Regis University", "72nd & Pecos", "88th & Lowell", "Eastlake-124th", "Thornton Pkwy", "124th & Huron", "Wagon Road", "Westminster", "Arvada Ridge", "Olde Town Arvada", "Gold Strike", "Wheat Ridge-Ward", "Lamar"],
        "H Line": ["Union Station", "Empower Field at Mile High", "Federal Blvd", "Sheridan", "Lakewood"],
        "N Line": ["Union Station", "38th & Blake", "40th & Colorado", "Commerce City", "72nd & Colorado", "88th & Colorado", "104th Avenue", "124th Avenue", "Eastlake-124th", "Thornton Pkwy", "Northglenn"],
        "R Line": ["Union Station", "Peoria", "Aurora Metro Center", "13th & Dallas", "Dayton", "Fitzsimons", "Central Park-Blvd", "40th & Colorado", "38th & Blake"],
        "W Line": ["Union Station", "10th & Osage", "Auraria West", "Decatur-Federal", "Federal Center", "Lakewood", "13th Avenue", "Colorado", "Wadsworth-Garrison", "Olde Town Arvada", "Wheat Ridge-Ward", "Kipling", "Belmar", "Villa Italia", "Sheridan"]
      }
    },
    {
      id: "washington_dc",
      name: "Washington D.C.",
      agency: "WMATA (Washington Metropolitan Area Transit Authority)",
      railLines: ["Red Line", "Blue Line", "Orange Line", "Silver Line", "Green Line", "Yellow Line"],
      lineStations: {
        "Red Line": ["Shady Grove", "Rockville", "Twinbrook", "White Flint", "Grosvenor-Strathmore", "Medical Center", "Bethesda", "Friendship Heights", "Tenleytown-AU", "Van Ness-UDC", "Cleveland Park", "Woodley Park-Zoo/Adams Morgan", "Dupont Circle", "Farragut North", "Metro Center", "Gallery Pl-Chinatown", "Union Station", "Rhode Island Ave-Brentwood", "Brookland-CUA", "Fort Totten", "Takoma", "Silver Spring", "Forest Glen", "Wheaton", "Glenmont"],
        "Blue Line": ["Franconia-Springfield", "Van Dorn Street", "King St-Old Town", "Braddock Road", "Ronald Reagan Washington National Airport", "Crystal City", "Pentagon City", "Pentagon", "Arlington Cemetery", "Rosslyn", "Foggy Bottom-GWU", "Farragut West", "McPherson Square", "Metro Center", "Federal Triangle", "Smithsonian", "L'Enfant Plaza", "Federal Center SW", "Capitol South", "Eastern Market", "Potomac Ave", "Stadium-Armory", "Minnesota Ave", "Deanwood", "Cheverly", "Landover", "New Carrollton", "Largo Town Center"],
        "Orange Line": ["Vienna/Fairfax-GMU", "East Falls Church", "West Falls Church", "East Falls Church", "Ballston-MU", "Virginia Square-GMU", "Clarendon", "Court House", "Rosslyn", "Foggy Bottom-GWU", "Farragut West", "McPherson Square", "Metro Center", "Federal Triangle", "Smithsonian", "L'Enfant Plaza", "Federal Center SW", "Capitol South", "Eastern Market", "Potomac Ave", "Stadium-Armory", "Minnesota Ave", "Deanwood", "Cheverly", "Landover", "New Carrollton"],
        "Silver Line": ["Wiehle-Reston East", "Spring Hill", "Greensboro", "Tysons Corner", "McLean", "East Falls Church", "Ballston-MU", "Virginia Square-GMU", "Clarendon", "Court House", "Rosslyn", "Foggy Bottom-GWU", "Farragut West", "McPherson Square", "Metro Center", "Federal Triangle", "Smithsonian", "L'Enfant Plaza", "Federal Center SW", "Capitol South", "Eastern Market", "Potomac Ave", "Stadium-Armory", "Benning Road", "Capitol Heights", "Addison Road-Seat Pleasant", "Morgan Boulevard", "Largo Town Center"],
        "Green Line": ["Greenbelt", "College Park-U of MD", "Prince George's Plaza", "West Hyattsville", "Fort Totten", "Georgia Ave-Petworth", "Columbia Heights", "U Street/African-Amer Civil War Memorial/Cardozo", "Shaw-Howard U", "Mt Vernon Sq 7th St-Convention Center", "Gallery Pl-Chinatown", "Archives-Navy Memorial-Penn Quarter", "L'Enfant Plaza", "Waterfront-SEU", "Navy Yard-Ballpark", "Anacostia", "Congress Heights", "Southern Avenue", "Naylor Road", "Suitland", "Branch Ave"],
        "Yellow Line": ["Huntington", "Eisenhower Avenue", "King St-Old Town", "Braddock Road", "Ronald Reagan Washington National Airport", "Crystal City", "Pentagon City", "Pentagon", "Arlington Cemetery", "Rosslyn", "Foggy Bottom-GWU", "Farragut West", "McPherson Square", "Metro Center", "Gallery Pl-Chinatown", "Archives-Navy Memorial-Penn Quarter", "L'Enfant Plaza", "Waterfront-SEU", "Navy Yard-Ballpark", "Anacostia", "Congress Heights", "Southern Avenue", "Naylor Road", "Suitland", "Branch Ave"]
      }
    },
    {
      id: "philadelphia",
      name: "Philadelphia",
      agency: "SEPTA (Southeastern Pennsylvania Transportation Authority)",
      railLines: ["Market-Frankford Line", "Broad Street Line", "Regional Rail"],
      lineStations: {
        "Market-Frankford Line": ["Frankford Terminal", "Margaret-Orthodox", "Allegheny", "Kensington-Allegheny", "Huntingdon", "York-Dauphin", "Front-Girard", "Girard", "Fairmount", "Spring Garden", "2nd Street", "5th Street-Independence Hall", "8th Street", "11th Street", "13th Street", "15th Street", "19th Street", "22nd Street", "30th Street", "34th Street", "40th Street", "46th Street", "52nd Street", "56th Street", "60th Street", "63rd Street", "69th Street Terminal"],
        "Broad Street Line": ["Fern Rock Transportation Center", "Olney", "Logan", "Wyoming", "Hunting Park", "Erie", "Allegheny", "North Philadelphia", "Girard", "Fairmount", "Spring Garden", "Race-Vine", "City Hall", "Walnut-Locust", "Lombard-South", "Ellsworth-Federal", "Tasker-Morris", "Snyder", "Oregon", "Girard Ave", "Pattison", "NRG Station"],
        "Regional Rail": ["30th Street Station", "Suburban Station", "Jefferson Station", "Temple University", "North Philadelphia", "Wayne Junction", "Germantown", "Mt Airy", "Chestnut Hill East", "Chestnut Hill West", "Manayunk", "Ivy Ridge", "Miquon", "Spring Mill", "Conshohocken", "Norristown", "King of Prussia", "Valley Forge", "Paoli", "Villanova", "Ardmore", "Haverford", "Bryn Mawr", "Rosemont", "Radnor", "St Davids", "Wayne", "Devon", "Berwyn", "Daylesford", "Malvern", "Downingtown", "Thorndale", "Coatesville", "Parkesburg", "Atglen", "Christiana", "Bear", "Newark", "Claymont", "Marcus Hook", "Highland Ave", "Chester Transportation Center", "Eddystone", "Crum Lynne", "Ridley Park", "Prospect Park", "Norwood", "Glenolden", "Folcroft", "Sharon Hill", "Curtis Park", "Darby", "Eastwick", "University City", "Gray 30th Street"]
      }
    },
    {
      id: "atlanta",
      name: "Atlanta",
      agency: "MARTA (Metropolitan Atlanta Rapid Transit Authority)",
      railLines: ["Red Line", "Gold Line", "Blue Line", "Green Line"],
      lineStations: {
        "Red Line": ["North Springs", "Sandy Springs", "Dunwoody", "Medical Center", "Buckhead", "Lindbergh Center", "Arts Center", "Midtown", "North Avenue", "Civic Center", "Peachtree Center", "Five Points", "Garnett", "West End", "Oakland City", "Lakewood/Ft. McPherson", "East Point", "College Park", "Airport"],
        "Gold Line": ["Doraville", "Chamblee", "Brookhaven/Oglethorpe University", "Lenox", "Lindbergh Center", "Arts Center", "Midtown", "North Avenue", "Civic Center", "Peachtree Center", "Five Points", "Garnett", "West End", "Oakland City", "Lakewood/Ft. McPherson", "East Point", "College Park", "Airport"],
        "Blue Line": ["Hamilton E. Holmes", "West Lake", "Ashby", "Vine City", "Omni Dome", "Five Points", "Georgia State", "King Memorial", "Inman Park/Reynoldstown", "Edgewood/Candler Park", "East Lake", "Decatur", "Avondale", "Kensington", "Indian Creek"],
        "Green Line": ["Bankhead", "Ashby", "Vine City", "Omni Dome", "Five Points", "Georgia State", "King Memorial", "Inman Park/Reynoldstown", "Edgewood/Candler Park", "East Lake", "Decatur", "Avondale", "Kensington", "Indian Creek"]
      }
    }
  ];

  const currentCity = CITIES_WITH_RAIL.find(city => city.id === selectedCityId) || selectedCity;
  
  // Get available stations based on selected line
  const availableStations = currentCity && line && 'lineStations' in currentCity && currentCity.lineStations 
    ? currentCity.lineStations[line as keyof typeof currentCity.lineStations] || []
    : [];

  // Reset location when line changes
  useEffect(() => {
    if (line && location && location !== "other") {
      // Check if current location is still valid for the selected line
      if (!availableStations.includes(location)) {
        setLocation("");
      }
    }
  }, [line, availableStations, location]);
  
  const { 
    latitude, 
    longitude, 
    accuracy, 
    error: geoError, 
    loading: geoLoading,
    getCurrentLocation 
  } = useGeolocation();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Fetch incident reports with React Query
  const { data: incidents = [], isLoading, error } = useQuery<IncidentReportData[]>({
    queryKey: ['incident-reports', selectedCity?.id || selectedCityId],
    queryFn: () => fetchIncidentReports(selectedCity?.id || selectedCityId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('incident-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_reports'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleGetCurrentLocation = () => {
    setUseCurrentLocation(true);
    getCurrentLocation();
  };

  const handleSubmitReport = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit an incident report.",
        variant: "destructive"
      });
      return;
    }

    if (!reportType || (!selectedCity && !selectedCityId) || !location || !line || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to submit your report.",
        variant: "destructive"
      });
      return;
    }

    if (!currentCity) {
      toast({
        title: "City required",
        description: "Please select a city to report the incident.",
        variant: "destructive"
      });
      return;
    }

    // Validate custom location if "other" is selected
    if (location === "other" && !customLocation.trim()) {
      toast({
        title: "Location required",
        description: "Please specify the location when 'Other' is selected.",
        variant: "destructive"
      });
      return;
    }

    // Rate limiting check
    const rateLimitKey = `incident_report_${currentUser.id}`;
    if (!rateLimiter.canProceed(rateLimitKey, 3, 300000)) { // 3 reports per 5 minutes
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(rateLimitKey) / 60000);
      toast({
        title: "Rate limit exceeded",
        description: `Please wait ${remainingTime} minutes before submitting another report.`,
        variant: "destructive"
      });
      return;
    }

    // Validate location if provided
    if (!validateLocation(latitude || undefined, longitude || undefined)) {
      toast({
        title: "Invalid location",
        description: "The location coordinates appear to be invalid.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Determine the final location name
    const finalLocationName = location === "other" ? customLocation : location;

    // Prepare report data with sanitized inputs
    const reportData = {
      reporter_id: currentUser.id,
      incident_type: sanitizeInput(reportType),
      transit_line: sanitizeInput(line),
      location_name: sanitizeInput(finalLocationName),
      description: sanitizeInput(description),
      latitude: latitude || null,
      longitude: longitude || null,
      accuracy: accuracy || null
    };

    // Handle offline scenario
    if (!isOnline) {
      const saved = await saveOfflineReport('incident', reportData);
      if (saved) {
        // Reset form
        setReportType("");
        setLocation("");
        setCustomLocation("");
        setLine("");
        setDescription("");
        setImageUrl(null);
        setUseCurrentLocation(false);

        toast({
          title: "📱 Report Saved Offline",
          description: "Your report will be submitted when connection returns.",
          variant: "default"
        });
      } else {
        toast({
          title: "Failed to save offline",
          description: "Please try again when online.",
          variant: "destructive"
        });
      }
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Starting incident report submission...', reportData);
      
      // Handle image upload if there is one
      let uploadedImageUrl = null;
      if (imageUrl) {
        console.log('Uploading image...');
        try {
          // Convert blob URL to actual file
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          
          const fileName = `incident-${Date.now()}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('id-documents')
            .upload(`incident-photos/${fileName}`, blob, {
              contentType: 'image/jpeg',
            });

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            toast({
              title: "Image upload failed",
              description: uploadError.message || "Could not upload photo. Report will be submitted without image.",
              variant: "destructive"
            });
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('id-documents')
              .getPublicUrl(uploadData.path);
            uploadedImageUrl = publicUrl;
            console.log('Image uploaded successfully:', uploadedImageUrl);
          }
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          toast({
            title: "Image processing failed",
            description: "Could not process photo. Report will be submitted without image.",
            variant: "destructive"
          });
        }
      }

      console.log('Inserting incident report into database...');
      // Insert incident report
      const { data: insertData, error } = await supabase
        .from('incident_reports')
        .insert({
          ...reportData,
          image_url: uploadedImageUrl
        })
        .select();

      console.log('Database insert result:', { data: insertData, error });

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      // Reset form
      setReportType("");
      setLocation("");
      setCustomLocation("");
      setLine("");
      setDescription("");
      setImageUrl(null);
      setUseCurrentLocation(false);

      toast({
        title: "✅ Report Submitted Successfully!",
        description: "Your incident report has been shared with other RAILSAVIOR users.",
      });

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
    } catch (error: any) {
      console.error('Error submitting report:', error);
      
      // Show more specific error message
      const errorMessage = error?.message || error?.details || "Unknown error occurred";
      console.error('Detailed error:', errorMessage);
      
      toast({
        title: "Failed to submit report",
        description: `Error: ${errorMessage}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageCapture = (capturedImageUrl: string) => {
    setImageUrl(capturedImageUrl);
    toast({
      title: "Photo Added",
      description: "Photo has been attached to your incident report.",
    });
  };

  const handleRemoveImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete your report.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('incident_reports')
        .delete()
        .eq('id', reportId)
        .eq('reporter_id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Report deleted",
        description: "Your incident report has been removed.",
      });

      queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Failed to delete report",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Get line color dynamically based on city and line
  const getLineColor = (lineName: string) => {
    // Use a more generic approach since we now support multiple cities
    return "bg-primary";
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    };
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Failed to load incident reports. Please try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Form */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary-foreground/5 to-background">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary-foreground/10 border-b border-primary/20">
        <CardTitle className="flex items-center gap-2 text-primary">
          <div className="w-6 h-6 bg-primary rounded-full text-primary-foreground flex items-center justify-center text-sm font-bold">📝</div>
          Report an Incident
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Help keep the community informed about safety concerns - all reports are anonymous</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Incident Type */}
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select incident type" />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City Selection (if not pre-selected) */}
          {!selectedCity && (
            <Select value={selectedCityId} onValueChange={setSelectedCityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES_WITH_RAIL.map(city => (
                  <SelectItem key={city.id} value={city.id}>
                    <div className="flex items-center gap-2">
                      {city.name} - {city.agency}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Rail Line Selection (dynamic based on selected city) */}
          {currentCity && (
            <Select value={line} onValueChange={setLine}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${currentCity.name} line`} />
              </SelectTrigger>
              <SelectContent>
                {currentCity.railLines.map(railLine => (
                  <SelectItem key={railLine} value={railLine}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {railLine}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Location Selection */}
          <div className="space-y-2">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder={currentCity ? `Select ${currentCity.name} station/location` : "Select station or location"} />
              </SelectTrigger>
               <SelectContent>
                 {availableStations.map(station => (
                   <SelectItem key={station} value={station}>
                     {station}
                   </SelectItem>
                 ))}
                 <SelectItem value="other">Other location (specify below)</SelectItem>
               </SelectContent>
            </Select>
            
            {location === "other" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter specific location"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={geoLoading}
                  className="px-3"
                >
                  <MapPinIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {useCurrentLocation && (
              <div className="text-xs text-muted-foreground">
                {geoLoading && "📍 Getting your location..."}
                {geoError && <span className="text-destructive">❌ {geoError}</span>}
                {latitude && longitude && (
                  <span className="text-green-600">
                    ✅ Location captured ({accuracy ? `±${Math.round(accuracy)}m` : 'GPS'})
                  </span>
                )}
              </div>
            )}
          </div>

          <Textarea
            placeholder="Describe what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={3}
          />

          {/* Photo Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Photo Evidence (Optional)</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Add Photo
              </Button>
            </div>
            
            {imageUrl && (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Incident photo" 
                  className="w-full h-32 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 w-6 h-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSubmitReport}
            disabled={isSubmitting || !currentUser}
            className="w-full"
          >
            {isSubmitting 
              ? "Submitting..." 
              : !currentUser 
                ? "Login to Submit Report" 
                : "Submit Report"
            }
          </Button>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Incidents ({incidents.length})</h3>
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
        </div>
        
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {isLoading 
                ? "Loading recent incidents..." 
                : "No recent incidents reported. Stay safe!"
              }
            </CardContent>
          </Card>
        ) : (
          incidents.slice(0, 8).map(incident => (
            <DraggableIncidentCard
              key={incident.id}
              incident={incident}
              currentUser={currentUser}
              onDelete={handleDeleteReport}
              getLineColor={getLineColor}
              formatDateTime={formatDateTime}
            />
          ))
        )}
      </div>

      {/* Camera Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleImageCapture}
        title="Document Incident"
      />
    </div>
  );
};