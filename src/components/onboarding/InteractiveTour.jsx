import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { createPageUrl } from "@/utils";
import { useNavigate } from 'react-router-dom';

// Tour stappen per pagina
const TOUR_STEPS = {
  Dashboard: [
    {
      target: null,
      title: "Welkom bij Konsensi! 👋",
      content: "Dit is jouw persoonlijke financiële dashboard. Hier zie je in één oogopslag hoe het met je geld staat.",
      position: "center"
    },
    {
      target: '[data-tour="income-summary"]',
      title: "💰 Totaal Inkomen",
      content: "Hier zie je hoeveel geld er binnenkomt deze maand - zowel vast als extra inkomen.",
      position: "bottom"
    },
    {
      target: '[data-tour="expenses-summary"]',
      title: "🏠 Vaste Lasten",
      content: "Dit toont je maandelijkse vaste kosten zoals huur, verzekeringen en abonnementen.",
      position: "bottom"
    },
    {
      target: '[data-tour="debt-paid"]',
      title: "✅ Afbetaald",
      content: "Hier zie je hoeveel je deze maand al hebt afbetaald op je schulden.",
      position: "bottom"
    },
    {
      target: '[data-tour="total-debt"]',
      title: "💳 Totale Schuld",
      content: "Dit is het totaalbedrag dat je nog moet afbetalen aan al je schuldeisers.",
      position: "bottom"
    },
    {
      target: null,
      title: "Klaar om te beginnen! 🚀",
      content: "Laten we nu je inkomsten bekijken. Klik op 'Volgende' om door te gaan.",
      position: "center",
      nextPage: "Income",
      navigateOnNext: true
    }
  ],
  Income: [
    {
      target: null,
      title: "💰 Inkomsten Pagina",
      content: "Hier beheer je al je inkomsten - zowel vast salaris als extra bijverdiensten.",
      position: "center"
    },
    {
      target: '[data-tour="add-income"]',
      title: "➕ Inkomen Toevoegen",
      content: "Klik hier om nieuw inkomen toe te voegen. Je kunt kiezen tussen vast (maandelijks) of extra (eenmalig) inkomen.",
      position: "bottom-end"
    },
    {
      target: '[data-tour="income-list"]',
      title: "📋 Je Inkomsten",
      content: "Hier zie je een overzicht van al je inkomstenbronnen. Je kunt ze bewerken of verwijderen.",
      position: "top"
    },
    {
      target: null,
      title: "Door naar Vaste Lasten! 📝",
      content: "Nu gaan we je vaste lasten bekijken.",
      position: "center",
      nextPage: "MaandelijkseLasten",
      navigateOnNext: true
    }
  ],
  MaandelijkseLasten: [
    {
      target: null,
      title: "🏠 Vaste Lasten Pagina",
      content: "Hier registreer je al je maandelijkse vaste kosten zoals huur, energie en verzekeringen.",
      position: "center"
    },
    {
      target: '[data-tour="add-cost"]',
      title: "➕ Vaste Last Toevoegen",
      content: "Voeg hier nieuwe vaste lasten toe. Vergeet niet de betaaldatum in te vullen!",
      position: "bottom-end"
    },
    {
      target: '[data-tour="costs-categories"]',
      title: "📊 Kosten Overzicht",
      content: "Hier zie je al je vaste lasten per categorie gegroepeerd.",
      position: "top"
    },
    {
      target: null,
      title: "Nu naar Potjes! 🏺",
      content: "Nu gaan we je potjes bekijken - dit is de enveloppe-methode voor je budget.",
      position: "center",
      nextPage: "Potjes",
      navigateOnNext: true
    }
  ],
  Potjes: [
    {
      target: null,
      title: "🏺 Potjes Pagina",
      content: "Hier verdeel je je beschikbare budget over verschillende categorieën - zoals een digitale enveloppe-methode.",
      position: "center"
    },
    {
      target: '[data-tour="add-pot"]',
      title: "➕ Potje Toevoegen",
      content: "Maak een nieuw potje aan voor een specifieke uitgavencategorie of spaardoel.",
      position: "bottom-start"
    },
    {
      target: '[data-tour="pots-overview"]',
      title: "📊 Potjes Overzicht",
      content: "Hier zie je al je potjes met budget en uitgaven. De voortgangsbalk laat zien hoeveel je al hebt uitgegeven.",
      position: "top-start"
    },
    {
      target: null,
      title: "Nu naar Schulden! 💳",
      content: "Als laatste bekijken we de schuldenpagina.",
      position: "center",
      nextPage: "Debts",
      navigateOnNext: true
    }
  ],
  Debts: [
    {
      target: null,
      title: "💳 Betaalachterstanden",
      content: "Hier beheer je eventuele schulden en betalingsregelingen.",
      position: "center"
    },
    {
      target: '[data-tour="add-debt"]',
      title: "➕ Schuld Toevoegen",
      content: "Voeg hier schulden toe. Je kunt ook persoonlijke leningen registreren.",
      position: "bottom-start"
    },
    {
      target: '[data-tour="debt-list"]',
      title: "📋 Schulden Overzicht",
      content: "Hier zie je al je schulden met status en voortgang van afbetaling.",
      position: "top-start"
    },
    {
      target: null,
      title: "🎉 Onboarding Voltooid!",
      content: "Je bent helemaal klaar! Gebruik de help-knop (?) op elke pagina om de uitleg opnieuw te zien.",
      position: "center",
      isLast: true
    }
  ],

  BudgetPlan: [
    {
      target: null,
      title: "📊 Budgetplan",
      content: "Hier krijg je een compleet overzicht van je financiën en kun je je budget plannen.",
      position: "center"
    },
    {
      target: '[data-tour="budget-tabs"]',
      title: "📑 Verschillende Weergaves",
      content: "Wissel tussen Overzicht, Verdelen, Voortgang en Historie om je budget te beheren.",
      position: "bottom"
    }
  ],
  CentVoorCent: [
    {
      target: null,
      title: "💰 Cent voor Cent",
      content: "Hier zie je gedetailleerde analyses van je uitgaven en krijg je inzichten om te besparen.",
      position: "center"
    }
  ]
};

