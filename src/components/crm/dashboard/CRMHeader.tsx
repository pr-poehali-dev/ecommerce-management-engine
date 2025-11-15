import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface CRMHeaderProps {
  onRefresh: () => void;
  onNotificationsToggle: () => void;
  onSettingsToggle: () => void;
}

const CRMHeader: React.FC<CRMHeaderProps> = ({
  onRefresh,
  onNotificationsToggle,
  onSettingsToggle
}) => {
  return (
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
              onClick={onRefresh}
              title="Обновить данные"
            >
              <Icon name="RefreshCw" className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onNotificationsToggle}
                title="Уведомления"
              >
                <Icon name="Bell" className="h-4 w-4" />
              </Button>
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSettingsToggle}
              title="Настройки"
            >
              <Icon name="Settings" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMHeader;
