import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';

const NotificationPermission: React.FC = () => {
  const { t } = useLanguage();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      const hasAsked = localStorage.getItem('notificationAsked');
      if (!hasAsked && Notification.permission === 'default') {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem('notificationAsked', 'true');
      
      if (result === 'granted') {
        new Notification('SellHub уведомления включены! 🚀', {
          body: 'Вы будете получать уведомления о новых заказах и важных событиях',
          icon: '/favicon.ico'
        });
      }
      
      setShowPrompt(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('notificationAsked', 'true');
  };

  if (!showPrompt || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-fade-in">
      <Card className="shadow-2xl border-purple-200 dark:border-purple-900">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
              <Icon name="Bell" className="text-purple-700 dark:text-purple-300" size={24} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{t('enableNotifications')}</CardTitle>
              <CardDescription className="mt-1">
                {t('enableNotificationsDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex gap-2">
          <Button 
            onClick={requestPermission}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Icon name="Check" className="mr-2 h-4 w-4" />
            {t('enable')}
          </Button>
          <Button 
            variant="outline" 
            onClick={dismissPrompt}
            className="flex-1"
          >
            {t('later')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPermission;