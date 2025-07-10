// Transit system mapping utility
export const getTransitSystemFromCity = (city: string | null | undefined): string => {
  if (!city) return 'Public Transit';
  
  const cityLower = city.toLowerCase();
  
  // Main transit systems mapping
  const transitSystems: Record<string, string> = {
    // Chicago
    'chicago': 'CTA',
    'chi': 'CTA',
    
    // New York
    'nyc': 'MTA',
    'new_york': 'MTA',
    'newyork': 'MTA',
    'manhattan': 'MTA',
    'brooklyn': 'MTA',
    'queens': 'MTA',
    'bronx': 'MTA',
    'staten_island': 'MTA',
    
    // Washington DC
    'washington_dc': 'Metro',
    'washington': 'Metro',
    'dc': 'Metro',
    'dmv': 'Metro',
    
    // Atlanta
    'atlanta': 'MARTA',
    'atl': 'MARTA',
    
    // Philadelphia  
    'philadelphia': 'SEPTA',
    'philly': 'SEPTA',
    'phila': 'SEPTA',
    
    // Denver
    'denver': 'RTD',
    
    // Los Angeles
    'los_angeles': 'Metro',
    'la': 'Metro',
    'losangeles': 'Metro',
    
    // San Francisco
    'san_francisco': 'BART/Muni',
    'sanfrancisco': 'BART/Muni',
    'sf': 'BART/Muni',
    'bay_area': 'BART/Muni',
    
    // Boston
    'boston': 'MBTA',
    'bos': 'MBTA',
    
    // Seattle
    'seattle': 'Sound Transit',
    'sea': 'Sound Transit',
    
    // Portland
    'portland': 'TriMet',
    
    // Miami
    'miami': 'Metrorail',
    'mia': 'Metrorail',
  };
  
  return transitSystems[cityLower] || 'Public Transit';
};

// Get a friendly display name for the transit system
export const getTransitDisplayName = (transitSystem: string): string => {
  const displayNames: Record<string, string> = {
    'CTA': 'Chicago Transit Authority',
    'MTA': 'Metropolitan Transportation Authority', 
    'Metro': 'Metro System',
    'MARTA': 'Metropolitan Atlanta Rapid Transit Authority',
    'SEPTA': 'Southeastern Pennsylvania Transportation Authority',
    'RTD': 'Regional Transportation District',
    'BART/Muni': 'Bay Area Rapid Transit',
    'MBTA': 'Massachusetts Bay Transportation Authority',
    'Sound Transit': 'Sound Transit',
    'TriMet': 'TriMet',
    'Metrorail': 'Miami-Dade Metrorail',
    'Public Transit': 'Public Transit'
  };
  
  return displayNames[transitSystem] || transitSystem;
};