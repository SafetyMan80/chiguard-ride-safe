import { Card, CardContent } from "@/components/ui/card";
import { DraggableIncidentCard } from "@/components/DraggableIncidentCard";
import { IncidentReportData } from "@/types/incident";

interface IncidentListProps {
  incidents: IncidentReportData[];
  isLoading: boolean;
  currentUser: any;
  onDelete: (reportId: string) => void;
}

export const IncidentList = ({ incidents, isLoading, currentUser, onDelete }: IncidentListProps) => {
  const getLineColor = (lineName: string) => {
    return "bg-primary";
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Incidents ({incidents.length})</h3>
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
      </div>
      
      {incidents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isLoading 
              ? "Loading recent incidents..." 
              : "No recent incidents reported. Stay safe!"
            }
          </CardContent>
        </Card>
      ) : (
        incidents.slice(0, 8).map(incident => (
          <DraggableIncidentCard
            key={incident.id}
            incident={incident}
            currentUser={currentUser}
            onDelete={onDelete}
            getLineColor={getLineColor}
            formatDateTime={formatDateTime}
          />
        ))
      )}
    </div>
  );
};