export interface IncidentReportData {
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

export interface City {
  id: string;
  name: string;
  agency: string;
  railLines: string[];
  lineStations?: {
    [key: string]: string[];
  };
}

export interface IncidentReportProps {
  selectedCity?: City;
}

export const INCIDENT_TYPES = [
  "Harassment",
  "Theft/Pickpocketing", 
  "Assault",
  "Public Indecency",
  "Suspicious Activity",
  "Medical Emergency",
  "Safety Concern",
  "Other"
];