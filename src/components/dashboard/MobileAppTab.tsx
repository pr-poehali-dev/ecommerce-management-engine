import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';

const MobileAppTab: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: 'Bell',
      title: t('realTimeNotifications'),
      description: 'Мгновенные уведомления о заказах, платежах и важных событиях',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: 'ShoppingCart',
      title: t('orderManagement'),
      description: 'Управляйте заказами из любой точки мира',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: 'Package',
      title: t('productTracking'),
      description: 'Отслеживайте остатки и обновляйте товары на ходу',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: 'TrendingUp',
      title: t('salesAnalytics'),
      description: 'Просматривайте аналитику продаж в реальном времени',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: 'Zap',
      title: 'Быстрые действия',
      description: 'Выполняйте частые задачи одним нажатием',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: 'Shield',
      title: 'Безопасность',
      description: 'Биометрическая авторизация и шифрование данных',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const screenshots = [
    { id: 1, title: 'Дашборд', gradient: 'from-purple-400 to-blue-400' },
    { id: 2, title: 'Заказы', gradient: 'from-blue-400 to-cyan-400' },
    { id: 3, title: 'Аналитика', gradient: 'from-green-400 to-emerald-400' },
    { id: 4, title: 'Товары', gradient: 'from-orange-400 to-red-400' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-full">
          <Icon name="Smartphone" className="text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-semibold text-purple-900 dark:text-purple-200">
            Доступно для iOS и Android
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold gradient-text">
          {t('mobileAppTitle')}
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Управляйте своим бизнесом из любой точки мира. Все возможности платформы в вашем кармане.
        </p>
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Icon name="Apple" className="mr-2 h-5 w-5" />
          {t('downloadForIOS')}
        </Button>
        <Button size="lg" variant="outline" className="border-2">
          <Icon name="Smartphone" className="mr-2 h-5 w-5" />
          {t('downloadForAndroid')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <Icon name={feature.icon} className="text-white" size={24} />
              </div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Предпросмотр приложения</CardTitle>
          <CardDescription>
            Интуитивный интерфейс для максимальной продуктивности
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {screenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className="aspect-[9/16] rounded-2xl bg-gradient-to-br overflow-hidden shadow-xl"
                style={{
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`
                }}
              >
                <div className={`w-full h-full bg-gradient-to-br ${screenshot.gradient} p-4 flex flex-col`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-20 h-3 bg-white/30 rounded-full"></div>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-3">
                    <div className="space-y-2">
                      <div className="h-3 bg-white/40 rounded-full w-3/4"></div>
                      <div className="h-3 bg-white/40 rounded-full w-1/2"></div>
                      <div className="h-3 bg-white/40 rounded-full w-2/3"></div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-xs text-white font-semibold">
                    {screenshot.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="QrCode" className="text-purple-600" />
              {t('qrCode')}
            </CardTitle>
            <CardDescription>
              Отсканируйте для быстрого скачивания
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-48 h-48 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900 rounded-2xl flex items-center justify-center">
              <Icon name="QrCode" size={120} className="text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Технические требования</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Icon name="Apple" className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">iOS</h4>
                  <p className="text-sm text-muted-foreground">
                    Требуется iOS 14.0 или новее
                  </p>
                  <Badge variant="outline" className="mt-2">
                    iPhone, iPad, iPod touch
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Icon name="Smartphone" className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Android</h4>
                  <p className="text-sm text-muted-foreground">
                    Требуется Android 8.0 или новее
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Google Play
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
        <CardContent className="p-8 text-center">
          <Icon name="Rocket" className="mx-auto mb-4 text-purple-600 dark:text-purple-400" size={48} />
          <h3 className="text-2xl font-bold mb-2">Начните прямо сейчас</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Скачайте приложение и получите все возможности SellHub в удобном мобильном формате. 
            Первые 30 дней бесплатно!
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Icon name="Download" className="mr-2 h-5 w-5" />
              Скачать сейчас
            </Button>
            <Button size="lg" variant="outline">
              Посмотреть демо
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileAppTab;
