type IconProps = { className?: string; size?: number };

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const HomeIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10h4v-6h6v6h4V10" />
  </svg>
);

export const PatientsIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M14 20a4.5 4.5 0 0 1 7.5-3.4" />
  </svg>
);

export const ScheduleIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
    <circle cx="9" cy="14" r="1" fill="currentColor" />
    <circle cx="13" cy="14" r="1" fill="currentColor" />
    <circle cx="17" cy="14" r="1" fill="currentColor" />
  </svg>
);

export const NotesIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const ReportsIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M4 4h16v16H4z" />
    <path d="M8 16V10M12 16v-3M16 16V8" />
  </svg>
);

export const SettingsIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const AlertIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </svg>
);

export const SparkIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
);

export const Spinner = (props: IconProps) => (
  <svg {...base(props.size)} className={`animate-spin ${props.className ?? ''}`}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);

export const FlameIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M12 3c2 3 5 5 5 9a5 5 0 1 1-10 0c0-1.7.7-3 1.6-4.2.4 1 1.2 1.6 2 1.6.6 0 1-.4 1-1 0-1-.4-2-.4-3.2 0-1.6.8-2.8 1.8-3.2Z" />
  </svg>
);

export const MenuIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M6 6l12 12M18 6l-12 12" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="m4 12 5 5L20 6" />
  </svg>
);

export const FileIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
  </svg>
);

export const MicIcon = (props: IconProps) => (
  <svg {...base(props.size)} className={props.className}>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
