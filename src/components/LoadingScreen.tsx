import { Logo } from "@/components/Logo";
import chicagoTrainGraphic from "@/assets/chicago-l-train-ai.jpg";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="flex items-center justify-center gap-2 mb-6 -ml-4">
        <Logo className="w-24 h-24 drop-shadow-md" />
        <h1 className="text-5xl font-black text-chicago-gunmetal tracking-tight">
          CHIGUARD
        </h1>
      </div>
      
      <div className="mb-4 overflow-hidden">
        <img 
          src={chicagoTrainGraphic}
          alt="Chicago L Train" 
          className="w-full max-w-lg h-40 object-cover rounded-lg animate-train-move will-change-transform"
        />
      </div>
      
      <p className="text-center text-lg text-muted-foreground font-sans font-medium">
        Safety Driven...Community Powered
      </p>
      
      <div className="w-48 h-1.5 bg-chicago-blue rounded-full mt-3 animate-pulse"></div>
    </div>
  );
};