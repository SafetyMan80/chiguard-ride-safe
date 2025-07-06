import { Logo } from "@/components/Logo";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="flex items-center justify-center gap-4 mb-8">
        <Logo className="w-32 h-32 drop-shadow-md" />
        <h1 className="text-5xl font-urbanist font-black text-chicago-gunmetal dark:text-white tracking-tight animate-zoom-in-text flex items-center">
          <span className="text-7xl text-black font-playfair" style={{ textShadow: '2px 2px 0 hsl(var(--chicago-gold)), -2px -2px 0 hsl(var(--chicago-gold)), 2px -2px 0 hsl(var(--chicago-gold)), -2px 2px 0 hsl(var(--chicago-gold))' }}>R</span>
          <span>AIL</span>
          <span className="text-7xl text-black font-playfair" style={{ textShadow: '2px 2px 0 hsl(var(--chicago-gold)), -2px -2px 0 hsl(var(--chicago-gold)), 2px -2px 0 hsl(var(--chicago-gold)), -2px 2px 0 hsl(var(--chicago-gold))' }}>S</span>
          <span>AVIOR</span>
        </h1>
      </div>
      
      <p className="text-center text-lg text-muted-foreground font-sans font-medium mb-4">
        Safety Driven...Community Powered
      </p>
      
      <div className="w-48 h-1.5 bg-chicago-blue rounded-full animate-pulse"></div>
    </div>
  );
};