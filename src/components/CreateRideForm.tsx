import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface CreateRideFormProps {
  onRideCreated: () => void;
  onCancel: () => void;
  userUniversity?: string;
  selectedUniversity?: string;
  cityData?: {
    id: string;
    name: string;
    agency: string;
    universities: Array<{
      id: string;
      name: string;
      shortName: string;
    }>;
  };
  transitLines?: Array<{
    name: string;
    color: string;
  }>;
}

// Station data for each city and line
const STATION_DATA_BY_CITY: { [key: string]: { [line: string]: string[] } } = {
  chicago: {
    "Red Line": ["Howard", "Jarvis", "Morse", "Loyola", "Granville", "Thorndale", "Bryn Mawr", "Berwyn", "Argyle", "Lawrence", "Wilson", "Sheridan", "Addison", "Belmont", "Fullerton", "North/Clybourn", "Clark/Division", "Chicago/State", "Grand/State", "Lake/State", "Monroe/State", "Jackson/State", "Harrison", "Roosevelt", "Cermak-Chinatown", "Sox-35th", "47th", "Garfield", "63rd", "69th", "79th", "87th", "95th/Dan Ryan"],
    "Blue Line": ["O'Hare", "Rosemont", "Cumberland", "Harlem (O'Hare)", "Jefferson Park", "Montrose", "Irving Park", "Addison", "Belmont", "Logan Square", "California", "Western", "Damen", "Division", "Chicago", "Grand", "Clark/Lake", "Washington", "Monroe", "Jackson", "LaSalle", "Clinton", "UIC-Halsted", "Racine", "Illinois Medical District", "Western (Forest Park)", "Kedzie-Homan", "Pulaski", "Cicero", "Austin", "Oak Park", "Harlem (Forest Park)", "Forest Park"],
    "Brown Line": ["Kimball", "Kedzie", "Francisco", "Rockwell", "Western", "Damen", "Montrose", "Irving Park", "Addison", "Paulina", "Southport", "Belmont", "Wellington", "Diversey", "Fullerton", "Armitage", "Sedgwick", "Chicago", "Merchandise Mart", "Clark/Lake", "State/Lake", "Washington/Wells", "Quincy/Wells", "LaSalle/Van Buren", "Harold Washington Library"],
    "Green Line": ["Harlem/Lake", "Oak Park", "Ridgeland", "Austin", "Central", "Laramie", "Cicero", "Pulaski", "Conservatory", "Kedzie", "California", "Ashland/63rd", "Halsted", "Indiana", "35th-Bronzeville-IIT", "Roosevelt", "Cermak-McCormick Place", "Clark/Lake"],
    "Orange Line": ["Midway", "Pulaski", "Kedzie", "Western", "35th/Archer", "Ashland", "Halsted", "Roosevelt", "Harold Washington Library", "LaSalle/Van Buren", "Quincy/Wells", "Washington/Wells", "Clark/Lake"],
    "Pink Line": ["54th/Cermak", "Cicero", "Kostner", "Pulaski", "Central Park", "Kedzie", "California", "Western", "Damen", "18th", "Polk", "Ashland", "Morgan", "Clinton", "Clark/Lake"],
    "Purple Line": ["Linden", "Central", "Noyes", "Foster", "Davis", "Dempster", "Main", "South Blvd", "Howard", "Wilson", "Belmont", "Fullerton", "Armitage", "Sedgwick", "Chicago", "Merchandise Mart", "Clark/Lake"],
    "Yellow Line": ["Howard", "Oakton-Skokie", "Dempster-Skokie"]
  },
  nyc: {
    "4 Train": ["Woodlawn", "161st St-Yankee Stadium", "149th St-Grand Concourse", "125th St", "86th St", "59th St-Columbus Circle", "42nd St-Times Square", "14th St-Union Square", "Brooklyn Bridge-City Hall", "Fulton St", "Wall St-William St", "Bowling Green", "Atlantic Ave-Barclays Ctr", "Crown Heights-Utica Ave"],
    "5 Train": ["Eastchester-Dyre Ave", "149th St-Grand Concourse", "125th St", "86th St", "59th St-Columbus Circle", "42nd St-Times Square", "14th St-Union Square", "Brooklyn Bridge-City Hall", "Fulton St", "Wall St-William St", "Bowling Green", "Atlantic Ave-Barclays Ctr", "Franklin Ave-Medgar Evers College"],
    "6 Train": ["Pelham Bay Park", "Whitlock Ave", "Elder Ave", "Morrison Ave-Soundview", "St Lawrence Ave", "Westchester Sq-E Tremont Ave", "Zerega Ave", "Castle Hill Ave", "Parkchester", "St Mary's St", "Cypress Ave", "Brook Ave", "Longwood Ave", "E 149th St", "E 143rd St-St Mary's St", "135th St", "125th St", "116th St", "110th St", "103rd St", "96th St", "86th St", "77th St", "68th St-Hunter College", "59th St", "51st St", "42nd St-Grand Central", "33rd St", "28th St", "23rd St", "14th St-Union Sq", "Astor Pl", "Bleecker St", "Spring St", "Canal St", "Brooklyn Bridge-City Hall"],
    "7 Train": ["Flushing-Main St", "Mets-Willets Point", "111th St", "103rd St-Corona Plaza", "Junction Blvd", "90th St-Elmhurst Ave", "82nd St-Jackson Heights", "74th St-Broadway", "69th St", "61st St-Woodside", "52nd St", "46th St-Bliss St", "40th St-Lowery St", "33rd St-Rawson St", "Queensboro Plaza", "Court Sq", "Hunters Point Ave", "Vernon Blvd-Jackson Ave", "Grand Central-42nd St", "5th Ave-Bryant Park", "Times Sq-42nd St", "34th St-Hudson Yards"],
    "A Train": ["Inwood-207th St", "Dyckman St", "190th St", "181st St", "175th St", "168th St-Washington Hts", "163rd St-Amsterdam Ave", "155th St", "145th St", "135th St", "125th St", "116th St", "Cathedral Pkwy-110th St", "103rd St", "96th St", "86th St", "81st St-Museum of Natural History", "72nd St", "59th St-Columbus Circle", "42nd St-Port Authority", "34th St-Penn Station", "14th St", "W 4th St-Washington Sq", "Spring St", "Canal St", "Chambers St", "Fulton St", "High St-Brooklyn Bridge", "Jay St-MetroTech", "Hoyt-Schermerhorn Sts", "Nostrand Ave", "Utica Ave", "Broadway Junction", "80th St", "88th St", "Rockaway Blvd", "104th St", "111th St", "Ozone Park-Lefferts Blvd", "Aqueduct Racetrack", "Howard Beach-JFK Airport", "Broad Channel", "Beach 67th St", "Beach 60th St", "Beach 44th St", "Beach 36th St", "Beach 25th St", "Far Rockaway-Mott Ave"],
    "B Train": ["Bedford Park Blvd", "Kingsbridge Rd", "Fordham Rd", "182nd-183rd Sts", "Tremont Ave", "174th-175th Sts", "170th St", "167th St", "161st St-Yankee Stadium", "155th St", "145th St", "135th St", "125th St", "116th St", "Cathedral Pkwy-110th St", "103rd St", "96th St", "86th St", "81st St", "72nd St", "59th St-Columbus Circle", "47th-50th Sts-Rockefeller Ctr", "42nd St-Times Square", "34th St-Herald Sq", "W 4th St", "Broadway-Lafayette St", "Grand St", "DeKalb Ave", "Atlantic Ave-Barclays Ctr", "7th Ave", "Prospect Park", "Church Ave", "Kings Hwy", "Sheepshead Bay", "Brighton Beach"],
    "C Train": ["168th St", "163rd St-Amsterdam Ave", "155th St", "145th St", "135th St", "125th St", "116th St", "Cathedral Pkwy-110th St", "103rd St", "96th St", "86th St", "81st St", "72nd St", "59th St-Columbus Circle", "50th St", "42nd St-Port Authority", "34th St-Penn Station", "23rd St", "14th St", "W 4th St", "Spring St", "Canal St", "Chambers St", "Fulton St", "High St", "Jay St-MetroTech", "Hoyt-Schermerhorn Sts", "Lafayette Ave", "Clinton-Washington Aves", "Franklin Ave", "Nostrand Ave", "Kingston-Throop Aves", "Utica Ave", "Ralph Ave", "Rockaway Ave", "Broadway Junction", "Liberty Ave", "Van Siclen Ave", "Shepherd Ave", "Euclid Ave"],
    "D Train": ["Norwood-205th St", "Bedford Park Blvd", "Kingsbridge Rd", "Fordham Rd", "182nd-183rd Sts", "Tremont Ave", "174th-175th Sts", "170th St", "167th St", "161st St-Yankee Stadium", "155th St", "145th St", "125th St", "59th St-Columbus Circle", "47th-50th Sts", "42nd St-Times Square", "34th St-Herald Sq", "W 4th St", "Broadway-Lafayette St", "Grand St", "Atlantic Ave-Barclays Ctr", "36th St", "9th Ave", "Fort Hamilton Pkwy", "50th St", "55th St", "62nd St", "71st St", "79th St", "18th Ave", "20th Ave", "Bay Pkwy", "25th Ave", "Bay 50th St", "Stillwell Ave-Coney Island"],
    "E Train": ["Jamaica Center-Parsons/Archer", "Sutphin Blvd-Archer Ave-JFK Airport", "Jamaica-Van Wyck", "Briarwood", "Kew Gardens-Union Tpke", "75th Ave", "Forest Hills-71st Ave", "67th Ave", "63rd Dr-Rego Park", "Woodhaven Blvd", "Grand Ave-Newtown", "Elmhurst Ave", "Jackson Hts-Roosevelt Ave", "65th St", "Northern Blvd", "46th St", "Steinway St", "36th St", "Queens Plaza", "Lexington Ave/53rd St", "5th Ave/53rd St", "42nd St-Port Authority", "34th St-Penn Station", "23rd St", "14th St", "W 4th St", "Spring St", "Canal St", "Chambers St", "World Trade Center"],
    "F Train": ["Jamaica-179th St", "169th St", "Parsons Blvd", "Sutphin Blvd", "Briarwood", "Kew Gardens-Union Tpke", "75th Ave", "Forest Hills-71st Ave", "67th Ave", "63rd Dr-Rego Park", "Woodhaven Blvd", "Grand Ave-Newtown", "Elmhurst Ave", "Jackson Hts-Roosevelt Ave", "21st St-Queensbridge", "Roosevelt Island", "Lexington Ave/63rd St", "57th St", "47th-50th Sts", "42nd St-Bryant Pk", "34th St-Herald Sq", "23rd St", "14th St", "W 4th St", "Broadway-Lafayette St", "2nd Ave", "Delancey St-Essex St", "East Broadway", "York St", "Jay St-MetroTech", "Bergen St", "Carroll St", "Smith-9th Sts", "4th Ave-9th St", "7th Ave", "15th St-Prospect Park", "Fort Hamilton Pkwy", "Church Ave", "Ditmas Ave", "18th Ave", "Avenue I", "Bay Ridge Ave", "95th St", "Stillwell Ave-Coney Island"],
    "G Train": ["Court Sq", "21st St", "Greenpoint Ave", "Nassau Ave", "Metropolitan Ave", "Broadway", "Flushing Ave", "Myrtle-Willoughby Aves", "Bedford-Nostrand Aves", "Classon Ave", "Clinton-Washington Aves", "Fulton St", "Hoyt-Schermerhorn Sts", "Bergen St", "Carroll St", "Smith-9th Sts", "4th Ave-9th St", "7th Ave", "15th St-Prospect Park", "Fort Hamilton Pkwy", "Church Ave"],
    "J Train": ["Jamaica Center", "Sutphin Blvd", "121st St", "111th St", "104th St", "Woodhaven Blvd", "85th St-Forest Pkwy", "75th St", "Cypress Hills", "Crescent St", "Norwood Ave", "Cleveland St", "Van Siclen Ave", "Alabama Ave", "Broadway Junction", "Chauncey St", "Halsey St", "Gates Ave", "Kosciuszko St", "Myrtle Ave", "Flushing Ave", "Lorimer St", "Hewes St", "Marcy Ave", "Delancey St-Essex St", "Bowery", "Canal St", "Chambers St", "Fulton St", "Broad St"],
    "L Train": ["Canarsie-Rockaway Pkwy", "East 105th St", "New Lots Ave", "Livonia Ave", "Sutter Ave-Rutland Rd", "Atlantic Ave", "Wilson Ave", "Bushwick Ave-Aberdeen St", "Broadway Junction", "Myrtle-Wyckoff Aves", "Halsey St", "Knickerbocker Ave", "Central Ave", "Wilson Ave", "Bushwick Ave-Aberdeen St", "Montrose Ave", "Grand St", "Graham Ave", "Lorimer St", "Bedford Ave", "1st Ave", "3rd Ave", "Union Sq-14th St", "6th Ave", "8th Ave"],
    "M Train": ["Metropolitan Ave", "Fresh Pond Rd", "Forest Ave", "Seneca Ave", "Myrtle-Wyckoff Aves", "Knickerbocker Ave", "Central Ave", "Bushwick Ave-Aberdeen St", "Lorimer St", "Flushing Ave", "Myrtle Ave", "Kosciuszko St", "Gates Ave", "Halsey St", "Chauncey St", "Broadway Junction", "Marcy Ave", "Hewes St", "Lorimer St", "Delancey St-Essex St", "Bowery", "Canal St", "Chambers St", "Fulton St", "Broad St"],
    "N Train": ["Astoria-Ditmars Blvd", "Astoria Blvd", "Triboro Plaza", "31st St", "36th Ave", "39th Ave", "Queensboro Plaza", "Lexington Ave/59th St", "5th Ave/59th St", "57th St-7th Ave", "49th St", "Times Sq-42nd St", "34th St-Herald Sq", "28th St", "23rd St", "14th St-Union Sq", "Canal St", "City Hall", "Cortlandt St", "Rector St", "Whitehall St-South Ferry", "36th St", "45th St", "53rd St", "59th St", "8th Ave", "Fort Hamilton Pkwy", "New Utrecht Ave", "18th Ave", "20th Ave", "Bay Pkwy", "Kings Hwy", "Avenue U", "86th St", "Stillwell Ave-Coney Island"],
    "Q Train": ["96th St", "86th St", "72nd St", "Lexington Ave/63rd St", "57th St-7th Ave", "Times Sq-42nd St", "34th St-Herald Sq", "14th St-Union Sq", "Canal St", "DeKalb Ave", "Atlantic Ave-Barclays Ctr", "7th Ave", "Prospect Park", "Parkside Ave", "Church Ave", "Beverley Rd", "Cortelyou Rd", "Newkirk Plaza", "Avenue H", "Avenue J", "Avenue M", "Kings Hwy", "Avenue U", "Neck Rd", "Sheepshead Bay", "Brighton Beach", "Ocean Pkwy", "W 8th St-NY Aquarium", "Stillwell Ave-Coney Island"],
    "R Train": ["Forest Hills-71st Ave", "67th Ave", "63rd Dr-Rego Park", "Woodhaven Blvd", "Grand Ave-Newtown", "Elmhurst Ave", "Jackson Hts-Roosevelt Ave", "65th St", "Northern Blvd", "46th St", "Steinway St", "36th St", "Queens Plaza", "Lexington Ave/59th St", "5th Ave/59th St", "57th St-7th Ave", "49th St", "Times Sq-42nd St", "34th St-Herald Sq", "28th St", "23rd St", "14th St-Union Sq", "8th St-NYU", "Prince St", "Canal St", "City Hall", "Cortlandt St", "Rector St", "Whitehall St-South Ferry", "Court St", "Jay St-MetroTech", "DeKalb Ave", "Atlantic Ave-Barclays Ctr", "Union St", "9th St", "Prospect Ave", "25th St", "36th St", "45th St", "53rd St", "59th St", "Bay Ridge Ave", "77th St", "86th St", "Bay Ridge-95th St"],
    "W Train": ["Astoria-Ditmars Blvd", "Astoria Blvd", "Triboro Plaza", "31st St", "36th Ave", "39th Ave", "Queensboro Plaza", "Lexington Ave/59th St", "5th Ave/59th St", "57th St-7th Ave", "49th St", "Times Sq-42nd St", "34th St-Herald Sq", "28th St", "23rd St", "14th St-Union Sq", "8th St-NYU", "Prince St", "Canal St", "City Hall", "Cortlandt St", "Rector St", "Whitehall St-South Ferry"],
    "Z Train": ["Jamaica Center", "Sutphin Blvd", "121st St", "104th St", "Woodhaven Blvd", "85th St-Forest Pkwy", "75th St", "Crescent St", "Norwood Ave", "Cleveland St", "Van Siclen Ave", "Alabama Ave", "Broadway Junction", "Gates Ave", "Kosciuszko St", "Myrtle Ave", "Marcy Ave", "Delancey St-Essex St", "Bowery", "Canal St", "Chambers St", "Fulton St", "Broad St"]
  },
  denver: {
    "A Line": ["Union Station", "38th & Blake", "40th & Colorado", "Central Park-Blvd", "61st & Peña", "Airport Blvd", "Denver International Airport"],
    "B Line": ["Union Station", "27th & Welton", "25th & Welton", "Downing", "29th & Welton", "Welton", "Stapleton", "Central Park-Blvd", "Westminster"],
    "C Line": ["Union Station", "10th & Osage", "Decatur-Federal", "Lakewood", "Garrison", "Sheridan", "Knox", "Federal Center", "Littleton"],
    "D Line": ["Union Station", "Theatre District", "18th & California", "18th & Stout", "20th & Welton", "25th & Welton", "Nine Mile", "Northglenn"],
    "E Line": ["Union Station", "38th & Blake", "40th & Colorado", "Peoria", "Smith Road", "40th & Airport Way", "Lincoln"],
    "F Line": ["Union Station", "18th & California", "18th & Stout", "20th & Welton", "25th & Welton", "27th & Welton", "Dahlia", "Holly", "Ridgegate", "Sky Ridge", "Lone Tree City Center"],
    "G Line": ["Union Station", "41st & Fox", "Regis University", "72nd & Pecos", "88th & Lowell", "Eastlake-124th", "Thornton Pkwy", "124th & Huron", "Wagon Road", "Westminster", "Arvada Ridge", "Olde Town Arvada", "Gold Strike", "Wheat Ridge-Ward", "Lamar"],
    "H Line": ["Union Station", "Empower Field at Mile High", "Federal Blvd", "Sheridan", "Lakewood"],
    "N Line": ["Union Station", "38th & Blake", "40th & Colorado", "Commerce City", "72nd & Colorado", "88th & Colorado", "104th Avenue", "124th Avenue", "Eastlake-124th", "Thornton Pkwy", "Northglenn"],
    "R Line": ["Union Station", "Peoria", "Aurora Metro Center", "13th & Dallas", "Dayton", "Fitzsimons", "Central Park-Blvd", "40th & Colorado", "38th & Blake"],
    "W Line": ["Union Station", "10th & Osage", "Auraria West", "Decatur-Federal", "Federal Center", "Lakewood", "13th Avenue", "Colorado", "Wadsworth-Garrison", "Olde Town Arvada", "Wheat Ridge-Ward", "Kipling", "Belmar", "Villa Italia", "Sheridan"]
  },
  washington_dc: {
    "Red Line": ["Shady Grove", "Rockville", "Twinbrook", "White Flint", "Grosvenor-Strathmore", "Medical Center", "Bethesda", "Friendship Heights", "Tenleytown-AU", "Van Ness-UDC", "Cleveland Park", "Woodley Park-Zoo/Adams Morgan", "Dupont Circle", "Farragut North", "Metro Center", "Gallery Pl-Chinatown", "Union Station", "Rhode Island Ave-Brentwood", "Brookland-CUA", "Fort Totten", "Takoma", "Silver Spring", "Forest Glen", "Wheaton", "Glenmont"],
    "Blue Line": ["Franconia-Springfield", "Van Dorn Street", "King St-Old Town", "Braddock Road", "Ronald Reagan Washington National Airport", "Crystal City", "Pentagon City", "Pentagon", "Arlington Cemetery", "Rosslyn", "Foggy Bottom-GWU", "Farragut West", "McPherson Square", "Metro Center", "Federal Triangle", "Smithsonian", "L'Enfant Plaza", "Federal Center SW", "Capitol South", "Eastern Market", "Potomac Ave", "Stadium-Armory", "Minnesota Ave", "Deanwood", "Cheverly", "Landover", "New Carrollton", "Largo Town Center"],
    "Orange Line": ["Vienna/Fairfax-GMU", "East Falls Church", "West Falls Church", "East Falls Church", "Ballston-MU", "Virginia Square-GMU", "Clarendon", "Court House", "Rosslyn", "Foggy Bottom-GWU", "Farragut West", "McPherson Square", "Metro Center", "Federal Triangle", "Smithsonian", "L'Enfant Plaza", "Federal Center SW", "Capitol South", "Eastern Market", "Potomac Ave", "Stadium-Armory", "Minnesota Ave", "Deanwood", "Cheverly", "Landover", "New Carrollton"],
    "Silver Line": ["Wiehle-Reston East", "Spring Hill", "Greensboro", "Tysons Corner", "McLean", "East Falls Church", "Ballston-MU", "Virginia Square-GMU", "Clarendon", "Court House", "Rosslyn", "Foggy Bottom-GWU", "Farragut West", "McPherson Square", "Metro Center", "Federal Triangle", "Smithsonian", "L'Enfant Plaza", "Federal Center SW", "Capitol South", "Eastern Market", "Potomac Ave", "Stadium-Armory", "Benning Road", "Capitol Heights", "Addison Road-Seat Pleasant", "Morgan Boulevard", "Largo Town Center"],
    "Green Line": ["Greenbelt", "College Park-U of MD", "Prince George's Plaza", "West Hyattsville", "Fort Totten", "Georgia Ave-Petworth", "Columbia Heights", "U Street/African-Amer Civil War Memorial/Cardozo", "Shaw-Howard U", "Mt Vernon Sq 7th St-Convention Center", "Gallery Pl-Chinatown", "Archives-Navy Memorial-Penn Quarter", "L'Enfant Plaza", "Waterfront-SEU", "Navy Yard-Ballpark", "Anacostia", "Congress Heights", "Southern Avenue", "Naylor Road", "Suitland", "Branch Ave"],
    "Yellow Line": ["Huntington", "Eisenhower Avenue", "King St-Old Town", "Braddock Road", "Ronald Reagan Washington National Airport", "Crystal City", "Pentagon City", "Pentagon", "Arlington Cemetery", "Rosslyn", "Foggy Bottom-GWU", "Farragut West", "McPherson Square", "Metro Center", "Gallery Pl-Chinatown", "Archives-Navy Memorial-Penn Quarter", "L'Enfant Plaza", "Waterfront-SEU", "Navy Yard-Ballpark", "Anacostia", "Congress Heights", "Southern Avenue", "Naylor Road", "Suitland", "Branch Ave"]
  },
  philadelphia: {
    "Market-Frankford Line": ["Frankford Terminal", "Margaret-Orthodox", "Allegheny", "Kensington-Allegheny", "Huntingdon", "York-Dauphin", "Front-Girard", "Girard", "Fairmount", "Spring Garden", "2nd Street", "5th Street-Independence Hall", "8th Street", "11th Street", "13th Street", "15th Street", "19th Street", "22nd Street", "30th Street", "34th Street", "40th Street", "46th Street", "52nd Street", "56th Street", "60th Street", "63rd Street", "69th Street Terminal"],
    "Broad Street Line": ["Fern Rock Transportation Center", "Olney", "Logan", "Wyoming", "Hunting Park", "Erie", "Allegheny", "North Philadelphia", "Girard", "Fairmount", "Spring Garden", "Race-Vine", "City Hall", "Walnut-Locust", "Lombard-South", "Ellsworth-Federal", "Tasker-Morris", "Snyder", "Oregon", "Girard Ave", "Pattison", "NRG Station"],
    "Regional Rail": ["30th Street Station", "Suburban Station", "Jefferson Station", "Temple University", "North Philadelphia", "Wayne Junction", "Germantown", "Mt Airy", "Chestnut Hill East", "Chestnut Hill West", "Manayunk", "Ivy Ridge", "Miquon", "Spring Mill", "Conshohocken", "Norristown", "King of Prussia", "Valley Forge", "Paoli", "Villanova", "Ardmore", "Haverford", "Bryn Mawr", "Rosemont", "Radnor", "St Davids", "Wayne", "Devon", "Berwyn", "Daylesford", "Malvern", "Downingtown", "Thorndale", "Coatesville", "Parkesburg", "Atglen", "Christiana", "Bear", "Newark", "Claymont", "Marcus Hook", "Highland Ave", "Chester Transportation Center", "Eddystone", "Crum Lynne", "Ridley Park", "Prospect Park", "Norwood", "Glenolden", "Folcroft", "Sharon Hill", "Curtis Park", "Darby", "Eastwick", "University City", "Gray 30th Street"]
  },
  atlanta: {
    "Red Line": ["North Springs", "Sandy Springs", "Dunwoody", "Medical Center", "Buckhead", "Lindbergh Center", "Arts Center", "Midtown", "North Avenue", "Civic Center", "Peachtree Center", "Five Points", "Garnett", "West End", "Oakland City", "Lakewood/Ft. McPherson", "East Point", "College Park", "Airport"],
    "Gold Line": ["Doraville", "Chamblee", "Brookhaven/Oglethorpe University", "Lenox", "Lindbergh Center", "Arts Center", "Midtown", "North Avenue", "Civic Center", "Peachtree Center", "Five Points", "Garnett", "West End", "Oakland City", "Lakewood/Ft. McPherson", "East Point", "College Park", "Airport"],
    "Blue Line": ["Hamilton E. Holmes", "West Lake", "Ashby", "Vine City", "Omni Dome", "Five Points", "Georgia State", "King Memorial", "Inman Park/Reynoldstown", "Edgewood/Candler Park", "East Lake", "Decatur", "Avondale", "Kensington", "Indian Creek"],
    "Green Line": ["Bankhead", "Ashby", "Vine City", "Omni Dome", "Five Points", "Georgia State", "King Memorial", "Inman Park/Reynoldstown", "Edgewood/Candler Park", "East Lake", "Decatur", "Avondale", "Kensington", "Indian Creek"]
  },
  boston: {
    "Red Line": ["Alewife", "Davis", "Porter", "Harvard", "Central", "Kendall/MIT", "Charles/MGH", "Park Street", "Downtown Crossing", "South Station", "Broadway", "Andrew", "JFK/UMass", "Savin Hill", "Fields Corner", "Shawmut", "Ashmont", "North Quincy", "Wollaston", "Quincy Center", "Quincy Adams", "Braintree"],
    "Blue Line": ["Wonderland", "Revere Beach", "Beachmont", "Suffolk Downs", "Orient Heights", "Wood Island", "Airport", "Maverick", "Aquarium", "State", "Government Center", "Bowdoin"],
    "Orange Line": ["Oak Grove", "Malden Center", "Wellington", "Assembly", "Sullivan Square", "Community College", "North Station", "Haymarket", "State", "Downtown Crossing", "Chinatown", "Tufts Medical Center", "Back Bay", "Massachusetts Avenue", "Ruggles", "Roxbury Crossing", "Jackson Square", "Stony Brook", "Green Street", "Forest Hills"],
    "Green Line": ["Lechmere", "Science Park", "North Station", "Haymarket", "Government Center", "Park Street", "Boylston", "Arlington", "Copley", "Hynes Convention Center", "Kenmore", "Fenway", "Longwood", "Brookline Village", "Brookline Hills", "Beaconsfield", "Reservoir", "Chestnut Hill", "Newton Centre", "Newton Highlands", "Eliot", "Waban", "Woodland", "Riverside"],
    "Silver Line": ["South Station", "Courthouse", "World Trade Center", "Silver Line Way", "Logan Airport Terminal A", "Logan Airport Terminal B", "Logan Airport Terminal C", "Logan Airport Terminal E"]
  },
  san_francisco: {
    "BART Red Line": ["Richmond", "El Cerrito del Norte", "El Cerrito Plaza", "North Berkeley", "Downtown Berkeley", "Ashby", "MacArthur", "19th St/Oakland", "12th St/Oakland City Center", "West Oakland", "Embarcadero", "Montgomery St", "Powell St", "Civic Center/UN Plaza", "16th St Mission", "24th St Mission", "Glen Park", "Balboa Park", "Daly City", "Colma", "South San Francisco", "San Bruno", "Millbrae"],
    "BART Blue Line": ["Dublin/Pleasanton", "West Dublin/Pleasanton", "Castro Valley", "Bay Fair", "San Leandro", "Coliseum", "Fruitvale", "Lake Merritt", "12th St/Oakland City Center", "19th St/Oakland", "MacArthur", "Ashby", "Downtown Berkeley", "North Berkeley", "El Cerrito Plaza", "El Cerrito del Norte", "Richmond"],
    "BART Green Line": ["Daly City", "Balboa Park", "Glen Park", "24th St Mission", "16th St Mission", "Civic Center/UN Plaza", "Powell St", "Montgomery St", "Embarcadero", "West Oakland", "12th St/Oakland City Center", "19th St/Oakland", "MacArthur", "Rockridge", "Orinda", "Lafayette", "Walnut Creek", "Pleasant Hill/Contra Costa Centre", "Concord", "North Concord/Martinez"],
    "BART Yellow Line": ["Millbrae", "San Bruno", "South San Francisco", "Colma", "Daly City", "Balboa Park", "Glen Park", "24th St Mission", "16th St Mission", "Civic Center/UN Plaza", "Powell St", "Montgomery St", "Embarcadero", "West Oakland", "12th St/Oakland City Center", "19th St/Oakland", "MacArthur", "Rockridge", "Orinda", "Lafayette", "Walnut Creek", "Pleasant Hill/Contra Costa Centre", "Concord", "North Concord/Martinez", "Pittsburg/Bay Point"],
    "MUNI N-Judah": ["Ocean Beach", "Judah & La Playa", "Judah & 19th Ave", "Judah & 9th Ave", "Carl & Cole", "Carl & Hillway", "Duboce & Church", "Duboce & Castro", "Duboce & Mission", "Van Ness", "Civic Center", "Powell", "Montgomery", "Embarcadero", "2nd & King", "4th & King", "Caltrain"],
    "MUNI T-Third": ["Sunnydale", "Visitacion Valley", "Gilman/Paul", "3rd St & Carroll", "3rd St & Newcomb", "3rd St & Oakdale", "3rd St & Palou", "3rd St & Revere", "3rd St & Williams", "Bayview-Hunters Point", "Evans", "Innes", "Kirkwood", "La Salle", "Oakdale", "Palou", "Quesada", "Revere", "Shafter", "Sunnydale", "Thomas", "Upton", "Van Dyke", "Wallace", "Williams", "Yosemite", "Embarcadero"],
    "MUNI K-Ingleside": ["Balboa Park", "Ocean Ave", "Plymouth", "Broad", "Capitol", "Randolph", "Balboa Park", "Ocean Ave", "Lee", "Junipero Serra", "19th Ave", "Stonestown", "Embarcadero"],
    "MUNI L-Taraval": ["SF Zoo", "Wawona", "46th Ave", "40th Ave", "35th Ave", "29th Ave", "22nd Ave", "19th Ave", "West Portal", "Forest Hill", "Castro", "Van Ness", "Civic Center", "Powell", "Montgomery", "Embarcadero"],
    "MUNI M-Ocean View": ["Balboa Park", "Ocean Ave", "Lee", "Junipero Serra", "19th Ave", "Stonestown", "SF State", "19th Ave", "West Portal", "Forest Hill", "Castro", "Van Ness", "Civic Center", "Powell", "Montgomery", "Embarcadero"],
    "MUNI J-Church": ["Balboa Park", "Ocean Ave", "Lee", "Junipero Serra", "Randolph", "Capitol", "Broad", "Plymouth", "Ocean Ave", "Balboa Park", "30th St", "Church", "24th St", "22nd St", "20th St", "18th St", "16th St", "14th St", "Duboce", "Van Ness", "Civic Center", "Powell", "Montgomery", "Embarcadero"]
  }
};

