// src/app/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";

import { Navigation } from "./components/Navigation";
import { ProfileSetupModal } from "./components/ProfileSetupModal";
import { useAuth } from "./context/AuthContext";
import { useProfile } from "./context/ProfileContext";
import { Footer } from "./components/Footer";
import { GeminiChatWidget } from "./components/GeminiChatWidget";
import { RequireAuth } from "./components/RequireAuth";

import { HomePage } from "./pages/Home";
import { ExamWeightagePage } from "./pages/ExamWeightage";
import { CoursesPage } from "./pages/courses";
import { PrivacyPage } from "./pages/Privacy";
import { TermsPage } from "./pages/Terms";
import { RefundPolicyPage } from "./pages/RefundPolicy";
import { ContactPage } from "./pages/Contact";
import { CbsePage } from "./pages/Cbse";
import {
  PyqExamPage,
  PyqChemistryPage,
  PyqChapterPage,
  PyqQuestionPage,
  PyqQuestionAttemptPage,
  PyqPersonalTestPage,
  PyqPersonalTestChaptersPage,
  PyqPersonalTestAttemptPage,
  PyqPersonalTestReviewPage,
} from "./pages/Pyq";
import {
  NotesExamPage,
  NotesChemistryPage,
  NotesBundlesPage,
} from "./pages/NotesDashboard";
import {
  MyNotesExamPage,
  MyNotesListPage,
  MyNotesPdfViewerPage,
  MyNotesBundleNotesPage,
} from "./pages/MyNotesDashboard";
import { CartPage } from "./pages/Cart";
import { UserDashboardPage } from "./pages/UserDashboard";
import { AdminAnandPage } from "./pages/Admin";

function PublicLayout() {
  const location = useLocation();
  const { user } = useAuth();

  // If a signed-in user somehow visits a public route, always push them
  // to the main user dashboard instead of showing the marketing homepage.
  if (user && location.pathname === "/") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navigation />
      <main className="pt-20">
        <div
          key={location.pathname}
          className="animate-in fade-in slide-in-from-bottom-2 duration-250"
        >
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { needsProfileSetup } = useProfile();

  // Hide chat widget on exam / question pages so students can't use it during tests.
  const isExamRoute = location.pathname.startsWith("/dashboard/pyq");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="min-h-screen">
        <div
          key={location.pathname}
          className="animate-in fade-in slide-in-from-bottom-2 duration-250"
        >
          <Outlet />
        </div>
      </main>
      {user && needsProfileSetup && <ProfileSetupModal />}
      {!isExamRoute && <GeminiChatWidget />}
    </div>
  );
}

function AdminLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="min-h-screen">
        <div
          key={location.pathname}
          className="animate-in fade-in slide-in-from-bottom-2 duration-250"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages with navbar + footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/neet" element={<ExamWeightagePage />} />
          <Route path="/jee-main" element={<ExamWeightagePage />} />
          <Route path="/jee-advanced" element={<ExamWeightagePage />} />
          <Route path="/cbse" element={<CbsePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/notes" element={<Navigate to="/dashboard/notes" replace />} />
          <Route path="/pyq" element={<Navigate to="/dashboard/pyq" replace />} />
          <Route path="/cart" element={<CartPage />} />
        </Route>

        {/* User dashboard with custom sidebar layout (no header/footer) */}
        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/dashboard/bundles/:bundleId" element={<UserDashboardPage />} />
          <Route path="/dashboard/profile" element={<UserDashboardPage />} />

          {/* Dashboard PYQ steps as separate pages */}
          <Route path="/dashboard/pyq" element={<PyqExamPage />} />
          <Route path="/dashboard/pyq/personal-test" element={<PyqPersonalTestPage />} />
          <Route path="/dashboard/pyq/personal-test/chapters" element={<PyqPersonalTestChaptersPage />} />
          <Route path="/dashboard/pyq/personal-test/attempt" element={<PyqPersonalTestAttemptPage />} />
          <Route path="/dashboard/pyq/personal-test/review/:resultId" element={<PyqPersonalTestReviewPage />} />
          <Route path="/dashboard/pyq/:examId" element={<PyqChemistryPage />} />
          <Route path="/dashboard/pyq/:examId/:chemType" element={<PyqChapterPage />} />
          <Route
            path="/dashboard/pyq/:examId/:chemType/:chapterSlug"
            element={<PyqQuestionPage />}
          />
          <Route
            path="/dashboard/pyq/:examId/:chemType/:chapterSlug/:questionId"
            element={<PyqQuestionAttemptPage />}
          />

          {/* Dashboard Notes steps (same layout as PYQ) */}
          <Route path="/dashboard/notes" element={<NotesExamPage />} />
          <Route path="/dashboard/notes/:examId" element={<NotesChemistryPage />} />
          <Route path="/dashboard/notes/:examId/:chemType" element={<NotesBundlesPage />} />

          {/* My Notes: exam → bundles → notes → PDF viewer */}
          <Route path="/dashboard/my-notes" element={<MyNotesExamPage />} />
          <Route path="/dashboard/my-notes/:examId" element={<MyNotesListPage />} />
          <Route path="/dashboard/my-notes/:examId/bundle/:bundleId" element={<MyNotesBundleNotesPage />} />
          <Route path="/dashboard/my-notes/:examId/view/:noteId" element={<MyNotesPdfViewerPage />} />
        </Route>

        {/* Admin pages without navbar/footer */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/anand" element={<AdminAnandPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}