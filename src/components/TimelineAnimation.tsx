"use client";
import { useEffect, useState } from "react";

interface TimelineAnimationProps {
  steps: string[];
  durationPerStep?: number;
  pauseDuration?: number;
}

export const TimelineAnimation = ({
  steps,
  durationPerStep = 2000,
  pauseDuration = 6000,
}: TimelineAnimationProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animatingLineIndex, setAnimatingLineIndex] = useState<number | null>(
    null,
  );
  const [isPaused, setIsPaused] = useState(false);

  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    if (steps.length <= 1) return;

    const progressAnimation = () => {
      if (isPaused) return;

      // Start animating the current step's line
      setAnimatingLineIndex(currentStepIndex);

      // After the line animation completes, move to the next step
      setTimeout(() => {
        const nextIndex =
          currentStepIndex === steps.length - 1 ? 0 : currentStepIndex + 1;

        // If we're at the last step
        if (currentStepIndex === steps.length - 2) {
          // Next step will be the last one - prepare for celebration
          setCurrentStepIndex(nextIndex);
          setAnimatingLineIndex(null);

          // Pause after completing the cycle
          if (nextIndex === steps.length - 1) {
            setIsPaused(true);
            setTimeout(() => {
              setIsPaused(false);
            }, pauseDuration);
          }
        } else {
          // Normal step progression
          setCurrentStepIndex(nextIndex);
          setAnimatingLineIndex(null);
        }
      }, 300);
    };

    const interval = setInterval(progressAnimation, durationPerStep);

    return () => clearInterval(interval);
  }, [steps, durationPerStep, currentStepIndex, isPaused, pauseDuration]);

  return (
    <div className="w-full py-2">
      {/* Current step display */}
      <div className="mb-3 text-sm md:text-base font-medium text-accent-purple flex items-center">
        {steps[currentStepIndex]}
        {isLastStep && <span className="ml-2 animate-bounce">🎉</span>}
      </div>

      {/* Timeline */}
      <div className="flex items-center w-full">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center flex-grow last:flex-grow-0"
          >
            {/* Dot */}
            <div
              className={`relative rounded-full flex items-center justify-center w-4 h-4
            
                ${index <= currentStepIndex ? "bg-accent-purple" : "bg-gray-300"}`}
            >
              {/* Pulsing effect when active */}
              {index === currentStepIndex && (
                <div
                  className={`absolute rounded-full bg-accent-purple/30 animate-ping w-4 h-4`}
                ></div>
              )}
            </div>

            {/* Line connecting dots (except after the last dot) */}
            {index < steps.length - 1 && (
              <div className="flex-grow h-1 mx-1 bg-gray-300">
                <div
                  className="h-full transition-all duration-300 ease-in-out bg-accent-purple"
                  style={{
                    width:
                      index < currentStepIndex || index === animatingLineIndex
                        ? "100%"
                        : "0%",
                  }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex w-full mt-1">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`text-xs flex-grow last:flex-grow-0 last:text-right first:text-left text-center 
              ${index === currentStepIndex ? "text-accent-purple" : "text-gray-400"}`}
            style={{
              maxWidth:
                index === 0 || index === steps.length - 1
                  ? "auto"
                  : `${100 / steps.length}%`,
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};
