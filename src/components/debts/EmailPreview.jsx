import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, CheckCircle2, FileText, Info, ChevronLeft, Edit, Eye, Clipboard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

/**
 * TemplatePreview - Toont een brief/template in een mooi opgemaakte preview.
 * De gebruiker kan de brief kopiëren of downloaden om zelf te versturen per email/post.
 * Er wordt GEEN email verstuurd vanuit de app.
 *
 * Props:
 * - letterContent: string - De brieftekst
 * - onLetterChange: (content) => void - Handler voor het bewerken van de brief
 * - recipientName: string - Naam van de ontvanger (schuldeiser)
 * - recipientType: string - Type ontvanger (bijv. "Schuldeiser", "Incassobureau")
 * - subject: string - Onderwerp van de brief
 * - senderName: string - Naam van de afzender (gebruiker)
 * - onMarkComplete: () => void - Handler voor "Ik heb het verstuurd" (status bijwerken)
 * - markCompleteText: string - Tekst voor de markeer-knop
 * - onBack: () => void - Handler voor terug
 * - backText: string - Tekst voor terug-knop
 * - calculation: object - VTLB berekening data voor live weergave
 * - attachmentName: string - Optionele bijlage bestandsnaam
 * - tipText: string - Optionele tip tekst
 * - infoTitle: string - Optionele info card titel
 * - infoText: string - Optionele info card tekst
 * - showDisclaimer: boolean - Toon Juridisch Loket disclaimer
 * - showChecklist: boolean - Toon checklist sectie
 */
