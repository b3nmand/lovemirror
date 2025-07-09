import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { AuthGuard } from '@/components/AuthGuard';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { Layout } from '@/components/Layout';
import App from './App.tsx';
import Auth from './pages/Auth.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ProfileSetup from './pages/ProfileSetup.tsx';
import Assessment from './pages/Assessment.tsx';
import HighValueResults from './pages/HighValueResults.tsx';
import WifeMaterialResults from './pages/WifeMaterialResults.tsx';
import BridalPriceResults from './pages/BridalPriceResults.tsx';
import Welcome from './pages/Welcome.tsx';
import Assessors from './pages/Assessors.tsx';
import ExternalAssessment from './pages/ExternalAssessment.tsx';
import ExternalResults from './pages/ExternalResults.tsx';
import InvitePartner from './pages/InvitePartner.tsx';
import InvitationAccept from './pages/InvitationAccept.tsx';
import SelfImprovement from './pages/SelfImprovement.tsx';
import Goals from './pages/Goals.tsx';
import CompatibilityResults from './pages/CompatibilityResults.tsx';
import AIRelationshipMentor from './pages/AIRelationshipMentor.tsx';
import Subscription from './pages/Subscription.tsx';
import Settings from './pages/Settings.tsx';
import Education from './pages/Education.tsx';
import CheckoutRedirect from './pages/CheckoutRedirect.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthGuard requireAuth={false}><Welcome /></AuthGuard>} />
          <Route path="/app" element={<AuthGuard requireAuth={false}><App /></AuthGuard>} />
          <Route path="/auth" element={<AuthGuard requireAuth={false}><Auth /></AuthGuard>} />
          <Route path="/dashboard" element={<Layout><AuthGuard><Dashboard /></AuthGuard></Layout>} />
          <Route path="/profile-setup" element={<AuthGuard><ProfileSetup /></AuthGuard>} />
          <Route path="/assessment" element={<Layout><AuthGuard><Assessment /></AuthGuard></Layout>} />
          <Route path="/subscription" element={<Layout><AuthGuard><Subscription /></AuthGuard></Layout>} />
          <Route path="/checkout-redirect" element={<AuthGuard><CheckoutRedirect /></AuthGuard>} />
          <Route path="/education" element={<Layout><AuthGuard><Education /></AuthGuard></Layout>} />
          <Route path="/settings" element={<Layout><AuthGuard><Settings /></AuthGuard></Layout>} />
          
          {/* Protected routes that require subscription */}
          <Route path="/high-value-results/:id?" element={<Layout><AuthGuard><SubscriptionGuard><HighValueResults /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/wife-material-results/:id?" element={<Layout><AuthGuard><SubscriptionGuard><WifeMaterialResults /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/bridal-price-results/:id?" element={<Layout><AuthGuard><SubscriptionGuard><BridalPriceResults /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/assessors" element={<Layout><AuthGuard><SubscriptionGuard><Assessors /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/invite-partner" element={<Layout><AuthGuard><SubscriptionGuard><InvitePartner /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/external-results/:type?" element={<Layout><AuthGuard><SubscriptionGuard><ExternalResults /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/self-improvement" element={<Layout><AuthGuard><SubscriptionGuard><SelfImprovement /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/goals" element={<Layout><AuthGuard><SubscriptionGuard><Goals /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/compatibility/:id?" element={<Layout><AuthGuard><SubscriptionGuard><CompatibilityResults /></SubscriptionGuard></AuthGuard></Layout>} />
          <Route path="/ai-mentor" element={<Layout><AuthGuard><SubscriptionGuard><AIRelationshipMentor /></SubscriptionGuard></AuthGuard></Layout>} />
          
          {/* Public routes that don't require subscription */}
          <Route path="/external-assessment/:code" element={<AuthGuard requireAuth={false}><ExternalAssessment /></AuthGuard>} />
          <Route path="/invitation/:code" element={<AuthGuard requireAuth={false}><InvitationAccept /></AuthGuard>} />
          <Route path="*" element={<Navigate to="/\" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  </StrictMode>
);