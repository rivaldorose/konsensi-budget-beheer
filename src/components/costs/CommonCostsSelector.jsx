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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCosts, setSelectedCosts] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});

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
    setSelectedCategory(null);
  };

  const groupedCosts = COMMON_COSTS.reduce((acc, cost) => {
    if (!acc[cost.category]) acc[cost.category] = [];
    acc[cost.category].push(cost);
    return acc;
  }, {});

  const categories = [
    { key: 'wonen', label: '🏠', name: 'Wonen' },
    { key: 'utilities', label: '⚡', name: 'Nutsvoorzieningen' },
    { key: 'verzekeringen', label: '🛡️', name: 'Verzekeringen' },
    { key: 'abonnementen', label: '📱', name: 'Abonnementen' },
    { key: 'streaming_diensten', label: '📺', name: 'Streaming' },
    { key: 'vervoer', label: '🚗', name: 'Vervoer' },
    { key: 'bankkosten', label: '🏦', name: 'Bank' },
    { key: 'other', label: '🧩', name: 'Overig' },
  ];

  // If category selected, show costs for that category
  if (selectedCategory) {
    const categoryCosts = groupedCosts[selectedCategory] || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-gray-400 dark:text-[#9CA3AF] hover:text-primary dark:hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h4 className="text-lg font-display font-bold text-primary-dark dark:text-primary">
            {CATEGORY_LABELS[selectedCategory]}
          </h4>
        </div>

        <div className="space-y-3">
          {categoryCosts.map((cost) => {
            const isSelected = selectedCosts.some(c => c.name === cost.name);
            const alreadyExists = existingNames.includes(cost.name.toLowerCase());

            return (
              <div
                key={cost.name}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  alreadyExists
                    ? 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] opacity-50'
                    : isSelected
                    ? 'bg-[#ecf4e6] dark:bg-primary/20 border-[#B2FF78] dark:border-primary'
                    : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:border-[#B2FF78] dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cost.icon}</span>
                  <div>
                    <p className="font-bold text-primary-dark dark:text-white">{cost.name}</p>
                    <p className="text-xs text-gray-500 dark:text-[#a1a1a1]">Gemiddeld: {cost.avgAmount}€/maand</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isSelected && !alreadyExists && (
                    <Input
                      type="number"
                      step="0.01"
                      value={customAmounts[cost.name] ?? cost.avgAmount}
                      onChange={(e) => updateAmount(cost.name, e.target.value)}
                      className="w-24 h-10 text-right bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                      placeholder={cost.avgAmount.toString()}
                    />
                  )}
                  <button
                    onClick={() => !alreadyExists && toggleCost(cost)}
                    disabled={alreadyExists}
                    className={`size-10 rounded-full flex items-center justify-center transition-colors ${
                      alreadyExists
                        ? 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-400 dark:text-[#6B7280] cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#B2FF78] dark:bg-primary text-primary-dark dark:text-[#0a0a0a]'
                        : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-[#9CA3AF] hover:bg-[#B2FF78] dark:hover:bg-primary'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCosts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-700 dark:text-white">
                Geselecteerd: {selectedCosts.length} vaste lasten
              </p>
              <p className="text-sm text-gray-600 dark:text-[#a1a1a1]">
                Totaal: <span className="font-bold text-primary-dark dark:text-primary">
                  €{selectedCosts.reduce((sum, c) => sum + (c.amount || 0), 0).toFixed(2)}
                </span>
              </p>
            </div>
            <button
              onClick={handleConfirm}
              className="w-full bg-primary-dark dark:bg-primary text-white dark:text-[#0a0a0a] font-bold py-3 rounded-xl hover:bg-opacity-90 shadow-soft hover:shadow-lg transition-all"
            >
              {selectedCosts.length} vaste lasten toevoegen
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show category grid
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {categories.map((category) => (
        <button
          key={category.key}
          onClick={() => setSelectedCategory(category.key)}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] hover:bg-[#ecf4e6] dark:hover:bg-primary/20 hover:text-primary-dark dark:hover:text-primary text-gray-700 dark:text-white font-bold text-sm transition-colors border border-transparent hover:border-[#B2FF78] dark:hover:border-primary"
        >
          <span className="text-2xl">{category.label}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
}