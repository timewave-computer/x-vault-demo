import React from "react";
import { Card, TimelineAnimation } from "@/components";

interface DepositInProgressProps {
  copy: {
    title: string;
    description: string;
    steps: string[];
  };
}

export const DepositInProgress: React.FC<DepositInProgressProps> = ({
  copy,
}) => {
  return (
    <div className="mt-8">
      <Card variant="secondary">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-accent-purple/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-10 -mb-10 bg-accent-purple/5 rounded-full blur-xl"></div>

        <div className="py-4">
          <div className="flex flex-col px-4 max-w-[1200px]">
            <div className="text-xl font-beast text-accent-purple mb-2">
              {copy.title}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>{copy.description}</div>
              <TimelineAnimation steps={copy.steps} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
