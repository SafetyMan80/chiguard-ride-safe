import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, University, ArrowLeft } from "lucide-react";
import { UniversityRides } from "./UniversityRides";

interface University {
  id: string;
  name: string;
  shortName: string;
  description: string;
  studentCount: string;
  nearbyStations: string[];
}

interface CityData {
  id: string;
  name: string;
  agency: string;
  color: string;
  universities: University[];
}

const CITIES_WITH_UNIVERSITIES: CityData[] = [
  {
    id: "chicago",
    name: "Chicago",
    agency: "CTA",
    color: "bg-chicago-blue",
    universities: [
      {
        id: "northwestern",
        name: "Northwestern University",
        shortName: "Northwestern",
        description: "Private research university in Evanston",
        studentCount: "21,000+",
        nearbyStations: ["Davis", "Foster", "Noyes"]
      },
      {
        id: "uchicago",
        name: "University of Chicago",
        shortName: "UChicago",
        description: "Private research university in Hyde Park",
        studentCount: "17,000+",
        nearbyStations: ["59th-University", "Garfield", "51st"]
      },
      {
        id: "uic",
        name: "University of Illinois Chicago",
        shortName: "UIC",
        description: "Public research university",
        studentCount: "33,000+",
        nearbyStations: ["UIC-Halsted", "Racine", "Polk"]
      },
      {
        id: "depaul",
        name: "DePaul University",
        shortName: "DePaul",
        description: "Private Catholic research university",
        studentCount: "22,000+",
        nearbyStations: ["Fullerton", "Lincoln Park", "Armitage"]
      },
      {
        id: "loyola",
        name: "Loyola University Chicago",
        shortName: "Loyola",
        description: "Private Catholic research university",
        studentCount: "17,000+",
        nearbyStations: ["Loyola", "Granville", "Thorndale"]
      },
      {
        id: "iit",
        name: "Illinois Institute of Technology",
        shortName: "IIT",
        description: "Private technological research university",
        studentCount: "8,000+",
        nearbyStations: ["35th-Bronzeville-IIT", "Sox-35th", "Indiana"]
      },
      {
        id: "roosevelt",
        name: "Roosevelt University",
        shortName: "Roosevelt",
        description: "Private university in downtown Chicago",
        studentCount: "4,000+",
        nearbyStations: ["Harrison", "Jackson", "Monroe"]
      },
      {
        id: "columbia",
        name: "Columbia College Chicago",
        shortName: "Columbia Chicago",
        description: "Private arts and communications college",
        studentCount: "7,000+",
        nearbyStations: ["Harrison", "Jackson", "Roosevelt"]
      },
      {
        id: "neiu",
        name: "Northeastern Illinois University",
        shortName: "NEIU",
        description: "Public university serving diverse communities",
        studentCount: "9,000+",
        nearbyStations: ["Kimball", "Kedzie", "Albany Park"]
      }
    ]
  },
  {
    id: "nyc",
    name: "New York City",
    agency: "MTA",
    color: "bg-blue-600",
    universities: [
      {
        id: "columbia",
        name: "Columbia University",
        shortName: "Columbia",
        description: "Private Ivy League research university",
        studentCount: "33,000+",
        nearbyStations: ["116th St-Columbia", "Cathedral Pkwy", "125th St"]
      },
      {
        id: "nyu",
        name: "New York University",
        shortName: "NYU",
        description: "Private research university in Greenwich Village",
        studentCount: "51,000+",
        nearbyStations: ["W 4th St-Washington Sq", "8th St-NYU", "Astor Pl"]
      },
      {
        id: "cornell",
        name: "Cornell University",
        shortName: "Cornell",
        description: "Private Ivy League research university",
        studentCount: "25,000+",
        nearbyStations: ["Roosevelt Island", "Lexington Av/59th St", "68th St-Hunter"]
      },
      {
        id: "syracuse",
        name: "Syracuse University",
        shortName: "Syracuse",
        description: "Private research university in Central NY",
        studentCount: "22,000+",
        nearbyStations: ["Penn Station", "Grand Central", "Port Authority"]
      },
      {
        id: "stonybrook",
        name: "Stony Brook University",
        shortName: "Stony Brook",
        description: "Public research university - SUNY",
        studentCount: "26,000+",
        nearbyStations: ["Jamaica", "Penn Station", "Ronkonkoma"]
      },
      {
        id: "buffalo",
        name: "University at Buffalo",
        shortName: "UB",
        description: "Public research university - SUNY",
        studentCount: "32,000+",
        nearbyStations: ["Buffalo Exchange St", "Buffalo Central Terminal"]
      },
      {
        id: "fordham",
        name: "Fordham University",
        shortName: "Fordham",
        description: "Private Catholic research university",
        studentCount: "16,000+",
        nearbyStations: ["Fordham Rd", "183rd St", "Burnside Av"]
      },
      {
        id: "cuny",
        name: "City University of New York",
        shortName: "CUNY",
        description: "Public university system",
        studentCount: "270,000+",
        nearbyStations: ["City College", "125th St", "137th St"]
      },
      {
        id: "newschool",
        name: "The New School",
        shortName: "New School",
        description: "Private research university",
        studentCount: "10,000+",
        nearbyStations: ["14th St-Union Sq", "23rd St", "W 4th St"]
      },
      {
        id: "pace",
        name: "Pace University",
        shortName: "Pace",
        description: "Private university in Manhattan",
        studentCount: "13,000+",
        nearbyStations: ["Brooklyn Bridge-City Hall", "Fulton St", "Wall St"]
      },
      {
        id: "stjohns",
        name: "St. John's University",
        shortName: "St. John's",
        description: "Private Catholic research university",
        studentCount: "21,000+",
        nearbyStations: ["Jamaica Center", "Sutphin Blvd", "Union Turnpike"]
      },
      {
        id: "pratt",
        name: "Pratt Institute",
        shortName: "Pratt",
        description: "Private art and design university",
        studentCount: "5,000+",
        nearbyStations: ["Clinton-Washington Avs", "Lafayette Av", "Fulton St"]
      }
    ]
  },
  {
    id: "los_angeles",
    name: "Los Angeles",
    agency: "LA Metro",
    color: "bg-red-600",
    universities: [
      {
        id: "ucla",
        name: "University of California, Los Angeles",
        shortName: "UCLA",
        description: "Public research university in Westwood",
        studentCount: "46,000+",
        nearbyStations: ["Westwood/UCLA", "Expo/Bundy", "Culver City"]
      },
      {
        id: "usc",
        name: "University of Southern California",
        shortName: "USC",
        description: "Private research university",
        studentCount: "48,000+",
        nearbyStations: ["Expo/Vermont", "Expo Park/USC", "Jefferson/USC"]
      },
      {
        id: "caltech",
        name: "California Institute of Technology",
        shortName: "Caltech",
        description: "Private research university in Pasadena",
        studentCount: "2,200+",
        nearbyStations: ["Lake", "Allen", "Del Mar"]
      },
      {
        id: "csun",
        name: "California State University, Northridge",
        shortName: "CSUN",
        description: "Public university in the San Fernando Valley",
        studentCount: "38,000+",
        nearbyStations: ["Northridge", "Chatsworth", "Van Nuys"]
      },
      {
        id: "csula",
        name: "California State University, Los Angeles",
        shortName: "Cal State LA",
        description: "Public university serving diverse communities",
        studentCount: "27,000+",
        nearbyStations: ["Lincoln/Cypress", "Heritage Square", "Southwest Museum"]
      },
      {
        id: "lmu",
        name: "Loyola Marymount University",
        shortName: "LMU",
        description: "Private Catholic research university",
        studentCount: "9,000+",
        nearbyStations: ["Culver City", "Expo/Sepulveda", "Douglas/Rosecrans"]
      },
      {
        id: "pepperdine",
        name: "Pepperdine University",
        shortName: "Pepperdine",
        description: "Private Christian research university in Malibu",
        studentCount: "8,000+",
        nearbyStations: ["Santa Monica", "Venice", "Culver City"]
      },
      {
        id: "occidental",
        name: "Occidental College",
        shortName: "Occidental",
        description: "Private liberal arts college",
        studentCount: "2,000+",
        nearbyStations: ["Lincoln/Cypress", "Southwest Museum", "Highland Park"]
      }
    ]
  },
  {
    id: "washington_dc",
    name: "Washington D.C.",
    agency: "WMATA",
    color: "bg-blue-800",
    universities: [
      {
        id: "gwu",
        name: "George Washington University",
        shortName: "GWU",
        description: "Private research university",
        studentCount: "27,000+",
        nearbyStations: ["Foggy Bottom-GWU", "Dupont Circle", "Farragut West"]
      },
      {
        id: "georgetown",
        name: "Georgetown University",
        shortName: "Georgetown",
        description: "Private Catholic research university",
        studentCount: "19,000+",
        nearbyStations: ["Rosslyn", "Foggy Bottom", "Dupont Circle"]
      },
      {
        id: "american",
        name: "American University",
        shortName: "American",
        description: "Private research university",
        studentCount: "14,000+",
        nearbyStations: ["Tenleytown-AU", "Friendship Heights", "Van Ness-UDC"]
      },
      {
        id: "howard",
        name: "Howard University",
        shortName: "Howard",
        description: "Private historically black research university",
        studentCount: "10,000+",
        nearbyStations: ["Shaw-Howard U", "U Street", "Georgia Ave-Petworth"]
      },
      {
        id: "catholic",
        name: "The Catholic University of America",
        shortName: "Catholic U",
        description: "Private Catholic research university",
        studentCount: "6,000+",
        nearbyStations: ["Brookland-CUA", "Rhode Island Ave", "Fort Totten"]
      },
      {
        id: "gallaudet",
        name: "Gallaudet University",
        shortName: "Gallaudet",
        description: "Private university for deaf and hard of hearing",
        studentCount: "2,000+",
        nearbyStations: ["Union Station", "NoMa-Gallaudet U", "New York Ave"]
      },
      {
        id: "trinity",
        name: "Trinity Washington University",
        shortName: "Trinity",
        description: "Private Catholic university",
        studentCount: "2,500+",
        nearbyStations: ["Brookland-CUA", "Catholic U", "Rhode Island Ave"]
      }
    ]
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    agency: "SEPTA",
    color: "bg-purple-600",
    universities: [
      {
        id: "upenn",
        name: "University of Pennsylvania",
        shortName: "Penn",
        description: "Private Ivy League research university",
        studentCount: "28,000+",
        nearbyStations: ["30th Street Station", "University City", "34th Street"]
      },
      {
        id: "temple",
        name: "Temple University",
        shortName: "Temple",
        description: "Public research university",
        studentCount: "37,000+",
        nearbyStations: ["Temple University", "Cecil B. Moore", "Girard"]
      },
      {
        id: "drexel",
        name: "Drexel University",
        shortName: "Drexel",
        description: "Private research university",
        studentCount: "24,000+",
        nearbyStations: ["30th Street Station", "University City", "Powelton Ave"]
      },
      {
        id: "villanova",
        name: "Villanova University",
        shortName: "Villanova",
        description: "Private Catholic research university",
        studentCount: "11,000+",
        nearbyStations: ["Villanova", "Radnor", "St. Davids"]
      },
      {
        id: "jefferson",
        name: "Thomas Jefferson University",
        shortName: "Jefferson",
        description: "Private health sciences university",
        studentCount: "8,000+",
        nearbyStations: ["Jefferson Station", "City Hall", "Walnut-Locust"]
      },
      {
        id: "lasalle",
        name: "La Salle University",
        shortName: "La Salle",
        description: "Private Catholic university",
        studentCount: "5,000+",
        nearbyStations: ["Olney Transportation Center", "Logan", "Wyoming"]
      }
    ]
  },
  {
    id: "atlanta",
    name: "Atlanta",
    agency: "MARTA",
    color: "bg-orange-600",
    universities: [
      {
        id: "gatech",
        name: "Georgia Institute of Technology",
        shortName: "Georgia Tech",
        description: "Public research university",
        studentCount: "39,000+",
        nearbyStations: ["Midtown", "North Avenue", "Arts Center"]
      },
      {
        id: "emory",
        name: "Emory University",
        shortName: "Emory",
        description: "Private research university",
        studentCount: "15,000+",
        nearbyStations: ["Decatur", "East Lake", "Edgewood/Candler Park"]
      },
      {
        id: "gsu",
        name: "Georgia State University",
        shortName: "Georgia State",
        description: "Public research university",
        studentCount: "53,000+",
        nearbyStations: ["Georgia State", "Five Points", "Peachtree Center"]
      },
      {
        id: "spelman",
        name: "Spelman College",
        shortName: "Spelman",
        description: "Private historically black liberal arts college",
        studentCount: "2,100+",
        nearbyStations: ["West End", "Ashby", "Vine City"]
      },
      {
        id: "morehouse",
        name: "Morehouse College",
        shortName: "Morehouse",
        description: "Private historically black liberal arts college",
        studentCount: "2,200+",
        nearbyStations: ["West End", "Ashby", "Vine City"]
      },
      {
        id: "clark",
        name: "Clark Atlanta University",
        shortName: "Clark Atlanta",
        description: "Private historically black research university",
        studentCount: "4,000+",
        nearbyStations: ["West End", "Ashby", "Vine City"]
      },
      {
        id: "kennesaw",
        name: "Kennesaw State University",
        shortName: "Kennesaw State",
        description: "Public research university",
        studentCount: "41,000+",
        nearbyStations: ["Arts Center", "Lindbergh Center", "Buckhead"]
      }
    ]
  },
  {
    id: "denver",
    name: "Denver",
    agency: "RTD",
    color: "bg-green-600",
    universities: [
      {
        id: "ucd",
        name: "University of Colorado Denver",
        shortName: "UC Denver",
        description: "Public research university",
        studentCount: "23,000+",
        nearbyStations: ["Union Station", "Pepsi Center/Elitch Gardens", "Sports Authority Field"]
      },
      {
        id: "du",
        name: "University of Denver",
        shortName: "DU",
        description: "Private research university",
        studentCount: "12,000+",
        nearbyStations: ["University of Denver", "Evans", "Englewood"]
      },
      {
        id: "msu",
        name: "Metropolitan State University of Denver",
        shortName: "MSU Denver",
        description: "Public university",
        studentCount: "18,000+",
        nearbyStations: ["Auraria West", "Union Station", "Pepsi Center/Elitch Gardens"]
      },
      {
        id: "regis",
        name: "Regis University",
        shortName: "Regis",
        description: "Private Catholic university",
        studentCount: "4,000+",
        nearbyStations: ["Federal Center", "Sheridan", "Knox"]
      },
      {
        id: "csu_denver",
        name: "Colorado State University Denver",
        shortName: "CSU Denver",
        description: "Public university",
        studentCount: "2,500+",
        nearbyStations: ["Union Station", "Pepsi Center/Elitch Gardens", "Sports Authority Field"]
      }
    ]
  }
];

