import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COMMON_COSTS = [
  // Wonen
  { name: 'Huur', category: 'wonen', icon: '🏠', avgAmount: 800, popular: true },
  { name: 'Hypotheek', category: 'wonen', icon: '🏡', avgAmount: 1200 },
  { name: 'Servicekosten', category: 'wonen', icon: '🔧', avgAmount: 100 },
  
  // Nutsvoorzieningen
  { name: 'Energie (Gas & Stroom)', category: 'utilities', icon: '⚡', avgAmount: 150, popular: true },
  { name: 'Water', category: 'utilities', icon: '💧', avgAmount: 40 },
  { name: 'Afvalstoffenheffing', category: 'utilities', icon: '🗑️', avgAmount: 25 },
  
  // Verzekeringen
  { name: 'Zorgverzekering', category: 'verzekeringen', icon: '🏥', avgAmount: 130, popular: true },
  { name: 'Aansprakelijkheidsverzekering', category: 'verzekeringen', icon: '🛡️', avgAmount: 5 },
  { name: 'Inboedelverzekering', category: 'verzekeringen', icon: '🏠', avgAmount: 15 },
  { name: 'Autoverzekering', category: 'verzekeringen', icon: '🚗', avgAmount: 80 },
  { name: 'Reisverzekering', category: 'verzekeringen', icon: '✈️', avgAmount: 10 },
  
  // Abonnementen
  { name: 'Telefoon abonnement', category: 'abonnementen', icon: '📱', avgAmount: 25, popular: true },
  { name: 'Internet', category: 'abonnementen', icon: '🌐', avgAmount: 45, popular: true },
  { name: 'TV pakket', category: 'abonnementen', icon: '📺', avgAmount: 20 },
  
  // Streaming
  { name: 'Netflix', category: 'streaming_diensten', icon: '🎬', avgAmount: 13, popular: true },
  { name: 'Spotify', category: 'streaming_diensten', icon: '🎵', avgAmount: 10 },
  { name: 'Disney+', category: 'streaming_diensten', icon: '🏰', avgAmount: 9 },
  { name: 'Videoland', category: 'streaming_diensten', icon: '📺', avgAmount: 10 },
  { name: 'Amazon Prime', category: 'streaming_diensten', icon: '📦', avgAmount: 5 },
  { name: 'HBO Max', category: 'streaming_diensten', icon: '🎥', avgAmount: 10 },
  
  // Vervoer
  { name: 'OV-chipkaart / NS', category: 'vervoer', icon: '🚆', avgAmount: 100 },
  { name: 'Benzine / Tanken', category: 'vervoer', icon: '⛽', avgAmount: 150 },
  { name: 'Wegenbelasting', category: 'vervoer', icon: '🚗', avgAmount: 50 },
  { name: 'Parkeervergunning', category: 'vervoer', icon: '🅿️', avgAmount: 60 },
  
  // Bankkosten
  { name: 'Bankrekening', category: 'bankkosten', icon: '🏦', avgAmount: 5 },
  { name: 'Creditcard', category: 'bankkosten', icon: '💳', avgAmount: 3 },
  
  // Overig
  { name: 'Sportschool', category: 'other', icon: '💪', avgAmount: 30 },
  { name: 'Kinderopvang', category: 'other', icon: '👶', avgAmount: 500 },
  { name: 'Huisdier verzorging', category: 'other', icon: '🐕', avgAmount: 50 },
  { name: 'Contributie (vereniging)', category: 'other', icon: '⚽', avgAmount: 20 },
];

const CATEGORY_LABELS = {
  wonen: '🏠 Wonen',
  utilities: '⚡ Nutsvoorzieningen',
  verzekeringen: '🛡️ Verzekeringen',
  abonnementen: '📱 Abonnementen',
  streaming_diensten: '📺 Streaming',
  vervoer: '🚗 Vervoer',
  bankkosten: '🏦 Bank',
  other: '📦 Overig'
};

