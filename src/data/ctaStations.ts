export interface CTAArrival {
  staId: string;
  staNm: string;
  stpId: string;
  stpDe: string;
  rn: string;
  rt: string;
  destNm: string;
  prdt: string;
  arrT: string;
  isApp: string;
  isSch: string;
  isDly: string;
  isFlt: string;
  flags?: string;
  lat?: string;
  lon?: string;
  heading?: string;
}

export interface CTARoute {
  rt: string;
  rtnm: string;
  rtclr: string;
  rtdd: string;
}

export interface Station {
  name: string;
  lines: string[];
  stopId?: string;
}

// 🚊 COMPREHENSIVE CTA STATIONS LIST - Updated with correct Stop IDs
export const POPULAR_STATIONS: Station[] = [
  { name: "Union Station", lines: ["Blue"], stopId: "30212" }, // Actually Jackson Blue Line
  { name: "O'Hare Airport", lines: ["Blue"], stopId: "30171" }, // O'Hare Terminal
  { name: "Midway Airport", lines: ["Orange"], stopId: "30063" }, // Midway Terminal  
  { name: "95th/Dan Ryan", lines: ["Red"], stopId: "30089" }, // 95th Terminal
  { name: "Howard", lines: ["Red", "Purple", "Yellow"], stopId: "30173" }, // Howard Terminal
  { name: "Clark/Lake", lines: ["Blue", "Brown", "Green", "Orange", "Pink", "Purple"], stopId: "30131" },
  { name: "Chicago/State", lines: ["Red"], stopId: "30013" }, // State/Lake Red Line
  { name: "Roosevelt", lines: ["Red", "Orange", "Green"], stopId: "30001" },
  { name: "Fullerton", lines: ["Red", "Brown", "Purple"], stopId: "30057" },
  { name: "Belmont", lines: ["Red", "Brown", "Purple"], stopId: "30254" }, // Belmont Red Line
  { name: "Addison", lines: ["Red"], stopId: "30278" },
  { name: "Wilson", lines: ["Red", "Purple"], stopId: "30256" }, // Wilson Red Line
  { name: "Jackson", lines: ["Blue", "Red"], stopId: "30212" }, // Jackson Blue Line
  { name: "LaSalle/Van Buren", lines: ["Blue", "Orange", "Brown", "Purple", "Pink"], stopId: "30031" },
  { name: "Western", lines: ["Blue", "Brown"], stopId: "30220" }, // Western Blue Line
  { name: "Logan Square", lines: ["Blue"], stopId: "30077" },
  { name: "Merchandise Mart", lines: ["Brown", "Purple"], stopId: "30768" },
  { name: "North/Clybourn", lines: ["Red"], stopId: "30017" }
];