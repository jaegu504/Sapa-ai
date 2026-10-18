import React from 'react';

export interface NavIconProps {
  className?: string;
  size?: number;
}

/**
 * Radar / Pulse Wave vector icon (Apple SF Symbols style)
 */
export const RadarNavIcon: React.FC<NavIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    {/* Central pulse dot */}
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    {/* Inner broadcast wave */}
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49" />
    {/* Outer broadcast wave */}
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);

/**
 * Dual Silhouettes Contacts vector icon
 */
export const ContactsNavIcon: React.FC<NavIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    {/* Primary User */}
    <circle cx="9" cy="7" r="4" />
    <path d="M2 20a7 7 0 0 1 14 0H2z" />
    {/* Secondary Partner User */}
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M22 20a6.5 6.5 0 0 0-6-6" />
  </svg>
);

/**
 * Apple Calendar / Schedule sheet vector icon
 */
export const ScheduleNavIcon: React.FC<NavIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    {/* Calendar Card Frame */}
    <rect x="3" y="4" width="18" height="18" rx="4" />
    {/* Binding Rings */}
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    {/* Divider Header */}
    <line x1="3" y1="10" x2="21" y2="10" />
    {/* Date Dots / Grid */}
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
    <circle cx="8" cy="18" r="1" fill="currentColor" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
    <circle cx="16" cy="18" r="1" fill="currentColor" />
  </svg>
);

/**
 * Apple SF-Style Precision Settings Gear vector icon
 */
export const SettingsNavIcon: React.FC<NavIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    {/* Central Axle Ring */}
    <circle cx="12" cy="12" r="3" />
    {/* Gear Profile */}
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/**
 * Apple iOS Light Theme vector SVG icon
 */
export const AppleThemeIcon: React.FC<NavIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.74 1.03-1.77.92-2.8-.88.04-1.95.59-2.58 1.33-.56.65-.99 1.7-1.04 2.72.99.08 2-.51 2.7-1.25z" />
  </svg>
);

/**
 * Apple VisionOS Spatial Dark Glass Theme vector SVG icon
 */
export const VisionOsThemeIcon: React.FC<NavIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    {/* VisionOS Panoramic Curved Visor Frame */}
    <rect x="2" y="6" width="20" height="12" rx="6" />
    {/* Left Spatial Eye Lens */}
    <circle cx="8" cy="12" r="2.5" />
    {/* Right Spatial Eye Lens */}
    <circle cx="16" cy="12" r="2.5" />
    {/* Center Bridge Sensor */}
    <path d="M11 12h2" />
  </svg>
);

/**
 * System / Auto Adaptive Theme vector SVG icon
 */
export const SystemThemeIcon: React.FC<NavIconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    aria-hidden="true"
  >
    {/* Laptop / Monitor Base */}
    <rect x="2" y="4" width="14" height="10" rx="2" />
    <path d="M2 17h14" />
    {/* Overlaying Mobile Phone */}
    <rect x="15" y="8" width="7" height="12" rx="2" fill="none" strokeWidth="2" />
    <circle cx="18.5" cy="17" r="0.5" fill="currentColor" />
  </svg>
);

