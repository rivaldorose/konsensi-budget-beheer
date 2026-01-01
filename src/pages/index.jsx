import Layout from "./Layout.jsx";

import debts from "./debts";

import CentVoorCent from "./CentVoorCent";

import VTLBCalculator from "./VTLBCalculator";

import onboarding from "./onboarding";

import OnboardingNew from "./OnboardingNew";

import TermsOfService from "./TermsOfService";

import PrivacyPolicy from "./PrivacyPolicy";

import Dashboard from "./Dashboard";

import Settings from "./Settings";

import AdminFAQ from "./AdminFAQ";

import Adempauze from "./Adempauze";

import AdempauzeCalculator from "./AdempauzeCalculator";

import Potjes from "./Potjes";

import VasteLastenCheck from "./VasteLastenCheck";

import FAQ from "./FAQ";

import NotificationSettings from "./NotificationSettings";

import SecuritySettings from "./SecuritySettings";

import DisplaySettings from "./DisplaySettings";

import VTLBSettings from "./VTLBSettings";

import AdminSupport from "./AdminSupport";

import WorkSchedule from "./WorkSchedule";

import BudgetPlan from "./BudgetPlan";

import Income from "./Income";

import MaandelijkseLasten from "./MaandelijkseLasten";

import Wishlist from "./Wishlist";

import Feedback from "./Feedback";

import Privacy from "./Privacy";

import HelpSupport from "./HelpSupport";

import Login from "./Login";

import SignUp from "./SignUp";

import ForgotPassword from "./ForgotPassword";

import EmailSent from "./EmailSent";

import ResetPassword from "./ResetPassword";

import PasswordSaved from "./PasswordSaved";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    debts: debts,
    
    CentVoorCent: CentVoorCent,
    
    VTLBCalculator: VTLBCalculator,
    
    onboarding: onboarding,
    
    Dashboard: Dashboard,
    
    Settings: Settings,
    
    AdminFAQ: AdminFAQ,
    
    Adempauze: Adempauze,
    
    AdempauzeCalculator: AdempauzeCalculator,
    
    Potjes: Potjes,
    
    VasteLastenCheck: VasteLastenCheck,
    
    FAQ: FAQ,
    
    NotificationSettings: NotificationSettings,
    
    SecuritySettings: SecuritySettings,
    
    DisplaySettings: DisplaySettings,
    
    VTLBSettings: VTLBSettings,
    
    AdminSupport: AdminSupport,
    
    WorkSchedule: WorkSchedule,
    
    BudgetPlan: BudgetPlan,
    
    Income: Income,
    
    MaandelijkseLasten: MaandelijkseLasten,
    
    Wishlist: Wishlist,
    
    Feedback: Feedback,
    
    Privacy: Privacy,
    
    HelpSupport: HelpSupport,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/signup" element={<SignUp />} />
                
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                <Route path="/email-sent" element={<EmailSent />} />
                
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route path="/password-saved" element={<PasswordSaved />} />
                
                <Route path="/" element={<MaandelijkseLasten />} />
                
                <Route path="/debts" element={<debts />} />
                
                <Route path="/CentVoorCent" element={<CentVoorCent />} />
                
                <Route path="/VTLBCalculator" element={<VTLBCalculator />} />
                
                <Route path="/onboarding" element={<OnboardingNew />} />
                
                <Route path="/onboarding-new" element={<OnboardingNew />} />
                
                <Route path="/terms" element={<TermsOfService />} />
                
                <Route path="/privacy" element={<PrivacyPolicy />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/AdminFAQ" element={<AdminFAQ />} />
                
                <Route path="/Adempauze" element={<Adempauze />} />
                
                <Route path="/AdempauzeCalculator" element={<AdempauzeCalculator />} />
                
                <Route path="/Potjes" element={<Potjes />} />
                
                <Route path="/VasteLastenCheck" element={<VasteLastenCheck />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
                <Route path="/NotificationSettings" element={<NotificationSettings />} />
                
                <Route path="/SecuritySettings" element={<SecuritySettings />} />
                
                <Route path="/DisplaySettings" element={<DisplaySettings />} />
                
                <Route path="/VTLBSettings" element={<VTLBSettings />} />
                
                <Route path="/AdminSupport" element={<AdminSupport />} />
                
                <Route path="/WorkSchedule" element={<WorkSchedule />} />
                
                <Route path="/BudgetPlan" element={<BudgetPlan />} />
                
                <Route path="/Income" element={<Income />} />
                
                <Route path="/MaandelijkseLasten" element={<MaandelijkseLasten />} />
                
                <Route path="/Wishlist" element={<Wishlist />} />
                
                <Route path="/Feedback" element={<Feedback />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/HelpSupport" element={<HelpSupport />} />
                
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