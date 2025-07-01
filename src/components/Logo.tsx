export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Shield shape */}
    <path
      d="M50 5L20 20V45C20 70 50 95 50 95C50 95 80 70 80 45V20L50 5Z"
      fill="hsl(var(--chicago-blue))"
      stroke="hsl(var(--chicago-red))"
      strokeWidth="2"
    />
    {/* Letter C */}
    <path
      d="M32 35C32 26 38 20 46 20C52 20 58 24 58 30H52C52 27 49 26 46 26C41 26 38 29 38 35V55C38 61 41 64 46 64C49 64 52 63 52 60H58C58 66 52 70 46 70C38 70 32 64 32 55V35Z"
      fill="white"
      strokeWidth="1"
      stroke="hsl(var(--chicago-blue))"
    />
    {/* Letter G */}
    <path
      d="M58 35C58 26 64 20 72 20C78 20 84 24 84 30H78C78 27 75 26 72 26C67 26 64 29 64 35V55C64 61 67 64 72 64C75 64 78 63 78 60V52H72V47H84V55C84 64 78 70 72 70C64 70 58 64 58 55V35Z"
      fill="white"
      strokeWidth="1" 
      stroke="hsl(var(--chicago-blue))"
    />
  </svg>
);