import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MapPin } from "lucide-react";

interface RideRequest {
  id: string;
  user: string;
  university: string;
  line: string;
  station: string;
  time: string;
  spots: number;
  description: string;
}

const CHICAGO_UNIVERSITIES = [
  "University of Chicago",
  "Northwestern University", 
  "DePaul University",
  "Loyola University Chicago",
  "Illinois Institute of Technology",
  "University of Illinois Chicago",
  "Chicago State University",
  "Northeastern Illinois University",
  "Columbia College Chicago",
  "Roosevelt University"
];

export const UniversityRides = () => {
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [rideRequests] = useState<RideRequest[]>([
    {
      id: "1",
      user: "Jasmine",
      university: "DePaul University",
      line: "Red Line",
      station: "Fullerton",
      time: "9:30 PM",
      spots: 2,
      description: "Night class ending, looking for safe ride home"
    },
    {
      id: "2", 
      user: "Marcus",
      university: "University of Chicago",
      line: "Green Line",
      station: "Garfield",
      time: "10:15 PM", 
      spots: 3,
      description: "Study group finished, heading south"
    },
    {
      id: "3",
      user: "Sarah",
      university: "Northwestern University",
      line: "Purple Line",
      station: "Davis",
      time: "8:45 PM",
      spots: 1,
      description: "Evening seminar, looking for company"
    }
  ]);

  const filteredRequests = selectedUniversity 
    ? rideRequests.filter(req => req.university === selectedUniversity)
    : rideRequests;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-chicago-blue" />
            Group Rides by University
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              variant={selectedUniversity === "" ? "chicago" : "chicago-outline"}
              size="sm"
              onClick={() => setSelectedUniversity("")}
            >
              All Universities
            </Button>
            {CHICAGO_UNIVERSITIES.slice(0, 5).map(uni => (
              <Button
                key={uni}
                variant={selectedUniversity === uni ? "chicago" : "chicago-outline"}
                size="sm"
                onClick={() => setSelectedUniversity(uni)}
                className="text-xs h-8"
              >
                {uni.split(' ').map(word => word[0]).join('')}
              </Button>
            ))}
          </div>
          
          <Button 
            variant="chicago" 
            className="w-full"
            onClick={() => {
              // TODO: Implement group ride request functionality
              alert("Group ride request feature coming soon!");
            }}
          >
            Request a Group Ride
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Available Group Rides</h3>
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No group rides available for {selectedUniversity || "any university"}.
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="animate-fade-in">
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-chicago-light-blue text-chicago-dark-blue">
                        {request.user[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.user}</p>
                      <p className="text-sm text-muted-foreground">{request.university}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{request.spots} spots</Badge>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-chicago-red" />
                    <span>{request.line} - {request.station}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3" />
                    <span>Departing at {request.time}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                
                <Button 
                  variant="chicago-outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement join group ride functionality
                    alert(`Joining ride with ${request.user}. Feature coming soon!`);
                  }}
                >
                  Join Group Ride
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};