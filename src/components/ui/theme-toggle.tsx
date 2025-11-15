import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden group"
      title={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
    >
      <div className="relative w-5 h-5">
        <Icon
          name="Sun"
          className={`absolute inset-0 transition-all duration-500 ${
            theme === 'light'
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
          }`}
          size={20}
        />
        <Icon
          name="Moon"
          className={`absolute inset-0 transition-all duration-500 ${
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }`}
          size={20}
        />
      </div>
    </Button>
  );
};

export default ThemeToggle;
