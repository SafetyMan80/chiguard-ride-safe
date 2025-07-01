export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Shield shape */}
    <path
      d="M50 10L15 25V50C15 70 50 90 50 90C50 90 85 70 85 50V25L50 10Z"
      fill="hsl(var(--chicago-blue))"
      stroke="hsl(var(--chicago-red))"
      strokeWidth="2"
    />
  </svg>
);