"use client";

import { useEffect, useState } from "react";

/**
 * There is no suppot for connecting a wallet on mobile devices.
 * This component is used to detect if the user is on a mobile device
 * and prevent them from accessing the app.
 *
 */

export function MobileDetection({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkIfMobile = () => {
      const userAgent = window.navigator.userAgent;
      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(userAgent) || window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Don't render anything during server-side rendering to prevent hydration mismatch
  if (!isClient) return children;

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gradient-to-b from-accent-purple-light to-white">
        <div className="max-w-md p-8 rounded-xl bg-white shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-accent-purple">
            Desktop Only
          </h1>
          <p className="mb-4">
            This application is optimized for desktop viewing. Please access
            from a computer for the best experience.
          </p>
          <div className="text-sm text-gray-500">
            <p>We detected that you're using a mobile device.</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
