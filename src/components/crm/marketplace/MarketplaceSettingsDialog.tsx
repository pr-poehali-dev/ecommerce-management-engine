import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { Marketplace, marketplaceInfo } from './types';

interface MarketplaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketplace: Marketplace | null;
  onSync: (id: number, name: string) => void;
  onDisconnect: (marketplace: Marketplace) => void;
}

const MarketplaceSettingsDialog: React.FC<MarketplaceSettingsDialogProps> = ({
  open,
  onOpenChange,
  marketplace,
  onSync,
  onDisconnect
}) => {
  if (!marketplace) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">Настройки маркетплейса</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-5xl">
              {marketplaceInfo[marketplace.slug || marketplace.name]?.logo || '📦'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                {marketplaceInfo[marketplace.slug || marketplace.name]?.displayName || marketplace.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {marketplace.is_connected ? 'Подключен и активен' : 'Не подключен'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
              <span className="text-sm text-muted-foreground">Client ID</span>
              <span className="text-sm font-mono">{marketplace.client_id || '—'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
              <span className="text-sm text-muted-foreground">API Key</span>
              <span className="text-sm font-mono">
                {marketplace.api_key ? '••••••••' + marketplace.api_key.slice(-4) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
              <span className="text-sm text-muted-foreground">Последняя синхронизация</span>
              <span className="text-sm">
                {marketplace.last_sync_at 
                  ? new Date(marketplace.last_sync_at).toLocaleString('ru-RU')
                  : 'Не синхронизировано'}
              </span>
            </div>
          </div>

          {marketplace.is_connected && (
            <div className="space-y-3 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  onSync(marketplace.id, marketplace.slug || marketplace.name);
                  onOpenChange(false);
                }}
              >
                <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
                Синхронизировать сейчас
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => onDisconnect(marketplace)}
              >
                <Icon name="Unlink" className="mr-2 h-4 w-4" />
                Отключить маркетплейс
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceSettingsDialog;
