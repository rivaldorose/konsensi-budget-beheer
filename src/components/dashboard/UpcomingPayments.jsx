import React from "react";
import { formatCurrency } from "@/components/utils/formatters";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UpcomingPayments({ payments = [] }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Onbekend";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Onbekend";
      return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long" }).format(date);
    } catch (e) {
      return "Onbekend";
    }
  };

  return (
    <div className="bg-white dark:bg-card-bg rounded-[2rem] p-6 shadow-soft border border-transparent dark:border-border-main">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-header text-lg font-bold text-konsensi-dark dark:text-white">Aankomende Betalingen</h3>
        <Link
          to={createPageUrl("VasteLastenCheck")}
          className="size-8 rounded-full bg-gray-100 dark:bg-card-elevated flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition border border-transparent dark:border-border-main"
        >
          <span className="material-symbols-outlined text-sm dark:text-text-secondary">arrow_forward</span>
        </Link>
      </div>
      <div className="space-y-3">
        {payments.length > 0 ? (
          payments.slice(0, 3).map((payment, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-card-elevated rounded-2xl border border-gray-100 dark:border-border-main"
            >
              <div className="size-10 rounded-full bg-konsensi-primary/10 dark:bg-konsensi-bg-green flex-shrink-0 flex items-center justify-center border border-transparent dark:border-konsensi-primary/20">
                <span className="material-symbols-outlined text-konsensi-primary">
                  {payment.type === "debt" ? "credit_card" : payment.type === "fixed_cost" ? "payments" : "music_note"}
                </span>
              </div>
              <div className="flex-grow">
                <p className="font-bold text-sm text-konsensi-dark dark:text-white">{payment.name}</p>
                <p className="text-xs text-gray-500 dark:text-text-secondary">
                  {payment.type === "debt" ? "Volgende Schuldbetaling" : "Volgende Vaste Last"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-konsensi-dark dark:text-white">
                  {formatCurrency(payment.amount || 0)}
                </p>
                <p className="text-xs text-gray-400 dark:text-text-tertiary">{formatDate(payment.date)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-text-secondary py-4 text-sm">Geen aankomende betalingen</p>
        )}
      </div>
    </div>
  );
}

