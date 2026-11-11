export function InstagramIcon({ size, className = '', strokeWidth = 2, ...props }) {
  const hasWidth = /(^|\s)w-/.test(className)
  const hasHeight = /(^|\s)h-/.test(className)
  const w = hasWidth ? undefined : (size || 20)
  const h = hasHeight ? undefined : (size || 20)
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}
