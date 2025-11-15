import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';
const ML_API = 'https://functions.poehali.dev/108ae54f-0a71-400d-8644-1b7b5aaca990';
const AUTH_API = 'https://functions.poehali.dev/a081dfbf-a5de-44db-b7f5-c892743a5173';

interface DashboardStats {
  total_marketplaces: number;
  connected_marketplaces: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  status: string;
  total_amount: number;
  order_date: string;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  total_stock: number;
}

const CRMDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CRM_API}/?action=getDashboard`);
      const data = await response.json();
      
      if (data.stats) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setLowStockProducts(data.lowStockProducts || []);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные дашборда',
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500/10 text-blue-500',
      processing: 'bg-yellow-500/10 text-yellow-500',
      shipped: 'bg-purple-500/10 text-purple-500',
      delivered: 'bg-green-500/10 text-green-500',
      cancelled: 'bg-red-500/10 text-red-500',
      returned: 'bg-gray-500/10 text-gray-500'
    };
    return colors[status] || colors.new;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: 'Новый',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён',
      returned: 'Возврат'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Загрузка дашборда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CRM Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Управление маркетплейсами и товарами
            </p>
          </div>
          <Button onClick={loadDashboard} variant="outline" size="sm">
            <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Маркетплейсы</p>
                <p className="text-2xl font-bold mt-1">
                  {stats?.connected_marketplaces || 0}/{stats?.total_marketplaces || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Icon name="Store" className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Подключено активных
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Товары</p>
                <p className="text-2xl font-bold mt-1">{stats?.total_products || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Icon name="Package" className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              В каталоге
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Заказы</p>
                <p className="text-2xl font-bold mt-1">{stats?.total_orders || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Icon name="ShoppingCart" className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Всего
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Выручка</p>
                <p className="text-2xl font-bold mt-1">
                  {formatMoney(stats?.total_revenue || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              За весь период
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Последние заказы</h2>
              <Button variant="ghost" size="sm">
                <Icon name="ExternalLink" className="h-4 w-4" />
              </Button>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Inbox" className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Заказов пока нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.order_number}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.customer_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatMoney(order.total_amount)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(order.order_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Низкие остатки</h2>
              <Button variant="ghost" size="sm">
                <Icon name="AlertTriangle" className="h-4 w-4" />
              </Button>
            </div>
            
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="CheckCircle" className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Все товары в достатке</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Icon name="Package" className="h-4 w-4 text-red-500" />
                        <p className="font-semibold text-red-500">
                          {product.total_stock} шт
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Icon name="LineChart" className="h-6 w-6 text-blue-500" />
              </div>
              <Icon name="ArrowRight" className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Аналитика</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Детальная статистика по продажам и заказам
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Icon name="Brain" className="h-6 w-6 text-purple-500" />
              </div>
              <Icon name="ArrowRight" className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">ML Прогнозы</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Предсказания продаж и возвратов
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Icon name="Users" className="h-6 w-6 text-green-500" />
              </div>
              <Icon name="ArrowRight" className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Команда</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Управление пользователями и ролями
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
