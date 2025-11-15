import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';

interface AnalyticsSummary {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  active_marketplaces: number;
  conversion_rate?: number;
  growth_rate?: number;
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

interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
}

const AnalyticsPanel: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);

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
        setConversionFunnel(data.conversionFunnel || []);
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const maxRevenue = Math.max(...dailyStats.map(s => s.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Аналитика</h2>
          <p className="text-muted-foreground mt-1">
            Полная статистика продаж и конверсии
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Icon name="ShoppingCart" className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Заказов</p>
              <p className="text-2xl font-bold">{summary?.total_orders || 0}</p>
              {summary?.growth_rate !== undefined && (
                <p className="text-xs text-green-500 mt-1">
                  +{summary.growth_rate.toFixed(1)}% к предыдущему периоду
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5">
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

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
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

        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Icon name="Target" className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Конверсия</p>
              <p className="text-2xl font-bold">{summary?.conversion_rate?.toFixed(1) || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">График продаж</h3>
          {dailyStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="BarChart3" className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Нет данных за выбранный период</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => formatMoney(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU')}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">Заказы по дням</h3>
          {dailyStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="TrendingUp" className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Нет данных за выбранный период</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU')}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">Воронка конверсии</h3>
          {conversionFunnel.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Filter" className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Нет данных о конверсии</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversionFunnel.map((stage, index) => {
                const maxCount = conversionFunnel[0]?.count || 1;
                const widthPercent = (stage.count / maxCount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{formatNumber(stage.count)}</span>
                        <span className="font-semibold text-primary">{stage.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 flex items-center justify-center"
                        style={{ width: `${widthPercent}%` }}
                      >
                        {widthPercent > 30 && (
                          <span className="text-white text-sm font-semibold">
                            {formatNumber(stage.count)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">Распределение по маркетплейсам</h3>
          {marketplaceStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Store" className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Нет подключенных маркетплейсов</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={marketplaceStats}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => entry.name}
                  >
                    {marketplaceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                {marketplaceStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stat.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.orders} заказов
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatMoney(stat.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Динамика выручки и заказов</h3>
        {dailyStats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="LineChart" className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Нет данных за выбранный период</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? formatMoney(value) : value,
                  name === 'revenue' ? 'Выручка' : 'Заказы'
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU')}
              />
              <Legend 
                formatter={(value) => value === 'revenue' ? 'Выручка' : 'Заказы'}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="orders" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};

export default AnalyticsPanel;
