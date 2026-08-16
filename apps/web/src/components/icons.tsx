import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></Svg>;
}
export function GridIcon(props: IconProps) {
  return <Svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Svg>;
}
export function CalendarIcon(props: IconProps) {
  return <Svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></Svg>;
}
export function RefreshIcon(props: IconProps) {
  return <Svg {...props}><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 9a7 7 0 0 0-11.4-3L4 11M5.5 15a7 7 0 0 0 11.4 3L20 13"/></Svg>;
}
export function BellIcon(props: IconProps) {
  return <Svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></Svg>;
}
export function UsersIcon(props: IconProps) {
  return <Svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
}
export function BarChartIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></Svg>;
}
export function DollarIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.8-1-2-1.5-4-1.5-2.2 0-3.5 1-3.5 2.5 0 3.5 7.5 1.5 7.5 5 0 1.5-1.3 2.5-4 2.5-2 0-3.2-.5-4-1.5M12 5v14"/></Svg>;
}
export function FileIcon(props: IconProps) {
  return <Svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></Svg>;
}
export function SettingsIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.24.33.46.67.6 1 .11.3.17.64.17 1H21v4h-.83c0 .36-.06.7-.17 1-.14.33-.36.67-.6 1Z"/></Svg>;
}
export function HelpIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.4 9a2.8 2.8 0 1 1 4.5 2.2c-1.2.8-1.9 1.2-1.9 2.8M12 18h.01"/></Svg>;
}
export function ChevronDownIcon(props: IconProps) {
  return <Svg {...props}><path d="m7 10 5 5 5-5"/></Svg>;
}
export function ChevronLeftIcon(props: IconProps) {
  return <Svg {...props}><path d="m15 18-6-6 6-6"/></Svg>;
}
export function ChevronRightIcon(props: IconProps) {
  return <Svg {...props}><path d="m9 18 6-6-6-6"/></Svg>;
}
export function MailIcon(props: IconProps) {
  return <Svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></Svg>;
}
export function LockIcon(props: IconProps) {
  return <Svg {...props}><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></Svg>;
}
export function EyeIcon(props: IconProps) {
  return <Svg {...props}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></Svg>;
}
export function ShieldIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10.5 10V8.8a1.5 1.5 0 0 1 3 0V10"/></Svg>;
}
export function AlertIcon(props: IconProps) {
  return <Svg {...props}><path d="M10.3 3.6 2.4 17.2A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.8L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></Svg>;
}
export function CheckIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></Svg>;
}
export function PlusIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 5v14M5 12h14"/></Svg>;
}
export function UserIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Svg>;
}
export function MoreIcon(props: IconProps) {
  return <Svg {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></Svg>;
}
export function SearchIcon(props: IconProps) {
  return <Svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></Svg>;
}
export function FilterIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 5h16M7 12h10M10 19h4"/></Svg>;
}
export function DownloadIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></Svg>;
}
export function UploadIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 16V4M7 9l5-5 5 5M5 21h14"/></Svg>;
}
export function EditIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></Svg>;
}
export function TrashIcon(props: IconProps) {
  return <Svg {...props}><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/></Svg>;
}
export function XIcon(props: IconProps) {
  return <Svg {...props}><path d="m6 6 12 12M18 6 6 18"/></Svg>;
}
export function ClockIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Svg>;
}
export function BuildingIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 21V5l8-3 8 3v16M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2M9 21v-2h6v2"/></Svg>;
}
export function TagIcon(props: IconProps) {
  return <Svg {...props}><path d="M20 13 11 22 2 13V4h9Z"/><circle cx="7" cy="9" r="1"/></Svg>;
}
export function LinkIcon(props: IconProps) {
  return <Svg {...props}><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></Svg>;
}

export function LogOutIcon(props: IconProps) {
  return <Svg {...props}><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></Svg>;
}
