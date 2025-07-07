import { Logo } from "@/components/Logo";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const HeaderSection = () => {
  return (
    <header className="p-6 safe-area-top">
      <OfflineIndicator />
      <div className="flex justify-end items-center mb-4">
        <ThemeToggle />
      </div>
      <Card className="bg-chicago-accent dark:bg-card border-chicago-blue/20">
        <CardHeader className="text-center pb-3">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Logo className="w-24 h-24 md:w-28 md:h-28 drop-shadow-xl" />
            <h1 className="text-3xl md:text-4xl font-urbanist font-black text-chicago-gunmetal dark:text-white tracking-tight text-center">
              RAILSAVIOR
            </h1>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-center text-lg text-muted-foreground font-sans font-medium">
            Safety Driven...Community Powered
          </p>
        </CardContent>
      </Card>
    </header>
  );
};