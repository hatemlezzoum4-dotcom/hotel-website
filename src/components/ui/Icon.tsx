import type { SVGProps } from "react";

const paths: Record<string, React.ReactNode> = {
  bell: <><path d="M4 18h16" /><path d="M6 18a6 6 0 0 1 12 0" /><path d="M12 9V7" /><circle cx="12" cy="5.5" r="1.2" /></>,
  utensils: <><path d="M7 3v18" /><path d="M4 3v5a3 3 0 0 0 6 0V3" /><path d="M17 21V3c-2 1.5-3 4-3 7v3h3" /></>,
  coffee: <><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" /></>,
  buffet: <><path d="M3 17h18" /><path d="M5 17a7 7 0 0 1 14 0" /><path d="M12 8V6" /><path d="M4 20h16" /></>,
  sofa: <><path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" /><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z" /><path d="M5 18v2M19 18v2" /></>,
  parking: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M10 17V8h3a2.5 2.5 0 0 1 0 5h-3" /></>,
  plane: <><path d="M10.5 19.5 12 15l-6-3V9.5l6 1.5V6a1.5 1.5 0 0 1 3 0v5l6-1.5V12l-6 3 1.5 4.5L14 21l-1.5-2-1.5 2z" /></>,
  tray: <><path d="M3 17h18" /><path d="M5 17a7 7 0 0 1 14 0" /><circle cx="12" cy="8.5" r="1" /></>,
  wifi: <><path d="M2 9a15 15 0 0 1 20 0" /><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19" r="0.8" /></>,
  snow: <><path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5" /></>,
  star: <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z" />,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  phone: <path d="M5 4h3.5l1.5 4.5-2 1.5a11 11 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3.5 6 8.5 7 8.5-7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></>,
  bed: <><path d="M3 18V6" /><path d="M3 14h18v4" /><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="2" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="1.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  whatsapp: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3a2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1 2.7 11.5 11.5 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"
    />
  ),
};

export const ICON_NAMES = Object.keys(paths);

export default function Icon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name] ?? paths.star}
    </svg>
  );
}
