import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/components/utils/LanguageContext';
import { FAQ as FAQEntity } from '@/api/entities';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function FAQPage() {
  const { t, language } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await FAQEntity.list('-volgorde', 100);
        setFaqs(data);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const getLocalizedField = (item, field) => {
    return item[`${field}_${language}`] || item[`${field}_nl`];
  };

  // NIEUWE FILTER: Verwijder items zonder vraag OF antwoord
  const filteredFaqs = faqs.filter(faq => {
    const question = getLocalizedField(faq, 'vraag');
    const answer = getLocalizedField(faq, 'antwoord');
    
    // Skip als geen vraag of geen antwoord
    if (!question || !answer || question.trim() === '' || answer.trim() === '') {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const questionLower = question.toLowerCase();
      const answerLower = answer.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return questionLower.includes(searchLower) || answerLower.includes(searchLower);
    }
    
    return true;
  });

  // Group by category en remove duplicates
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const category = faq.categorie || 'algemeen';
    const question = getLocalizedField(faq, 'vraag');
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    // Check for duplicates binnen deze categorie
    const isDuplicate = acc[category].some(existingFaq => 
      getLocalizedField(existingFaq, 'vraag') === question
    );
    
    if (!isDuplicate) {
      acc[category].push(faq);
    }
    
    return acc;
  }, {});

  const categoryTranslations = {
    algemeen: t('faq.category.general'),
    schulden: t('faq.category.debts'),
    budget: t('faq.category.budget'),
    technisch: t('faq.category.technical'),
    beveiliging: t('faq.category.security'),
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => window.location.href = createPageUrl('GetHelp')}>
          <ChevronLeft className="w-5 h-5"/>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('help.faqTitle')}</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder={t('faq.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      ) : Object.keys(groupedFaqs).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedFaqs).map(([category, items], categoryIndex) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#4CAF50]">
                {categoryTranslations[category] || category}
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {items.map((faq, index) => {
                  const question = getLocalizedField(faq, 'vraag');
                  const answer = getLocalizedField(faq, 'antwoord');
                  
                  return (
                    <AccordionItem 
                      key={`${faq.id}-${index}`} 
                      value={`${category}-${faq.id}-${index}`}
                      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="text-left text-base font-semibold text-gray-800 hover:no-underline px-4 py-4">
                        {question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-gray-600 leading-relaxed">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: answer }} 
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600">{t('faq.noResults')}</p>
        </div>
      )}
    </div>
  );
}