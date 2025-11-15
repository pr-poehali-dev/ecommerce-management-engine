import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { playNotificationSound, showNotification } from '@/lib/notification-sounds';

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'stock' | 'customer' | 'ai' | 'marketplace';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

const NotificationCenter: React.FC = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      title: 'Новый заказ #12458',
      message: 'Заказ на 15,990 ₽ от Дмитрий Соколов',
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'ai',
      title: 'AI рекомендация',
      message: 'Рекомендуем повысить цену на "Wireless Headphones Pro" на 8.3%',
      timestamp: new Date(Date.now() - 15 * 60000),
      read: false,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'stock',
      title: 'Низкий остаток',
      message: 'Wireless Headphones Pro: осталось 12 шт (4 дня)',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: false,
      priority: 'high'
    },
    {
      id: '4',
      type: 'payment',
      title: 'Платеж получен',
      message: 'Получен платеж 23,450 ₽ от Анастасия Волкова',
      timestamp: new Date(Date.now() - 45 * 60000),
      read: true,
      priority: 'medium'
    },
    {
      id: '5',
      type: 'marketplace',
      title: 'Маркетплейс подключен',
      message: 'Amazon успешно интегрирован с вашим магазином',
      timestamp: new Date(Date.now() - 120 * 60000),
      read: true,
      priority: 'low'
    },
    {
      id: '6',
      type: 'customer',
      title: 'Новый клиент',
      message: 'Полина Лебедева зарегистрировалась',
      timestamp: new Date(Date.now() - 180 * 60000),
      read: true,
      priority: 'low'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const interval = setInterval(() => {
      const shouldAddNotification = Math.random() > 0.85;
      if (shouldAddNotification) {
        const types: Array<'order' | 'payment' | 'stock' | 'customer' | 'ai'> = ['order', 'payment', 'stock', 'customer', 'ai'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: randomType,
          title: getRandomTitle(randomType),
          message: getRandomMessage(randomType),
          timestamp: new Date(),
          read: false,
          priority: Math.random() > 0.5 ? 'high' : 'medium'
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 20));
        
        playNotificationSound(newNotification.priority === 'high' ? 'warning' : 'info');
        
        showNotification(newNotification.title, {
          body: newNotification.message,
          tag: newNotification.id,
          requireInteraction: newNotification.priority === 'high'
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getRandomTitle = (type: string): string => {
    const titles = {
      order: ['Новый заказ', 'Заказ обновлен', 'Заказ доставлен'],
      payment: ['Платеж получен', 'Оплата подтверждена'],
      stock: ['Низкий остаток', 'Товар заканчивается'],
      customer: ['Новый клиент', 'Отзыв клиента'],
      ai: ['AI рекомендация', 'Прогноз продаж', 'Оптимизация цен']
    };
    const list = titles[type as keyof typeof titles] || ['Уведомление'];
    return list[Math.floor(Math.random() * list.length)];
  };

  const getRandomMessage = (type: string): string => {
    const messages = {
      order: ['Новый заказ на сумму ' + (Math.random() * 50000 + 1000).toFixed(0) + ' ₽'],
      payment: ['Получен платеж ' + (Math.random() * 30000 + 1000).toFixed(0) + ' ₽'],
      stock: ['Остаток товара: ' + Math.floor(Math.random() * 20 + 5) + ' шт'],
      customer: ['Новый клиент зарегистрировался на платформе'],
      ai: ['AI обнаружил возможность увеличить прибыль на ' + (Math.random() * 20 + 5).toFixed(1) + '%']
    };
    const list = messages[type as keyof typeof messages] || ['Новое событие'];
    return list[Math.floor(Math.random() * list.length)];
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return 'ShoppingCart';
      case 'payment': return 'DollarSign';
      case 'stock': return 'Package';
      case 'customer': return 'User';
      case 'ai': return 'Sparkles';
      case 'marketplace': return 'Globe';
      default: return 'Bell';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'order': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'payment': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'stock': return 'text-orange-600 bg-orange-100 dark:bg-orange-900';
      case 'customer': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case 'ai': return 'text-pink-600 bg-pink-100 dark:bg-pink-900';
      case 'marketplace': return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин назад';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ч назад';
    return Math.floor(diff / 86400) + ' дн назад';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Icon name="Bell" size={20} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 animate-pulse"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Bell" size={20} className="text-purple-600" />
                Уведомления
              </CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Отметить все
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Icon name="BellOff" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Нет уведомлений</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg h-fit ${getColor(notification.type)}`}>
                          <Icon name={getIcon(notification.type)} size={18} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon name="Clock" size={12} />
                            {formatTime(notification.timestamp)}
                            {notification.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs h-5">
                                Срочно
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;