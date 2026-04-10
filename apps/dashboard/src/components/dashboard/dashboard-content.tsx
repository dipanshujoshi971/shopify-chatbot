'use client';

import { useEffect, useState } from 'react';

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState('260px');

  useEffect(() => {
    // Read initial state
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setSidebarWidth('72px');

    // Listen for CSS variable changes from sidebar
    const observer = new MutationObserver(() => {
      const width = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-width')
        .trim();
      if (width) setSidebarWidth(width);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative z-10 transition-all duration-300"
      style={{ paddingLeft: `var(--sidebar-width, ${sidebarWidth})` }}
    >
      <div className="hidden lg:block" />
      {children}
    </div>
  );
}
