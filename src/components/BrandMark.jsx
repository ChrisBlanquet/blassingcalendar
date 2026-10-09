export function BrandMark({ size = 56 }) {
  return (
    <div
      className="grid place-items-center rounded-full bg-linear-to-br from-blush via-nude to-gold-soft shadow-[0_8px_24px_rgba(201,123,132,0.25)]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 64 64" fill="none" aria-hidden>
        <path
          d="M32 8c3 8 8 13 16 16-8 3-13 8-16 16-3-8-8-13-16-16 8-3 13-8 16-16Z"
          fill="#C9A36B"
        />
        <path
          d="M44 36c1.6 4.4 4.4 7.2 8.8 8.8-4.4 1.6-7.2 4.4-8.8 8.8-1.6-4.4-4.4-7.2-8.8-8.8 4.4-1.6 7.2-4.4 8.8-8.8Z"
          fill="#C97B84"
        />
        <circle cx="20" cy="44" r="3.2" fill="#C97B84" />
      </svg>
    </div>
  )
}
