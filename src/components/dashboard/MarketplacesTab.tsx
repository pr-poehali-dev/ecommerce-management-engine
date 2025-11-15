import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const MARKETPLACE_API = 'https://functions.poehali.dev/fd20e79f-008e-45c3-b1f3-525acbe9e95b';

interface Marketplace {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  country: string;
  color: string;
  stats?: {
    orders: number;
    revenue: number;
    products: number;
  };
}

const MarketplacesTab: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [credentials, setCredentials] = useState({
    apiKey: '',
    clientId: '',
    sellerId: ''
  });
  
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([
    {
      id: 'amazon',
      name: 'Amazon',
      icon: 'ShoppingBag',
      connected: true,
      country: 'США',
      color: 'from-orange-500 to-yellow-500',
      stats: { orders: 1243, revenue: 2450000, products: 156 }
    },
    {
      id: 'wildberries',
      name: 'Wildberries',
      icon: 'Package',
      connected: true,
      country: 'Россия',
      color: 'from-purple-500 to-pink-500',
      stats: { orders: 892, revenue: 1890000, products: 234 }
    },
    {
      id: 'ozon',
      name: 'Ozon',
      icon: 'ShoppingCart',
      connected: true,
      country: 'Россия',
      color: 'from-blue-500 to-cyan-500',
      stats: { orders: 567, revenue: 1120000, products: 189 }
    },
    {
      id: 'aliexpress',
      name: 'AliExpress',
      icon: 'Globe',
      connected: false,
      country: 'Китай',
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'ebay',
      name: 'eBay',
      icon: 'Tag',
      connected: false,
      country: 'США',
      color: 'from-blue-600 to-blue-400'
    },
    {
      id: 'etsy',
      name: 'Etsy',
      icon: 'Heart',
      connected: false,
      country: 'США',
      color: 'from-orange-400 to-red-400'
    },
    {
      id: 'yandex',
      name: 'Яндекс.Маркет',
      icon: 'Store',
      connected: false,
      country: 'Россия',
      color: 'from-red-600 to-yellow-500'
    },
    {
      id: 'lamoda',
      name: 'Lamoda',
      icon: 'Shirt',
      connected: false,
      country: 'Россия',
      color: 'from-black to-gray-600'
    },
    {
      id: 'kaspi',
      name: 'Kaspi.kz',
      icon: 'CreditCard',
      connected: false,
      country: 'Казахстан',
      color: 'from-red-500 to-red-700'
    },
    {
      id: 'shopify',
      name: 'Shopify',
      icon: 'ShoppingBag',
      connected: false,
      country: 'Международный',
      color: 'from-green-500 to-green-700'
    }
  ]);

  const handleConnect = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setShowConnectDialog(true);
  };

  const handleSaveConnection = async () => {
    if (!selectedMarketplace) return;
    
    setSyncing(true);
    try {
      const response = await fetch(`${MARKETPLACE_API}?marketplace=${selectedMarketplace.id}&action=connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMarketplaces(prev =>
          prev.map(m =>
            m.id === selectedMarketplace.id
              ? { ...m, connected: true, stats: data.stats }
              : m
          )
        );
        toast({ 
          title: 'Успешно подключено!', 
          description: `${selectedMarketplace.name} интегрирован с вашим магазином` 
        });
        setShowConnectDialog(false);
        setSelectedMarketplace(null);
        setCredentials({ apiKey: '', clientId: '', sellerId: '' });
      } else {
        toast({ 
          title: 'Ошибка подключения', 
          description: data.error || 'Проверьте учетные данные',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ 
        title: 'Ошибка', 
        description: 'Не удалось подключить маркетплейс',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncProducts = async (marketplace: Marketplace) => {
    if (!marketplace.connected) return;
    
    setSyncing(true);
    try {
      const response = await fetch(`${MARKETPLACE_API}?marketplace=${marketplace.id}&action=getProducts`);
      const data = await response.json();
      
      if (response.ok && data.products) {
        setMarketplaceProducts(data.products);
        setSelectedMarketplace(marketplace);
        setShowProductsDialog(true);
        toast({ 
          title: 'Товары загружены', 
          description: `Найдено ${data.total} товаров на ${marketplace.name}` 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Ошибка', 
        description: 'Не удалось загрузить товары',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = (marketplaceId: string) => {
    setMarketplaces(prev =>
      prev.map(m =>
        m.id === marketplaceId ? { ...m, connected: false, stats: undefined } : m
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">{t('marketplaceIntegrations')}</h2>
          <p className="text-muted-foreground mt-1">
            Подключите маркетплейсы для автоматической синхронизации товаров и заказов
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketplaces.map((marketplace) => (
          <Card
            key={marketplace.id}
            className={`overflow-hidden transition-all hover:shadow-xl ${
              marketplace.connected ? 'border-green-200 dark:border-green-900' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${marketplace.color}`}>
                  <Icon name={marketplace.icon} className="text-white" size={24} />
                </div>
                <Badge
                  variant={marketplace.connected ? 'default' : 'secondary'}
                  className={marketplace.connected ? 'bg-green-600' : ''}
                >
                  {marketplace.connected ? t('connected') : t('notConnected')}
                </Badge>
              </div>
              <CardTitle className="mt-4">{marketplace.name}</CardTitle>
              <CardDescription>{marketplace.country}</CardDescription>
            </CardHeader>

            <CardContent>
              {marketplace.connected && marketplace.stats ? (
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">{t('totalOrders')}</span>
                    <span className="font-semibold">{marketplace.stats.orders}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">{t('totalRevenue')}</span>
                    <span className="font-semibold">
                      {marketplace.stats.revenue.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">{t('totalProducts')}</span>
                    <span className="font-semibold">{marketplace.stats.products}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
                  Подключите маркетплейс для начала работы
                </div>
              )}

              <div className="flex gap-2">
                {marketplace.connected ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDisconnect(marketplace.id)}
                    >
                      <Icon name="Unplug" className="mr-2 h-4 w-4" />
                      {t('disconnect')}
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleSyncProducts(marketplace)}
                      disabled={syncing}
                    >
                      <Icon name="RefreshCw" className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      {t('syncNow')}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleConnect(marketplace)}
                  >
                    <Icon name="Link" className="mr-2 h-4 w-4" />
                    {t('connect')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMarketplace && (
                <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedMarketplace.color}`}>
                  <Icon name={selectedMarketplace.icon} className="text-white" size={20} />
                </div>
              )}
              {t('connectMarketplace')}: {selectedMarketplace?.name}
            </DialogTitle>
            <DialogDescription>
              Введите данные для подключения к маркетплейсу
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">{t('apiKey')}</Label>
              <Input
                id="apiKey"
                placeholder="Введите API ключ"
                type="password"
                value={credentials.apiKey}
                onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              />
            </div>
            {(selectedMarketplace?.id === 'ozon' || selectedMarketplace?.id === 'amazon') && (
              <div className="grid gap-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="Введите Client ID"
                  value={credentials.clientId}
                  onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="sellerId">{t('sellerID')}</Label>
              <Input
                id="sellerId"
                placeholder="Введите ID продавца"
                value={credentials.sellerId}
                onChange={(e) => setCredentials({ ...credentials, sellerId: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveConnection} disabled={syncing || !credentials.apiKey}>
              {syncing ? 'Подключение...' : t('connect')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductsDialog} onOpenChange={setShowProductsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Товары из {selectedMarketplace?.name}
            </DialogTitle>
            <DialogDescription>
              Синхронизированные товары с маркетплейса
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {marketplaceProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>SKU: {product.sku}</span>
                      <span>Категория: {product.category}</span>
                      <span>Остаток: {product.stock} шт</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <Badge 
                      variant="outline" 
                      className={product.status === 'active' ? 'text-green-600 border-green-600' : ''}
                    >
                      {product.status === 'active' ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductsDialog(false)}>
              Закрыть
            </Button>
            <Button>
              <Icon name="Download" className="mr-2 h-4 w-4" />
              Импортировать все
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplacesTab;