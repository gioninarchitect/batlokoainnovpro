const variants = {
  gold: 'bg-gold/20 text-gold-dark border-gold',
  safety: 'bg-safety/10 text-safety-dark border-safety',
  industrial: 'bg-industrial/10 text-industrial border-industrial',
  navy: 'bg-navy/10 text-navy border-navy'
}

function Badge({
  children,
  variant = 'gold',
  className = ''
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1
        text-caption font-semibold uppercase tracking-wider
        border rounded-full
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export default Badge
