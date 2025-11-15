import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ML_API = 'https://functions.poehali.dev/108ae54f-0a71-400d-8644-1b7b5aaca990';

interface SalesForecast {
  date: string;
  predictedSales: number;
  confidence: number;
}

interface ReturnsPrediction {
  returnProbability: number;
  confidence: number;
  riskLevel: string;
  totalOrders: number;
  returnedOrders: number;
}

interface Anomaly {
  date: string;
  revenue: number;
  expectedRevenue: number;
  deviation: number;
  type: string;
  severity: string;
}

const AIToolsPanel: React.FC = () => {
  const { toast } = useToast();
  const [activeAITool, setActiveAITool] = useState<string>('sales-forecast');
  const [loading, setLoading] = useState(false);
  
  const [productId, setProductId] = useState('1');
  const [forecastDays, setForecastDays] = useState('7');
  const [salesForecast, setSalesForecast] = useState<SalesForecast[]>([]);
  
  const [returnsPrediction, setReturnsPrediction] = useState<ReturnsPrediction | null>(null);
  
  const [marketplaceId, setMarketplaceId] = useState('1');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const runSalesForecast = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ML_API}/?action=salesForecast&productId=${productId}&days=${forecastDays}`);
      const data = await response.json();
      
      if (data.forecast) {
        setSalesForecast(data.forecast);
        toast({
          title: 'Прогноз готов',
          description: `Прогноз на ${forecastDays} дней построен`
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось построить прогноз',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runReturnsPrediction = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ML_API}/?action=returnsPrediction&productId=${productId}`);
      const data = await response.json();
      
      if (data.returnProbability !== undefined) {
        setReturnsPrediction({
          returnProbability: data.returnProbability,
          confidence: data.confidence,
          riskLevel: data.riskLevel,
          totalOrders: data.totalOrders,
          returnedOrders: data.returnedOrders
        });
        toast({
          title: 'Анализ завершен',
          description: `Вероятность возврата: ${(data.returnProbability * 100).toFixed(1)}%`
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проанализировать возвраты',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runAnomalyDetection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ML_API}/?action=anomalyDetection&marketplaceId=${marketplaceId}`);
      const data = await response.json();
      
      if (data.anomalies) {
        setAnomalies(data.anomalies);
        toast({
          title: 'Анализ завершен',
          description: `Найдено аномалий: ${data.anomalies.length}`
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обнаружить аномалии',
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI Инструменты</h2>
        <p className="text-muted-foreground mt-1">
          Прогнозы и анализ с машинным обучением
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={`p-6 cursor-pointer transition-all ${activeAITool === 'sales-forecast' ? 'border-primary shadow-lg' : 'hover:shadow-md'}`}
          onClick={() => setActiveAITool('sales-forecast')}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold">Прогноз продаж</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            ML предсказание будущих продаж товара
          </p>
        </Card>

        <Card
          className={`p-6 cursor-pointer transition-all ${activeAITool === 'returns-prediction' ? 'border-primary shadow-lg' : 'hover:shadow-md'}`}
          onClick={() => setActiveAITool('returns-prediction')}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Icon name="RotateCcw" className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="font-semibold">Прогноз возвратов</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Вероятность возврата товара покупателем
          </p>
        </Card>

        <Card
          className={`p-6 cursor-pointer transition-all ${activeAITool === 'anomaly-detection' ? 'border-primary shadow-lg' : 'hover:shadow-md'}`}
          onClick={() => setActiveAITool('anomaly-detection')}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Icon name="AlertTriangle" className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="font-semibold">Аномалии</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Обнаружение необычных изменений в продажах
          </p>
        </Card>
      </div>

      {activeAITool === 'sales-forecast' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Прогноз продаж товара</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="productId">ID товара</Label>
              <Input
                id="productId"
                type="number"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Введите ID товара"
              />
            </div>
            <div>
              <Label htmlFor="forecastDays">Период прогноза (дней)</Label>
              <Select value={forecastDays} onValueChange={setForecastDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 дня</SelectItem>
                  <SelectItem value="7">7 дней</SelectItem>
                  <SelectItem value="14">14 дней</SelectItem>
                  <SelectItem value="30">30 дней</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={runSalesForecast} disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Анализирую...
              </>
            ) : (
              <>
                <Icon name="Brain" className="mr-2 h-4 w-4" />
                Построить прогноз
              </>
            )}
          </Button>

          {salesForecast.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold">Результаты прогноза:</h4>
              {salesForecast.map((forecast, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(forecast.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-sm text-muted-foreground">
                      Уверенность: {(forecast.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{forecast.predictedSales}</p>
                    <p className="text-sm text-muted-foreground">шт</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeAITool === 'returns-prediction' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Прогноз возвратов</h3>
          
          <div className="mb-6">
            <Label htmlFor="productIdReturns">ID товара</Label>
            <Input
              id="productIdReturns"
              type="number"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Введите ID товара"
            />
          </div>

          <Button onClick={runReturnsPrediction} disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Анализирую...
              </>
            ) : (
              <>
                <Icon name="Brain" className="mr-2 h-4 w-4" />
                Проанализировать возвраты
              </>
            )}
          </Button>

          {returnsPrediction && (
            <div className="mt-6">
              <Card className="p-6 bg-gradient-to-br from-red-500/10 to-orange-500/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Вероятность возврата</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    returnsPrediction.riskLevel === 'high' ? 'bg-red-500/20 text-red-500' :
                    returnsPrediction.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {returnsPrediction.riskLevel === 'high' ? 'Высокий риск' :
                     returnsPrediction.riskLevel === 'medium' ? 'Средний риск' :
                     'Низкий риск'}
                  </span>
                </div>
                <p className="text-4xl font-bold mb-4">{(returnsPrediction.returnProbability * 100).toFixed(1)}%</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Уверенность</p>
                    <p className="font-semibold">{(returnsPrediction.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Всего заказов</p>
                    <p className="font-semibold">{returnsPrediction.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Возвратов</p>
                    <p className="font-semibold">{returnsPrediction.returnedOrders}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Статистика</p>
                    <p className="font-semibold">{returnsPrediction.totalOrders > 0 ? ((returnsPrediction.returnedOrders / returnsPrediction.totalOrders) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Card>
      )}

      {activeAITool === 'anomaly-detection' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Обнаружение аномалий</h3>
          
          <div className="mb-6">
            <Label htmlFor="marketplaceId">ID маркетплейса</Label>
            <Select value={marketplaceId} onValueChange={setMarketplaceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Маркетплейс 1</SelectItem>
                <SelectItem value="2">Маркетплейс 2</SelectItem>
                <SelectItem value="3">Маркетплейс 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={runAnomalyDetection} disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Анализирую...
              </>
            ) : (
              <>
                <Icon name="Brain" className="mr-2 h-4 w-4" />
                Обнаружить аномалии
              </>
            )}
          </Button>

          {anomalies.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold">Обнаружено аномалий: {anomalies.length}</h4>
              {anomalies.map((anomaly, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  anomaly.severity === 'high' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{new Date(anomaly.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
                      <p className="text-sm text-muted-foreground">
                        {anomaly.type === 'spike' ? 'Резкий рост' : 'Резкое падение'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      anomaly.severity === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {anomaly.severity === 'high' ? 'Критично' : 'Внимание'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Выручка</p>
                      <p className="font-semibold">{formatMoney(anomaly.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ожидалось</p>
                      <p className="font-semibold">{formatMoney(anomaly.expectedRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Отклонение</p>
                      <p className={`font-semibold ${anomaly.deviation > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}σ
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {anomalies.length === 0 && !loading && (
            <div className="mt-6 text-center py-8 text-muted-foreground">
              <Icon name="CheckCircle" className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Аномалий не обнаружено</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AIToolsPanel;
