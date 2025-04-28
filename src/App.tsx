
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClipboardProvider } from "@/context/ClipboardContext";
import { SyncProvider } from "@/context/SyncContext";
import { AuthProvider } from "@/context/AuthContext";
import { ViewSelector } from "./components/ViewSelector";
import { StudentView } from "./components/StudentView";
import { SplitModeView } from "./components/SplitModeView";
import { AuthPage } from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { SplitWhiteboard } from "./components/SplitWhiteboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ClipboardProvider>
            <SyncProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/" element={<ViewSelector />} />
                <Route path="/teacher" element={<SplitWhiteboard />} />
                <Route path="/student" element={<StudentView />} />
                <Route path="/split-mode" element={<SplitModeView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SyncProvider>
          </ClipboardProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
