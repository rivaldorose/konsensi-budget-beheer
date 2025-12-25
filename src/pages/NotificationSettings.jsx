import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotificationRulesManager from "@/components/notifications/NotificationRulesManager";
import { Bell, Info } from "lucide-react";

export default function NotificationSettings() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-8 h-8 text-green-600" />
          Notificatie-instellingen
        </h1>
        <p className="text-gray-600 mt-2">
          Bepaal wanneer en hoe je op de hoogte gehouden wilt worden van je betaalachterstanden
        </p>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Hoe werkt het?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">1.</span>
                  <span><strong>Stel regels in:</strong> Bepaal voor welke situaties je notificaties wilt (bijv. 7 dagen voor een betalingstermijn)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">2.</span>
                  <span><strong>Kies kanalen:</strong> Ontvang notificaties in de app en/of via e-mail</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">3.</span>
                  <span><strong>AI prioriteert:</strong> De meest urgente notificaties worden automatisch als eerste getoond</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">4.</span>
                  <span><strong>Blijf op de hoogte:</strong> Mis nooit meer een belangrijke deadline of actie</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <NotificationRulesManager />
    </div>
  );
}