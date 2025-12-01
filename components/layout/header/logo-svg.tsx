export function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 90 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NBFHOMES Logo"
    >
      <text
        x="50%"
        y="55%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="currentColor"
        fontSize="24"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        letterSpacing="-0.05em"
      >
        NBF.
      </text>
    </svg>
  );
}
