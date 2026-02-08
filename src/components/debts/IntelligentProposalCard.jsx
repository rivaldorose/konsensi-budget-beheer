/**
 * INTELLIGENTE BETALINGSREGELING CARD
 *
 * Toont automatisch gegenereerde betalingsvoorstel per schuld
 * Inclusief success kans indicator en looptijd info
 */

import React from 'react';
import { formatCurrency } from '@/components/utils/formatters';
import { getStatusIcon } from '@/services/arrangementEngine';

export default function IntelligentProposalCard({ voorstel, onSelectProposal }) {
  if (!voorstel) return null;

  const {
    creditor,
    bedrag,
    maandBedrag,
    looptijd,
    looptijdTekst,
    kans,
    kansNiveau,
    kansKleur,
    status,
    statusTekst,
    isReady,
    percentagePerMaand
  } = voorstel;

  const getKansKleurClass = () => {
    switch (kansKleur) {
      case 'green': return 'bg-emerald-500';
      case 'orange': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getKansBgClass = () => {
    switch (kansKleur) {
      case 'green': return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30';
      case 'orange': return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
      case 'red': return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
      default: return 'bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/30';
    }
  };

  const getKansTekstClass = () => {
    switch (kansKleur) {
      case 'green': return 'text-emerald-600 dark:text-emerald-400';
      case 'orange': return 'text-amber-600 dark:text-amber-400';
      case 'red': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${getKansBgClass()}`}
      onClick={() => onSelectProposal && onSelectProposal(voorstel)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-lg ${getKansTekstClass()}`}>
            {getStatusIcon(status)}
          </span>
          <span className="font-bold text-gray-900 dark:text-white">{creditor}</span>
        </div>
        <span className="text-gray-500 dark:text-gray-400 font-medium">
          {formatCurrency(bedrag)}
        </span>
      </div>

      {/* Voorstel Details */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Maandbedrag</p>
          <p className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(maandBedrag)}
          </p>
        </div>
        <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Looptijd</p>
          <p className="font-bold text-gray-900 dark:text-white">
            {looptijdTekst}
          </p>
        </div>
      </div>

      {/* Success Kans Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500 dark:text-gray-400">Acceptatiekans</span>
          <span className={`font-bold ${getKansTekstClass()}`}>{kans}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getKansKleurClass()}`}
            style={{ width: `${kans}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-gray-600/30">
        <span className={`text-xs font-medium ${getKansTekstClass()}`}>
          {statusTekst}
        </span>
        {isReady && (
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">description</span>
            Brief klaar
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact versie voor in debt list items
 */
export function IntelligentProposalBadge({ voorstel }) {
  if (!voorstel) return null;

  const { maandBedrag, looptijd, kans, kansKleur, isReady } = voorstel;

  const getKleurClass = () => {
    switch (kansKleur) {
      case 'green': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
      case 'orange': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'red': return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${getKleurClass()}`}>
      <span>€{maandBedrag}/mnd</span>
      <span className="opacity-60">•</span>
      <span>{looptijd}mnd</span>
      <span className="opacity-60">•</span>
      <span className="flex items-center gap-0.5">
        {kans}%
        {isReady && <span className="material-symbols-outlined text-sm ml-1">check_circle</span>}
      </span>
    </div>
  );
}

/**
 * Summary widget voor totaaloverzicht
 */
export function IntelligentProposalSummary({ batchResult }) {
  if (!batchResult || !batchResult.totaal) return null;

  const { totaal, voorstellen } = batchResult;
  const haalbareVoorstellen = voorstellen?.filter(v =>
    v.status === 'zeer_haalbaar' || v.status === 'haalbaar'
  ).length || 0;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl p-5 border border-primary/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/20 rounded-full">
          <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Intelligente Voorstellen</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Automatisch berekend op basis van je VTLB
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{formatCurrency(totaal.maandBedrag)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Totaal per maand</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totaal.aantalSchulden}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Schulden</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totaal.gemiddeldeSuccessKans}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Gem. kans</p>
        </div>
      </div>

      {haalbareVoorstellen > 0 && (
        <div className="mt-4 pt-4 border-t border-primary/20 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{haalbareVoorstellen}</span>
            {' '}voorstellen klaar voor verzending
          </span>
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">description</span>
            Brieven genereren
          </span>
        </div>
      )}
    </div>
  );
}
