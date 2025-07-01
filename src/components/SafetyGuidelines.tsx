import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

interface SafetyGuidelinesProps {
  onBack?: () => void;
}

export const SafetyGuidelines = ({ onBack }: SafetyGuidelinesProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Safety Guidelines
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div>
            <p className="text-muted-foreground mb-4">
              <strong>Your safety is our priority.</strong> Follow these guidelines to stay safe while using Chicago CTA.
            </p>
          </div>

          <section>
            <h3 className="font-semibold mb-2 text-chicago-red">🚨 Emergency Situations</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• <strong>Call 911 first</strong> for immediate life-threatening emergencies</p>
              <p>• Use CHIGUARD's SOS button to alert nearby riders and get community support</p>
              <p>• Stay calm and move to a well-lit, populated area if possible</p>
              <p>• Keep your phone charged and accessible at all times</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-chicago-blue">🚇 CTA Platform Safety</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• Stand away from the platform edge until the train comes to a complete stop</p>
              <p>• Be aware of your surroundings and avoid distractions like headphones at high volume</p>
              <p>• Keep your belongings secure and avoid displaying expensive items</p>
              <p>• Use well-lit areas of the platform, especially during late hours</p>
              <p>• Report suspicious activity to CTA personnel or Chicago Police</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">👥 Community Support</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• Look out for fellow riders and offer help when safe to do so</p>
              <p>• Report incidents accurately through CHIGUARD to help others stay informed</p>
              <p>• Join university ride-share groups for safer travel in numbers</p>
              <p>• Share your location with trusted contacts when traveling alone</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">📱 Using CHIGUARD Safely</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• Enable location services for accurate emergency response</p>
              <p>• Keep your profile information updated and accurate</p>
              <p>• Only use the emergency button for genuine emergencies</p>
              <p>• Respect other users' privacy and report inappropriate behavior</p>
              <p>• Verify university ride-share participants before joining</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">🌙 Late Night Travel</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• Travel with friends or in groups whenever possible</p>
              <p>• Use well-lit CTA stops and avoid isolated areas</p>
              <p>• Plan your route in advance and share it with someone you trust</p>
              <p>• Consider alternative transportation if you feel unsafe</p>
              <p>• Stay alert and trust your instincts</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">⚠️ Red Flags to Watch For</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• Someone following you or making you feel uncomfortable</p>
              <p>• Aggressive or erratic behavior from other passengers</p>
              <p>• Unattended bags or suspicious items</p>
              <p>• People asking personal questions or trying to get you alone</p>
              <p>• Anyone blocking exits or escape routes</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">📞 Important Numbers</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• <strong>Emergency:</strong> 911</p>
              <p>• <strong>Chicago Police Non-Emergency:</strong> 311</p>
              <p>• <strong>CTA Customer Service:</strong> (888) 968-7282</p>
              <p>• <strong>Text CTA Security:</strong> 41411</p>
              <p>• <strong>Chicago Crisis Text Line:</strong> Text HOME to 741741</p>
            </div>
          </section>

          <div className="bg-chicago-light-blue/10 p-4 rounded-lg border border-chicago-light-blue/20">
            <p className="text-sm font-medium text-chicago-blue">
              Remember: Your safety is more important than any schedule or convenience. 
              Trust your instincts and don't hesitate to ask for help or change your plans if something doesn't feel right.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};