export default function CommonCostsSelector({ onSelect, existingCosts = [] }) {
  const [selectedCosts, setSelectedCosts] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
  const [showAll, setShowAll] = useState(false);

  const existingNames = existingCosts.map(c => c.name?.toLowerCase());
  
  const toggleCost = (cost) => {
    const isSelected = selectedCosts.some(c => c.name === cost.name);
    if (isSelected) {
      setSelectedCosts(prev => prev.filter(c => c.name !== cost.name));
    } else {
      setSelectedCosts(prev => [...prev, { 
        ...cost, 
        amount: customAmounts[cost.name] || cost.avgAmount 
      }]);
    }
  };

  const updateAmount = (costName, amount) => {
    setCustomAmounts(prev => ({ ...prev, [costName]: parseFloat(amount) || 0 }));
    setSelectedCosts(prev => prev.map(c => 
      c.name === costName ? { ...c, amount: parseFloat(amount) || 0 } : c
    ));
  };

  const handleConfirm = () => {
    onSelect(selectedCosts);
    setSelectedCosts([]);
    setCustomAmounts({});
  };

  const groupedCosts = COMMON_COSTS.reduce((acc, cost) => {
    if (!acc[cost.category]) acc[cost.category] = [];
    acc[cost.category].push(cost);
    return acc;
  }, {});

  const popularCosts = COMMON_COSTS.filter(c => c.popular);

  return (
    <div className="space-y-4">
        {/* Popular / Quick Select */}
        {!showAll && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Meest gekozen</p>
            <div className="flex flex-wrap gap-2">
              {popularCosts.map((cost) => {
                const isSelected = selectedCosts.some(c => c.name === cost.name);
                const alreadyExists = existingNames.includes(cost.name.toLowerCase());
                
                return (
                  <button
                    key={cost.name}
                    onClick={() => !alreadyExists && toggleCost(cost)}
                    disabled={alreadyExists}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                      alreadyExists 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span>{cost.icon}</span>
                    <span>{cost.name}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                    {alreadyExists && <span className="text-xs">(al toegevoegd)</span>}
                  </button>
                );
              })}
            </div>
            
            <Button 
              variant="link" 
              onClick={() => setShowAll(true)}
              className="text-blue-600 p-0 h-auto"
            >
              Bekijk alle categorieën →
            </Button>
          </div>
        )}

        {/* All Categories */}
        {showAll && (
          <div className="space-y-4">
            <Button 
              variant="link" 
              onClick={() => setShowAll(false)}
              className="text-blue-600 p-0 h-auto"
            >
              ← Terug naar populaire keuzes
            </Button>
            
            {Object.entries(groupedCosts).map(([category, costs]) => (
              <div key={category} className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {CATEGORY_LABELS[category]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {costs.map((cost) => {
                    const isSelected = selectedCosts.some(c => c.name === cost.name);
                    const alreadyExists = existingNames.includes(cost.name.toLowerCase());
                    
                    return (
                      <button
                        key={cost.name}
                        onClick={() => !alreadyExists && toggleCost(cost)}
                        disabled={alreadyExists}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                          alreadyExists 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span>{cost.icon}</span>
                        <span>{cost.name}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Items with Amount Input */}
        <AnimatePresence>
          {selectedCosts.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 pt-4 border-t border-gray-200"
            >
              <p className="text-sm font-medium text-gray-700">
                Geselecteerd ({selectedCosts.length})
              </p>
              
              <div className="space-y-2">
                {selectedCosts.map((cost) => (
                  <div 
                    key={cost.name}
                    className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200"
                  >
                    <span className="text-lg">{cost.icon}</span>
                    <span className="flex-1 text-sm font-medium">{cost.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">€</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={customAmounts[cost.name] ?? cost.avgAmount}
                        onChange={(e) => updateAmount(cost.name, e.target.value)}
                        className="w-24 h-8 text-right"
                      />
                      <button
                        onClick={() => toggleCost(cost)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-gray-600">
                  Totaal: <span className="font-bold">€{selectedCosts.reduce((sum, c) => sum + (c.amount || 0), 0).toFixed(2)}</span>
                </div>
                <Button 
                  onClick={handleConfirm}
                  className="bg-[#386641] hover:bg-[#2A4B30]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {selectedCosts.length} vaste lasten toevoegen
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}