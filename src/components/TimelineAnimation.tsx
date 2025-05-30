"use client";
import { useEffect, useState } from "react";

interface TimelineAnimationProps {
  steps: string[];
  durationPerStep?: number;
  lineAnimationDuration?: number;
}

export const TimelineAnimation = ({
  steps,
  durationPerStep = 2500,
  lineAnimationDuration = 800,
}: TimelineAnimationProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animatingLineIndex, setAnimatingLineIndex] = useState<number | null>(
    null,
  );

  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    if (steps.length <= 1) return;

    let intervalId: NodeJS.Timeout;

    const progressAnimation = () => {
      // Start animating the current step's line
      setAnimatingLineIndex(currentStepIndex);

      // After the line animation completes, move to the next step
      setTimeout(() => {
        const nextIndex = currentStepIndex + 1;

        // Only proceed if we haven't reached the end
        if (nextIndex < steps.length) {
          setCurrentStepIndex(nextIndex);
          setAnimatingLineIndex(null);

          // If this is the last step, clear the interval
          if (nextIndex === steps.length - 1) {
            clearInterval(intervalId);
          }
        }
      }, lineAnimationDuration);
    };

    intervalId = setInterval(progressAnimation, durationPerStep);

    return () => clearInterval(intervalId);
  }, [steps, durationPerStep, currentStepIndex, lineAnimationDuration]);

  return (
    <div className="w-full">
      {/* Current step display */}
      <div className="mb-3 text-sm md:text-base font-medium text-accent-purple flex items-center">
        {steps[currentStepIndex]}
        {isLastStep && <span className="ml-2 animate-scale">🎉</span>}
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
      <div className="w-full mt-1 relative">
        {steps.map((step, index) => {
          // Calculate position for first and last steps
          let leftPosition = "0%";
          if (index === steps.length - 1) {
            leftPosition = "100%";
          } else if (index > 0) {
            // For middle steps, calculate based on position
            leftPosition = `${(index / (steps.length - 1)) * 100}%`;
          }

          return (
            <div
              key={index}
              className={`text-xs absolute transform -translate-x-1/2 ${
                index === currentStepIndex
                  ? "text-accent-purple"
                  : "text-gray-400"
              } ${index === 0 ? "text-left !translate-x-0" : ""} ${
                index === steps.length - 1
                  ? "text-right !translate-x-[-100%]"
                  : ""
              }`}
              style={{
                left: leftPosition,
              }}
            >
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
};
