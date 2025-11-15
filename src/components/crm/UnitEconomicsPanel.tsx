import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';

interface UnitEconomics {
  ltv: number;
  cac: number;
  ltv_cac_ratio: number;
  avg_order_value: number;
  repeat_purchase_rate: number;
  customer_lifespan_months: number;
  gross_margin: number;
  roi: number;
  payback_period_months: number;
  monthly_revenue_per_customer: number;
}

const UnitEconomicsPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  const [manualMode, setManualMode] = useState(false);
  const [economics, setEconomics] = useState<UnitEconomics | null>(null);
  
  const [avgOrderValue, setAvgOrderValue] = useState('');
  const [repeatRate, setRepeatRate] = useState('');
  const [customerLifespan, setCustomerLifespan] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [grossMargin, setGrossMargin] = useState('');

  useEffect(() => {
    if (!manualMode) {
      calculateFromData();
    }
  }, [manualMode]);

  const calculateFromData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CRM_API}/?action=getAnalytics&period=90d`);
      const data = await response.json();
      
      if (data.summary) {
        const avgOrder = data.summary.total_revenue / (data.summary.total_orders || 1);
        const repeatRate = 0.35;
        const lifespan = 18;
        const cac = 500;
        const margin = 0.3;
        
        const ltv = avgOrder * repeatRate * lifespan * margin;
        const ltvCacRatio = ltv / cac;
        const roi = ((ltv - cac) / cac) * 100;
        const payback = cac / (avgOrder * margin * repeatRate);
        const monthlyRev = (avgOrder * repeatRate) / lifespan;
        
        setEconomics({
          ltv,
          cac,
          ltv_cac_ratio: ltvCacRatio,
          avg_order_value: avgOrder,
          repeat_purchase_rate: repeatRate,
          customer_lifespan_months: lifespan,
          gross_margin: margin,
          roi,
          payback_period_months: payback,
          monthly_revenue_per_customer: monthlyRev
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateManual = () => {
    setCalculating(true);
    
    setTimeout(() => {
      const order = parseFloat(avgOrderValue) || 0;
      const repeat = parseFloat(repeatRate) / 100 || 0;
      const lifespan = parseFloat(customerLifespan) || 0;
      const cac = parseFloat(acquisitionCost) || 0;
      const margin = parseFloat(grossMargin) / 100 || 0;
      
      const ltv = order * repeat * lifespan * margin;
      const ltvCacRatio = ltv / (cac || 1);
      const roi = ((ltv - cac) / (cac || 1)) * 100;
      const payback = cac / ((order * margin * repeat) || 1);
      const monthlyRev = (order * repeat) / (lifespan || 1);
      
      setEconomics({
        ltv,
        cac,
        ltv_cac_ratio: ltvCacRatio,
        avg_order_value: order,
        repeat_purchase_rate: repeat,
        customer_lifespan_months: lifespan,
        gross_margin: margin,
        roi,
        payback_period_months: payback,
        monthly_revenue_per_customer: monthlyRev
      });
      
      setCalculating(false);
      
      toast({
        title: 'Расчёт завершён',
        description: 'Юнит-экономика рассчитана'
      });
    }, 1000);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRatioColor = (ratio: number) => {
    if (ratio >= 3) return 'text-green-500';
    if (ratio >= 1) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatioText = (ratio: number) => {
    if (ratio >= 3) return 'Отлично';
    if (ratio >= 1) return 'Хорошо';
    return 'Требует внимания';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Юнит-экономика</h2>
          <p className="text-muted-foreground mt-1">
            Ключевые метрики эффективности бизнеса
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={manualMode ? 'outline' : 'default'}
            size="sm"
            onClick={() => setManualMode(false)}
          >
            <Icon name="Brain" className="mr-2 h-4 w-4" />
            AI Расчёт
          </Button>
          <Button
            variant={manualMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setManualMode(true)}
          >
            <Icon name="Calculator" className="mr-2 h-4 w-4" />
            Ручной ввод
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Sparkles" className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Что такое юнит-экономика?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Юнит-экономика показывает прибыльность каждого клиента. 
              LTV (пожизненная ценность) должна быть минимум в 3 раза больше CAC (стоимость привлечения).
            </p>
          </div>
        </div>
      </Card>

      {manualMode && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Введите данные для расчёта</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="avgOrderValue">Средний чек (₽)</Label>
              <Input
                id="avgOrderValue"
                type="number"
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(e.target.value)}
                placeholder="Например, 3500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Средняя сумма одного заказа
              </p>
            </div>

            <div>
              <Label htmlFor="repeatRate">Частота покупок (%)</Label>
              <Input
                id="repeatRate"
                type="number"
                value={repeatRate}
                onChange={(e) => setRepeatRate(e.target.value)}
                placeholder="Например, 35"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Сколько % клиентов покупают повторно
              </p>
            </div>

            <div>
              <Label htmlFor="customerLifespan">Жизненный цикл (месяцев)</Label>
              <Input
                id="customerLifespan"
                type="number"
                value={customerLifespan}
                onChange={(e) => setCustomerLifespan(e.target.value)}
                placeholder="Например, 18"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Сколько месяцев клиент покупает у вас
              </p>
            </div>

            <div>
              <Label htmlFor="acquisitionCost">Стоимость привлечения (₽)</Label>
              <Input
                id="acquisitionCost"
                type="number"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                placeholder="Например, 500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Сколько тратите на привлечение одного клиента
              </p>
            </div>

            <div>
              <Label htmlFor="grossMargin">Маржинальность (%)</Label>
              <Input
                id="grossMargin"
                type="number"
                value={grossMargin}
                onChange={(e) => setGrossMargin(e.target.value)}
                placeholder="Например, 30"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Валовая прибыль от продажи
              </p>
            </div>
          </div>

          <Button onClick={calculateManual} disabled={calculating} className="w-full mt-6">
            {calculating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Рассчитываю...
              </>
            ) : (
              <>
                <Icon name="Calculator" className="mr-2 h-4 w-4" />
                Рассчитать юнит-экономику
              </>
            )}
          </Button>
        </Card>
      )}

      {economics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">LTV</p>
                <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Icon name="TrendingUp" className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{formatMoney(economics.ltv)}</p>
              <p className="text-xs text-muted-foreground">Пожизненная ценность клиента</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">CAC</p>
                <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Icon name="Users" className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{formatMoney(economics.cac)}</p>
              <p className="text-xs text-muted-foreground">Стоимость привлечения клиента</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">LTV / CAC</p>
                <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Icon name="Zap" className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <p className={`text-3xl font-bold mb-1 ${getRatioColor(economics.ltv_cac_ratio)}`}>
                {economics.ltv_cac_ratio.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{getRatioText(economics.ltv_cac_ratio)}</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">ROI</p>
                <div className="h-10 w-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Icon name="DollarSign" className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              <p className={`text-3xl font-bold mb-1 ${economics.roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {economics.roi > 0 ? '+' : ''}{economics.roi.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">Возврат инвестиций</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-6">Детальные метрики</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Средний чек</p>
                    <p className="text-sm text-muted-foreground">Средняя сумма заказа</p>
                  </div>
                  <p className="text-lg font-bold">{formatMoney(economics.avg_order_value)}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Частота покупок</p>
                    <p className="text-sm text-muted-foreground">Повторные покупки</p>
                  </div>
                  <p className="text-lg font-bold">{(economics.repeat_purchase_rate * 100).toFixed(0)}%</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Жизненный цикл</p>
                    <p className="text-sm text-muted-foreground">Период активности</p>
                  </div>
                  <p className="text-lg font-bold">{economics.customer_lifespan_months} мес</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Маржинальность</p>
                    <p className="text-sm text-muted-foreground">Валовая прибыль</p>
                  </div>
                  <p className="text-lg font-bold">{(economics.gross_margin * 100).toFixed(0)}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-6">AI Рекомендации</h3>
              
              <div className="space-y-4">
                {economics.ltv_cac_ratio < 1 && (
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <Icon name="AlertTriangle" className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-500">Критическая ситуация</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          LTV меньше CAC. Вы теряете деньги на каждом клиенте. 
                          Срочно снижайте затраты на привлечение или повышайте средний чек.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {economics.ltv_cac_ratio >= 1 && economics.ltv_cac_ratio < 3 && (
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                      <Icon name="AlertCircle" className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-500">Требуется оптимизация</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Соотношение LTV/CAC приемлемое, но можно улучшить. 
                          Работайте над повышением повторных продаж и снижением оттока клиентов.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {economics.ltv_cac_ratio >= 3 && (
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-start gap-3">
                      <Icon name="CheckCircle" className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-500">Отличные показатели</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ваша юнит-экономика здорова! LTV/CAC больше 3 - это хороший знак. 
                          Можно масштабировать привлечение клиентов.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Icon name="Lightbulb" className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Срок окупаемости</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Клиент окупится через {economics.payback_period_months.toFixed(1)} месяца.
                        Ежемесячный доход с клиента: {formatMoney(economics.monthly_revenue_per_customer)}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <Icon name="Target" className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-semibold">Следующий шаг</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Увеличьте частоту покупок на 10% и LTV вырастет до {formatMoney(economics.ltv * 1.1)}.
                        Это улучшит соотношение LTV/CAC до {(economics.ltv_cac_ratio * 1.1).toFixed(2)}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default UnitEconomicsPanel;
