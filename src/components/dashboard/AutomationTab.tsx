import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  executions: number;
  lastRun?: string;
}

const AutomationTab: React.FC = () => {
  const { t } = useLanguage();
  
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Автозаказ при низком остатке',
      description: 'Автоматически создает заказ поставщику когда товар заканчивается',
      icon: 'Package',
      enabled: true,
      executions: 23,
      lastRun: '2 часа назад'
    },
    {
      id: '2',
      name: 'Динамическое ценообразование',
      description: 'Меняет цены в зависимости от спроса и конкурентов',
      icon: 'DollarSign',
      enabled: true,
      executions: 156,
      lastRun: '15 минут назад'
    },
    {
      id: '3',
      name: 'Автоответы клиентам',
      description: 'Отвечает на типовые вопросы клиентов автоматически',
      icon: 'MessageSquare',
      enabled: false,
      executions: 0
    },
    {
      id: '4',
      name: 'Синхронизация заказов',
      description: 'Синхронизирует заказы между всеми маркетплейсами',
      icon: 'RefreshCw',
      enabled: true,
      executions: 89,
      lastRun: '5 минут назад'
    },
    {
      id: '5',
      name: 'Умная рассылка',
      description: 'Отправляет персонализированные предложения клиентам',
      icon: 'Mail',
      enabled: false,
      executions: 0
    },
    {
      id: '6',
      name: 'Анти-fraud система',
      description: 'Проверяет подозрительные заказы и блокирует мошенников',
      icon: 'Shield',
      enabled: true,
      executions: 12,
      lastRun: '1 день назад'
    }
  ]);

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            {t('automation')}
          </h2>
          <p className="text-muted-foreground mt-1">
            Автоматизируйте рутинные задачи и сэкономьте время
          </p>
        </div>
        <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
          <Icon name="Plus" className="mr-2 h-4 w-4" />
          {t('createRule')}
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={`transition-all duration-300 ${
            rule.enabled 
              ? 'border-green-200 dark:border-green-900 shadow-lg shadow-green-100 dark:shadow-green-900/20' 
              : 'border-gray-200 dark:border-gray-800'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${
                    rule.enabled 
                      ? 'bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Icon name={rule.icon} className={rule.enabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500'} size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{rule.name}</h3>
                      {rule.enabled && <Badge variant="default" className="bg-green-600">Активно</Badge>}
                      {!rule.enabled && <Badge variant="outline">Выключено</Badge>}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {rule.description}
                    </p>
                    
                    {rule.enabled && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Icon name="Zap" size={14} className="text-green-600" />
                          <span className="text-muted-foreground">
                            Выполнено: <span className="font-semibold text-foreground">{rule.executions}</span>
                          </span>
                        </div>
                        {rule.lastRun && (
                          <div className="flex items-center gap-1.5">
                            <Icon name="Clock" size={14} className="text-blue-600" />
                            <span className="text-muted-foreground">
                              Последний запуск: <span className="font-semibold text-foreground">{rule.lastRun}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <Button variant="ghost" size="sm">
                    <Icon name="Settings" size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Sparkles" className="text-blue-600" />
            Экономия времени
          </CardTitle>
          <CardDescription>
            Благодаря автоматизации вы сэкономили за последний месяц
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                23.5
              </div>
              <div className="text-sm text-muted-foreground mt-1">часов времени</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                280
              </div>
              <div className="text-sm text-muted-foreground mt-1">выполненных задач</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                45K ₽
              </div>
              <div className="text-sm text-muted-foreground mt-1">сэкономлено</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationTab;
