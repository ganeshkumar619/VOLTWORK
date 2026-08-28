import React from 'react';

export const ElectricBg: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Immersive Dark Cosmic / Midnight Gradient Base */}
      <div
        className="absolute inset-0 bg-[#020617]"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 70%)',
        }}
      />

      {/* High-tech matrix dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Cyber ambient glow points */}
      <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
