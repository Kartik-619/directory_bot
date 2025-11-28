"use client";

import { forwardRef, ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>(
  ({ title, subtitle, children }, ref) => {
    return (
      <header ref={ref} className="header">
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>
        {children}
      </header>
    );
  }
);

Header.displayName = 'Header';