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
    <div className="bg-white rounded-[2rem] p-6 shadow-soft">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-header text-lg font-bold text-konsensi-dark">Aankomende Betalingen</h3>
        <Link
          to={createPageUrl("VasteLastenCheck")}
          className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
        >
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
      <div className="space-y-3">
        {payments.length > 0 ? (
          payments.slice(0, 3).map((payment, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100"
            >
              <div className="size-10 rounded-full bg-[#1DB954]/10 flex-shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#1DB954]">
                  {payment.type === "debt" ? "credit_card" : payment.type === "fixed_cost" ? "payments" : "music_note"}
                </span>
              </div>
              <div className="flex-grow">
                <p className="font-bold text-sm text-konsensi-dark">{payment.name}</p>
                <p className="text-xs text-gray-500">
                  {payment.type === "debt" ? "Volgende Schuldbetaling" : "Volgende Vaste Last"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-konsensi-dark">
                  {formatCurrency(payment.amount || 0)}
                </p>
                <p className="text-xs text-gray-400">{formatDate(payment.date)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4 text-sm">Geen aankomende betalingen</p>
        )}
      </div>
    </div>
  );
}

