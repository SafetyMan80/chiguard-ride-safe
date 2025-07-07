import { Logo } from "@/components/Logo";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const HeaderSection = () => {
  return (
    <header className="p-6 safe-area-top bg-gradient-to-b from-background via-background/95 to-background/90 -mx-6 px-6 backdrop-blur-md">
      <OfflineIndicator />
      <div className="flex justify-end items-center mb-6">
        <ThemeToggle />
      </div>
      <Card className="glass-card shadow-[var(--shadow-elevated)] border-chicago-blue/10">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-chicago-blue/20 rounded-full blur-xl"></div>
              <Logo className="relative w-24 h-24 md:w-28 md:h-28 drop-shadow-2xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-urbanist font-black bg-gradient-to-r from-chicago-blue via-chicago-navy to-chicago-blue bg-clip-text text-transparent tracking-tight text-center">
              RAILSAVIOR
            </h1>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <p className="text-center text-base text-muted-foreground/80 font-medium">
            Safety Driven...Community Powered
          </p>
        </CardContent>
      </Card>
    </header>
  );
};