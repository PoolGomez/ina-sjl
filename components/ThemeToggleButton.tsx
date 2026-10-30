'use client';

import React from 'react';
import { useTheme, ThemeMode } from '../lib/themeContext';

export const ThemeToggleButton: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();

  const options: {
    value: ThemeMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'system',
      label: 'Tema del sistema',
      icon: (
        <svg
          viewBox="0 0 16 16"
          height="16"
          width="16"
          data-slot="geist-icon"
          style={{ color: 'currentColor' }}
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.5 5.25C2.5 3.45 3.96 2 5.75 2h4.5c1.8 0 3.25 1.46 3.25 3.25V14h-11V5.25M5.75 3.5C4.78 3.5 4 4.28 4 5.25v7.25h8V5.25c0-.97-.78-1.75-1.75-1.75zM5 5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V9H5zm3.5 6H11V10H8.5z"
          />
        </svg>
      ),
    },
    {
      value: 'light',
      label: 'Tema claro',
      icon: (
        <svg
          viewBox="0 0 16 16"
          height="16"
          width="16"
          data-slot="geist-icon"
          style={{ color: 'currentColor' }}
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.75 2v-.75h-1.5V3h1.5V2M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 1.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.75 1.5v1.75h-1.5V13zM13 7.25h1.75v1.5H13zm-11 0h-.75v1.5H3v-1.5H2m9-3.32.54-.53.17-.17.53-.53 1.06 1.06-.53.53-.17.17-.53.53zm-7.77 7.78-.53.53 1.06 1.06.53-.53.17-.17.53-.53L3.93 11l-.53.53zM3.93 5l-.53-.53-.17-.17-.53-.53L3.76 2.7l.53.53.17.17.53.53zm7.78 7.78.53.53 1.06-1.06-.53-.53-.17-.17-.53-.53L11 12.07l.53.53z"
          />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: 'Tema oscuro',
      icon: (
        <svg
          viewBox="0 0 16 16"
          height="16"
          width="16"
          data-slot="geist-icon"
          style={{ color: 'currentColor' }}
        >
          <path
            fill="currentColor"
            d="m6.3 3.3.7.25A4.25 4.25 0 0 0 12.45 9l.96.96-.08.2A5.75 5.75 0 1 1 6.04 2.6zM5.25 4.76a4.24 4.24 0 1 0 6 5.99H11a5.75 5.75 0 0 1-5.75-6M12.5 3.5h1.25V5H12.5v1.25H11V5H9.75V3.5H11V2.25h1.5zM7 3.55l-.7-.25-.26-.7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <fieldset
      role="radiogroup"
      aria-label="Seleccionar tema de visualización"
      className="isolate inline-flex items-center rounded-full border border-gray-200 dark:border-gray-800 bg-gray-100/80 dark:bg-gray-900 p-0.5 h-9 w-fit m-0 shadow-theme-xs"
    >
      <legend className="sr-only">Seleccionar tema:</legend>
      {options.map((opt) => {
        const isActive = themeMode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => setThemeMode(opt.value)}
            className={`group rounded-full flex items-center justify-center size-8 m-0 relative cursor-pointer transition-all ${
              isActive
                ? 'bg-white dark:bg-gray-800 text-gray-950 dark:text-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.14)]'
                : 'bg-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <span className="sr-only">{opt.label}</span>
            <span className="relative z-10 flex items-center justify-center size-4">
              {opt.icon}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
};

export default ThemeToggleButton;
