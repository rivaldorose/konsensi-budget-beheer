import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function AdempauzeWidget({ user, completedSteps = 0, totalSteps = 3 }) {
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  const getNextStep = () => {
    if (completedSteps === 0) return "Communiceer met schuldeisers";
    if (completedSteps === 1) return "Zoek professionele hulp";
    if (completedSteps === 2) return "Focus op inkomen";
    return "Alle stappen voltooid! 🎉";
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">💚 Adempauze actief</h3>
            
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm text-gray-700 mb-1">
                <span>{completedSteps} van {totalSteps} stappen voltooid</span>
                <span className="font-semibold text-green-600">{progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            {completedSteps < totalSteps && (
              <p className="text-sm text-gray-700 mb-3">
                <strong>Volgende stap:</strong> {getNextStep()}
              </p>
            )}
            
            {completedSteps === totalSteps && (
              <p className="text-sm text-green-700 font-medium mb-3">
                ✅ Je hebt alle stappen voltooid! Goed bezig 💪
              </p>
            )}
            
            <Button 
              onClick={() => window.location.href = createPageUrl('Adempauze')}
              size="sm"
              className="w-full bg-green-500 hover:bg-green-600"
            >
              Open Adempauze
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}