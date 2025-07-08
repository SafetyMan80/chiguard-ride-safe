export interface City {
  id: string;
  name: string;
  agency: string;
  description: string;
  railLines: string[];
  color: string;
  available: boolean;
}

export const CITIES_WITH_RAIL: City[] = [
  // Available cities with live data
  {
    id: "chicago",
    name: "Chicago",
    agency: "CTA (Chicago Transit Authority)",
    description: "L Train System - 8 color-coded lines",
    railLines: ["Red", "Blue", "Brown", "Green", "Orange", "Pink", "Purple", "Yellow"],
    color: "bg-blue-600",
    available: true
  },
  {
    id: "nyc",
    name: "New York City",
    agency: "MTA (Metropolitan Transportation Authority)",
    description: "Subway System - Multiple numbered and lettered lines",
    railLines: ["4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "W", "Z"],
    color: "bg-blue-600",
    available: true
  },
  {
    id: "denver",
    name: "Denver",
    agency: "RTD (Regional Transportation District)",
    description: "Light Rail & Commuter Rail - Multiple lettered lines",
    railLines: ["A Line", "B Line", "C Line", "D Line", "E Line", "F Line", "G Line", "H Line", "N Line", "R Line", "W Line"],
    color: "bg-green-700",
    available: true
  },
  {
    id: "atlanta",
    name: "Atlanta",
    agency: "MARTA (Metropolitan Atlanta Rapid Transit Authority)",
    description: "Heavy Rail System - 4 colored lines",
    railLines: ["Red", "Gold", "Blue", "Green"],
    color: "bg-orange-600",
    available: true
  },
  {
    id: "boston",
    name: "Boston",
    agency: "MBTA (Massachusetts Bay Transportation Authority)",
    description: "The T - Subway, Light Rail & Commuter Rail",
    railLines: ["Red", "Blue", "Orange", "Green", "Silver"],
    color: "bg-indigo-600",
    available: true
  },
  {
    id: "san_francisco",
    name: "San Francisco",
    agency: "BART & MUNI",
    description: "BART Heavy Rail & MUNI Light Rail Systems",
    railLines: ["BART Red", "BART Blue", "BART Green", "BART Yellow", "MUNI N", "MUNI T", "MUNI K", "MUNI L", "MUNI M", "MUNI J"],
    color: "bg-purple-600",
    available: true
  },
  
  // Coming soon cities
  {
    id: "washington_dc",
    name: "Washington D.C.",
    agency: "WMATA (Washington Metropolitan Area Transit Authority)",
    description: "Metrorail System - 6 color-coded lines",
    railLines: ["Red", "Blue", "Orange", "Silver", "Green", "Yellow"],
    color: "bg-blue-800",
    available: false
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    agency: "SEPTA (Southeastern Pennsylvania Transportation Authority)",
    description: "Regional Rail and Subway System",
    railLines: ["Market-Frankford", "Broad Street", "Regional Rail"],
    color: "bg-purple-600",
    available: false
  },
  {
    id: "los_angeles",
    name: "Los Angeles",
    agency: "LA Metro",
    description: "Metro Rail System - Light rail and subway lines",
    railLines: ["Red", "Purple", "Blue", "Green", "Gold", "Expo"],
    color: "bg-red-600",
    available: false
  }
];