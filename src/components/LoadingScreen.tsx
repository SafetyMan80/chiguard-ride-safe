import { Logo } from "@/components/Logo";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="flex flex-col items-center justify-center space-y-6 mb-8 animate-scale-in transform-gpu">
        <Logo className="w-32 h-32 drop-shadow-xl transform-gpu" />
        <h1 className="text-5xl font-urbanist font-black text-chicago-gunmetal dark:text-white tracking-tight text-center transform-gpu will-change-transform">
          RAILSAVIOR
        </h1>
      </div>
      
      <p className="text-center text-lg text-muted-foreground font-sans font-medium mb-4 opacity-0 animate-fade-in animation-delay-300">
        Safety Driven...Community Powered
      </p>
      
      <div className="w-48 h-1.5 bg-chicago-blue rounded-full animate-pulse transform-gpu"></div>
    </div>
  );
};