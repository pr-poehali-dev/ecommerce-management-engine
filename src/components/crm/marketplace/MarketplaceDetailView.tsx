import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { CRM_API } from './types';
import OzonWebhookSetup from '../OzonWebhookSetup';

interface MarketplaceDetailViewProps {
  marketplaceId: number;
  marketplaceName: string;
  onBack: () => void;
}

const MarketplaceDetailView: React.FC<MarketplaceDetailViewProps> = ({
  marketplaceId,
  marketplaceName,
  onBack
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadMarketplaceData();
  }, [marketplaceId]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CRM_API}/?action=getMarketplaceData&marketplaceId=${marketplaceId}`);
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setData(result);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      toast({
        title: 'Синхронизация началась',
        description: `Загружаю новые данные с ${marketplaceName}...`
      });
      
      const response = await fetch(`${CRM_API}/?action=syncMarketplace&marketplaceId=${marketplaceId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      await loadMarketplaceData();
      
      toast({
        title: '✅ Синхронизация завершена',
        description: `Товары: ${result.products}, Заказы: ${result.orders}, Клиенты: ${result.customers}`,
        duration: 5000
      });
    } catch (error) {
      toast({
        title: 'Ошибка синхронизации',
        description: error instanceof Error ? error.message : 'Попробуйте позже',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
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
      cancelled: 'bg-red-500/10 text-red-500'
    };
    return colors[status] || colors.new;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: 'Новый',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Нет данных</p>
        <Button onClick={onBack} className="mt-4">
          Назад
        </Button>
      </div>
    );
  }

  const { marketplace, products, orders, stats } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{marketplace.name}</h2>
            <p className="text-sm text-muted-foreground">
              {marketplace.last_sync_at ? `Обновлено: ${formatDate(marketplace.last_sync_at)}` : 'Ещё не синхронизировано'}
            </p>
          </div>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <Icon name={syncing ? 'Loader2' : 'RefreshCw'} className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Синхронизация...' : 'Синхронизировать'}
        </Button>
      </div>

      {marketplace.slug === 'ozon' && <OzonWebhookSetup />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Товары</p>
              <p className="text-2xl font-bold mt-1">{stats.total_products}</p>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Icon name="Package" className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Заказы</p>
              <p className="text-2xl font-bold mt-1">{stats.total_orders}</p>
            </div>
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Icon name="ShoppingCart" className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Выручка</p>
              <p className="text-2xl font-bold mt-1">{formatMoney(stats.total_revenue)}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Icon name="Package" className="h-4 w-4" />
            Товары ({products.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Icon name="ShoppingCart" className="h-4 w-4" />
            Заказы ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {products.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <Icon name="Package" className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Нет товаров</p>
                <p className="text-sm mt-2">Нажмите "Синхронизировать" для загрузки</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.map((product: any) => (
                <Card key={product.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>SKU: {product.sku || 'Нет'}</span>
                        <span>•</span>
                        <span>Остаток: {product.mp_stock || product.stock || 0} шт</span>
                        {product.synced_at && (
                          <>
                            <span>•</span>
                            <span>Обновлено: {formatDate(product.synced_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatMoney(product.mp_price || product.price)}</p>
                      {product.cost_price > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Себестоимость: {formatMoney(product.cost_price)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <Icon name="ShoppingCart" className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Нет заказов</p>
                <p className="text-sm mt-2">Новые заказы появятся после синхронизации</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order: any) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{order.order_number}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.fulfillment_type && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-500">
                            {order.fulfillment_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{order.customer_name || order.customer_email}</span>
                        <span>•</span>
                        <span>{order.items_count} товар(ов)</span>
                        <span>•</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      {order.tracking_number && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Трек-номер: {order.tracking_number}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatMoney(order.total_amount)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceDetailView;