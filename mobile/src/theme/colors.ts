export const colors = {
  primary: '#1e40af',       // Deep clinical blue
  primaryDark: '#1e3a8a',
  primaryLight: '#3b82f6',
  primarySubtle: '#eff6ff',

  secondary: '#0d9488',     // Healthcare teal
  secondaryLight: '#14b8a6',
  secondarySubtle: '#ccfbf1',

  background: '#f8fafc',    // Off-white slate background
  surface: '#ffffff',       // Card & modal background
  surfaceMuted: '#f1f5f9',
  surfaceSubtle: '#f8fafc',

  border: '#e2e8f0',        // Subtle card & input border
  borderLight: '#f1f5f9',
  borderFocus: '#3b82f6',

  text: {
    primary: '#0f172a',     // High-contrast slate
    secondary: '#475569',   // Subtitles and body
    muted: '#94a3b8',       // Captions & timestamps
    inverse: '#ffffff',
  },

  status: {
    success: '#16a34a',
    successBg: '#dcfce7',
    successText: '#15803d',

    warning: '#d97706',
    warningBg: '#fef3c7',
    warningText: '#b45309',

    error: '#dc2626',
    errorBg: '#fee2e2',
    errorText: '#b91c1c',

    info: '#2563eb',
    infoBg: '#eff6ff',
    infoText: '#1d4ed8',
  },

  patientRole: {
    badgeBg: '#dcfce7',
    badgeText: '#166534',
  },

  doctorRole: {
    badgeBg: '#e0e7ff',
    badgeText: '#3730a3',
  },
} as const;
