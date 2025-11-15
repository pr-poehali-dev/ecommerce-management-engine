import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

interface WebStoreSidebarProps {
  status: string;
  selectedTheme: string;
  analytics: any;
  onPublish: () => void;
}

const WebStoreSidebar: React.FC<WebStoreSidebarProps> = ({
  status,
  selectedTheme,
  analytics,
  onPublish
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="BarChart3" className="text-blue-600" />
            Статистика магазина
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics && (
            <>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Посетители сегодня</div>
                <div className="text-2xl font-bold">{analytics.visitors?.today}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Заказы сегодня</div>
                <div className="text-2xl font-bold">{analytics.orders?.today}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Выручка сегодня</div>
                <div className="text-2xl font-bold">
                  {analytics.revenue?.today.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Конверсия</div>
                <div className="text-2xl font-bold">{analytics.conversion?.rate}%</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статус магазина</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Статус</span>
              <Badge className="bg-green-600">
                {status === 'published' ? 'Опубликован' : 'Черновик'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Тема</span>
              <span className="text-sm font-medium">{selectedTheme}</span>
            </div>
            <Separator />
            <Button variant="outline" className="w-full" onClick={onPublish}>
              <Icon name="ExternalLink" className="mr-2 h-4 w-4" />
              Открыть магазин
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebStoreSidebar;
