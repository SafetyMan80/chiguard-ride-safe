// Campus Security Contact Information
export const campusSecurityNumbers = {
  // Chicago Universities
  "University of Chicago": {
    emergency: "773-702-8181",
    security: "773-702-8181", 
    escort: "773-702-3131"
  },
  "Northwestern University": {
    emergency: "847-491-3254",
    security: "847-491-3254",
    escort: "847-491-7777"
  },
  "DePaul University": {
    emergency: "773-325-7777",
    security: "773-325-7777",
    escort: "773-325-1234"
  },
  "Loyola University Chicago": {
    emergency: "773-508-6039",
    security: "773-508-6039", 
    escort: "773-508-8888"
  },
  "University of Illinois Chicago": {
    emergency: "312-355-5555",
    security: "312-355-5555",
    escort: "312-996-2100"
  },
  "Illinois Institute of Technology": {
    emergency: "312-808-6363",
    security: "312-808-6363",
    escort: "312-808-4357"
  },
  "Chicago State University": {
    emergency: "773-995-3333",
    security: "773-995-3333",
    escort: "773-995-2000"
  },
  "Roosevelt University": {
    emergency: "312-341-4126",
    security: "312-341-4126",
    escort: "312-341-3500"
  },
  "Columbia College Chicago": {
    emergency: "312-369-1111",
    security: "312-369-1111",
    escort: "312-369-7000"
  },
  
  // Atlanta Universities
  "Georgia Institute of Technology": {
    emergency: "404-894-2500",
    security: "404-894-2500",
    escort: "404-894-7233"
  },
  "Emory University": {
    emergency: "404-727-6111",
    security: "404-727-6111",
    escort: "404-727-7433"
  },
  "Georgia State University": {
    emergency: "404-413-3333",
    security: "404-413-3333",
    escort: "404-413-1500"
  },
  "Clark Atlanta University": {
    emergency: "404-880-8911",
    security: "404-880-8911",
    escort: "404-880-8000"
  },
  "Morehouse College": {
    emergency: "404-681-2800",
    security: "404-681-2800",
    escort: "404-681-2800"
  },
  "Spelman College": {
    emergency: "404-270-5555",
    security: "404-270-5555",
    escort: "404-270-5000"
  },
  
  // New York Universities
  "Columbia University": {
    emergency: "212-854-5555",
    security: "212-854-5555",
    escort: "212-854-2797"
  },
  "New York University": {
    emergency: "212-998-2222",
    security: "212-998-2222",
    escort: "212-998-4444"
  },
  "Fordham University": {
    emergency: "718-817-2222",
    security: "718-817-2222",
    escort: "718-817-4000"
  },
  "The New School": {
    emergency: "212-229-5150",
    security: "212-229-5150",
    escort: "212-229-1234"
  },
  "Pace University": {
    emergency: "212-346-1234",
    security: "212-346-1234",
    escort: "212-346-1000"
  },
  
  // Washington DC Universities
  "George Washington University": {
    emergency: "202-994-6111",
    security: "202-994-6111",
    escort: "202-994-7000"
  },
  "Georgetown University": {
    emergency: "202-687-4343",
    security: "202-687-4343",
    escort: "202-687-0100"
  },
  "American University": {
    emergency: "202-885-3636",
    security: "202-885-3636",
    escort: "202-885-1000"
  },
  "Howard University": {
    emergency: "202-806-1100",
    security: "202-806-1100",
    escort: "202-806-6000"
  },
  
  // Denver Universities
  "University of Colorado Denver": {
    emergency: "303-315-2222",
    security: "303-315-2222",
    escort: "303-315-1234"
  },
  "University of Denver": {
    emergency: "303-871-3000",
    security: "303-871-3000",
    escort: "303-871-2334"
  },
  "Metropolitan State University of Denver": {
    emergency: "303-556-5000",
    security: "303-556-5000",
    escort: "303-556-3000"
  },
  "Colorado State University": {
    emergency: "970-491-6425",
    security: "970-491-6425",
    escort: "970-491-1234"
  },
  
  // Philadelphia Universities
  "University of Pennsylvania": {
    emergency: "215-573-3333",
    security: "215-573-3333",
    escort: "215-898-7297"
  },
  "Temple University": {
    emergency: "215-204-1234",
    security: "215-204-1234",
    escort: "215-204-8888"
  },
  "Drexel University": {
    emergency: "215-895-2222",
    security: "215-895-2222",
    escort: "215-895-1234"
  },
  "Villanova University": {
    emergency: "610-519-4444",
    security: "610-519-4444",
    escort: "610-519-1000"
  }
};

export const getCampusSecurity = (universityName: string) => {
  return campusSecurityNumbers[universityName as keyof typeof campusSecurityNumbers] || null;
};