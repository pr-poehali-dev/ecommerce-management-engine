import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    {
      id: 'add-product',
      icon: 'Plus',
      label: 'Добавить товар',
      color: 'from-blue-500 to-cyan-500',
      action: () => onNavigate('products')
    },
    {
      id: 'view-orders',
      icon: 'ShoppingCart',
      label: 'Заказы',
      color: 'from-purple-500 to-pink-500',
      action: () => onNavigate('orders')
    },
    {
      id: 'ai-insights',
      icon: 'Sparkles',
      label: 'AI Рекомендации',
      color: 'from-orange-500 to-red-500',
      action: () => onNavigate('aiInsights')
    },
    {
      id: 'connect-marketplace',
      icon: 'Globe',
      label: 'Маркетплейсы',
      color: 'from-green-500 to-teal-500',
      action: () => onNavigate('marketplaces')
    }
  ];

  return (
    <Card className="shadow-lg">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="group relative overflow-hidden rounded-xl p-6 text-white transition-all hover:scale-105 hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
              
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Icon name={action.icon} size={24} />
                </div>
                <span className="text-sm font-semibold text-center">
                  {action.label}
                </span>
              </div>

              <div className="absolute inset-0 shine-effect opacity-0 group-hover:opacity-100"></div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
