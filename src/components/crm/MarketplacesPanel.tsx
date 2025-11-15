import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Marketplace, marketplaceInfo, CRM_API } from './marketplace/types';
import MarketplaceConnectDialog from './marketplace/MarketplaceConnectDialog';
import MarketplaceSettingsDialog from './marketplace/MarketplaceSettingsDialog';
import MarketplaceCard from './marketplace/MarketplaceCard';
import MarketplaceDetailView from './marketplace/MarketplaceDetailView';

const MarketplacesPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [connectDialog, setConnectDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [selectedMarketplaceData, setSelectedMarketplaceData] = useState<Marketplace | null>(null);
  const [syncing, setSyncing] = useState<{[key: number]: boolean}>({});
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedMarketplace, setSelectedMarketplace] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    loadMarketplaces();
  }, []);

  const loadMarketplaces = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CRM_API}/?action=getMarketplaces`);
      const data = await response.json();
      
      console.log('Marketplaces loaded:', data);
      
      if (data.marketplaces) {
        setMarketplaces(data.marketplaces);
      } else if (data.error) {
        console.error('API Error:', data.error);
        toast({
          title: 'Ошибка API',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить маркетплейсы',
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

  const handleViewMarketplace = (marketplace: Marketplace) => {
    setSelectedMarketplace({ id: marketplace.id, name: marketplace.name });
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedMarketplace(null);
    loadMarketplaces();
  };

  const handleSync = async (marketplaceId: number, marketplaceName: string) => {
    setSyncing(prev => ({...prev, [marketplaceId]: true}));
    
    try {
      const marketplace = marketplaces.find(m => m.id === marketplaceId);
      if (!marketplace || !marketplace.is_connected) {
        toast({
          title: 'Ошибка',
          description: 'Маркетплейс не подключен',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Начинаю синхронизацию',
        description: `${marketplaceInfo[marketplaceName]?.displayName || marketplaceName}: загружаю данные...`
      });
      
      const response = await fetch(`${CRM_API}/?action=syncMarketplace&marketplaceId=${marketplaceId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      await loadMarketplaces();
      
      const summary = [
        `Товары: ${data.products || 0}`,
        `Заказы: ${data.orders || 0}`,
        `Клиенты: ${data.customers || 0}`
      ].join(', ');
      
      toast({
        title: '✅ Синхронизация завершена',
        description: summary,
        duration: 5000
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Ошибка синхронизации',
        description: error instanceof Error ? error.message : 'Не удалось синхронизировать данные',
        variant: 'destructive'
      });
    } finally {
      setSyncing(prev => ({...prev, [marketplaceId]: false}));
    }
  };

  const handleDisconnect = async (marketplace: Marketplace) => {
    try {
      const response = await fetch(`${CRM_API}/?action=disconnectMarketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplaceId: marketplace.id })
      });

      if (response.ok) {
        toast({
          title: '✅ Отключено',
          description: `${marketplaceInfo[marketplace.slug || marketplace.name]?.displayName || marketplace.name} отключен`
        });
        setSettingsDialog(false);
        await loadMarketplaces();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отключить маркетплейс',
        variant: 'destructive'
      });
    }
  };

  const openSettingsDialog = (marketplace: Marketplace) => {
    setSelectedMarketplaceData(marketplace);
    setSettingsDialog(true);
  };

  const openConnectDialog = (marketplaceName: string) => {
    setConnectDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (viewMode === 'detail' && selectedMarketplace) {
    return (
      <MarketplaceDetailView
        marketplaceId={selectedMarketplace.id}
        marketplaceName={selectedMarketplace.name}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Маркетплейсы</h2>
          <p className="text-muted-foreground mt-1">
            Управление подключениями и синхронизацией
          </p>
        </div>
        <MarketplaceConnectDialog
          open={connectDialog}
          onOpenChange={setConnectDialog}
          onSuccess={loadMarketplaces}
        />

        <MarketplaceSettingsDialog
          open={settingsDialog}
          onOpenChange={setSettingsDialog}
          marketplace={selectedMarketplaceData}
          onSync={handleSync}
          onDisconnect={handleDisconnect}
        />
      </div>

      {marketplaces.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Store" className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Подключите первый маркетплейс</h3>
            <p className="text-muted-foreground mb-6">
              Начните управлять продажами на всех площадках из одного места
            </p>
            <Button onClick={() => setConnectDialog(true)} size="lg">
              <Icon name="Plus" className="mr-2 h-5 w-5" />
              Подключить маркетплейс
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaces.map((marketplace) => (
            <MarketplaceCard
              key={marketplace.id}
              marketplace={marketplace}
              formatMoney={formatMoney}
              onOpenSettings={openSettingsDialog}
              onOpenConnect={openConnectDialog}
              onSync={handleSync}
              onView={handleViewMarketplace}
              syncing={syncing[marketplace.id] || false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplacesPanel;