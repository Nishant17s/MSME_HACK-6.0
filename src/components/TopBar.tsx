'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Clock, Bell, LayoutGrid, Monitor, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TopBarProps {
  activeAlertCount?: number;
  criticalAlertCount?: number;
  onToggleAlerts?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeAlertCount = 0, criticalAlertCount = 0, onToggleAlerts }) => {
  const [time, setTime] = useState<string>('--:--:--');
  const [date, setDate] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: '/', label: 'Monitor', icon: Monitor },
    { href: '/admin', label: 'Fleet Overview', icon: LayoutGrid },
  ];

  return (
    <header className="w-full h-14 flex-shrink-0 flex items-center justify-between px-5 z-20"
      style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--surface-border)' }}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
            <Shield className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              SentinelEdge
            </h1>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Industrial IoT
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 ml-4 px-1 py-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                style={{
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Alerts + Clock */}
      <div className="flex items-center gap-3">
        {/* Alert Bell */}
        {onToggleAlerts && (
          <button
            onClick={onToggleAlerts}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90"
            style={{
              background: criticalAlertCount > 0 ? 'var(--critical-bg)' : activeAlertCount > 0 ? 'var(--warning-bg)' : 'var(--surface-2)',
              border: `1px solid ${criticalAlertCount > 0 ? 'var(--critical-border)' : activeAlertCount > 0 ? 'var(--warning-border)' : 'var(--surface-border)'}`,
              color: criticalAlertCount > 0 ? 'var(--status-critical)' : activeAlertCount > 0 ? 'var(--status-warning)' : 'var(--text-muted)',
            }}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts</span>
            {activeAlertCount > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white px-1"
                style={{ background: criticalAlertCount > 0 ? 'var(--status-critical)' : 'var(--status-warning)' }}
              >
                {activeAlertCount}
              </span>
            )}
          </button>
        )}

        {/* Clock */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}
        >
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-primary)' }}>{time}</span>
          <span style={{ color: 'var(--text-dim)' }}>·</span>
          <span>{date}</span>
        </div>
      </div>
    </header>
  );
};
