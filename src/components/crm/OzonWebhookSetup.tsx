import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const OzonWebhookSetup: React.FC = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const webhookUrl = 'https://functions.poehali.dev/949a3c4b-1ed1-49af-9002-99aadaff62be';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast({
      title: '✅ Скопировано',
      description: 'URL вебхука скопирован в буфер обмена'
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="Webhook" className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">⚡ Мгновенное получение заказов</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Настройте вебхук в Ozon Seller, чтобы новые заказы появлялись в CRM сразу же, без задержек
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">URL вебхука для Ozon:</label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyToClipboard} variant="outline">
                  <Icon name={copied ? 'Check' : 'Copy'} className="h-4 w-4 mr-2" />
                  {copied ? 'Скопировано' : 'Копировать'}
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium">📋 Инструкция по настройке:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Откройте <a href="https://seller.ozon.ru/app/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Настройки API в Ozon Seller</a></li>
                <li>Перейдите в раздел "Уведомления" или "Webhooks"</li>
                <li>Нажмите "Добавить вебхук"</li>
                <li>Вставьте скопированный URL в поле "URL вебхука"</li>
                <li>Выберите события:
                  <ul className="ml-6 mt-1 space-y-1">
                    <li>• Новый заказ (TYPE_NEW_POSTING)</li>
                    <li>• Изменение статуса заказа (TYPE_POSTING_STATUS_CHANGED)</li>
                    <li>• Отмена заказа (TYPE_POSTING_CANCELLED)</li>
                  </ul>
                </li>
                <li>Сохраните настройки</li>
              </ol>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-500/10 p-3 rounded-lg">
              <Icon name="Zap" className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>
                После настройки все новые заказы с Ozon будут автоматически появляться в CRM в течение 1-2 секунд
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OzonWebhookSetup;
