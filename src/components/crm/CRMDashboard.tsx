import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CRM_API } from './marketplace/types';
import MarketplacesPanel from './MarketplacesPanel';

interface DashboardStats {
  total_marketplaces: number;
  connected_marketplaces: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: any[];
  lowStockProducts: any[];
}

const CRMDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CRM_API}/?action=getDashboard`);
      const result = await response.json();
      
      if (result.stats) {
        setData(result);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
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
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              E-Commerce Hub
            </h1>
            <p className="text-muted-foreground mt-2">
              Управляй всеми маркетплейсами из одного места
            </p>
          </div>
          <Button onClick={loadDashboard} variant="outline" size="sm" className="gap-2">
            <Icon name="RefreshCw" size={16} />
            Обновить
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Icon name="Store" size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Маркетплейсы</p>
                <p className="text-3xl font-bold mt-1">
                  {data?.stats.connected_marketplaces || 0}
                  <span className="text-lg text-muted-foreground font-normal">/{data?.stats.total_marketplaces || 0}</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-green-500/10 to-green-600/5 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <Icon name="Package" size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Товаров</p>
                <p className="text-3xl font-bold mt-1">{data?.stats.total_products || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/20">
                <Icon name="ShoppingCart" size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Заказов</p>
                <p className="text-3xl font-bold mt-1">{data?.stats.total_orders || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Icon name="TrendingUp" size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Выручка</p>
                <p className="text-2xl font-bold mt-1">{formatMoney(data?.stats.total_revenue || 0)}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="marketplaces" className="w-full">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="marketplaces" className="gap-2">
              <Icon name="Store" size={16} />
              Маркетплейсы
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Icon name="Package" size={16} />
              Товары
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Icon name="ShoppingCart" size={16} />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="BarChart3" size={16} />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplaces" className="mt-6">
            <MarketplacesPanel />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card className="p-8 text-center border-dashed">
              <Icon name="Package" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Управление товарами</h3>
              <p className="text-sm text-muted-foreground">
                Подключите маркетплейс для синхронизации товаров
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card className="p-8 text-center border-dashed">
              <Icon name="ShoppingCart" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Заказы</h3>
              <p className="text-sm text-muted-foreground">
                Подключите маркетплейс для получения заказов
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="p-8 text-center border-dashed">
              <Icon name="BarChart3" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Аналитика и отчеты</h3>
              <p className="text-sm text-muted-foreground">
                Подключите маркетплейс для просмотра аналитики
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CRMDashboard;
