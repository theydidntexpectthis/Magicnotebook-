import React from 'react';

const NotebookHero: React.FC = () => {
  return (
    <svg width="480" height="360" viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Laptop */}
      <rect x="140" y="70" width="240" height="150" rx="8" fill="#4A5568" />
      <rect x="150" y="80" width="220" height="130" rx="4" fill="#81D4FA" />
      
      {/* Laptop base */}
      <path d="M130 220H390L410 240H110L130 220Z" fill="#2D3748" />
      <rect x="110" y="240" width="300" height="10" rx="2" fill="#4A5568" />
      
      {/* Notepad screen */}
      <rect x="170" y="95" width="180" height="100" rx="2" fill="#FFF9C4" />
      
      {/* Notebook lines */}
      <rect x="180" y="110" width="160" height="1" fill="#E6D07E" />
      <rect x="180" y="125" width="160" height="1" fill="#E6D07E" />
      <rect x="180" y="140" width="160" height="1" fill="#E6D07E" />
      <rect x="180" y="155" width="160" height="1" fill="#E6D07E" />
      <rect x="180" y="170" width="160" height="1" fill="#E6D07E" />
      
      {/* Notepad title */}
      <text x="190" y="105" fontFamily="Arial" fontSize="12" fill="#2D3748">My notes</text>
      
      {/* Command text */}
      <text x="190" y="135" fontFamily="Arial" fontSize="12" fill="#2D3748">/trial netflix</text>
      
      {/* Hand with pencil */}
      <g transform="translate(320, 150) rotate(30)">
        {/* Pencil */}
        <rect x="0" y="-15" width="60" height="10" rx="2" fill="#F6AD55" />
        <path d="M58 -10 L70 -5 L58 0 Z" fill="#2D3748" />
        <rect x="0" y="-15" width="5" height="10" rx="1" fill="#ED8936" />
        
        {/* Hand */}
        <path d="M-20 -10 C-25 -20, -15 -30, -5 -25 L-2 -20 L0 -15 L-5 0 C-10 5, -20 0, -20 -10 Z" fill="#F6AD55" />
      </g>
      
      {/* Keyboard keys (simplified) */}
      <rect x="150" y="230" width="220" height="2" fill="#A0AEC0" />
    </svg>
  );
};

export default NotebookHero;