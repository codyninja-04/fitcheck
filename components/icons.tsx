// Small stroke icons, 24 unit grid, currentColor. Kept in one file so the app
// doesn't pull in an icon package for a dozen glyphs.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

function Icon({ children, className = 'h-5 w-5', ...rest }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...rest}>
      {children}
    </svg>
  )
}

export const CameraIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2l1.4 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
)

export const ImageIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m20.5 15.5-4.5-4.5-8.5 8.5" />
  </Icon>
)

export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)

export const ArrowRightIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

export const ArrowLeftIcon = (p: P) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
)

export const ClockIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
)

export const TrashIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
  </Icon>
)

export const LockIcon = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Icon>
)

export const EyeOffIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 8.5 4.5 9 6-.3.9-1.4 2.6-3.1 4M6.6 7.6C4.6 8.9 3.4 10.8 3 12c.5 1.5 4 6 9 6 1.6 0 3-.4 4.2-1.1M10 10a3 3 0 0 0 4 4" />
  </Icon>
)

export const SparkIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3.5 13.7 9 19 10.7l-5.3 1.7L12 18l-1.7-5.6L5 10.7 10.3 9z" />
    <path d="M19 3.5v3M17.5 5h3" />
  </Icon>
)

export const RefreshIcon = (p: P) => (
  <Icon {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
  </Icon>
)

// Occasion glyphs.
export const HeartIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 19.5s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 7.5 2.3c0 5.6-7.5 10.2-7.5 10.2z" />
  </Icon>
)

export const BriefcaseIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
    <path d="M9 7.5V5.8A1.3 1.3 0 0 1 10.3 4.5h3.4A1.3 1.3 0 0 1 15 5.8v1.7M3.5 12.5h17" />
  </Icon>
)

export const LaptopIcon = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="5.5" width="14" height="10" rx="1.5" />
    <path d="M2.5 18.5h19" />
  </Icon>
)

export const CoffeeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
    <path d="M16 10.5h1.3a2.3 2.3 0 0 1 0 4.6H16M9 3.5v2.5M12.5 3.5v2.5" />
  </Icon>
)

export const BowTieIcon = (p: P) => (
  <Icon {...p}>
    <path d="M10.5 12 4 7.5v9zM13.5 12 20 7.5v9z" />
    <rect x="10.5" y="10" width="3" height="4" rx="1" />
  </Icon>
)

export const DotsIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="6" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="18" cy="12" r="1.2" fill="currentColor" />
  </Icon>
)
