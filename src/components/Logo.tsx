import railSaviorLogo from "@/assets/rail-savior-logo.png";

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img
    src={railSaviorLogo}
    alt="Rail Savior Shield Logo"
    className={`${className} object-contain drop-shadow-lg`}
  />
);