import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import AnalyticsPanel from '@/components/crm/AnalyticsPanel';
import MarketplacesPanel from '@/components/crm/MarketplacesPanel';
import ProductsPanel from '@/components/crm/ProductsPanel';
import OrdersPanel from '@/components/crm/OrdersPanel';
import AIToolsPanel from '@/components/crm/AIToolsPanel';
import UnitEconomicsPanel from '@/components/crm/UnitEconomicsPanel';

const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';

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
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('crm_active_tab') || 'dashboard';
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('crm_settings');
    return saved ? JSON.parse(saved) : {
      companyName: 'Интернет-магазин',
      email: '',
      currency: 'RUB',
      notifyOrders: true,
      notifyStock: true,
      emailReports: false
    };
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    localStorage.setItem('crm_active_tab', activeTab);
  }, [activeTab]);

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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Загрузка CRM системы...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Icon name="Zap" className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Единая CRM Система</h1>
                <p className="text-xs text-muted-foreground">Управление маркетплейсами с AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadDashboard}
                title="Обновить данные"
              >
                <Icon name="RefreshCw" className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  title="Уведомления"
                >
                  <Icon name="Bell" className="h-4 w-4" />
                </Button>
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSettingsOpen(!settingsOpen)}
                title="Настройки"
              >
                <Icon name="Settings" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <Icon name="LayoutDashboard" className="h-4 w-4" />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="marketplaces" className="gap-2">
              <Icon name="Store" className="h-4 w-4" />
              Маркетплейсы
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Icon name="Package" className="h-4 w-4" />
              Товары
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Icon name="ShoppingCart" className="h-4 w-4" />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="LineChart" className="h-4 w-4" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="gap-2">
              <Icon name="Brain" className="h-4 w-4" />
              AI Инструменты
            </TabsTrigger>
            <TabsTrigger value="unit-economics" className="gap-2">
              <Icon name="Calculator" className="h-4 w-4" />
              Юнит-экономика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => setActiveTab('marketplaces')} style={{animationDelay: '0ms'}}>
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

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => setActiveTab('products')} style={{animationDelay: '100ms'}}>
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

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => setActiveTab('orders')} style={{animationDelay: '200ms'}}>
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

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer col-span-2 group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => setActiveTab('analytics')} style={{animationDelay: '300ms'}}>
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
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
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
                          setActiveTab('orders');
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
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('products')}>
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
                          setActiveTab('products');
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
              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => setActiveTab('analytics')} style={{animationDelay: '400ms'}}>
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

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => setActiveTab('ai-tools')} style={{animationDelay: '500ms'}}>
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

              <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-3" onClick={() => setActiveTab('unit-economics')} style={{animationDelay: '600ms'}}>
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
          </TabsContent>

          <TabsContent value="marketplaces">
            <MarketplacesPanel />
          </TabsContent>

          <TabsContent value="products">
            <ProductsPanel />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersPanel />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsPanel />
          </TabsContent>

          <TabsContent value="ai-tools">
            <AIToolsPanel />
          </TabsContent>

          <TabsContent value="unit-economics">
            <UnitEconomicsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Уведомления</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="Info" className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Новый заказ на Ozon</p>
                  <p className="text-xs text-muted-foreground mt-1">Заказ #12345 на сумму 2,500 ₽</p>
                  <p className="text-xs text-muted-foreground mt-1">5 минут назад</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Низкий остаток товара</p>
                  <p className="text-xs text-muted-foreground mt-1">Товар "Смартфон XYZ" - осталось 3 шт</p>
                  <p className="text-xs text-muted-foreground mt-1">1 час назад</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle" className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Синхронизация завершена</p>
                  <p className="text-xs text-muted-foreground mt-1">Wildberries успешно синхронизирован</p>
                  <p className="text-xs text-muted-foreground mt-1">2 часа назад</p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setNotificationsOpen(false)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Настройки CRM системы</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Общие настройки</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-name">Название компании</Label>
                  <Input 
                    id="company-name" 
                    placeholder="Моя компания" 
                    className="mt-1"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email для уведомлений</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="email@example.com" 
                    className="mt-1"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Валюта</Label>
                  <Input 
                    id="currency" 
                    placeholder="RUB" 
                    className="mt-1"
                    defaultValue="RUB"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Уведомления</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="text-sm">Уведомлять о новых заказах</span>
                  <input 
                    type="checkbox" 
                    className="h-4 w-4" 
                    checked={settings.notifyOrders}
                    onChange={(e) => setSettings({...settings, notifyOrders: e.target.checked})}
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="text-sm">Уведомлять о низких остатках</span>
                  <input 
                    type="checkbox" 
                    className="h-4 w-4" 
                    checked={settings.notifyStock}
                    onChange={(e) => setSettings({...settings, notifyStock: e.target.checked})}
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="text-sm">Отчеты по email</span>
                  <input 
                    type="checkbox" 
                    className="h-4 w-4" 
                    checked={settings.emailReports}
                    onChange={(e) => setSettings({...settings, emailReports: e.target.checked})}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={() => {
                localStorage.setItem('crm_settings', JSON.stringify(settings));
                toast({
                  title: 'Настройки сохранены',
                  description: 'Ваши настройки успешно обновлены'
                });
                setSettingsOpen(false);
              }}>
                <Icon name="Save" className="mr-2 h-4 w-4" />
                Сохранить
              </Button>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMDashboard;