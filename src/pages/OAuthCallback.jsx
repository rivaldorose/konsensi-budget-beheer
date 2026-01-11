import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // Determine provider from URL path
      const isGoogle = location.pathname.includes("/google/");
      const isMicrosoft = location.pathname.includes("/microsoft/");

      const providerName = isGoogle ? "Google" : isMicrosoft ? "Microsoft" : "Unknown";
      setProvider(providerName);

      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const state = searchParams.get("state");

      // Handle error from OAuth provider
      if (error) {
        setStatus("error");
        setMessage(error === "access_denied"
          ? "Je hebt de toegang geweigerd. Sluit dit venster en probeer opnieuw."
          : `Er is een fout opgetreden: ${error}`
        );

        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage({
            type: isGoogle ? "google-oauth-error" : "microsoft-oauth-error",
            error: error
          }, window.location.origin);
        }
        return;
      }

      // No authorization code
      if (!code) {
        setStatus("error");
        setMessage("Geen autorisatiecode ontvangen. Probeer opnieuw.");
        return;
      }

      try {
        // Parse state to get return URL
        let returnUrl = "/NotificationSettings";
        if (state) {
          try {
            const stateData = JSON.parse(atob(state));
            returnUrl = stateData.returnUrl || returnUrl;
          } catch (e) {
            console.warn("Could not parse state:", e);
          }
        }

        // For now, we'll just notify the parent window of success
        // In a production app, you would exchange the code for tokens via a backend
        // The backend would:
        // 1. Exchange the authorization code for access/refresh tokens
        // 2. Get user email from the token
        // 3. Store tokens securely in the database

        // Simulate token exchange success
        // In production, replace this with actual API call to your backend
        const email = isGoogle ? "Google Calendar" : "Microsoft Calendar";

        setStatus("success");
        setMessage(`${providerName} Calendar is succesvol gekoppeld!`);

        // Notify parent window of success
        if (window.opener) {
          window.opener.postMessage({
            type: isGoogle ? "google-oauth-success" : "microsoft-oauth-success",
            email: email,
            code: code // The parent can use this to exchange for tokens if needed
          }, window.location.origin);

          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1500);
        }

      } catch (err) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setMessage("Er is een fout opgetreden bij het koppelen. Probeer opnieuw.");

        if (window.opener) {
          window.opener.postMessage({
            type: isGoogle ? "google-oauth-error" : "microsoft-oauth-error",
            error: err.message
          }, window.location.origin);
        }
      }
    };

    handleCallback();
  }, [location.pathname, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2a2a2a] p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <Loader2 className="w-12 h-12 text-konsensi-green mx-auto animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {provider} Calendar koppelen...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Even geduld terwijl we je kalender koppelen.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Succesvol gekoppeld!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {message}
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              Dit venster sluit automatisch...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Koppeling mislukt
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {message}
            </p>
            <button
              onClick={() => window.close()}
              className="px-6 py-2 bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
            >
              Venster sluiten
            </button>
          </>
        )}
      </div>
    </div>
  );
}
