import chiguardLogo from "@/assets/chiguard-logo.png";

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img
    src={chiguardLogo}
    alt="ChiGuard Shield Logo"
    className={`${className} object-contain`}
  />
);