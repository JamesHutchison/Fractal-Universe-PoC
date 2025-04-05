import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useEffect } from "react";
import { useAudio } from "./lib/stores/useAudio";
import UniverseSimulator from "./components/UniverseSimulator";
import "@fontsource/inter";

function App() {
  // Setup audio elements
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Background music setup
        const bgMusic = new Audio("/sounds/background.mp3");
        bgMusic.loop = true;
        bgMusic.volume = 0.15;
        
        // Sound effects
        const hitSound = new Audio("/sounds/hit.mp3");
        const successSound = new Audio("/sounds/success.mp3");
        
        // Store audio references
        useAudio.getState().setBackgroundMusic(bgMusic);
        useAudio.getState().setHitSound(hitSound);
        useAudio.getState().setSuccessSound(successSound);
        
        console.log("Audio setup completed");
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    };
    
    setupAudio();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen overflow-hidden bg-background">
        <UniverseSimulator />
      </div>
    </QueryClientProvider>
  );
}

export default App;
