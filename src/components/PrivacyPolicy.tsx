
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy = ({ onBack }: PrivacyPolicyProps) => {
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
              Privacy Policy
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
            <h3 className="font-semibold mb-2">1. Information We Collect</h3>
            <div className="text-muted-foreground space-y-2">
              <p><strong>Personal Information:</strong></p>
              <p>• Name, email address, phone number</p>
              <p>• Date of birth and address (for verification purposes)</p>
              <p>• University information (if applicable)</p>
              <p>• Government-issued ID (for identity verification)</p>
              
              <p className="mt-3"><strong>Location Information:</strong></p>
              <p>• Real-time location data (when emergency features are activated)</p>
              <p>• General location for incident reporting</p>
              
              <p className="mt-3"><strong>Usage Information:</strong></p>
              <p>• App usage patterns and feature interactions</p>
              <p>• CTA schedule queries and preferences</p>
              <p>• Incident reports and safety communications</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">2. How We Use Your Information</h3>
            <div className="text-muted-foreground space-y-2">
              <p>• <strong>Safety Services:</strong> Provide emergency assistance and incident reporting</p>
              <p>• <strong>Identity Verification:</strong> Verify user identities to maintain community safety</p>
              <p>• <strong>CTA Services:</strong> Deliver real-time transit information</p>
              <p>• <strong>University Features:</strong> Connect verified students for ride-sharing</p>
              <p>• <strong>Communication:</strong> Send safety alerts and service updates</p>
              <p>• <strong>Improvement:</strong> Analyze usage to improve our services</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">3. Information Sharing</h3>
            <div className="text-muted-foreground space-y-2">
              <p>We share your information only in these circumstances:</p>
              <p>• <strong>Emergency Situations:</strong> Location and contact information with emergency services</p>
              <p>• <strong>Law Enforcement:</strong> When required by law or to protect user safety</p>
              <p>• <strong>Service Providers:</strong> With trusted partners who help operate our services</p>
              <p>• <strong>University Partners:</strong> Limited information for student verification</p>
              <p>• <strong>Your Consent:</strong> When you explicitly agree to share information</p>
              
              <p className="mt-3 font-medium">We never sell your personal information to third parties.</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">4. Location Data</h3>
            <p className="text-muted-foreground">
              Location access is essential for emergency features but is only collected when:
              you activate emergency features, report incidents, or request location-based services.
              You can disable location services in your device settings, but this may limit some features.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">5. Data Security</h3>
            <div className="text-muted-foreground space-y-2">
              <p>We protect your information through:</p>
              <p>• Encryption of data in transit and at rest</p>
              <p>• Regular security audits and updates</p>
              <p>• Access controls and authentication requirements</p>
              <p>• Secure cloud infrastructure (Supabase)</p>
              <p>• Regular staff training on privacy practices</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">6. Your Rights</h3>
            <div className="text-muted-foreground space-y-2">
              <p>You have the right to:</p>
              <p>• Access and download your personal data</p>
              <p>• Correct inaccurate information</p>
              <p>• Delete your account and associated data</p>
              <p>• Opt out of non-essential communications</p>
              <p>• Control location data sharing</p>
              <p>• Request information about data usage</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">7. Data Retention</h3>
            <p className="text-muted-foreground">
              We retain your information only as long as necessary for the purposes outlined in this policy.
              Emergency contact information and verification data may be retained longer for safety purposes.
              You can request deletion of your data through the app settings.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">8. Children's Privacy</h3>
            <p className="text-muted-foreground">
              RAIL SAVIOR is not intended for children under 13. We do not knowingly collect personal information 
              from children under 13. If we become aware of such collection, we will delete the information immediately.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">9. Changes to This Policy</h3>
            <p className="text-muted-foreground">
              We may update this Privacy Policy to reflect changes in our practices or legal requirements.
              We will notify users of significant changes through the app and by email.
              Your continued use constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">10. Contact Us</h3>
            <div className="text-muted-foreground space-y-2">
              <p>For privacy-related questions or requests:</p>
              <p>• Email: privacy@railsavior.app</p>
              <p>• In-app support through Settings</p>
              <p>• Response time: Within 5 business days</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};
