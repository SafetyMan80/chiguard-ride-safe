import { CityConfig } from './interfaces';

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
      // Red Line Stations
      { id: "fullerton", name: "Fullerton", lines: ["red", "brown", "purple"], popular: true },
      { id: "belmont-red", name: "Belmont", lines: ["red", "brown", "purple"], popular: true },
      { id: "addison", name: "Addison", lines: ["red"], popular: true },
      { id: "wilson", name: "Wilson", lines: ["red", "purple"], popular: true },
      { id: "95th-dan-ryan", name: "95th/Dan Ryan", lines: ["red"], popular: true },
      { id: "howard", name: "Howard", lines: ["red", "purple", "yellow"], popular: true },
      { id: "chicago-state", name: "Chicago/State", lines: ["red"], popular: true },
      { id: "north-clybourn", name: "North/Clybourn", lines: ["red"], popular: true },
      // Blue Line Stations
      { id: "ohare", name: "O'Hare Airport", lines: ["blue"], popular: true },
      { id: "rosemont", name: "Rosemont", lines: ["blue"], popular: true },
      { id: "jefferson-park", name: "Jefferson Park", lines: ["blue"], popular: true },
      { id: "logan-square", name: "Logan Square", lines: ["blue"], popular: true },
      { id: "western-blue", name: "Western", lines: ["blue"], popular: true },
      { id: "division", name: "Division", lines: ["blue"], popular: true },
      { id: "chicago-blue", name: "Chicago", lines: ["blue"], popular: true },
      { id: "jackson-blue", name: "Jackson", lines: ["blue"], popular: true },
      { id: "uic-halsted", name: "UIC-Halsted", lines: ["blue"], popular: true },
      { id: "forest-park", name: "Forest Park", lines: ["blue"], popular: true },
      // Brown Line Stations
      { id: "kimball", name: "Kimball", lines: ["brown"], popular: true },
      { id: "western-brown", name: "Western", lines: ["brown"], popular: true },
      { id: "montrose", name: "Montrose", lines: ["brown"], popular: true },
      { id: "sedgwick", name: "Sedgwick", lines: ["brown"], popular: true },
      { id: "merchandise-mart", name: "Merchandise Mart", lines: ["brown", "purple"], popular: true },
      // Green Line Stations
      { id: "harlem-lake", name: "Harlem/Lake", lines: ["green"], popular: true },
      { id: "oak-park", name: "Oak Park", lines: ["green"], popular: true },
      { id: "garfield", name: "Garfield", lines: ["green"], popular: true },
      { id: "63rd-cottage-grove", name: "63rd/Cottage Grove", lines: ["green"], popular: true },
      // Orange Line Stations
      { id: "midway", name: "Midway Airport", lines: ["orange"], popular: true },
      { id: "pulaski-orange", name: "Pulaski", lines: ["orange"], popular: true },
      { id: "halsted-orange", name: "Halsted", lines: ["orange"], popular: true },
      { id: "roosevelt-orange", name: "Roosevelt", lines: ["orange", "red", "green"], popular: true },
      // Pink Line Stations
      { id: "54th-cermak", name: "54th/Cermak", lines: ["pink"], popular: true },
      { id: "california-pink", name: "California", lines: ["pink"], popular: true },
      { id: "damen-pink", name: "Damen", lines: ["pink"], popular: true },
      // Purple Line Stations
      { id: "linden", name: "Linden", lines: ["purple"], popular: true },
      { id: "davis", name: "Davis", lines: ["purple"], popular: true },
      { id: "foster", name: "Foster", lines: ["purple"], popular: true },
      // Multi-line Transfer Stations
      { id: "clark-lake", name: "Clark/Lake", lines: ["blue", "brown", "green", "orange", "pink", "purple"], popular: true },
      { id: "roosevelt", name: "Roosevelt", lines: ["red", "orange", "green"], popular: true },
      { id: "jackson", name: "Jackson", lines: ["blue", "red"], popular: true },
      { id: "lasalle-van-buren", name: "LaSalle/Van Buren", lines: ["blue", "orange", "brown", "purple", "pink"], popular: true }
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
      // Green Line (4,5,6 Trains)
      { id: "times-square", name: "Times Square-42nd St", lines: ["4", "5", "6", "7", "N", "Q", "R", "W"], popular: true },
      { id: "grand-central", name: "Grand Central-42nd St", lines: ["4", "5", "6", "7"], popular: true },
      { id: "union-square", name: "Union Square-14th St", lines: ["4", "5", "6", "L", "N", "Q", "R", "W"], popular: true },
      { id: "penn-station", name: "Penn Station-34th St", lines: ["A", "C", "E"], popular: true },
      { id: "atlantic-terminal", name: "Atlantic Terminal", lines: ["4", "5", "N", "Q", "R", "W"], popular: true },
      { id: "world-trade", name: "World Trade Center", lines: ["A", "C", "E", "R", "W"], popular: true },
      { id: "brooklyn-bridge", name: "Brooklyn Bridge", lines: ["4", "5", "6"], popular: true },
      { id: "jfk-airport", name: "JFK Airport", lines: ["A", "E"], popular: true },
      // Blue Line (A,C,E Trains)
      { id: "42nd-port-authority", name: "42nd St-Port Authority", lines: ["A", "C", "E"], popular: true },
      { id: "14th-st-union-sq", name: "14th St-Union Sq", lines: ["4", "5", "6", "L", "N", "Q", "R", "W"], popular: true },
      { id: "west-4th", name: "West 4th St", lines: ["A", "C", "E", "F"], popular: true },
      // Orange Line (F Train)
      { id: "34th-herald-sq", name: "34th St-Herald Sq", lines: ["F", "N", "Q", "R", "W"], popular: true },
      { id: "47-50-rockefeller", name: "47-50 Sts-Rockefeller Ctr", lines: ["F"], popular: true },
      // Yellow Line (N,Q,R,W Trains)
      { id: "queensboro-plaza", name: "Queensboro Plaza", lines: ["7", "N", "W"], popular: true },
      { id: "canal-st", name: "Canal St", lines: ["4", "5", "6", "N", "Q", "R", "W"], popular: true }
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
      // Multi-line stations (Union Station serves all lines)
      { id: "union-station", name: "Union Station", lines: ["A", "B", "C", "D", "E", "F", "G", "H", "N", "R", "W"], popular: true },
      // A Line (to DEN Airport)
      { id: "denver-airport", name: "Denver International Airport", lines: ["A"], popular: true },
      { id: "39th-blake", name: "39th/Blake", lines: ["A"], popular: true },
      { id: "peoria", name: "Peoria", lines: ["A"], popular: true },
      // C/D Lines
      { id: "downtown-littleton", name: "Downtown-Littleton", lines: ["C", "D"], popular: true },
      { id: "mineral", name: "Mineral", lines: ["C", "D"], popular: true },
      // B/G Lines
      { id: "westminster", name: "Westminster", lines: ["B", "G"], popular: true },
      { id: "72nd-federal", name: "72nd/Federal", lines: ["B", "G"], popular: true },
      // W Line
      { id: "lakewood", name: "Lakewood", lines: ["W"], popular: true },
      { id: "sheridan", name: "Sheridan", lines: ["W"], popular: true },
      // N Line
      { id: "thornton", name: "Thornton", lines: ["N"], popular: true },
      { id: "124th", name: "124th", lines: ["N"], popular: true },
      // G Line
      { id: "arvada", name: "Arvada", lines: ["G"], popular: true },
      { id: "wheat-ridge", name: "Wheat Ridge", lines: ["G"], popular: true }
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
      // Red Line
      { id: "union-station", name: "Union Station", lines: ["red"], popular: true },
      { id: "gallery-chinatown", name: "Gallery Pl-Chinatown", lines: ["red", "yellow", "green"], popular: true },
      { id: "metro-center", name: "Metro Center", lines: ["red", "blue", "orange", "silver"], popular: true },
      { id: "dupont-circle", name: "Dupont Circle", lines: ["red"], popular: true },
      { id: "woodley-park", name: "Woodley Park", lines: ["red"], popular: true },
      // Blue/Orange/Silver Lines
      { id: "lenfant-plaza", name: "L'Enfant Plaza", lines: ["blue", "orange", "silver", "green", "yellow"], popular: true },
      { id: "smithsonian", name: "Smithsonian", lines: ["blue", "orange", "silver"], popular: true },
      { id: "rosslyn", name: "Rosslyn", lines: ["blue", "orange", "silver"], popular: true },
      { id: "reagan-airport", name: "Reagan National Airport", lines: ["blue", "yellow"], popular: true },
      { id: "dulles-airport", name: "Dulles Airport", lines: ["silver"], popular: true },
      // Green/Yellow Lines
      { id: "fort-totten", name: "Fort Totten", lines: ["green", "yellow", "red"], popular: true },
      { id: "archives", name: "Archives", lines: ["green", "yellow"], popular: true },
      // Green Line only
      { id: "anacostia", name: "Anacostia", lines: ["green"], popular: true },
      // Yellow Line only
      { id: "pentagon", name: "Pentagon", lines: ["yellow", "blue"], popular: true }
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
      // Market-Frankford Line (Blue)
      { id: "69th-street", name: "69th Street", lines: ["market-frankford"], popular: true },
      { id: "millbourne", name: "Millbourne", lines: ["market-frankford"], popular: true },
      { id: "30th-street", name: "30th Street Station", lines: ["market-frankford", "regional-rail"], popular: true },
      { id: "15th-street", name: "15th Street", lines: ["market-frankford"], popular: true },
      { id: "8th-market", name: "8th & Market", lines: ["market-frankford"], popular: true },
      { id: "5th-independence", name: "5th St/Independence Hall", lines: ["market-frankford"], popular: true },
      { id: "2nd-street", name: "2nd Street", lines: ["market-frankford"], popular: true },
      { id: "frankford", name: "Frankford", lines: ["market-frankford"], popular: true },
      // Broad Street Line (Orange)
      { id: "fern-rock", name: "Fern Rock", lines: ["broad-street"], popular: true },
      { id: "olney", name: "Olney", lines: ["broad-street"], popular: true },
      { id: "temple-university", name: "Temple University", lines: ["broad-street"], popular: true },
      { id: "girard", name: "Girard", lines: ["broad-street"], popular: true },
      { id: "city-hall", name: "City Hall", lines: ["broad-street"], popular: true },
      { id: "walnut-locust", name: "Walnut-Locust", lines: ["broad-street"], popular: true },
      { id: "broad-pattison", name: "Broad St-Pattison", lines: ["broad-street"], popular: true },
      { id: "nrg-station", name: "NRG Station", lines: ["broad-street"], popular: true },
      // Regional Rail
      { id: "suburban-station", name: "Suburban Station", lines: ["regional-rail"], popular: true },
      { id: "jefferson-station", name: "Jefferson Station", lines: ["regional-rail"], popular: true },
      { id: "philadelphia-airport", name: "Philadelphia Airport", lines: ["regional-rail"], popular: true },
      { id: "center-city", name: "Center City", lines: ["regional-rail"], popular: true }
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
      // Red/Gold Lines (serve airport)
      { id: "airport", name: "Airport", lines: ["red", "gold"], popular: true },
      { id: "college-park", name: "College Park", lines: ["red", "gold"], popular: true },
      { id: "east-point", name: "East Point", lines: ["red", "gold"], popular: true },
      { id: "west-end", name: "West End", lines: ["red", "gold"], popular: true },
      { id: "garnett", name: "Garnett", lines: ["red", "gold"], popular: true },
      { id: "five-points", name: "Five Points", lines: ["red", "gold", "blue", "green"], popular: true },
      { id: "peachtree-center", name: "Peachtree Center", lines: ["red", "gold"], popular: true },
      { id: "civic-center", name: "Civic Center", lines: ["red", "gold"], popular: true },
      { id: "north-avenue", name: "North Avenue", lines: ["red", "gold"], popular: true },
      { id: "midtown", name: "Midtown", lines: ["red", "gold"], popular: true },
      { id: "arts-center", name: "Arts Center", lines: ["red", "gold"], popular: true },
      { id: "lindbergh-center", name: "Lindbergh Center", lines: ["red", "gold"], popular: true },
      { id: "buckhead", name: "Buckhead", lines: ["red", "gold"], popular: true },
      { id: "sandy-springs", name: "Sandy Springs", lines: ["red"], popular: true },
      { id: "north-springs", name: "North Springs", lines: ["red"], popular: true },
      { id: "doraville", name: "Doraville", lines: ["gold"], popular: true },
      // Blue/Green Lines
      { id: "hamilton-holmes", name: "Hamilton E Holmes", lines: ["blue"], popular: true },
      { id: "west-lake", name: "West Lake", lines: ["blue"], popular: true },
      { id: "ashby", name: "Ashby", lines: ["green"], popular: true },
      { id: "vine-city", name: "Vine City", lines: ["green"], popular: true },
      { id: "omni-dome", name: "Omni Dome", lines: ["blue", "green"], popular: true },
      { id: "georgia-state", name: "Georgia State", lines: ["blue", "green"], popular: true },
      { id: "king-memorial", name: "King Memorial", lines: ["blue", "green"], popular: true },
      { id: "inman-park", name: "Inman Park", lines: ["blue", "green"], popular: true },
      { id: "edgewood", name: "Edgewood", lines: ["blue", "green"], popular: true },
      { id: "east-lake", name: "East Lake", lines: ["blue"], popular: true },
      { id: "decatur", name: "Decatur", lines: ["blue"], popular: true },
      { id: "indian-creek", name: "Indian Creek", lines: ["blue"], popular: true },
      { id: "bankhead", name: "Bankhead", lines: ["green"], popular: true }
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
      // Red/Purple Lines (Heavy Rail)
      { id: "union-station", name: "Union Station", lines: ["red", "purple"], popular: true },
      { id: "civic-center", name: "Civic Center", lines: ["red", "purple"], popular: true },
      { id: "pershing-square", name: "Pershing Square", lines: ["red", "purple"], popular: true },
      { id: "7th-metro", name: "7th St/Metro Center", lines: ["red", "purple"], popular: true },
      { id: "westlake", name: "Westlake/MacArthur Park", lines: ["red"], popular: true },
      { id: "wilshire-vermont", name: "Wilshire/Vermont", lines: ["red"], popular: true },
      { id: "hollywood-vine", name: "Hollywood/Vine", lines: ["red"], popular: true },
      { id: "hollywood-highland", name: "Hollywood/Highland", lines: ["red"], popular: true },
      { id: "universal-city", name: "Universal City", lines: ["red"], popular: true },
      { id: "north-hollywood", name: "North Hollywood", lines: ["red"], popular: true },
      { id: "wilshire-normandie", name: "Wilshire/Normandie", lines: ["purple"], popular: true },
      { id: "wilshire-western", name: "Wilshire/Western", lines: ["purple"], popular: true },
      // Blue Line
      { id: "downtown-long-beach", name: "Downtown Long Beach", lines: ["blue"], popular: true },
      { id: "long-beach-blvd", name: "Long Beach Blvd", lines: ["blue"], popular: true },
      { id: "willowbrook", name: "Willowbrook", lines: ["blue", "green"], popular: true },
      { id: "rosa-parks", name: "Rosa Parks", lines: ["blue"], popular: true },
      { id: "grand", name: "Grand", lines: ["blue"], popular: true },
      // Green Line
      { id: "redondo-beach", name: "Redondo Beach", lines: ["green"], popular: true },
      { id: "el-segundo", name: "El Segundo", lines: ["green"], popular: true },
      { id: "hawthorne", name: "Hawthorne", lines: ["green"], popular: true },
      { id: "crenshaw", name: "Crenshaw", lines: ["green"], popular: true },
      { id: "norwalk", name: "Norwalk", lines: ["green"], popular: true },
      // Gold Line
      { id: "east-la", name: "East LA", lines: ["gold"], popular: true },
      { id: "little-tokyo", name: "Little Tokyo", lines: ["gold"], popular: true },
      { id: "pasadena", name: "Pasadena", lines: ["gold"], popular: true },
      { id: "sierra-madre", name: "Sierra Madre Villa", lines: ["gold"], popular: true },
      // Expo Line
      { id: "santa-monica", name: "Santa Monica", lines: ["expo"], popular: true },
      { id: "expo-bundy", name: "Expo/Bundy", lines: ["expo"], popular: true },
      { id: "culver-city", name: "Culver City", lines: ["expo"], popular: true },
      { id: "expo-vermont", name: "Expo/Vermont", lines: ["expo"], popular: true },
      // LAX Connection
      { id: "lax", name: "LAX Airport", lines: ["green"], popular: true }
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