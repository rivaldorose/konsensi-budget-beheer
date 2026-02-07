import React, { Suspense } from "react";
import Layout from "./Layout.jsx";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// Loading fallback component - minimal branded loader to prevent flash
const LoadingFallback = () => {
    // Apply dark mode class immediately based on localStorage/system preference
    React.useEffect(() => {
        const saved = localStorage.getItem('theme');
        const isDark = saved !== null ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f0f0f] flex items-center justify-center">
            <div className="text-center">
                {/* Konsensi logo/brand mark */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                {/* Simple pulse animation instead of spinner */}
                <div className="flex justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

// Helper: retry dynamic import with auto-reload on chunk load failure
// This handles the case where a new deployment changes chunk hashes
// and users with stale tabs try to load old (now deleted) chunks
const lazyWithRetry = (importFn) => {
    return React.lazy(() =>
        importFn().catch((error) => {
            // Only auto-reload for chunk load failures, not other errors
            if (
                error.message?.includes('Failed to fetch dynamically imported module') ||
                error.message?.includes('Loading chunk') ||
                error.message?.includes('Loading CSS chunk')
            ) {
                const hasReloaded = sessionStorage.getItem('chunk_reload');
                if (!hasReloaded) {
                    sessionStorage.setItem('chunk_reload', '1');
                    window.location.reload();
                    return { default: () => null };
                }
                // Already tried reloading once, clear flag and let error boundary handle it
                sessionStorage.removeItem('chunk_reload');
            }
            throw error;
        })
    );
};

// Clear the reload flag on successful page load
if (sessionStorage.getItem('chunk_reload')) {
    sessionStorage.removeItem('chunk_reload');
}

// Lazy load large feature pages for code splitting
const Dashboard = lazyWithRetry(() => import("./Dashboard"));
const Debts = lazyWithRetry(() => import("./Debts"));
const CentVoorCent = lazyWithRetry(() => import("./CentVoorCent"));
const CentVoorCentArchief = lazyWithRetry(() => import("./CentVoorCentArchief"));
const VTLBCalculator = lazyWithRetry(() => import("./VTLBCalculator"));
const OnboardingNew = lazyWithRetry(() => import("./OnboardingNew"));
const Potjes = lazyWithRetry(() => import("./Potjes"));
const BudgetPlan = lazyWithRetry(() => import("./BudgetPlan"));
const Income = lazyWithRetry(() => import("./Income"));
const MaandelijkseLasten = lazyWithRetry(() => import("./MaandelijkseLasten"));
const VasteLastenCheck = lazyWithRetry(() => import("./VasteLastenCheck"));
const WorkSchedule = lazyWithRetry(() => import("./WorkSchedule"));
const Adempauze = lazyWithRetry(() => import("./Adempauze"));
const AdempauzeCalculator = lazyWithRetry(() => import("./AdempauzeCalculator"));
const Wishlist = lazyWithRetry(() => import("./Wishlist"));
const BudgetHelp = lazyWithRetry(() => import("./BudgetHelp"));
const CoachChat = lazyWithRetry(() => import("./CoachChat"));
const VideoCall = lazyWithRetry(() => import("./VideoCall"));

// Keep smaller/frequently accessed pages static
import TermsOfService from "./TermsOfService";
import PrivacyPolicy from "./PrivacyPolicy";
import Settings from "./Settings";
import FAQ from "./FAQ";
import NotificationSettings from "./NotificationSettings";
import SecuritySettings from "./SecuritySettings";
import DisplaySettings from "./DisplaySettings";
import VTLBSettings from "./VTLBSettings";
import GamificationSettings from "./GamificationSettings";
import Feedback from "./Feedback";
import HelpSupport from "./HelpSupport";
import FAQSettings from "./FAQSettings";
import Notifications from "./Notifications";
import NotificationDetail from "./NotificationDetail";
import Login from "./Login";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import EmailSent from "./EmailSent";
import ResetPassword from "./ResetPassword";
import PasswordSaved from "./PasswordSaved";
import NotFound from "./NotFound";
import Maintenance from "./Maintenance";
import OAuthCallback from "./OAuthCallback";

// Note: These pages are lazy loaded and not included in PAGES object
const PAGES = {
    Settings: Settings,
    FAQ: FAQ,
    NotificationSettings: NotificationSettings,
    SecuritySettings: SecuritySettings,
    DisplaySettings: DisplaySettings,
    VTLBSettings: VTLBSettings,
    GamificationSettings: GamificationSettings,
    Feedback: Feedback,
    HelpSupport: HelpSupport,
    FAQSettings: FAQSettings,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    // If empty (root URL), return Dashboard
    if (!urlLastPart || urlLastPart === '') {
        return 'Dashboard';
    }

    // Check for explicit Dashboard route
    if (urlLastPart.toLowerCase() === 'dashboard') {
        return 'Dashboard';
    }

    // Check for lazy loaded pages
    // Handle sub-routes that should map to parent page name
    const subRouteMap = { 'samenvatting': 'CentVoorCent' };
    const urlParts = url.split('/').filter(Boolean);
    if (urlParts.length >= 2 && subRouteMap[urlParts[urlParts.length - 1].toLowerCase()]) {
        return subRouteMap[urlParts[urlParts.length - 1].toLowerCase()];
    }

    const lazyPages = ['debts', 'centvoorcent', 'centvoorcentarchief', 'vtlbcalculator', 'potjes', 'budgetplan', 'budgethelp', 'income', 'maandelijkselasten', 'vastelastencheck', 'workschedule', 'adempauze', 'adempauzecalculator', 'wishlist', 'coachchat', 'videocall'];
    if (lazyPages.includes(urlLastPart.toLowerCase())) {
        return urlLastPart.charAt(0).toUpperCase() + urlLastPart.slice(1);
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Dashboard';
}

// Wrapper for lazy loaded routes
const LazyRoute = ({ component: Component }) => (
    <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
            <Component />
        </Suspense>
    </ErrorBoundary>
);

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                {/* Auth pages - keep static for fast initial load */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/email-sent" element={<EmailSent />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/password-saved" element={<PasswordSaved />} />

                {/* Main app pages - lazy loaded */}
                <Route path="/" element={<LazyRoute component={Dashboard} />} />
                <Route path="/Dashboard" element={<LazyRoute component={Dashboard} />} />
                <Route path="/debts" element={<LazyRoute component={Debts} />} />
                <Route path="/CentVoorCent" element={<LazyRoute component={CentVoorCentArchief} />} />
                <Route path="/CentVoorCent/samenvatting" element={<LazyRoute component={CentVoorCent} />} />
                <Route path="/CentVoorCentArchief" element={<LazyRoute component={CentVoorCentArchief} />} />
                <Route path="/VTLBCalculator" element={<LazyRoute component={VTLBCalculator} />} />
                <Route path="/onboarding" element={<LazyRoute component={OnboardingNew} />} />
                <Route path="/onboarding-new" element={<LazyRoute component={OnboardingNew} />} />
                <Route path="/Potjes" element={<LazyRoute component={Potjes} />} />
                <Route path="/BudgetPlan" element={<LazyRoute component={BudgetPlan} />} />
                <Route path="/Income" element={<LazyRoute component={Income} />} />
                <Route path="/MaandelijkseLasten" element={<LazyRoute component={MaandelijkseLasten} />} />
                <Route path="/VasteLastenCheck" element={<LazyRoute component={VasteLastenCheck} />} />
                <Route path="/WorkSchedule" element={<LazyRoute component={WorkSchedule} />} />
                <Route path="/Adempauze" element={<LazyRoute component={Adempauze} />} />
                <Route path="/AdempauzeCalculator" element={<LazyRoute component={AdempauzeCalculator} />} />
                <Route path="/Wishlist" element={<LazyRoute component={Wishlist} />} />
                <Route path="/BudgetHelp" element={<LazyRoute component={BudgetHelp} />} />
                <Route path="/CoachChat" element={<LazyRoute component={CoachChat} />} />
                <Route path="/VideoCall" element={<LazyRoute component={VideoCall} />} />

                {/* Settings and smaller pages - static */}
                <Route path="/Settings" element={<Settings />} />
                <Route path="/Notifications" element={<Notifications />} />
                <Route path="/NotificationDetail/:id" element={<NotificationDetail />} />
                <Route path="/NotificationSettings" element={<NotificationSettings />} />
                <Route path="/SecuritySettings" element={<SecuritySettings />} />
                <Route path="/DisplaySettings" element={<DisplaySettings />} />
                <Route path="/VTLBSettings" element={<VTLBSettings />} />
                <Route path="/GamificationSettings" element={<GamificationSettings />} />
                <Route path="/gamificationsettings" element={<GamificationSettings />} />
                <Route path="/FAQ" element={<FAQ />} />
                <Route path="/FAQSettings" element={<FAQSettings />} />
                <Route path="/Feedback" element={<Feedback />} />
                <Route path="/HelpSupport" element={<HelpSupport />} />

                {/* Legal pages */}
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/termsofservice" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/privacypolicy" element={<PrivacyPolicy />} />

                {/* OAuth Callback Routes */}
                <Route path="/auth/google/callback" element={<OAuthCallback />} />
                <Route path="/auth/microsoft/callback" element={<OAuthCallback />} />

                {/* Error Pages */}
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
