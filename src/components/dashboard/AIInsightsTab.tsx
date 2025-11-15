import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIInsight {
  productName: string;
  currentPrice: number;
  recommendedPrice: number;
  potentialProfit: number;
  confidence: number;
  reason: string;
}

interface SalesForecast {
  product: string;
  expectedSales: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface InventoryAlert {
  product: string;
  currentStock: number;
  daysLeft: number;
  urgency: 'high' | 'medium' | 'low';
}

const AIInsightsTab: React.FC = () => {
  const { t } = useLanguage();

  const priceInsights: AIInsight[] = [
    {
      productName: 'Wireless Headphones Pro',
      currentPrice: 5990,
      recommendedPrice: 6490,
      potentialProfit: 8.3,
      confidence: 87,
      reason: 'Конкуренты продают по более высокой цене, спрос растет'
    },
    {
      productName: 'Smart Watch X3',
      currentPrice: 12990,
      recommendedPrice: 11990,
      potentialProfit: 15.2,
      confidence: 92,
      reason: 'Снижение цены увеличит объем продаж в 1.8 раз'
    },
    {
      productName: 'Gaming Mouse RGB',
      currentPrice: 3490,
      recommendedPrice: 3990,
      potentialProfit: 14.3,
      confidence: 79,
      reason: 'Высокий спрос, средняя цена на рынке выше'
    }
  ];

  const salesForecasts: SalesForecast[] = [
    { product: 'Wireless Headphones Pro', expectedSales: 156, confidence: 85, trend: 'up' },
    { product: 'Smart Watch X3', expectedSales: 89, confidence: 78, trend: 'stable' },
    { product: 'Gaming Mouse RGB', expectedSales: 234, confidence: 91, trend: 'up' },
    { product: 'USB-C Cable 2m', expectedSales: 445, confidence: 94, trend: 'up' }
  ];

  const inventoryAlerts: InventoryAlert[] = [
    { product: 'Wireless Headphones Pro', currentStock: 12, daysLeft: 4, urgency: 'high' },
    { product: 'Gaming Mouse RGB', currentStock: 23, daysLeft: 7, urgency: 'medium' },
    { product: 'Phone Case Clear', currentStock: 45, daysLeft: 12, urgency: 'low' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {t('aiInsights')}
        </h2>
        <p className="text-muted-foreground mt-1">
          Умные рекомендации на основе анализа данных и машинного обучения
        </p>
      </div>

      <Card className="border-purple-200 dark:border-purple-900 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="TrendingUp" className="text-purple-600" />
            {t('priceOptimization')}
          </CardTitle>
          <CardDescription>
            AI анализирует конкурентов и рынок для оптимальных цен
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {priceInsights.map((insight, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border border-purple-100 dark:border-purple-900">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold">{insight.productName}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{insight.reason}</p>
                </div>
                <Badge variant={insight.recommendedPrice > insight.currentPrice ? 'default' : 'secondary'}>
                  {insight.recommendedPrice > insight.currentPrice ? '↑' : '↓'} {insight.potentialProfit.toFixed(1)}%
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">{t('currentPrice')}</div>
                  <div className="font-bold">{insight.currentPrice.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t('recommendedPrice')}</div>
                  <div className="font-bold text-purple-600">{insight.recommendedPrice.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t('confidence')}</div>
                  <div className="flex items-center gap-2">
                    <Progress value={insight.confidence} className="h-2 flex-1" />
                    <span className="font-bold text-xs">{insight.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-blue-200 dark:border-blue-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="BarChart3" className="text-blue-600" />
              {t('salesForecast')}
            </CardTitle>
            <CardDescription>Прогноз продаж на следующие 30 дней</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {salesForecasts.map((forecast, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900">
                <div className="flex-1">
                  <div className="font-medium">{forecast.product}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {t('expectedSales')}: <span className="font-semibold">{forecast.expectedSales} шт</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Icon 
                    name={forecast.trend === 'up' ? 'TrendingUp' : forecast.trend === 'down' ? 'TrendingDown' : 'Minus'} 
                    className={forecast.trend === 'up' ? 'text-green-600' : forecast.trend === 'down' ? 'text-red-600' : 'text-gray-600'}
                    size={20}
                  />
                  <Badge variant="outline">{forecast.confidence}%</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="AlertTriangle" className="text-orange-600" />
              {t('inventoryAlerts')}
            </CardTitle>
            <CardDescription>Предупреждения о низких остатках</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventoryAlerts.map((alert, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${
                alert.urgency === 'high' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900' :
                alert.urgency === 'medium' ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900' :
                'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{alert.product}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Остаток: <span className="font-semibold">{alert.currentStock} шт</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Хватит на: <span className="font-semibold">{alert.daysLeft} дней</span>
                    </div>
                  </div>
                  <Badge variant={alert.urgency === 'high' ? 'destructive' : 'default'}>
                    {alert.urgency === 'high' ? t('reorderSoon') : alert.urgency === 'medium' ? 'Внимание' : 'OK'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIInsightsTab;