// Default transit lines for cities
const TRANSIT_LINES_BY_CITY: { [key: string]: Array<{ name: string; color: string }> } = {
  chicago: [
    { name: "Red Line", color: "bg-red-600" },
    { name: "Blue Line", color: "bg-blue-600" },
    { name: "Brown Line", color: "bg-amber-600" },
    { name: "Green Line", color: "bg-green-600" },
    { name: "Orange Line", color: "bg-orange-600" },
    { name: "Pink Line", color: "bg-pink-600" },
    { name: "Purple Line", color: "bg-purple-600" },
    { name: "Yellow Line", color: "bg-yellow-600" }
  ],
  denver: [
    { name: "A Line", color: "bg-green-600" },
    { name: "B Line", color: "bg-blue-600" },
    { name: "C Line", color: "bg-orange-600" },
    { name: "D Line", color: "bg-yellow-600" },
    { name: "E Line", color: "bg-purple-600" },
    { name: "F Line", color: "bg-red-600" },
    { name: "G Line", color: "bg-teal-600" },
    { name: "H Line", color: "bg-pink-600" },
    { name: "N Line", color: "bg-cyan-600" },
    { name: "R Line", color: "bg-indigo-600" },
    { name: "W Line", color: "bg-amber-600" }
  ],
  nyc: [
    { name: "4 Train", color: "bg-green-600" },
    { name: "5 Train", color: "bg-green-600" },
    { name: "6 Train", color: "bg-green-600" },
    { name: "7 Train", color: "bg-purple-600" },
    { name: "A Train", color: "bg-blue-600" },
    { name: "B Train", color: "bg-orange-600" },
    { name: "C Train", color: "bg-blue-600" },
    { name: "D Train", color: "bg-orange-600" },
    { name: "E Train", color: "bg-blue-600" },
    { name: "F Train", color: "bg-orange-600" },
    { name: "G Train", color: "bg-green-600" },
    { name: "J Train", color: "bg-amber-600" },
    { name: "L Train", color: "bg-gray-600" },
    { name: "M Train", color: "bg-orange-600" },
    { name: "N Train", color: "bg-yellow-600" },
    { name: "Q Train", color: "bg-yellow-600" },
    { name: "R Train", color: "bg-yellow-600" },
    { name: "W Train", color: "bg-yellow-600" }
  ],
  washington_dc: [
    { name: "Red Line", color: "bg-red-600" },
    { name: "Blue Line", color: "bg-blue-600" },
    { name: "Orange Line", color: "bg-orange-600" },
    { name: "Silver Line", color: "bg-gray-400" },
    { name: "Green Line", color: "bg-green-600" },
    { name: "Yellow Line", color: "bg-yellow-600" }
  ],
  los_angeles: [
    { name: "Red Line", color: "bg-red-600" },
    { name: "Purple Line", color: "bg-purple-600" },
    { name: "Blue Line", color: "bg-blue-600" },
    { name: "Green Line", color: "bg-green-600" },
    { name: "Gold Line", color: "bg-yellow-600" },
    { name: "Expo Line", color: "bg-cyan-600" }
  ],
  philadelphia: [
    { name: "Market-Frankford Line", color: "bg-blue-600" },
    { name: "Broad Street Line", color: "bg-orange-600" },
    { name: "Regional Rail", color: "bg-purple-600" }
  ],
  atlanta: [
    { name: "Red Line", color: "bg-red-600" },
    { name: "Gold Line", color: "bg-yellow-600" },
    { name: "Blue Line", color: "bg-blue-600" },
    { name: "Green Line", color: "bg-green-600" }
  ],
  san_francisco: [
    { name: "BART Red Line", color: "bg-red-600" },
    { name: "BART Blue Line", color: "bg-blue-600" },
    { name: "BART Green Line", color: "bg-green-600" },
    { name: "BART Yellow Line", color: "bg-yellow-600" },
    { name: "MUNI N-Judah", color: "bg-blue-500" },
    { name: "MUNI T-Third", color: "bg-red-500" },
    { name: "MUNI K-Ingleside", color: "bg-orange-500" },
    { name: "MUNI L-Taraval", color: "bg-purple-500" },
    { name: "MUNI M-Ocean View", color: "bg-green-500" },
    { name: "MUNI J-Church", color: "bg-amber-500" }
  ]
};

