// Manual testing utility - call this from browser console
export const testSingleIncident = async () => {
  console.log("🧪 Testing single incident creation...");
  
  const { supabase } = await import("@/integrations/supabase/client");
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("❌ User not authenticated");
    return;
  }
  
  console.log("✅ User authenticated:", user.id);
  
  // Test incident data
  const testIncident = {
    incident_type: "Safety Concern",
    transit_line: "Red Line",
    location_name: "Union Station",
    description: "Manual test incident - please delete after testing",
    latitude: 41.8781,
    longitude: -87.6298,
    accuracy: 25,
    reporter_id: user.id
  };
  
  try {
    const { data, error } = await supabase
      .from('incident_reports')
      .insert(testIncident)
      .select();
    
    if (error) {
      console.error("❌ Failed to create test incident:", error);
      return;
    }
    
    console.log("✅ Test incident created:", data);
    
    // Test retrieval
    const { data: retrieved, error: retrieveError } = await supabase
      .from('incident_reports')
      .select('*')
      .eq('id', data[0].id);
    
    if (retrieveError) {
      console.error("❌ Failed to retrieve incident:", retrieveError);
      return;
    }
    
    console.log("✅ Test incident retrieved:", retrieved);
    
    // Test deletion
    const { error: deleteError } = await supabase
      .from('incident_reports')
      .delete()
      .eq('id', data[0].id)
      .eq('reporter_id', user.id);
    
    if (deleteError) {
      console.error("❌ Failed to delete test incident:", deleteError);
      return;
    }
    
    console.log("✅ Test incident deleted successfully");
    console.log("🎉 Manual test completed successfully!");
    
  } catch (err) {
    console.error("❌ Test failed with exception:", err);
  }
};

// For browser console access
(window as any).testSingleIncident = testSingleIncident;