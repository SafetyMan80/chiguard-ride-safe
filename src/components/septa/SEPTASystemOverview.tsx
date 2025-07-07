import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLineColor } from "@/data/septaStations";

export const SEPTASystemOverview = () => {
  const railLines = [
    { code: 'MFL', name: 'Market-Frankford Line', desc: 'East-West subway/elevated' },
    { code: 'BSL', name: 'Broad Street Line', desc: 'North-South subway' },
    { code: 'NHSL', name: 'Norristown High Speed Line', desc: 'Light rail to suburbs' },
    { code: 'RRD', name: 'Regional Rail', desc: 'Commuter rail network' },
    { code: 'Airport', name: 'Airport Line', desc: 'To Philadelphia International' },
    { code: 'Paoli/Thorndale', name: 'Paoli/Thorndale Line', desc: 'Western suburbs' },
    { code: 'Media/Elwyn', name: 'Media/Elwyn Line', desc: 'Southwestern suburbs' },
    { code: 'West Trenton', name: 'West Trenton Line', desc: 'Northern New Jersey' }
  ];

  return (
    <>
      {/* Lines Overview */}
      <Card>
        <CardHeader>
          <CardTitle>SEPTA Rail Lines</CardTitle>
          <p className="text-sm text-muted-foreground">
            Philadelphia's subway, elevated, and regional rail system
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {railLines.map(line => (
              <div key={line.code} className="flex items-center gap-3 p-2 border rounded">
                <div className={`w-4 h-4 rounded-full ${getLineColor(line.code)}`} />
                <div>
                  <div className="font-medium">{line.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {line.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Philadelphia Transit Tips */}
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">🔔 Philadelphia Transit Tips</h4>
            <ul className="text-sm space-y-1 text-purple-700">
              <li>• SEPTA Key card for all transit modes</li>
              <li>• Regional Rail has zone-based pricing</li>
              <li>• Free transfers between subway/bus within 2 hours</li>
              <li>• El (Market-Frankford) runs 24/7 on weekends</li>
              <li>• Use SEPTA app for real-time updates</li>
              <li>• Jefferson & 30th St are main Regional Rail hubs</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* API Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Data Source:</strong> SEPTA provides real-time arrival data through their public API. 
              Station names should match SEPTA's official station names for best results.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};