
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

interface TermsOfServiceProps {
  onBack?: () => void;
}

export const TermsOfService = ({ onBack }: TermsOfServiceProps) => {
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
              <FileText className="w-5 h-5" />
              Terms of Service
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div>
            <p className="text-muted-foreground mb-4">
              <strong>Last Updated:</strong> July 1, 2025
            </p>
          </div>

          <section>
            <h3 className="font-semibold mb-2">1. Acceptance of Terms</h3>
            <p className="text-muted-foreground">
              By accessing and using CHIGUARD, you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">2. Service Description</h3>
            <p className="text-muted-foreground">
              CHIGUARD is a safety application designed to help Chicago CTA riders stay safe through emergency features, 
              incident reporting, and community support. The service includes real-time CTA schedule information, 
              university ride-sharing, and emergency contact features.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">3. User Responsibilities</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• Provide accurate information during registration and profile setup</p>
              <p>• Use the emergency features responsibly and only in genuine emergencies</p>
              <p>• Report incidents accurately and in good faith</p>
              <p>• Respect other users and maintain community guidelines</p>
              <p>• Keep your account credentials secure</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">4. Emergency Services</h3>
            <p className="text-muted-foreground">
              CHIGUARD's emergency features are supplementary to, not a replacement for, official emergency services.
              In case of immediate danger, always call 911 first. CHIGUARD cannot guarantee response times or 
              availability of emergency features.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">5. Privacy and Data</h3>
            <p className="text-muted-foreground">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
              use, and protect your information. By using CHIGUARD, you consent to our data practices as 
              described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">6. Limitation of Liability</h3>
            <p className="text-muted-foreground">
              CHIGUARD is provided "as is" without warranties of any kind. We are not liable for any damages 
              arising from the use or inability to use the service, including but not limited to direct, 
              indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">7. Prohibited Uses</h3>
            <div className="text-muted-foreground space-y-2">
              <p>You may not use CHIGUARD to:</p>
              <p>• Submit false emergency reports or incident reports</p>
              <p>• Harass, threaten, or harm other users</p>
              <p>• Violate any local, state, or federal laws</p>
              <p>• Attempt to gain unauthorized access to the system</p>
              <p>• Use the service for commercial purposes without permission</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">8. Account Termination</h3>
            <p className="text-muted-foreground">
              We reserve the right to terminate or suspend accounts that violate these terms of service or 
              engage in prohibited activities. Users may also terminate their accounts at any time through 
              the settings page.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">9. Changes to Terms</h3>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Users will be notified of significant 
              changes through the application. Continued use of CHIGUARD after changes constitutes acceptance 
              of the new terms.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">10. Contact Information</h3>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at legal@chiguard.app or 
              through the support channels within the application.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};
