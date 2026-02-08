import React, { useMemo } from 'react';
import { formatCurrency } from '@/components/utils/formatters';

const creditorTypeLabels = {
  energie: 'Energie',
  telecom: 'Telecom',
  zorgverzekeraar: 'Zorg',
  bank: 'Bank',
  webshop: 'Webshop',
  overheid: 'Overheid',
  incassobureau: 'Incasso',
  deurwaarder: 'Deurwaarder',
  anders: 'Anders',
  incasso: 'Incasso',
  incasso_en_deurwaarder: 'Inc. & Deurw.'
};

const statusLabels = {
  niet_actief: 'Niet Actief',
  wachtend: 'Wachtend',
  betalingsregeling: 'Regeling',
  afbetaald: 'Afbetaald',
  actief: 'Actief',
  aanmaning: 'Aanmaning'
};

const colors = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function DebtOverviewChart({ debts = [], viewMode = 'type', embedded = false }) {
  const [activeView, setActiveView] = React.useState(viewMode);

  // Calculate distribution data — based on count (aantal schulden)
  const distributionData = useMemo(() => {
    if (!debts || debts.length === 0) return [];

    const groupedData = {};

    debts.forEach(debt => {
      const key = activeView === 'type'
        ? (debt.creditor_type || 'anders')
        : (debt.status || 'actief');

      if (!groupedData[key]) {
        groupedData[key] = {
          key,
          label: activeView === 'type'
            ? (creditorTypeLabels[key] || key)
            : (statusLabels[key] || key),
          amount: 0,
          count: 0
        };
      }
      groupedData[key].amount += (debt.amount || 0);
      groupedData[key].count += 1;
    });

    return Object.values(groupedData).sort((a, b) => b.count - a.count);
  }, [debts, activeView]);

  const totalCount = useMemo(() =>
    distributionData.reduce((sum, d) => sum + d.count, 0),
    [distributionData]
  );

  // Generate donut chart segments
  const generateDonutSegments = () => {
    if (distributionData.length === 0) return [];

    const segments = [];
    let currentAngle = -90; // Start from top
    const radius = 70;
    const centerX = 100;
    const centerY = 100;

    distributionData.forEach((item, index) => {
      const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
      const angle = (percentage / 100) * 360;

      // Calculate arc
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      segments.push({
        ...item,
        pathData,
        color: colors[index % colors.length],
        percentage
      });

      currentAngle = endAngle;
    });

    return segments;
  };

  const segments = generateDonutSegments();

  if (!debts || debts.length === 0) {
    const wrapperClass = embedded
      ? ""
      : "bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]";

    return (
      <div className={wrapperClass}>
        {!embedded && (
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-[20px]">pie_chart</span>
            </div>
            <h3 className="font-semibold text-lg text-[#1F2937] dark:text-white">Schuldenoverzicht</h3>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="size-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-gray-400 dark:text-[#6B7280] text-3xl">celebration</span>
          </div>
          <p className="text-gray-500 dark:text-[#a1a1a1] text-sm">Geen schulden gevonden</p>
          <p className="text-gray-400 dark:text-[#6B7280] text-xs mt-1">Voeg schulden toe om je overzicht te zien</p>
        </div>
      </div>
    );
  }

  const wrapperClass = embedded
    ? ""
    : "bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]";

  return (
    <div className={wrapperClass}>
      {/* Header - only show if not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-[20px]">pie_chart</span>
            </div>
            <h3 className="font-semibold text-lg text-[#1F2937] dark:text-white">Schuldenoverzicht</h3>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className={`flex ${embedded ? 'justify-end mb-4' : 'justify-end mb-6'}`}>
        <div className="flex bg-gray-100 dark:bg-[#2a2a2a] rounded-full p-1">
          <button
            onClick={() => setActiveView('type')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
              activeView === 'type'
                ? 'bg-white dark:bg-[#3a3a3a] text-[#1F2937] dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-[#a1a1a1] hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            Type
          </button>
          <button
            onClick={() => setActiveView('status')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
              activeView === 'status'
                ? 'bg-white dark:bg-[#3a3a3a] text-[#1F2937] dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-[#a1a1a1] hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            Status
          </button>
        </div>
      </div>

      {/* Chart and Legend */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="30"
              className="text-gray-100 dark:text-[#2a2a2a]"
            />

            {/* Segments */}
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.pathData}
                fill={segment.color}
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                style={{ transform: 'scale(1)', transformOrigin: '100px 100px' }}
              />
            ))}

            {/* Inner circle (donut hole) */}
            <circle cx="100" cy="100" r="45" className="fill-white dark:fill-[#1a1a1a]" />
          </svg>
        </div>

        {/* Legend - only category and percentage */}
        <div className="flex-1 w-full">
          <div className="space-y-2">
            {segments.slice(0, 5).map((segment, index) => {
              // Fix rounding: largest group gets the rounding difference
              let displayPercentage = Math.round(segment.percentage);
              if (index === 0 && segments.length > 0) {
                const otherRounded = segments.slice(1, 5).reduce((sum, s) => sum + Math.round(s.percentage), 0);
                displayPercentage = 100 - otherRounded;
              }
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="size-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm text-[#1F2937] dark:text-white font-medium truncate">
                      {segment.label} ({segment.count})
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#1F2937] dark:text-white flex-shrink-0 ml-2">
                    {displayPercentage}%
                  </span>
                </div>
              );
            })}
            {segments.length > 5 && (
              <div className="text-xs text-gray-400 dark:text-[#6B7280] text-center pt-2">
                +{segments.length - 5} meer
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-[#2a2a2a]">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1F2937] dark:text-white">{debts.length}</p>
          <p className="text-xs text-gray-500 dark:text-[#a1a1a1]">Totaal schulden</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-500">
            {debts.filter(d => d.status === 'afbetaald').length}
          </p>
          <p className="text-xs text-gray-500 dark:text-[#a1a1a1]">Afbetaald</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-500">
            {debts.filter(d => d.status === 'betalingsregeling').length}
          </p>
          <p className="text-xs text-gray-500 dark:text-[#a1a1a1]">Met regeling</p>
        </div>
      </div>
    </div>
  );
}
