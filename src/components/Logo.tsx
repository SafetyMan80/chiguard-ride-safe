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
    {/* Letter G */}
    <path
      d="M40 35C40 30 45 25 50 25C55 25 60 30 60 35V40H55V35C55 33 53 30 50 30C47 30 45 33 45 35V55C45 57 47 60 50 60C53 60 55 57 55 55V50H50V45H60V55C60 60 55 65 50 65C45 65 40 60 40 55V35Z"
      fill="white"
    />
  </svg>
);