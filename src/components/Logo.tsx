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
  </svg>
);