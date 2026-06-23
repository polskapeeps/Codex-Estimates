import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function SvgIcon({ size = 24, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </SvgIcon>
);

export const JobsIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </SvgIcon>
);

export const PlusIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);

export const MinusIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M5 12h14" />
  </SvgIcon>
);

export const ClientsIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </SvgIcon>
);

export const SettingsIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </SvgIcon>
);

export const MoonIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M12 3a6.8 6.8 0 0 0 7.1 10.8A8 8 0 1 1 12 3Z" />
  </SvgIcon>
);

export const SunIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </SvgIcon>
);

export const SearchIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </SvgIcon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m15 18-6-6 6-6" />
  </SvgIcon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m9 18 6-6-6-6" />
  </SvgIcon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m6 9 6 6 6-6" />
  </SvgIcon>
);

export const XIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </SvgIcon>
);

export const CheckIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </SvgIcon>
);

export const TrashIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </SvgIcon>
);

export const PencilIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </SvgIcon>
);

export const CopyIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </SvgIcon>
);

export const PrinterIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </SvgIcon>
);

export const DownloadIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </SvgIcon>
);

export const UploadIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </SvgIcon>
);

export const ArchiveIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </SvgIcon>
);

export const FileTextIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h6M9 9h1" />
  </SvgIcon>
);

export const PaintRollerIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <rect x="3" y="3" width="14" height="6" rx="1" />
    <path d="M17 6h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-7a2 2 0 0 0-2 2v1" />
    <rect x="9" y="15" width="4" height="6" rx="1" />
  </SvgIcon>
);

export const MapPinIcon = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </SvgIcon>
);
