'use client';

import { useEffect, useState } from 'react';

export function InventoryHealthRing({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const color = score >= 80 ? '#15803D' : score >= 60 ? '#F59E0B' : '#DC2626';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Attention' : 'Critical';
  const bgColor = score >= 80 ? '#DCFCE7' : score >= 60 ? '#FEF3C7' : '#FEE2E2';

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label={`Inventory health: ${score}%, ${label}`}>
        <circle cx="90" cy="90" r={radius} fill="none" stroke={bgColor} strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        <text
          x="90"
          y="88"
          textAnchor="middle"
          style={{ fontFamily: 'var(--font-fira-code)', fontSize: '32px', fontWeight: 700, fill: '#14532D' }}
        >
          {Math.round(animatedScore)}%
        </text>
        <text x="90" y="108" textAnchor="middle" style={{ fontSize: '13px', fill: '#64748B' }}>
          {label}
        </text>
      </svg>
      <p className="mt-2 text-xs text-muted-foreground">Inventory Health Score</p>
    </div>
  );
}