export const CreateRideForm = ({ 
  onRideCreated, 
  onCancel, 
  userUniversity, 
  selectedUniversity, 
  cityData,
  transitLines 
}: CreateRideFormProps) => {
  const [formData, setFormData] = useState({
    university_name: selectedUniversity || userUniversity || "",
    transit_line: "",
    station_name: "",
    departure_time: "",
    max_spots: 4,
    description: "",
    is_recurring: false,
    recurrence_pattern: "weekly"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Get universities and transit lines for the current city
  const universities = cityData?.universities || [];
  const availableTransitLines = transitLines || TRANSIT_LINES_BY_CITY[cityData?.id || 'chicago'] || [];
  const agencyName = cityData?.agency || 'Transit';

  // Get available stations for the selected line
  const availableStations = formData.transit_line 
    ? STATION_DATA_BY_CITY[cityData?.id || 'chicago']?.[formData.transit_line] || []
    : [];

  // Reset station when line changes
  const handleLineChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      transit_line: value,
      station_name: "" // Reset station when line changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a group ride.",
          variant: "destructive"
        });
        return;
      }

      // Convert departure time to ISO format
      const departureDateTime = new Date(formData.departure_time).toISOString();

      const rideData: any = {
        creator_id: user.id,
        university_name: formData.university_name,
        cta_line: formData.transit_line, // Still use cta_line field name for database compatibility
        station_name: formData.station_name,
        departure_time: departureDateTime,
        max_spots: formData.max_spots,
        description: formData.description,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null
      };

      // Calculate next occurrence if recurring
      if (formData.is_recurring) {
        const departureDate = new Date(formData.departure_time);
        let nextOccurrence: Date;
        
        switch (formData.recurrence_pattern) {
          case 'daily':
            nextOccurrence = new Date(departureDate.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            nextOccurrence = new Date(departureDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            nextOccurrence = new Date(departureDate);
            nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
            break;
          default:
            nextOccurrence = new Date(departureDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        
        rideData.next_occurrence = nextOccurrence.toISOString();
      }

      const { error } = await supabase
        .from('group_rides')
        .insert(rideData);

      if (error) throw error;

      toast({
        title: "Group ride created!",
        description: "Your ride request has been posted successfully.",
      });

      onRideCreated();
    } catch (error) {
      console.error('Error creating ride:', error);
      toast({
        title: "Failed to create ride",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-chicago-blue" />
            Create Group Ride
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Select 
              value={formData.university_name} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, university_name: value }))}
              required
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select your university" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-[100]">
                {universities.map(uni => (
                  <SelectItem key={uni.id} value={uni.name}>{uni.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transit_line">{agencyName} Line</Label>
              <Select 
                value={formData.transit_line} 
                onValueChange={handleLineChange}
                required
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-[100]">
                  {availableTransitLines.map(line => (
                    <SelectItem key={line.name} value={line.name}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${line.color}`} />
                        {line.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              {formData.transit_line && availableStations.length > 0 ? (
                <Select 
                  value={formData.station_name} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, station_name: value }))}
                  required
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[100] max-h-60 overflow-y-auto">
                    {availableStations.map(station => (
                      <SelectItem key={station} value={station}>
                        {station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="station"
                  value={formData.station_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, station_name: e.target.value }))}
                  placeholder={formData.transit_line ? "Station name" : "Select a line first"}
                  disabled={!formData.transit_line}
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Time</Label>
              <Input
                id="departure"
                type="datetime-local"
                value={formData.departure_time}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spots">Max Spots</Label>
              <Select 
                value={formData.max_spots.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, max_spots: parseInt(value) }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-[100]">
                  {[2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num} spots</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add details about your ride..."
              rows={3}
            />
          </div>

          {/* Recurring Options */}
          <div className="space-y-3 p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_recurring: !!checked }))
                }
              />
              <Label htmlFor="recurring" className="text-sm font-medium">
                Make this ride recurring
              </Label>
            </div>
            
            {formData.is_recurring && (
              <div className="space-y-2">
                <Label htmlFor="pattern">Recurrence Pattern</Label>
                <Select 
                  value={formData.recurrence_pattern} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_pattern: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[100]">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  A new ride will be automatically created for the next {formData.recurrence_pattern} occurrence.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Creating..." : "Create Ride"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};