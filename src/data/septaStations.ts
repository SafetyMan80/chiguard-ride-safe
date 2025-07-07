export interface SEPTAArrival {
  line: string;
  destination: string;
  arrival: string;
  direction: string;
  track?: string;
  status: string;
  delay: string;
}

export const getLineColor = (lineCode: string) => {
  const colorMap: { [key: string]: string } = {
    'BSL': 'bg-orange-500', // Broad Street Line
    'MFL': 'bg-blue-600', // Market-Frankford Line
    'NHSL': 'bg-purple-600', // Norristown High Speed Line
    'RRD': 'bg-purple-700', // Regional Rail
    'Airport': 'bg-blue-500',
    'West Trenton': 'bg-green-600',
    'Warminster': 'bg-yellow-600',
    'Lansdale/Doylestown': 'bg-red-600',
    'Paoli/Thorndale': 'bg-indigo-600',
    'Media/Elwyn': 'bg-pink-600',
    'Wilmington/Newark': 'bg-teal-600',
    'Chestnut Hill East': 'bg-amber-600',
    'Chestnut Hill West': 'bg-lime-600',
    'Cynwyd': 'bg-rose-600',
    'Fox Chase': 'bg-emerald-600',
    'Manayunk/Norristown': 'bg-violet-600'
  };
  return colorMap[lineCode] || 'bg-gray-500';
};

export const popularStations = [
  "30th Street Station",
  "Jefferson Station", 
  "City Hall",
  "Temple University",
  "Airport Terminal A",
  "15th Street",
  "Suburban Station",
  "North Philadelphia"
];