export default function EmailPreview({
  letterContent = "",
  onLetterChange,
  recipientName = "Schuldeiser",
  recipientType = "Schuldeiser",
  subject = "Betalingsvoorstel",
  senderName = "Gebruiker",
  onSend: onMarkComplete,
  sendButtonText: markCompleteText = "Ik heb de brief zelf verstuurd",
  onBack,
  backText = "Terug",
  calculation,
  attachmentName,
  tipText,
  infoTitle,
  infoText,
  showDisclaimer = false,
  showChecklist = false,
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(letterContent);
    setCopied(true);
    toast({
      title: "Gekopieerd!",
      description: "De brieftekst is naar je klembord gekopieerd. Plak het in je eigen e-mail of document.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxtFile = () => {
    const element = document.createElement("a");
    const file = new Blob([letterContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `brief_${recipientName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Gedownload!",
      description: "De brief is gedownload. Verstuur deze zelf per e-mail of post.",
    });
  };

  // Parse letter content into formatted paragraphs
  const renderFormattedLetter = () => {
    if (!letterContent) return null;

    const lines = letterContent.split("\n");
    const elements = [];
    let currentBlock = [];

    const flushBlock = (key) => {
      if (currentBlock.length > 0) {
        const text = currentBlock.join("\n");
        elements.push(
          <p key={key} className="mb-4 whitespace-pre-line">
            {text}
          </p>
        );
        currentBlock = [];
      }
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      if (trimmed === "") {
        flushBlock(`block-${i}`);
        return;
      }

      // Bold markers like "REDEN BETWISTING:" or "MIJN VERZOEK:"
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.endsWith(":")) {
        flushBlock(`block-${i}`);
        elements.push(
          <p key={`heading-${i}`} className="mb-2 font-bold text-slate-900 dark:text-white">
            {trimmed}
          </p>
        );
        return;
      }

      // Bullet points
      if (trimmed.startsWith("•") || trimmed.startsWith("- ")) {
        flushBlock(`block-${i}`);
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2 mb-1 ml-2">
            <span className="text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0">•</span>
            <span>{trimmed.replace(/^[•\-]\s*/, "")}</span>
          </div>
        );
        return;
      }

      // Attachment lines
      if (trimmed.startsWith("Bijlage") || trimmed.startsWith("Bijlagen")) {
        flushBlock(`block-${i}`);
        elements.push(
          <p key={`attachment-${i}`} className="mb-2 font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-3 mt-4">
            {trimmed}
          </p>
        );
        return;
      }

      // "Onderwerp:" and "Kenmerk:" lines - style as metadata
      if (trimmed.startsWith("Onderwerp:") || trimmed.startsWith("Kenmerk:")) {
        flushBlock(`block-${i}`);
        elements.push(
          <p key={`meta-${i}`} className="mb-1 text-slate-600 dark:text-slate-400 text-xs font-medium">
            {trimmed}
          </p>
        );
        return;
      }

      currentBlock.push(line);
    });

    flushBlock("final");
    return elements;
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {backText}
        </Button>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Content: Template Preview */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Brief Voorbeeld
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Controleer de brief, kopieer of download de tekst en verstuur deze zelf per e-mail of post.
            </p>
          </div>

          {/* Template Card - styled like an email/letter */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-[#2A2A2A] overflow-hidden shadow-sm">
            {/* Letter Header */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-[#2A2A2A] bg-slate-50/50 dark:bg-[#1A1A1A]/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400 text-xs font-medium min-w-[60px]">
                  Aan:
                </span>
                <span className="text-slate-900 dark:text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2 py-1 rounded">
                  {recipientName} ({recipientType})
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 text-xs font-medium min-w-[60px]">
                  Betreft:
                </span>
                <span className="text-slate-900 dark:text-white font-bold text-xs leading-relaxed">
                  {subject}
                </span>
              </div>
            </div>

            {/* Letter Body */}
            <div className="p-6 md:p-8">
              {isEditing ? (
                <Textarea
                  value={letterContent}
                  onChange={(e) => onLetterChange?.(e.target.value)}
                  className="min-h-[400px] text-sm bg-white dark:bg-[#1a1a1a] dark:text-white dark:border-[#2a2a2a] font-mono"
                />
              ) : (
                <div className="max-w-prose mx-auto text-slate-800 dark:text-slate-300 leading-relaxed text-sm space-y-0">
                  {renderFormattedLetter()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-[#2A2A2A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Template klaar
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <FileText className="w-3 h-3" />
                <span className="text-[10px] uppercase font-bold">
                  Kopieer of download om te versturen
                </span>
              </div>
            </div>
          </div>

          {/* VTLB Calculation Preview (if available) */}
          {calculation && (
            <div className="mt-4 bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-[#2A2A2A] overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-[#2A2A2A] bg-emerald-50/50 dark:bg-emerald-900/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">
                    calculate
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    VTLB Berekening
                  </span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    LIVE
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Vast inkomen:
                  </span>
                  <span className="font-semibold dark:text-white">
                    €{(calculation.vastInkomen || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Vaste lasten:
                  </span>
                  <span className="font-semibold dark:text-white">
                    -€{(calculation.vasteLasten || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-[#2A2A2A] pt-2">
                  <span className="font-semibold dark:text-white">
                    Beschikbaar:
                  </span>
                  <span className="font-bold dark:text-white">
                    €{(calculation.beschikbaar || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Afloscapaciteit (15%):</span>
                  <span>€{(calculation.aflosCapaciteit || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Huidige regelingen:</span>
                  <span>
                    -€{(calculation.huidigeRegelingen || 0).toFixed(2)}
                  </span>
                </div>
                <div
                  className={`flex justify-between border-t border-slate-100 dark:border-[#2A2A2A] pt-2 font-bold ${
                    (calculation.isHaalbaar || calculation.canPayInFull)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  <span>Ruimte voor regeling:</span>
                  <span>€{(calculation.ruimteVoorNieuw || 0).toFixed(2)}</span>
                </div>
                {calculation.voorstel > 0 && (
                  <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        💡 Wij raden aan: €{calculation.voorstel.toFixed(2)}/maand
                      </span>
                      <span className="text-xs text-slate-500">
                        (~{calculation.looptijd} maanden)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="w-full lg:w-64 flex flex-col gap-3">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-[#2A2A2A] p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Acties
            </h3>

            {/* Primary: Copy */}
            <Button
              onClick={copyToClipboard}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
              size="sm"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Gekopieerd!" : "Tekst Kopiëren"}
            </Button>

            {/* Download */}
            <Button
              variant="outline"
              onClick={downloadTxtFile}
              className="w-full"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" /> Download (.txt)
            </Button>

            {/* Toggle Edit/Preview */}
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="w-full"
              size="sm"
            >
              {isEditing ? (
                <>
                  <Eye className="w-4 h-4 mr-2" /> Voorbeeld
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" /> Bewerken
                </>
              )}
            </Button>

            <div className="pt-3 border-t border-slate-100 dark:border-[#2A2A2A]">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Kopieer de tekst en plak het in je eigen e-mailprogramma, of download het bestand en verstuur het per post.
              </p>
            </div>

            {/* Mark as sent (status tracking only) */}
            {onMarkComplete && (
              <div className="pt-3 border-t border-slate-100 dark:border-[#2A2A2A]">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Heb je de brief al verstuurd?
                </p>
                <Button
                  onClick={onMarkComplete}
                  variant="outline"
                  className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {markCompleteText}
                </Button>
              </div>
            )}
          </div>

          {/* Info Card */}
          {(infoTitle || infoText) && (
            <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-4">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  {infoTitle && (
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      {infoTitle}
                    </h4>
                  )}
                  {infoText && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {infoText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tip Card */}
          {tipText && (
            <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-amber-500 text-base flex-shrink-0 mt-0.5">
                  tips_and_updates
                </span>
                <div>
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                    Tip
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {tipText}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attachment Reminder */}
          {attachmentName && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-[#2A2A2A] p-3 flex items-center gap-3">
              <div className="size-8 bg-slate-100 dark:bg-black rounded-lg flex items-center justify-center text-emerald-500">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {attachmentName}
                </p>
                <p className="text-[10px] text-slate-500">
                  Vergeet niet dit mee te sturen als bijlage
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer Section */}
      {showDisclaimer && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Deze brief template komt van het Juridisch Loket
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Meer info:{" "}
                <a
                  href="https://www.juridischloket.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900 dark:text-blue-100"
                >
                  juridischloket.nl
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Section */}
      {showChecklist && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Zo stel je een betalingsregeling voor:
          </h4>
          <ul className="space-y-2 text-xs text-emerald-800 dark:text-emerald-200">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">□</span>
              <span>Maak een overzicht van uw inkomsten en uitgaven waaruit blijkt wat u kunt betalen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">□</span>
              <span>Kopieer de brief en stuur deze per e-mail of post naar de schuldeiser</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">□</span>
              <span>U kunt alvast een eerste betaling doen om te laten zien dat u zich aan de regeling wilt houden</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">□</span>
              <span>Vraag altijd om een schriftelijke bevestiging van de afspraken</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
