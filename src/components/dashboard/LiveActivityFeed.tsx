import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface Activity {
  id: string;
  type: 'order' | 'payment' | 'review' | 'signup';
  user: string;
  action: string;
  amount?: number;
  timestamp: Date;
  color: string;
}

const LiveActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'order',
      user: 'Дмитрий С.',
      action: 'оформил заказ',
      amount: 15990,
      timestamp: new Date(Date.now() - 1000),
      color: 'blue'
    },
    {
      id: '2',
      type: 'payment',
      user: 'Анастасия В.',
      action: 'оплатила заказ',
      amount: 8900,
      timestamp: new Date(Date.now() - 45000),
      color: 'green'
    },
    {
      id: '3',
      type: 'signup',
      user: 'Максим Н.',
      action: 'зарегистрировался',
      timestamp: new Date(Date.now() - 120000),
      color: 'purple'
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const names = ['Алексей', 'Мария', 'Иван', 'Елена', 'Петр', 'Ольга', 'Сергей', 'Анна'];
        const surnames = ['К.', 'С.', 'П.', 'В.', 'М.', 'Н.', 'Л.', 'Д.'];
        
        const types: Array<'order' | 'payment' | 'review' | 'signup'> = ['order', 'payment', 'review', 'signup'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const actions = {
          order: 'оформил заказ',
          payment: 'оплатил заказ',
          review: 'оставил отзыв',
          signup: 'зарегистрировался'
        };
        
        const colors = {
          order: 'blue',
          payment: 'green',
          review: 'orange',
          signup: 'purple'
        };

        const newActivity: Activity = {
          id: Date.now().toString(),
          type,
          user: `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`,
          action: actions[type],
          amount: ['order', 'payment'].includes(type) ? Math.floor(Math.random() * 50000 + 1000) : undefined,
          timestamp: new Date(),
          color: colors[type]
        };

        setActivities(prev => [newActivity, ...prev].slice(0, 15));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return 'ShoppingCart';
      case 'payment': return 'CreditCard';
      case 'review': return 'Star';
      case 'signup': return 'UserPlus';
      default: return 'Activity';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ч';
    return Math.floor(diff / 86400) + ' дн';
  };

  return (
    <Card className="shadow-lg border-green-100 dark:border-green-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="relative">
            <Icon name="Activity" className="text-green-600" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          Активность в реальном времени
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div 
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`bg-${activity.color}-100 dark:bg-${activity.color}-900 text-${activity.color}-700 dark:text-${activity.color}-300`}>
                    <Icon name={getIcon(activity.type)} size={18} />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{activity.user}</span>
                    <span className="text-sm text-muted-foreground">{activity.action}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {activity.amount && (
                      <Badge variant="outline" className="text-xs">
                        {activity.amount.toLocaleString('ru-RU')} ₽
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveActivityFeed;
