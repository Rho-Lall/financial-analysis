import type { CSSProperties } from 'react';

interface ScoreCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'percentage' | 'ratio' | 'number';
  trend?: number;
  trendLabel?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ScoreCard({
  title,
  value,
  format = 'number',
  trend,
  trendLabel = 'vs prior year',
  size = 'medium',
}: ScoreCardProps) {
  const formatValue = (val: number, fmt: string): string => {
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: Math.abs(val) >= 1e9 ? 'compact' : 'standard',
          maximumFractionDigits: 2,
        }).format(val);
      case 'percentage':
        return `${(val * 100).toFixed(2)}%`;
      case 'ratio':
        return val.toFixed(2);
      case 'number':
      default:
        return new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 2,
        }).format(val);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { value: '2rem', title: '0.85rem' };
      case 'large':
        return { value: '3.5rem', title: '1rem' };
      case 'medium':
      default:
        return { value: '2.75rem', title: '0.9rem' };
    }
  };

  const sizeStyles = getSizeStyles();

  const cardStyle: CSSProperties = {
    background: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s',
  };

  const titleStyle: CSSProperties = {
    fontSize: sizeStyles.title,
    fontWeight: 600,
    color: '#666',
    margin: '0 0 1rem 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const valueStyle: CSSProperties = {
    fontSize: sizeStyles.value,
    fontWeight: 700,
    color: '#333',
    margin: '0 0 0.5rem 0',
    lineHeight: 1.2,
  };

  const trendStyle: CSSProperties = {
    fontSize: '0.85rem',
    color: trend && trend > 0 ? '#22c55e' : trend && trend < 0 ? '#ef4444' : '#666',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <h3 style={titleStyle}>{title}</h3>
      <p style={valueStyle}>{formatValue(value, format)}</p>
      {trend !== undefined && (
        <p style={trendStyle}>
          <span style={{ fontSize: '1rem' }}>{getTrendIcon()}</span>
          <span>
            {formatValue(Math.abs(trend), format === 'currency' ? 'currency' : 'percentage')}{' '}
            {trendLabel}
          </span>
        </p>
      )}
    </div>
  );
}