// Highlight component voor target elementen
const Spotlight = ({ targetRect }) => {
  if (!targetRect) return null;
  
  const padding = 8;
  
  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={targetRect.left - padding} 
              y={targetRect.top - padding} 
              width={targetRect.width + padding * 2} 
              height={targetRect.height + padding * 2} 
              rx="8"
              fill="black" 
            />
          </mask>
        </defs>
        <rect 
          x="0" y="0" 
          width="100%" height="100%" 
          fill="rgba(0,0,0,0.7)" 
          mask="url(#spotlight-mask)" 
        />
      </svg>
      
      {/* Highlight ring */}
      <div 
        className="absolute border-2 border-[var(--konsensi-accent)] rounded-lg animate-pulse"
        style={{
          left: targetRect.left - padding,
          top: targetRect.top - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          boxShadow: '0 0 20px var(--konsensi-accent)'
        }}
      />
    </div>
  );
};

// Tooltip component
const TourTooltip = ({ step, stepIndex, totalSteps, targetRect, onNext, onPrev, onClose, onComplete }) => {
  // Voor center positie of geen target: gebruik flexbox centering
  const isCentered = step.position === 'center' || !targetRect;
  
  const tooltipWidth = 300; // max width van tooltip
  const tooltipHeight = 200; // geschatte hoogte
  const padding = 12;
  const safeMargin = 24; // grotere marge van schermrand
  
  const getPosition = () => {
    if (isCentered) {
      return {}; // Geen inline positioning nodig, flexbox handelt dit af
    }
    
    let top, left;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Bereken de ideale positie - standaard links van target als er weinig ruimte rechts is
    const spaceRight = viewportWidth - targetRect.right;
    const spaceLeft = targetRect.left;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    
    // Bepaal beste positie automatisch als tooltip niet past
    let actualPosition = step.position;
    
    // Check of er genoeg ruimte is voor de gevraagde positie
    if (step.position === 'bottom' && spaceBelow < tooltipHeight + padding + safeMargin) {
      actualPosition = spaceAbove > spaceBelow ? 'top' : 'left';
    }
    if (step.position === 'top' && spaceAbove < tooltipHeight + padding + safeMargin) {
      actualPosition = spaceBelow > spaceAbove ? 'bottom' : 'left';
    }
    if (step.position === 'right' && spaceRight < tooltipWidth + padding + safeMargin) {
      actualPosition = spaceLeft > tooltipWidth ? 'left' : 'bottom';
    }
    if (step.position === 'left' && spaceLeft < tooltipWidth + padding + safeMargin) {
      actualPosition = spaceRight > tooltipWidth ? 'right' : 'bottom';
    }
    
    // Bereken positie gebaseerd op de werkelijke positie
    switch (actualPosition) {
      case 'bottom':
        top = targetRect.bottom + padding;
        left = Math.max(safeMargin, Math.min(targetRect.left, viewportWidth - tooltipWidth - safeMargin));
        break;
      case 'top':
        top = targetRect.top - padding - tooltipHeight;
        left = Math.max(safeMargin, Math.min(targetRect.left, viewportWidth - tooltipWidth - safeMargin));
        break;
      case 'left':
        top = Math.max(safeMargin, Math.min(targetRect.top, viewportHeight - tooltipHeight - safeMargin));
        left = Math.max(safeMargin, targetRect.left - padding - tooltipWidth);
        break;
      case 'right':
        top = Math.max(safeMargin, Math.min(targetRect.top, viewportHeight - tooltipHeight - safeMargin));
        left = Math.min(targetRect.right + padding, viewportWidth - tooltipWidth - safeMargin);
        break;
      default:
        top = targetRect.bottom + padding;
        left = Math.max(safeMargin, Math.min(targetRect.left, viewportWidth - tooltipWidth - safeMargin));
    }
    
    // Extra veiligheid: forceer binnen viewport
    top = Math.max(safeMargin, Math.min(top, viewportHeight - tooltipHeight - safeMargin));
    left = Math.max(safeMargin, Math.min(left, viewportWidth - tooltipWidth - safeMargin));
    
    return { 
      top, 
      left,
      transform: 'none'
    };
  };
  
  const position = getPosition();
  
  // Centered tooltip wrapper
  if (isCentered) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          {/* Progress dots */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex 
                    ? 'w-6 bg-[var(--konsensi-primary)]' 
                    : i < stepIndex 
                      ? 'w-1.5 bg-[var(--konsensi-primary)]' 
                      : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          {/* Content */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600 mb-6">{step.content}</p>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {stepIndex + 1} / {totalSteps}
            </div>
            
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Terug
                </Button>
              )}
              
              {step.isLast ? (
                <Button 
                  size="sm" 
                  onClick={onComplete}
                  className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Afronden
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={onNext}
                  className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
                >
                  Volgende
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-[9999] bg-white rounded-2xl shadow-2xl p-4"
      style={{
        top: position.top,
        left: position.left,
        width: 300,
        maxWidth: 'calc(100vw - 48px)'
      }}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>
      
      {/* Progress dots */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === stepIndex 
                ? 'w-6 bg-[var(--konsensi-primary)]' 
                : i < stepIndex 
                  ? 'w-1.5 bg-[var(--konsensi-primary)]' 
                  : 'w-1.5 bg-gray-200'
            }`}
          />
        ))}
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
      <p className="text-gray-600 mb-6">{step.content}</p>
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {stepIndex + 1} / {totalSteps}
        </div>
        
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <Button variant="outline" size="sm" onClick={onPrev}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Terug
            </Button>
          )}
          
          {step.isLast ? (
            <Button 
              size="sm" 
              onClick={onComplete}
              className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
            >
              <Check className="w-4 h-4 mr-1" />
              Afronden
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={onNext}
              className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
            >
              Volgende
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main Tour Component
export default function InteractiveTour({ 
  pageName, 
  isOpen, 
  onClose, 
  isFullOnboarding = false,
  onComplete 
}) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  
  const steps = TOUR_STEPS[pageName] || [];
  const step = steps[currentStep];
  
  // Find and measure target element
  useEffect(() => {
    if (!isOpen || !step?.target) {
      setTargetRect(null);
      return;
    }
    
    const findTarget = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };
    
    // Initial find
    findTarget();
    
    // Re-find on resize/scroll
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);
    
    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget);
    };
  }, [isOpen, step, currentStep]);
  
  const handleNext = useCallback(() => {
    if (step?.nextPage && (isFullOnboarding || step?.navigateOnNext)) {
      // Navigate to next page
      navigate(createPageUrl(step.nextPage));
      setCurrentStep(0);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length, step, isFullOnboarding, navigate]);
  
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const handleComplete = useCallback(() => {
    setCurrentStep(0);
    onClose();
    if (onComplete) onComplete();
  }, [onClose, onComplete]);
  
  const handleClose = useCallback(() => {
    setCurrentStep(0);
    onClose();
  }, [onClose]);
  
  if (!isOpen || !step) return null;
  
  return createPortal(
    <AnimatePresence>
      {/* Dark overlay for center modals */}
      {(!step.target || step.position === 'center') && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9997] bg-black/70"
          onClick={handleClose}
        />
      )}
      
      {/* Spotlight for targeted elements */}
      {step.target && step.position !== 'center' && (
        <Spotlight targetRect={targetRect} />
      )}
      
      {/* Tooltip */}
      <TourTooltip 
        step={step}
        stepIndex={currentStep}
        totalSteps={steps.length}
        targetRect={targetRect}
        onNext={handleNext}
        onPrev={handlePrev}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    </AnimatePresence>,
    document.body
  );
}

// Export tour steps voor gebruik in andere componenten
export { TOUR_STEPS };