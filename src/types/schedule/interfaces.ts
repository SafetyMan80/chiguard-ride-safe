// Standard interface for all city schedule components
export interface StandardScheduleProps {
  selectedLine?: string;
  selectedStation?: string;
  onLineChange?: (line: string) => void;
  onStationChange?: (station: string) => void;
}

export interface StandardArrival {
  id?: string;
  line: string;
  station?: string;
  destination: string;
  direction?: string;
  arrivalTime: string;
  minutesToArrival?: number | null;
  eventTime?: string;
  delay?: string;
  trainId?: string;
  vehicleId?: string;
  status?: string;
  platform?: string;
  headsign?: string;
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