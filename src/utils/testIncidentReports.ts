import { supabase } from "@/integrations/supabase/client";
import { CITIES_WITH_RAIL } from "@/data/cityTransitData";
import { INCIDENT_TYPES } from "@/types/incident";
import { CITIES_WITH_RAIL as CITIES_DATA } from "@/data/cities";

interface TestIncident {
  incident_type: string;
  transit_line: string;
  location_name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export const generateTestIncidents = (): TestIncident[] => {
  const testIncidents: TestIncident[] = [];
  
  CITIES_WITH_RAIL.forEach(city => {
    // Check if city is available using the cities data
    const cityData = CITIES_DATA.find(c => c.id === city.id);
    if (!cityData?.available) return; // Skip unavailable cities
    
    city.railLines.forEach((line, lineIndex) => {
      // Get stations for this line
      const stations = city.lineStations?.[line] || [];
      
      // Test 2-3 stations per line to keep manageable
      const testStations = stations.slice(0, 3);
      
      testStations.forEach((station, stationIndex) => {
        // Rotate through incident types
        const incidentType = INCIDENT_TYPES[
          (lineIndex + stationIndex) % INCIDENT_TYPES.length
        ];
        
        // Create mock coordinates (general city area)
        const mockCoordinates = getMockCoordinates(city.id);
        
        testIncidents.push({
          incident_type: incidentType,
          transit_line: line,
          location_name: station,
          description: `Test ${incidentType.toLowerCase()} incident at ${station} on ${line} in ${city.name}. This is a mock report for testing purposes.`,
          latitude: mockCoordinates.lat + (Math.random() - 0.5) * 0.01, // Small variation
          longitude: mockCoordinates.lng + (Math.random() - 0.5) * 0.01,
          accuracy: Math.floor(Math.random() * 50) + 10 // 10-60 meters
        });
      });
    });
  });
  
  return testIncidents;
};

export const getMockCoordinates = (cityId: string) => {
  const coordinates: Record<string, { lat: number; lng: number }> = {
    chicago: { lat: 41.8781, lng: -87.6298 },
    nyc: { lat: 40.7589, lng: -73.9851 },
    denver: { lat: 39.7392, lng: -104.9903 },
    washington_dc: { lat: 38.9072, lng: -77.0369 },
    philadelphia: { lat: 39.9526, lng: -75.1652 },
    atlanta: { lat: 33.7490, lng: -84.3880 },
    los_angeles: { lat: 34.0522, lng: -118.2437 }
  };
  
  return coordinates[cityId] || { lat: 0, lng: 0 };
};

export const createTestIncidents = async (userId: string) => {
  const testIncidents = generateTestIncidents();
  const results = [];
  
  console.log(`Creating ${testIncidents.length} test incidents...`);
  
  for (const incident of testIncidents) {
    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .insert({
          ...incident,
          reporter_id: userId
        })
        .select();
      
      if (error) {
        console.error(`Failed to create incident for ${incident.location_name}:`, error);
        results.push({ success: false, incident, error: error.message });
      } else {
        console.log(`✅ Created incident: ${incident.incident_type} at ${incident.location_name}`);
        results.push({ success: true, incident, data });
      }
    } catch (err) {
      console.error(`Exception creating incident for ${incident.location_name}:`, err);
      results.push({ success: false, incident, error: (err as Error).message });
    }
  }
  
  return results;
};

export const testIncidentDeletion = async (userId: string) => {
  // Get all incidents created by this user
  const { data: incidents, error } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('reporter_id', userId)
    .eq('status', 'active');
  
  if (error) {
    console.error('Error fetching incidents for deletion test:', error);
    return { success: false, error: error.message };
  }
  
  if (!incidents || incidents.length === 0) {
    console.log('No incidents found to test deletion');
    return { success: true, message: 'No incidents to delete' };
  }
  
  // Test deleting the first few incidents
  const testDeletions = incidents.slice(0, 3);
  const results = [];
  
  for (const incident of testDeletions) {
    try {
      const { error: deleteError } = await supabase
        .from('incident_reports')
        .delete()
        .eq('id', incident.id)
        .eq('reporter_id', userId);
      
      if (deleteError) {
        console.error(`Failed to delete incident ${incident.id}:`, deleteError);
        results.push({ success: false, incident, error: deleteError.message });
      } else {
        console.log(`✅ Deleted incident: ${incident.incident_type} at ${incident.location_name}`);
        results.push({ success: true, incident });
      }
    } catch (err) {
      console.error(`Exception deleting incident ${incident.id}:`, err);
      results.push({ success: false, incident, error: (err as Error).message });
    }
  }
  
  return { success: true, results };
};

export const runComprehensiveIncidentTest = async () => {
  console.log('🧪 Starting comprehensive incident report testing...');
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ User not authenticated. Please log in first.');
    return { success: false, error: 'User not authenticated' };
  }
  
  console.log(`✅ User authenticated: ${user.id}`);
  
  // Clean up any existing test incidents first
  await supabase
    .from('incident_reports')
    .delete()
    .eq('reporter_id', user.id)
    .ilike('description', '%testing purposes%');
  
  // Create test incidents
  const createResults = await createTestIncidents(user.id);
  const successfulCreations = createResults.filter(r => r.success);
  const failedCreations = createResults.filter(r => !r.success);
  
  console.log(`\n📊 Creation Results:`);
  console.log(`✅ Successful: ${successfulCreations.length}`);
  console.log(`❌ Failed: ${failedCreations.length}`);
  
  if (failedCreations.length > 0) {
    console.log('\nFailed creations:', failedCreations);
  }
  
  // Test retrieval by city
  console.log('\n🔍 Testing incident retrieval by city...');
  for (const city of CITIES_WITH_RAIL) {
    const cityData = CITIES_DATA.find(c => c.id === city.id);
    if (!cityData?.available) continue;
    
    const { data: cityIncidents, error } = await supabase
      .from('incident_reports')
      .select('*')
      .eq('status', 'active')
      .in('transit_line', city.railLines);
    
    if (error) {
      console.error(`❌ Error fetching incidents for ${city.name}:`, error);
    } else {
      console.log(`✅ ${city.name}: Found ${cityIncidents?.length || 0} incidents`);
    }
  }
  
  // Test deletion functionality
  console.log('\n🗑️ Testing incident deletion...');
  const deleteResults = await testIncidentDeletion(user.id);
  
  if (deleteResults.success) {
    console.log('✅ Deletion test completed successfully');
  } else {
    console.error('❌ Deletion test failed:', deleteResults.error);
  }
  
  console.log('\n🎉 Comprehensive testing completed!');
  
  return {
    success: true,
    summary: {
      totalTestIncidents: createResults.length,
      successfulCreations: successfulCreations.length,
      failedCreations: failedCreations.length,
      deletionTest: deleteResults.success
    }
  };
};
