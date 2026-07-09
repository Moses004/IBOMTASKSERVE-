interface AvatarProps {
  url?: string | null
  name: string
  /** Full control over size + shape, e.g. "h-16 w-16 rounded-2xl" */
  className?: string
}

export function Avatar({ url, name, className = 'h-12 w-12 rounded-2xl' }: AvatarProps) {
  if (url) {
    return <img src={url} alt={name} className={`${className} flex-shrink-0 object-cover`} />
  }

  return (
    <div
      className={`${className} flex flex-shrink-0 items-center justify-center bg-gradient-to-br from-primary to-primary-deep font-display font-bold text-white`}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}
