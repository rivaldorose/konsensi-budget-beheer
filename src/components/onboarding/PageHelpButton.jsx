import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from 'lucide-react';
import { TOUR_STEPS } from './InteractiveTour';

export default function PageHelpButton({ pageName, onClick }) {
  // Capitalize first letter to match TOUR_STEPS keys
  const normalizedPageName = pageName ? pageName.charAt(0).toUpperCase() + pageName.slice(1) : '';
  
  // Alleen tonen als er tour stappen zijn voor deze pagina
  const hasSteps = TOUR_STEPS[normalizedPageName] && TOUR_STEPS[normalizedPageName].length > 0;
  
  if (!hasSteps) return null;
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="h-9 w-9 rounded-full border-2 border-gray-200 hover:border-[var(--konsensi-primary)] hover:bg-[var(--konsensi-accent-light)] transition-all"
      title="Bekijk uitleg voor deze pagina"
    >
      <HelpCircle className="w-5 h-5 text-gray-500 hover:text-[var(--konsensi-primary)]" />
    </Button>
  );
}