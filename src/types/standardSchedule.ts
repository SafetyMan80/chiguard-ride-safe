// Standard interface for all city schedule components
export interface StandardScheduleProps {
  selectedLine?: string;
  selectedStation?: string;
  onLineChange?: (line: string) => void;
  onStationChange?: (station: string) => void;
}

export interface StandardArrival {
  line: string;
  station: string;
  destination: string;
  direction?: string;
  arrivalTime: string;
  eventTime?: string;
  delay?: string;
  trainId?: string;
  status?: string;
}

export interface StandardLine {
  id: string;
  name: string;
  color: string;
}

export interface StandardStation {
  id: string;
  name: string;
  lines?: string[];
  popular?: boolean;
}

export interface CityConfig {
  name: string;
  agency: string;
  description: string;
  lines: StandardLine[];
  stations: StandardStation[];
  tips: string[];
  icon: string;
}

// Standard city configurations
export const CITY_CONFIGS: Record<string, CityConfig> = {
  chicago: {
    name: "Chicago CTA",
    agency: "Chicago Transit Authority", 
    description: "L Train System - 8 color-coded lines",
    icon: "🏙️",
    lines: [
      { id: "all", name: "All Lines", color: "bg-gray-500" },
      { id: "red", name: "Red Line", color: "bg-red-500" },
      { id: "blue", name: "Blue Line", color: "bg-blue-500" },
      { id: "brown", name: "Brown Line", color: "bg-yellow-700" },
      { id: "green", name: "Green Line", color: "bg-green-500" },
      { id: "orange", name: "Orange Line", color: "bg-orange-500" },
      { id: "pink", name: "Pink Line", color: "bg-pink-500" },
      { id: "purple", name: "Purple Line", color: "bg-purple-500" },
      { id: "yellow", name: "Yellow Line", color: "bg-yellow-500" }
    ],
    stations: [
      { id: "all", name: "All Stations", popular: true },
      { id: "union-station", name: "Union Station", popular: true },
      { id: "millennium-station", name: "Millennium Station", popular: true },
      { id: "clark-lake", name: "Clark/Lake", popular: true },
      { id: "roosevelt", name: "Roosevelt", popular: true },
      { id: "jackson", name: "Jackson", popular: true },
      { id: "monroe", name: "Monroe", popular: true },
      { id: "ohare", name: "O'Hare Airport", popular: true },
      { id: "midway", name: "Midway Airport", popular: true }
    ],
    tips: [
      "Ventra Card or mobile app for CTA rides",
      "Blue Line connects to O'Hare Airport", 
      "Orange Line connects to Midway Airport",
      "Clark/Lake is main downtown transfer hub",
      "Last trains run around 2 AM on weekends",
      "Use CTA Train Tracker for real-time info"
    ]
  },
  
  nyc: {
    name: "NYC MTA",
    agency: "Metropolitan Transportation Authority",
    description: "Subway System - Multiple numbered and lettered lines", 
    icon: "🗽",
    lines: [
      { id: "all", name: "All Lines", color: "bg-gray-500" },
      { id: "4", name: "4 Train", color: "bg-green-600" },
      { id: "5", name: "5 Train", color: "bg-green-600" },
      { id: "6", name: "6 Train", color: "bg-green-600" },
      { id: "7", name: "7 Train", color: "bg-purple-600" },
      { id: "A", name: "A Train", color: "bg-blue-600" },
      { id: "C", name: "C Train", color: "bg-blue-600" },
      { id: "E", name: "E Train", color: "bg-blue-600" },
      { id: "F", name: "F Train", color: "bg-orange-600" },
      { id: "L", name: "L Train", color: "bg-gray-600" },
      { id: "N", name: "N Train", color: "bg-yellow-600" },
      { id: "Q", name: "Q Train", color: "bg-yellow-600" },
      { id: "R", name: "R Train", color: "bg-yellow-600" },
      { id: "W", name: "W Train", color: "bg-yellow-600" }
    ],
    stations: [
      { id: "all", name: "All Stations", popular: true },
      { id: "times-square", name: "Times Square-42nd St", popular: true },
      { id: "grand-central", name: "Grand Central-42nd St", popular: true },
      { id: "union-square", name: "Union Square-14th St", popular: true },
      { id: "penn-station", name: "Penn Station-34th St", popular: true },
      { id: "atlantic-terminal", name: "Atlantic Terminal", popular: true },
      { id: "world-trade", name: "World Trade Center", popular: true },
      { id: "brooklyn-bridge", name: "Brooklyn Bridge", popular: true },
      { id: "jfk-airport", name: "JFK Airport", popular: true }
    ],
    tips: [
      "MetroCard or OMNY (tap phone/card) for rides",
      "AirTrain connects to JFK and LGA airports",
      "Times Square is the busiest transfer hub",
      "Service runs 24/7 but with reduced overnight frequency",
      "Express trains skip stops - check before boarding",
      "Use MTA app for real-time subway arrival info"
    ]
  },
  
  denver: {
    name: "Denver RTD",
    agency: "Regional Transportation District", 
    description: "Light Rail & Commuter Rail - Multiple lettered lines",
    icon: "🏔️",
    lines: [
      { id: "all", name: "All Lines", color: "bg-gray-500" },
      { id: "A", name: "A Line", color: "bg-green-600" },
      { id: "B", name: "B Line", color: "bg-blue-600" },
      { id: "C", name: "C Line", color: "bg-orange-600" },
      { id: "D", name: "D Line", color: "bg-yellow-600" },
      { id: "E", name: "E Line", color: "bg-purple-600" },
      { id: "F", name: "F Line", color: "bg-red-600" },
      { id: "G", name: "G Line", color: "bg-teal-600" },
      { id: "H", name: "H Line", color: "bg-pink-600" },
      { id: "N", name: "N Line", color: "bg-cyan-600" },
      { id: "R", name: "R Line", color: "bg-indigo-600" },
      { id: "W", name: "W Line", color: "bg-amber-600" }
    ],
    stations: [
      { id: "all", name: "All Stations", popular: true },
      { id: "union-station", name: "Union Station", popular: true },
      { id: "denver-airport", name: "Denver International Airport", popular: true },
      { id: "downtown-littleton", name: "Downtown-Littleton", popular: true },
      { id: "westminster", name: "Westminster", popular: true },
      { id: "lakewood", name: "Lakewood", popular: true },
      { id: "thornton", name: "Thornton", popular: true },
      { id: "arvada", name: "Arvada", popular: true },
      { id: "wheat-ridge", name: "Wheat Ridge", popular: true }
    ],
    tips: [
      "MyRide Card or mobile tickets for RTD services",
      "A Line connects directly to Denver Airport",
      "Union Station is the main downtown hub", 
      "Free parking at most suburban rail stations",
      "Last trains run around midnight on weekdays",
      "RTD app shows real-time arrival predictions"
    ]
  },
  
  washington_dc: {
    name: "Washington DC Metro",
    agency: "Washington Metropolitan Area Transit Authority",
    description: "Metrorail System - 6 color-coded lines",
    icon: "🏛️", 
    lines: [
      { id: "all", name: "All Lines", color: "bg-gray-500" },
      { id: "red", name: "Red Line", color: "bg-red-500" },
      { id: "blue", name: "Blue Line", color: "bg-blue-500" },
      { id: "orange", name: "Orange Line", color: "bg-orange-500" },
      { id: "silver", name: "Silver Line", color: "bg-gray-400" },
      { id: "green", name: "Green Line", color: "bg-green-500" },
      { id: "yellow", name: "Yellow Line", color: "bg-yellow-500" }
    ],
    stations: [
      { id: "all", name: "All Stations", popular: true },
      { id: "union-station", name: "Union Station", popular: true },
      { id: "gallery-chinatown", name: "Gallery Pl-Chinatown", popular: true },
      { id: "metro-center", name: "Metro Center", popular: true },
      { id: "lenfant-plaza", name: "L'Enfant Plaza", popular: true },
      { id: "dupont-circle", name: "Dupont Circle", popular: true },
      { id: "rosslyn", name: "Rosslyn", popular: true },
      { id: "reagan-airport", name: "Reagan National Airport", popular: true },
      { id: "dulles-airport", name: "Dulles Airport", popular: true }
    ],
    tips: [
      "SmarTrip card or mobile wallet for Metro rides",
      "Silver Line connects to Dulles Airport",
      "Blue/Yellow Lines serve Reagan National Airport",
      "Metro Center is the main transfer station",
      "Rush hour pricing - higher fares during peak times",
      "WMATA app provides real-time train arrivals"
    ]
  },
  
  philadelphia: {
    name: "Philadelphia SEPTA",
    agency: "Southeastern Pennsylvania Transportation Authority",
    description: "Regional Rail and Subway System",
    icon: "🔔",
    lines: [
      { id: "all", name: "All Lines", color: "bg-gray-500" },
      { id: "market-frankford", name: "Market-Frankford Line", color: "bg-blue-500" },
      { id: "broad-street", name: "Broad Street Line", color: "bg-orange-500" },
      { id: "regional-rail", name: "Regional Rail", color: "bg-purple-500" }
    ],
    stations: [
      { id: "all", name: "All Stations", popular: true },
      { id: "30th-street", name: "30th Street Station", popular: true },
      { id: "suburban-station", name: "Suburban Station", popular: true },
      { id: "jefferson-station", name: "Jefferson Station", popular: true },
      { id: "temple-university", name: "Temple University", popular: true },
      { id: "city-hall", name: "City Hall", popular: true },
      { id: "broad-pattison", name: "Broad St-Pattison", popular: true },
      { id: "philadelphia-airport", name: "Philadelphia Airport", popular: true },
      { id: "center-city", name: "Center City", popular: true }
    ],
    tips: [
      "SEPTA Key card or mobile app for transit",
      "Regional Rail connects to Philadelphia Airport",
      "Broad Street Line serves South Philadelphia",
      "Market-Frankford Line crosses the city east-west", 
      "30th Street Station is the main Amtrak hub",
      "SEPTA app shows real-time arrival information"
    ]
  },
  
  atlanta: {
    name: "Atlanta MARTA",
    agency: "Metropolitan Atlanta Rapid Transit Authority", 
    description: "Heavy Rail System - 4 colored lines",
    icon: "🍑",
    lines: [
      { id: "all", name: "All Lines", color: "bg-gray-500" },
      { id: "red", name: "Red Line", color: "bg-red-500" },
      { id: "gold", name: "Gold Line", color: "bg-yellow-500" },
      { id: "blue", name: "Blue Line", color: "bg-blue-500" },
      { id: "green", name: "Green Line", color: "bg-green-500" }
    ],
    stations: [
      { id: "all", name: "All Stations", popular: true },
      { id: "airport", name: "Airport", popular: true },
      { id: "five-points", name: "Five Points", popular: true },
      { id: "peachtree-center", name: "Peachtree Center", popular: true },
      { id: "lindbergh-center", name: "Lindbergh Center", popular: true },
      { id: "buckhead", name: "Buckhead", popular: true },
      { id: "midtown", name: "Midtown", popular: true },
      { id: "north-springs", name: "North Springs", popular: true },
      { id: "decatur", name: "Decatur", popular: true }
    ],
    tips: [
      "Breeze Card or mobile app for MARTA rides",
      "Red/Gold Lines serve Hartsfield-Jackson Airport",
      "Five Points is the main downtown transfer station",
      "Free parking at most suburban rail stations",
      "Last trains run around midnight on weekdays",
      "MARTA app provides real-time arrival info"
    ]
  },
  
  los_angeles: {
    name: "LA Metro Rail",
    agency: "Los Angeles County Metropolitan Transportation Authority",
    description: "Metro Rail System - Light rail and subway lines", 
    icon: "🌴",
    lines: [
      { id: "all", name: "All Lines", color: "bg-gray-500" },
      { id: "red", name: "Red Line", color: "bg-red-500" },
      { id: "purple", name: "Purple Line", color: "bg-purple-500" },
      { id: "blue", name: "Blue Line", color: "bg-blue-500" },
      { id: "green", name: "Green Line", color: "bg-green-500" },
      { id: "gold", name: "Gold Line", color: "bg-yellow-500" },
      { id: "expo", name: "Expo Line", color: "bg-cyan-500" }
    ],
    stations: [
      { id: "all", name: "All Stations", popular: true },
      { id: "union-station", name: "Union Station", popular: true },
      { id: "7th-metro", name: "7th St/Metro Center", popular: true },
      { id: "hollywood-highland", name: "Hollywood/Highland", popular: true },
      { id: "westlake", name: "Westlake/MacArthur Park", popular: true },
      { id: "north-hollywood", name: "North Hollywood", popular: true },
      { id: "long-beach", name: "Long Beach", popular: true },
      { id: "santa-monica", name: "Santa Monica", popular: true },
      { id: "lax", name: "LAX Airport", popular: true }
    ],
    tips: [
      "TAP card or mobile wallet for Metro rides",
      "Metro Connector shuttle serves LAX Airport",
      "7th St/Metro Center is the main transfer hub",
      "Expo Line connects to Santa Monica Beach",
      "Red/Purple Lines are subway (underground)",
      "Metro app shows real-time arrival predictions"
    ]
  }
};