import React, { Suspense } from "react";
import Layout from "./Layout.jsx";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// Loading fallback component
const LoadingFallback = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-gray-500"></div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">Laden...</p>
        </div>
    </div>
);

// Lazy load large feature pages for code splitting
const Dashboard = React.lazy(() => import("./Dashboard"));
const Debts = React.lazy(() => import("./Debts"));
const CentVoorCent = React.lazy(() => import("./CentVoorCent"));
const VTLBCalculator = React.lazy(() => import("./VTLBCalculator"));
const OnboardingNew = React.lazy(() => import("./OnboardingNew"));
const Potjes = React.lazy(() => import("./Potjes"));
const BudgetPlan = React.lazy(() => import("./BudgetPlan"));
const Income = React.lazy(() => import("./Income"));
const MaandelijkseLasten = React.lazy(() => import("./MaandelijkseLasten"));
const VasteLastenCheck = React.lazy(() => import("./VasteLastenCheck"));
const WorkSchedule = React.lazy(() => import("./WorkSchedule"));
const Adempauze = React.lazy(() => import("./Adempauze"));
const AdempauzeCalculator = React.lazy(() => import("./AdempauzeCalculator"));
const Wishlist = React.lazy(() => import("./Wishlist"));
const BudgetHelp = React.lazy(() => import("./BudgetHelp"));
const CoachChat = React.lazy(() => import("./CoachChat"));
const VideoCall = React.lazy(() => import("./VideoCall"));

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
    const lazyPages = ['debts', 'centvvorcent', 'vtlbcalculator', 'potjes', 'budgetplan', 'budgethelp', 'income', 'maandelijkselasten', 'vastelastencheck', 'workschedule', 'adempauze', 'adempauzecalculator', 'wishlist'];
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
                <Route path="/CentVoorCent" element={<LazyRoute component={CentVoorCent} />} />
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
                <Route path="/NotificationSettings" element={<NotificationSettings />} />
                <Route path="/SecuritySettings" element={<SecuritySettings />} />
                <Route path="/DisplaySettings" element={<DisplaySettings />} />
                <Route path="/VTLBSettings" element={<VTLBSettings />} />
                <Route path="/GamificationSettings" element={<GamificationSettings />} />
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