export const MultiCityGroupRides = () => {
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("chicago");

  const handleUniversitySelect = (universityId: string) => {
    setSelectedUniversity(universityId);
  };

  const handleBackToSelection = () => {
    setSelectedUniversity(null);
  };

  // If a university is selected, show the university rides component
  if (selectedUniversity) {
    const currentCity = CITIES_WITH_UNIVERSITIES.find(city => city.id === selectedCity);
    const university = currentCity?.universities.find(uni => uni.id === selectedUniversity);
    
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleBackToSelection}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {currentCity?.name} Universities
        </Button>
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            {university?.name} Group Rides
          </h3>
          <p className="text-sm text-muted-foreground">{university?.description}</p>
          <p className="text-xs text-muted-foreground">
            Transit: {currentCity?.agency} • Students: {university?.studentCount}
          </p>
        </div>
        <UniversityRides 
          cityData={currentCity}
          selectedUniversityId={selectedUniversity}
        />
      </div>
    );
  }

  // Show city tabs with universities
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            University Group Rides
          </CardTitle>
          <CardDescription>
            Connect with students from your university for safe group transit rides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCity} onValueChange={setSelectedCity} className="w-full">
            {/* City Selection Grid */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-center">Select Your City</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CITIES_WITH_UNIVERSITIES.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCity(city.id)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md
                      ${selectedCity === city.id 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/30'
                      }
                    `}
                  >
                    <div className="text-center space-y-2">
                      <div className={`w-3 h-3 rounded-full mx-auto ${city.color}`} />
                      <div className="font-medium text-sm">{city.name}</div>
                      <div className="text-xs text-muted-foreground">{city.agency}</div>
                      <div className="text-xs text-muted-foreground">
                        {city.universities.length} Universities
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {CITIES_WITH_UNIVERSITIES.map((city) => (
              <TabsContent key={city.id} value={city.id} className="space-y-4">
                <div className="text-center py-4">
                  <h3 className="text-xl font-semibold">{city.name} Universities</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your university to join or create group rides via {city.agency}
                  </p>
                </div>
                
                 <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                   <div className="grid grid-cols-1 gap-6 py-2">
                     {city.universities.map((university) => (
                       <Card
                         key={university.id}
                         className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md border-2 border-transparent hover:border-primary/20 mx-2"
                         onClick={() => handleUniversitySelect(university.id)}
                       >
                         <CardContent className="p-4">
                           <div className="flex items-start justify-between mb-3">
                             <div className="flex items-center gap-2">
                               <University className="w-5 h-5 text-primary flex-shrink-0" />
                               <div className="min-w-0">
                                 <h3 className="font-bold text-base leading-tight">{university.shortName}</h3>
                                 <p className="text-xs text-muted-foreground truncate">{university.name}</p>
                               </div>
                             </div>
                             <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2">
                               {university.studentCount}
                             </div>
                           </div>
                           
                           <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                             {university.description}
                           </p>
                           
                           <div className="space-y-2">
                             <p className="text-xs font-medium text-muted-foreground">Nearby Stations:</p>
                             <div className="flex flex-wrap gap-1">
                               {university.nearbyStations.slice(0, 2).map((station, index) => (
                                 <span
                                   key={index}
                                   className="bg-muted px-2 py-1 rounded text-xs font-medium"
                                 >
                                   {station}
                                 </span>
                               ))}
                               {university.nearbyStations.length > 2 && (
                                 <span className="text-xs text-muted-foreground px-2 py-1">
                                   +{university.nearbyStations.length - 2} more
                                 </span>
                               )}
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            About University Group Rides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🎓 Safe Campus Transit:</strong> Connect with verified students from your 
              university to share rides on public transit systems.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Verified Students Only:</strong> All participants must verify their 
              student status with valid university credentials.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Group Ride Features:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create and join rides to/from campus</li>
              <li>• Real-time location sharing with group members</li>
              <li>• Verification required for all participants</li>
              <li>• Integration with each city's transit system</li>
              <li>• Emergency contact and safety features</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};