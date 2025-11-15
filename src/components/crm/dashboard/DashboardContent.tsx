import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { DashboardStats, RecentOrder, LowStockProduct } from './types';

interface DashboardContentProps {
  stats: DashboardStats | null;
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  onTabChange: (tab: string) => void;
  formatMoney: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  stats,
  recentOrders,
  lowStockProducts,
  onTabChange,
  formatMoney,
  formatDate,
  getStatusColor,
  getStatusText
}) => {
  const { toast } = useToast();

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => onTabChange('marketplaces')} style={{animationDelay: '0ms'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Маркетплейсы</p>
              <p className="text-2xl font-bold mt-1">
                {stats?.connected_marketplaces || 0}/{stats?.total_marketplaces || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="Store" className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Подключено • Нажмите для управления
          </p>
        </Card>

        <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => onTabChange('products')} style={{animationDelay: '100ms'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Товары</p>
              <p className="text-2xl font-bold mt-1">{stats?.total_products || 0}</p>
            </div>
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="Package" className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            В каталоге • Управление товарами
          </p>
        </Card>

        <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => onTabChange('orders')} style={{animationDelay: '200ms'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Заказы</p>
              <p className="text-2xl font-bold mt-1">{stats?.total_orders || 0}</p>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="ShoppingCart" className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Всего • Просмотр заказов
          </p>
        </Card>

        <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer col-span-2 group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => onTabChange('analytics')} style={{animationDelay: '300ms'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Выручка</p>
              <p className="text-2xl font-bold mt-1">
                {formatMoney(stats?.total_revenue || 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="TrendingUp" className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            За весь период • Детальная аналитика
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Последние заказы</h2>
            <Button variant="ghost" size="sm" onClick={() => onTabChange('orders')}>
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
                  onClick={() => {
                    onTabChange('orders');
                    toast({
                      title: 'Заказ выбран',
                      description: `Заказ ${order.order_number}`
                    });
                  }}
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
            <Button variant="ghost" size="sm" onClick={() => onTabChange('products')}>
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
                  onClick={() => {
                    onTabChange('products');
                    toast({
                      title: 'Товар требует внимания',
                      description: `${product.name} - осталось ${product.total_stock} шт`
                    });
                  }}
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
        <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => onTabChange('analytics')} style={{animationDelay: '400ms'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="LineChart" className="h-6 w-6 text-blue-500" />
            </div>
            <Icon name="ArrowRight" className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-semibold text-lg">Детальная аналитика</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Графики, тренды и статистика по всем каналам продаж
          </p>
        </Card>

        <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => onTabChange('ai-tools')} style={{animationDelay: '500ms'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="Brain" className="h-6 w-6 text-purple-500" />
            </div>
            <Icon name="ArrowRight" className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-semibold text-lg">AI Прогнозы</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Предсказания продаж, возвратов и аномалий с ML
          </p>
        </Card>

        <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => onTabChange('unit-economics')} style={{animationDelay: '600ms'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="Calculator" className="h-6 w-6 text-green-500" />
            </div>
            <Icon name="ArrowRight" className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-semibold text-lg">Юнит-экономика</h3>
          <p className="text-sm text-muted-foreground mt-2">
            LTV, CAC, ROI и другие ключевые метрики бизнеса
          </p>
        </Card>
      </div>
    </div>
  );
};

export default DashboardContent;
