import { LOCAL_PHONE_LENGTH, toLocalDigits } from '../lib/phone'

export function PhoneField({
  value,
  onChange,
  error = false,
  label = 'TELÉFONO (OPCIONAL)',
  hint = 'Solo los 10 dígitos locales. El +52 de México no se edita.',
}) {
  const local = toLocalDigits(value)
  const invalid = error || (local.length > 0 && local.length < LOCAL_PHONE_LENGTH)

  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="block px-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
          {label}
        </label>
      ) : null}
      <div
        className={`flex h-12 overflow-hidden rounded-2xl border bg-white/80 shadow-sm transition ${
          invalid
            ? 'border-rose ring-4 ring-blush/80'
            : 'border-sand/80 focus-within:border-rose/50 focus-within:ring-4 focus-within:ring-blush/70'
        }`}
      >
        <span
          className="inline-flex shrink-0 items-center gap-1.5 bg-[#eee7e0] px-3 text-sm font-semibold text-ink select-none"
          aria-hidden
        >
          <span className="text-base leading-none">🇲🇽</span>
          +52
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={LOCAL_PHONE_LENGTH}
          pattern="[0-9]{10}"
          value={local}
          onChange={(event) => onChange(toLocalDigits(event.target.value))}
          placeholder="5512345678"
          aria-label={label || 'Teléfono local a 10 dígitos'}
          className="min-w-0 flex-1 bg-transparent px-3 text-ink outline-none placeholder:text-muted/50"
        />
      </div>
      {invalid ? (
        <span className="px-1 text-xs text-rose-deep">Escribe los 10 dígitos de la clienta.</span>
      ) : hint ? (
        <span className="px-1 text-xs text-muted/80">{hint}</span>
      ) : null}
    </div>
  )
}
