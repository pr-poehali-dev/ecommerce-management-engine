import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';

interface AnalyticsSummary {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  active_marketplaces: number;
}

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
}

interface MarketplaceStats {
  name: string;
  orders: number;
  revenue: number;
}

const AnalyticsPanel: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CRM_API}/?action=getAnalytics&period=${period}`);
      const data = await response.json();
      
      if (data.summary) {
        setSummary(data.summary);
        setDailyStats(data.daily || []);
        setMarketplaceStats(data.byMarketplace || []);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить аналитику',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Аналитика</h2>
          <p className="text-muted-foreground mt-1">
            Статистика продаж за период
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('7d')}
          >
            7 дней
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('30d')}
          >
            30 дней
          </Button>
          <Button
            variant={period === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('90d')}
          >
            90 дней
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Icon name="ShoppingCart" className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Заказов</p>
              <p className="text-2xl font-bold">{summary?.total_orders || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Выручка</p>
              <p className="text-2xl font-bold">{formatMoney(summary?.total_revenue || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Icon name="DollarSign" className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Средний чек</p>
              <p className="text-2xl font-bold">{formatMoney(summary?.avg_order_value || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Icon name="Store" className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Маркетплейсы</p>
              <p className="text-2xl font-bold">{summary?.active_marketplaces || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">Продажи по дням</h3>
          {dailyStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="BarChart3" className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(stat.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Заказов</p>
                      <p className="font-semibold">{stat.orders}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Выручка</p>
                      <p className="font-semibold">{formatMoney(stat.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">По маркетплейсам</h3>
          {marketplaceStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Store" className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Нет подключенных маркетплейсов</p>
            </div>
          ) : (
            <div className="space-y-4">
              {marketplaceStats.map((stat, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{stat.name}</p>
                    <p className="text-lg font-bold">{formatMoney(stat.revenue)}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">Заказов: {stat.orders}</p>
                    <p className="text-muted-foreground">
                      Средний чек: {formatMoney(stat.orders > 0 ? stat.revenue / stat.orders : 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
