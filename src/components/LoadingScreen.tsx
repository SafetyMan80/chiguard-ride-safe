import { Logo } from "@/components/Logo";
import { RealisticTrain3D } from "@/components/RealisticTrain3D";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="flex items-center justify-center gap-2 mb-6 -ml-4">
        <Logo className="w-32 h-32 drop-shadow-md" />
        <h1 className="text-5xl font-urbanist font-black text-chicago-gunmetal dark:text-foreground tracking-tight" style={{
          textShadow: '0 0 2px hsl(var(--chicago-gold)), 0 0 4px hsl(var(--chicago-gold)), 0 0 6px hsl(var(--chicago-gold))'
        }}>
          RAILSAVIOR
        </h1>
      </div>
      
      <div className="mb-4 overflow-hidden w-full max-w-2xl">
        <RealisticTrain3D interactive={true} />
      </div>
      
      <p className="text-center text-lg text-muted-foreground font-sans font-medium">
        Safety Driven...Community Powered
      </p>
      
      <div className="w-48 h-1.5 bg-chicago-blue rounded-full mt-3 animate-pulse"></div>
    </div>
  );
};