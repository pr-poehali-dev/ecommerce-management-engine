import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Settings {
  companyName: string;
  email: string;
  currency: string;
  notifyOrders: boolean;
  notifyStock: boolean;
  emailReports: boolean;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onSave: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onSave
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  onChange={(e) => onSettingsChange({...settings, companyName: e.target.value})}
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
                  onChange={(e) => onSettingsChange({...settings, email: e.target.value})}
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
                  onChange={(e) => onSettingsChange({...settings, notifyOrders: e.target.checked})}
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-sm">Уведомлять о низких остатках</span>
                <input 
                  type="checkbox" 
                  className="h-4 w-4" 
                  checked={settings.notifyStock}
                  onChange={(e) => onSettingsChange({...settings, notifyStock: e.target.checked})}
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-sm">Отчеты по email</span>
                <input 
                  type="checkbox" 
                  className="h-4 w-4" 
                  checked={settings.emailReports}
                  onChange={(e) => onSettingsChange({...settings, emailReports: e.target.checked})}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1" onClick={onSave}>
              <Icon name="Save" className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
