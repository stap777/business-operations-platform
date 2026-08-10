import React from 'react';

interface AvenLogoProps {
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
  showTagline?: boolean;
}

export const AvenLogo: React.FC<AvenLogoProps> = ({
  size = 'md',
  align = 'center',
  showTagline = true,
}) => {
  const titleSizeClass =
    size === 'lg'
      ? 'text-3xl'
      : size === 'sm'
      ? 'text-xl'
      : 'text-2xl';

  const taglineSizeClass =
    size === 'lg'
      ? 'text-sm'
      : size === 'sm'
      ? 'text-xs'
      : 'text-xs';

  const alignClass = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`space-y-0.5 ${alignClass}`}>
      <span className={`font-bold tracking-tight text-[#111111] dark:text-[#FAFAFA] block ${titleSizeClass}`}>
        Aven
      </span>
      {showTagline && (
        <span className={`font-normal text-[#71717A] dark:text-[#A1A1AA] block ${taglineSizeClass}`}>
          Business, organized.
        </span>
      )}
    </div>
  );
};
