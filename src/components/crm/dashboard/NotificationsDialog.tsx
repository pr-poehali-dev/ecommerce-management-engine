import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsDialog: React.FC<NotificationsDialogProps> = ({
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsDialog;
