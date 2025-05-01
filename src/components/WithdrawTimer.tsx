"use client";
import { useState, useEffect } from "react";

/**
 * A component that displays a countdown timer for withdrawals
 */
export function WithdrawTimer({
  initialTimeRemaining,
  isClaimable,
  claimTime,
  children,
}: {
  initialTimeRemaining: string;
  isClaimable: boolean;
  claimTime: string;
  children?: React.ReactNode;
}) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);

  useEffect(() => {
    // Only run the timer if we're not yet claimable
    if (isClaimable) return;

    // Parse the claim time from the string
    if (!claimTime || claimTime === "N/A") return;

    try {
      // Extract the date from the claimTime string
      const claimDate = new Date(claimTime.split(" ").slice(0, -1).join(" "));

      const timer = setInterval(() => {
        const now = new Date();

        if (claimDate <= now) {
          setTimeRemaining("00:00:00");
          clearInterval(timer);
          return;
        }

        // Calculate remaining time
        const diffInSeconds = Math.floor(
          (claimDate.getTime() - now.getTime()) / 1000,
        );

        // For larger time frames, show days
        const days = Math.floor(diffInSeconds / 86400); // 86400 seconds in a day
        const hours = Math.floor((diffInSeconds % 86400) / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;

        // Format with leading zeros
        const formattedHours = String(hours).padStart(2, "0");
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");

        // Include days in the output if there are any
        if (days > 0) {
          const formattedDays = String(days).padStart(2, "0");
          setTimeRemaining(
            `${formattedDays}:${formattedHours}:${formattedMinutes}:${formattedSeconds}`,
          );
        } else {
          setTimeRemaining(
            `${formattedHours}:${formattedMinutes}:${formattedSeconds}`,
          );
        }
      }, 1000);

      return () => clearInterval(timer);
    } catch (error) {
      console.error("Error parsing claim time:", error);
      return;
    }
  }, [isClaimable, claimTime]);

  const containerClassName = isClaimable
    ? "bg-green-100 border border-green-300 rounded-lg p-3 mb-4"
    : "bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4";

  const timerClassName = isClaimable
    ? "font-mono text-2xl text-center text-green-600 font-bold"
    : "font-mono text-2xl text-center text-gray-700 font-bold";

  const labelClassName = isClaimable
    ? "text-center text-green-600 font-medium mb-1"
    : "text-center text-gray-600 font-medium mt-1";

  const childrenClassName = isClaimable
    ? "text-center text-green-600 text-xs"
    : "text-center text-gray-600 text-xs ";

  const label = isClaimable ? "Ready to claim" : "Time Remaining";

  return (
    <div className={containerClassName}>
      <p className={labelClassName}>{label}</p>
      <div className={timerClassName}>{timeRemaining}</div>
      {children && <div className={childrenClassName}>{children}</div>}
    </div>
  );
}
