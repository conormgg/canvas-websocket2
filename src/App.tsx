
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClipboardProvider } from "@/context/ClipboardContext";
import { SyncProvider } from "@/context/SyncContext";
import { ViewSelector } from "./components/ViewSelector";
import { TeacherView } from "./components/TeacherView";
import { StudentView } from "./components/StudentView";
import { SplitModeView } from "./components/SplitModeView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ClipboardProvider>
        <SyncProvider>
          <Toaster />
          <Sonner />
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<ViewSelector />} />
              <Route path="/teacher" element={<TeacherView />} />
              <Route path="/student" element={<StudentView />} />
              <Route path="/split-mode" element={<SplitModeView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MemoryRouter>
        </SyncProvider>
      </ClipboardProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
