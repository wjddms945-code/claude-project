import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable }: CardProps) {
  const hoverClass = hoverable
    ? 'hover:shadow-md hover:border-gray-300 cursor-pointer transition-shadow'
    : '';
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
