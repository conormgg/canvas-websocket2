
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClipboardProvider } from "@/context/ClipboardContext";
import { SyncProvider } from "@/context/SyncContext";
import { ViewSelector } from "./components/ViewSelector";
import { StudentView } from "./components/StudentView";
import NotFound from "./pages/NotFound";
import { SplitWhiteboard } from "./components/SplitWhiteboard";
import { SyncTestView } from "./components/SyncTestView";
import React from "react";

// Create QueryClient outside the component to avoid recreation on re-renders
const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ClipboardProvider>
            <SyncProvider>
              <TooltipProvider>
                <Routes>
                  <Route path="/" element={<ViewSelector />} />
                  <Route path="/teacher" element={<SplitWhiteboard />} />
                  <Route path="/student" element={<StudentView />} />
                  <Route path="/sync-test" element={<SyncTestView />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </SyncProvider>
          </ClipboardProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
