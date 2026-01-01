interface ActionButtonProps {
  onPress: () => void;
  onRelease: () => void;
  isActive: boolean;
  label: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'red' | 'orange' | 'gray' | 'yellow';
  className?: string;
}

export default function ActionButton({
  onPress,
  onRelease,
  isActive,
  label,
  size = 'medium',
  color = 'red',
  className = '',
}: ActionButtonProps) {
  const sizeClasses = {
    small: 'w-12 h-12 text-xs',
    medium: 'w-14 h-14 text-lg',
    large: 'w-16 h-16 text-xl',
  };

  const colorClasses = {
    red: 'border-red-800 bg-red-600',
    orange: 'border-orange-800 bg-orange-600',
    gray: 'bg-gray-700',
    yellow: 'bg-yellow-600',
  };

  const activeColorClasses = {
    red: 'bg-red-700',
    orange: 'bg-orange-700',
    gray: 'bg-gray-600',
    yellow: 'bg-yellow-700',
  };

  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRelease();
      }}
      onTouchCancel={(e) => {
        e.preventDefault();
        onRelease();
      }}
      className={`rounded-full flex items-center justify-center text-white font-bold shadow-2xl ${
        color !== 'gray' && color !== 'yellow' ? 'border-2' : ''
      } touch-none select-none transition-all ${sizeClasses[size]} ${
        isActive ? `${activeColorClasses[color]} scale-90` : colorClasses[color]
      } ${className}`}
    >
      {label}
    </button>
  );
}
