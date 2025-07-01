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
      d="M35 35C35 28 40 22 47 22C52 22 56 26 56 30H51C51 28 49 27 47 27C43 27 40 30 40 35V55C40 60 43 63 47 63C49 63 51 62 51 60H56C56 64 52 68 47 68C40 68 35 62 35 55V35Z"
      fill="white"
    />
    {/* Letter G */}
    <path
      d="M57 35C57 28 62 22 69 22C74 22 78 26 78 30H73C73 28 71 27 69 27C66 27 62 30 62 35V55C62 60 66 63 69 63C71 63 73 62 73 60V52H69V47H78V55C78 62 74 68 69 68C62 68 57 62 57 55V35Z"
      fill="white"
    />
  </svg>
);