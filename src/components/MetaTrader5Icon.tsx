import React from 'react';

export const MetaTrader5Icon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M7 16V8l5 5 5-5v8" />
    </svg>
  );
};
