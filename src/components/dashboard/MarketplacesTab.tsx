import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  
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

  const handleSaveConnection = () => {
    if (selectedMarketplace) {
      setMarketplaces(prev =>
        prev.map(m =>
          m.id === selectedMarketplace.id
            ? { ...m, connected: true, stats: { orders: 0, revenue: 0, products: 0 } }
            : m
        )
      );
      setShowConnectDialog(false);
      setSelectedMarketplace(null);
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
                    <Button size="sm" className="flex-1">
                      <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiSecret">{t('apiSecret')}</Label>
              <Input
                id="apiSecret"
                placeholder="Введите Secret ключ"
                type="password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellerId">{t('sellerID')}</Label>
              <Input
                id="sellerId"
                placeholder="Введите ID продавца"
              />
            </div>
            {selectedMarketplace?.id === 'shopify' && (
              <div className="grid gap-2">
                <Label htmlFor="storeUrl">{t('storeUrl')}</Label>
                <Input
                  id="storeUrl"
                  placeholder="yourstore.myshopify.com"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveConnection}>
              {t('connect')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplacesTab;
