import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Consultation {
  id: string;
  date: Date;
  time: string;
  topic: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface BusinessPrompt {
  id: string;
  name: string;
  prompt: string;
  category: string;
}

const AIAssistantTab: React.FC = () => {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<'chat' | 'calendar' | 'settings'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Здравствуйте! Я AI-помощник SellHub. Чем могу помочь с вашим бизнесом?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([
    {
      id: '1',
      date: new Date(Date.now() + 86400000),
      time: '14:00',
      topic: 'Оптимизация цен на товары',
      status: 'scheduled'
    },
    {
      id: '2',
      date: new Date(Date.now() + 172800000),
      time: '16:00',
      topic: 'Анализ конкурентов на маркетплейсах',
      status: 'scheduled'
    }
  ]);

  const [businessPrompts, setBusinessPrompts] = useState<BusinessPrompt[]>([
    {
      id: '1',
      name: 'Анализ продаж',
      prompt: 'Проанализируй продажи за последний месяц и дай рекомендации по улучшению',
      category: 'Аналитика'
    },
    {
      id: '2',
      name: 'Ценообразование',
      prompt: 'Помоги оптимизировать цены на топ-10 товаров с учетом конкурентов',
      category: 'Маркетинг'
    },
    {
      id: '3',
      name: 'Прогноз спроса',
      prompt: 'Спрогнозируй спрос на каждую категорию товаров на следующий месяц',
      category: 'Планирование'
    },
    {
      id: '4',
      name: 'Управление запасами',
      prompt: 'Оцени текущие остатки и порекомендуй товары для пополнения',
      category: 'Логистика'
    }
  ]);

  const availableTimes = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Я обработал ваш запрос: "${inputMessage}". На основе анализа данных вашего магазина рекомендую...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const handleUsePrompt = (prompt: string) => {
    setInputMessage(prompt);
    setActiveView('chat');
  };

  const handleBookConsultation = () => {
    setShowBookingDialog(true);
  };

  const handleSaveConsultation = (time: string, topic: string) => {
    if (selectedDate) {
      const newConsultation: Consultation = {
        id: Date.now().toString(),
        date: selectedDate,
        time,
        topic,
        status: 'scheduled'
      };
      setConsultations(prev => [...prev, newConsultation]);
      setShowBookingDialog(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">{t('aiConsultant')}</h2>
          <p className="text-muted-foreground mt-1">
            Персональный AI-консультант для вашего бизнеса
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'chat' ? 'default' : 'outline'}
            onClick={() => setActiveView('chat')}
          >
            <Icon name="MessageSquare" className="mr-2 h-4 w-4" />
            {t('chatWithAI')}
          </Button>
          <Button
            variant={activeView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setActiveView('calendar')}
          >
            <Icon name="Calendar" className="mr-2 h-4 w-4" />
            {t('consultationCalendar')}
          </Button>
          <Button
            variant={activeView === 'settings' ? 'default' : 'outline'}
            onClick={() => setActiveView('settings')}
          >
            <Icon name="Settings" className="mr-2 h-4 w-4" />
            {t('aiSettings')}
          </Button>
        </div>
      </div>

      {activeView === 'chat' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Bot" className="text-purple-600" />
                AI Чат-помощник
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Icon name="Bot" className="text-white" size={16} />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Icon name="User" className="text-white" size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder={t('yourMessage')}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Icon name="Send" size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('businessPrompts')}</CardTitle>
              <CardDescription>Готовые запросы для вашего бизнеса</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {businessPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleUsePrompt(prompt.prompt)}
                      className="w-full text-left p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{prompt.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {prompt.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {prompt.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'calendar' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Calendar" className="text-blue-600" />
                {t('consultationCalendar')}
              </CardTitle>
              <CardDescription>
                Запланируйте персональную консультацию с AI-помощником
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
            <div className="p-6 pt-0">
              <Button onClick={handleBookConsultation} className="w-full">
                <Icon name="Plus" className="mr-2 h-4 w-4" />
                {t('scheduleConsultation')}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Запланированные консультации</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {consultations
                    .filter(c => c.status === 'scheduled')
                    .map((consultation) => (
                      <div
                        key={consultation.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon name="Clock" size={16} className="text-blue-600" />
                            <span className="font-semibold text-sm">
                              {consultation.date.toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          <Badge>{consultation.time}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{consultation.topic}</p>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('aiSettings')}</CardTitle>
            <CardDescription>
              Настройте AI-помощника под специфику вашего бизнеса
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="businessType">Тип бизнеса</Label>
              <Input id="businessType" placeholder="Например: Электроника" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetAudience">Целевая аудитория</Label>
              <Input id="targetAudience" placeholder="Например: Молодежь 18-35 лет" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessGoals">Основные цели бизнеса</Label>
              <Textarea
                id="businessGoals"
                placeholder="Например: Увеличение продаж на 30%, выход на новые маркетплейсы"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="aiTone">Стиль общения AI</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>Профессиональный</option>
                <option>Дружелюбный</option>
                <option>Краткий и по делу</option>
              </select>
            </div>
            <Button className="w-full">{t('save')}</Button>
          </CardContent>
        </Card>
      )}

      <ConsultationBookingDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        selectedDate={selectedDate}
        availableTimes={availableTimes}
        onBook={handleSaveConsultation}
        t={t}
      />
    </div>
  );
};

const ConsultationBookingDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  availableTimes: string[];
  onBook: (time: string, topic: string) => void;
  t: (key: string) => string;
}> = ({ open, onOpenChange, selectedDate, availableTimes, onBook, t }) => {
  const [selectedTime, setSelectedTime] = useState('');
  const [topic, setTopic] = useState('');

  const handleBook = () => {
    if (selectedTime && topic) {
      onBook(selectedTime, topic);
      setSelectedTime('');
      setTopic('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('scheduleConsultation')}</DialogTitle>
          <DialogDescription>
            Дата: {selectedDate?.toLocaleDateString('ru-RU')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>{t('selectTime')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {availableTimes.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="topic">Тема консультации</Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="О чем хотите проконсультироваться?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleBook} disabled={!selectedTime || !topic}>
            {t('bookNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssistantTab;
