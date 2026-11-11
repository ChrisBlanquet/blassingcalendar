import { InstagramIcon } from './InstagramIcon'
import { cleanInstagram } from '../lib/instagram'

export function InstagramField({
  value = '',
  onChange,
  label = 'INSTAGRAM (OPCIONAL)',
  placeholder = 'usuario',
  hint,
}) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="block px-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
          {label}
        </label>
      ) : null}
      <div className="flex h-12 overflow-hidden rounded-2xl border border-sand/80 bg-white/80 shadow-sm transition focus-within:border-rose/50 focus-within:ring-4 focus-within:ring-blush/70">
        <span
          className="inline-flex shrink-0 items-center gap-1.5 bg-[#eee7e0] px-3 text-sm font-semibold text-muted select-none"
          aria-hidden
        >
          <InstagramIcon size={16} className="text-[#a8908a]" />
          <span>@</span>
        </span>
        <input
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/^@+/, ''))}
          onBlur={(event) => onChange(cleanInstagram(event.target.value))}
          placeholder={placeholder}
          aria-label={label || 'Instagram'}
          className="min-w-0 flex-1 bg-transparent px-3 text-ink outline-none placeholder:text-muted/50"
        />
      </div>
      {hint ? <span className="px-1 text-xs text-muted/80">{hint}</span> : null}
    </div>
  )
}
