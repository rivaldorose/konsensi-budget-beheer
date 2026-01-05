import React from "react";
import { Link } from "react-router-dom";

export default function DashboardAlerts({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert, index) => {
        const isWarning = alert.type === 'warning';
        const isInfo = alert.type === 'info';

        return (
          <div
            key={index}
            className={`
              ${isWarning ? 'bg-rose-50 dark:bg-card-bg border-rose-100 dark:border-accent-red/20' : ''}
              ${isInfo ? 'bg-[#F0FDF4] dark:bg-card-bg border-[#DCFCE7] dark:border-konsensi-primary/20' : ''}
              border rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden
            `}
          >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWarning ? 'bg-accent-red' : 'bg-konsensi-primary'}`}></div>

            <span className={`material-symbols-outlined ${isWarning ? 'text-rose-500 dark:text-accent-red' : 'text-green-500 dark:text-konsensi-primary'}`}>
              {alert.icon}
            </span>
            <div className="flex-grow">
              <p className={`font-bold text-sm ${isWarning ? 'text-rose-700 dark:text-white' : 'text-green-700 dark:text-white'}`}>
                {alert.title}
              </p>
              {alert.subtitle && (
                <p className={`text-xs ${isWarning ? 'text-rose-600' : 'text-green-600 dark:text-konsensi-primary'} ${!alert.action && 'cursor-pointer hover:underline'}`}>
                  {alert.subtitle}
                </p>
              )}
              {alert.action && (
                <Link
                  to={alert.link || '#'}
                  className={`text-xs ${isWarning ? 'text-rose-500' : 'text-green-500 dark:text-konsensi-primary'} underline ${isWarning ? 'decoration-rose-300' : 'decoration-green-300'} hover:text-${isWarning ? 'red' : 'green'}-400`}
                >
                  {alert.action}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
