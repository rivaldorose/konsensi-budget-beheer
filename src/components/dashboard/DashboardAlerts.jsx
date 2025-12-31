import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DashboardAlerts({ alerts = [] }) {
  const defaultAlerts = [
    {
      type: "warning",
      title: "Uitgaven: €45 over budget",
      description: "Bekijk details",
      link: createPageUrl("BudgetPlan"),
      icon: "warning",
    },
    {
      type: "tip",
      title: "Mindset: Lees nieuwe post",
      description: "5 min leestijd",
      link: "#",
      icon: "lightbulb",
    },
  ];

  const displayAlerts = alerts.length > 0 ? alerts : defaultAlerts;

  return (
    <div className="flex flex-col gap-3">
      {displayAlerts.map((alert, index) => (
        <Link
          key={index}
          to={alert.link}
          className={`border rounded-2xl p-4 flex items-center gap-3 transition-shadow hover:shadow-md ${
            alert.type === "warning"
              ? "bg-rose-50 border-rose-100"
              : alert.type === "tip"
              ? "bg-[#F0FDF4] border-[#DCFCE7]"
              : "bg-blue-50 border-blue-100"
          }`}
        >
          <span
            className={`material-symbols-outlined ${
              alert.type === "warning"
                ? "text-rose-500"
                : alert.type === "tip"
                ? "text-green-500"
                : "text-blue-500"
            }`}
          >
            {alert.icon}
          </span>
          <div>
            <p
              className={`font-bold text-sm ${
                alert.type === "warning"
                  ? "text-rose-700"
                  : alert.type === "tip"
                  ? "text-green-700"
                  : "text-blue-700"
              }`}
            >
              {alert.title}
            </p>
            {alert.description && (
              <p
                className={`text-xs ${
                  alert.type === "warning"
                    ? "text-rose-500 underline decoration-rose-300"
                    : alert.type === "tip"
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {alert.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

