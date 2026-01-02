import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect } from "react"

const queryClient = new QueryClient()

function App() {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:8',message:'App component rendering',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, []);
  // #endregion
  
  return (
    <QueryClientProvider client={queryClient}>
      <Pages />
      <Toaster />
    </QueryClientProvider>
  )
}

export default App 