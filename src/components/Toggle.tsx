export type ToggleOption = {
  value: string;
  label: string;
};

interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Toggle({
  options,
  value,
  onChange,
  className = "",
}: ToggleProps) {
  return (
    <div
      className={`flex items-center justify-center space-x-4 mb-6 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-lg transition-all ${
            value === option.value
              ? "bg-accent-purple text-white font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
