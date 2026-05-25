import React from "react";

interface IconProps {
  w?: number;
  sw?: number;
}

const Ic: React.FC<IconProps & { d?: string; fill?: string; children?: React.ReactNode }> = ({
  d, w = 20, sw = 1.6, fill = "none", children,
}) => (
  <svg viewBox="0 0 24 24" width={w} height={w} fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

// ALL icons as named exports in an Icons object:
export const Icons = {
  pill:     (p: IconProps) => <Ic {...p}><rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="M8.5 7.5 L15.5 16.5"/></Ic>,
  capsule:  (p: IconProps) => <Ic {...p}><rect x="3.5" y="9" width="17" height="6" rx="3"/><path d="M12 9 V15"/></Ic>,
  droplet:  (p: IconProps) => <Ic {...p} d="M12 3.5 C12 3.5 5 11 5 15.5A7 7 0 0 0 19 15.5C19 11 12 3.5 12 3.5Z"/>,
  sun:      (p: IconProps) => <Ic {...p}><circle cx="12" cy="12" r="3.6"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/></Ic>,
  shield:   (p: IconProps) => <Ic {...p} d="M12 3L4.5 6V12C4.5 16.5 8 19.5 12 21C16 19.5 19.5 16.5 19.5 12V6Z"/>,
  heart:    (p: IconProps) => <Ic {...p} d="M12 20C4 14.5 4 8 7.5 6.5C10 5.4 12 7.5 12 9C12 7.5 14 5.4 16.5 6.5C20 8 20 14.5 12 20Z"/>,
  eye:      (p: IconProps) => <Ic {...p}><path d="M2.5 12C5 7 8.5 5 12 5C15.5 5 19 7 21.5 12C19 17 15.5 19 12 19C8.5 19 5 17 2.5 12Z"/><circle cx="12" cy="12" r="3"/></Ic>,
  leaf:     (p: IconProps) => <Ic {...p}><path d="M5 19C5 11 11 5 19 5C19 13 13 19 5 19Z"/><path d="M5 19L14 10"/></Ic>,
  flask:    (p: IconProps) => <Ic {...p}><path d="M9 3H15M10 3V9L5.5 18A1.5 1.5 0 0 0 7 20H17A1.5 1.5 0 0 0 18.5 18L14 9V3"/><path d="M7.5 14H16.5"/></Ic>,
  syringe:  (p: IconProps) => <Ic {...p}><path d="M14 3L21 10M17 6L13 10M16 9L9 16L6 16L4 18L6 20L8 18L8 15L15 8Z"/><path d="M11 12L13 14"/></Ic>,
  flame:    (p: IconProps) => <Ic {...p} d="M12 22C7 22 4 18.5 4 14.5C4 10 8 8 8 4C11 6 13 8 13 11C14 10 15.5 9 15.5 7.5C18 10 20 12.5 20 15.5C20 19 17 22 12 22Z"/>,
  plus:     (p: IconProps) => <Ic {...p}><path d="M12 5V19M5 12H19"/></Ic>,
  chevRight:(p: IconProps) => <Ic {...p} d="M9 5L16 12L9 19"/>,
  chevLeft: (p: IconProps) => <Ic {...p} d="M15 5L8 12L15 19"/>,
  home:     (p: IconProps) => <Ic {...p} d="M4 11L12 4L20 11V20H14V14H10V20H4Z"/>,
  list:     (p: IconProps) => <Ic {...p}><path d="M8 6H20M8 12H20M8 18H20M4 6H4.5M4 12H4.5M4 18H4.5"/></Ic>,
  check:    (p: IconProps) => <Ic {...p} d="M5 12.5L10 17L19 7"/>,
  undo:     (p: IconProps) => <Ic {...p}><path d="M4 9H14A5 5 0 0 1 14 19H10"/><path d="M7 6L4 9L7 12"/></Ic>,
  trash:    (p: IconProps) => <Ic {...p}><path d="M5 7H19M9 7V5A1 1 0 0 1 10 4H14A1 1 0 0 1 15 5V7M7 7L8 20A1 1 0 0 0 9 21H15A1 1 0 0 0 16 20L17 7"/></Ic>,
  minus:    (p: IconProps) => <Ic {...p} d="M5 12H19"/>,
  x:        (p: IconProps) => <Ic {...p} d="M6 6L18 18M18 6L6 18"/>,
  moon:     (p: IconProps) => <Ic {...p} d="M21 12.8A9 9 0 1 1 11.2 3C11.2 3 13 6 13 9C13 12 15 14 17 14.3A9 9 0 0 0 21 12.8Z"/>,
};

export type { IconProps };
