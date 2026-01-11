import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import InteractiveTour from './InteractiveTour';
import { User } from '@/api/entities';

const TourContext = createContext();

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

export default function TourProvider({ children }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullOnboarding, setIsFullOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  
  // Bepaal huidige pagina naam uit URL
  useEffect(() => {
    const path = location.pathname;
    // Extract page name from path
    let pageName = path.split('/').pop() || 'Dashboard';
    
    // Capitalize first letter to match TOUR_STEPS keys
    if (pageName) {
      pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }
    
    setCurrentPage(pageName);
  }, [location.pathname]);
  
  // Start volledige onboarding tour (alle pagina's)
  const startFullOnboarding = useCallback(async () => {
    setIsFullOnboarding(true);
    setIsOpen(true);
  }, []);
  
  // Start tour voor alleen de huidige pagina
  const startPageTour = useCallback((pageName) => {
    // Normalize page name - capitalize first letter
    let normalizedName = pageName || currentPage;
    if (normalizedName) {
      normalizedName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1).toLowerCase();
    }
    setCurrentPage(normalizedName);
    setIsFullOnboarding(false);
    setIsOpen(true);
  }, [currentPage]);
  
  const closeTour = useCallback(() => {
    setIsOpen(false);
    setIsFullOnboarding(false);
  }, []);
  
  const completeTour = useCallback(async () => {
    setIsOpen(false);
    setIsFullOnboarding(false);
    
    // Markeer onboarding als voltooid
    try {
      await User.updateMe({ 
        onboarding_completed: true,
        onboarding_tour_completed: true 
      });
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
    }
  }, []);
  
  const value = {
    isOpen,
    isFullOnboarding,
    currentPage,
    startFullOnboarding,
    startPageTour,
    closeTour
  };
  
  return (
    <TourContext.Provider value={value}>
      {children}
      <InteractiveTour 
        pageName={currentPage}
        isOpen={isOpen}
        onClose={closeTour}
        isFullOnboarding={isFullOnboarding}
        onComplete={completeTour}
      />
    </TourContext.Provider>
  );
}