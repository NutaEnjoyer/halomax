import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageSquare,
  Calendar,
  Target,
  HeadphonesIcon,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';

// Voice mapping
const voiceNames = {
  '3EuKHIEZbSzrHGNmdYsx': 'Николай',
  '0BcDz9UPwL3MpsnTeUlO': 'Денис',
  'ymDCYd8puC7gYjxIamPt': 'Марина',
  'Jbte7ht1CqapnZvc4KpK': 'Кари',
  'EDpEYNf6XIeKYRzYcx4I': 'Мария',
  'HcaxAsrhw4ByUo4CBCBN': 'Максим',
};

const templates = [
  {
    id: 1,
    name: 'Продажи (обзвон)',
    description: 'Холодный обзвон для продаж продукта',
    category: 'Продажи',
    icon: Phone,
    color: 'blue',
    template: {
      language: 'ru',
      voice: '3EuKHIEZbSzrHGNmdYsx',
      greeting_message:
        'Здравствуйте! Меня зовут HALO, я звоню от компании по продаже инновационных решений.',
      funnel_goal: 'Получить контактные данные клиента и договориться о встрече',
      prompt: `Ты - профессиональный менеджер по продажам. Твоя задача:

1. Представиться и кратко рассказать о компании
2. Выяснить потребности клиента через вопросы
3. Презентовать продукт как решение их проблем
4. Обработать возражения спокойно и аргументированно
5. Получить контактные данные (email, предпочитаемое время для встречи)

Будь дружелюбным, но профессиональным. Не дави на клиента, слушай внимательно. Если клиент занят - предложи перезвонить в удобное время.`,
    },
  },
  {
    id: 2,
    name: 'Опрос клиентов',
    description: 'Сбор обратной связи от клиентов',
    category: 'Исследования',
    icon: MessageSquare,
    color: 'green',
    template: {
      language: 'ru',
      voice: 'ymDCYd8puC7gYjxIamPt',
      greeting_message:
        'Добрый день! Я провожу короткий опрос для улучшения качества обслуживания.',
      funnel_goal: 'Получить ответы на все вопросы опроса и завершить анкетирование',
      prompt: `Ты - вежливый интервьюер, проводящий опрос клиентов. Твоя задача:

1. Объяснить цель опроса (занимает 2-3 минуты)
2. Спросить разрешение на проведение опроса
3. Задать следующие вопросы:
   - Как вы оцениваете качество обслуживания? (от 1 до 10)
   - Что вам понравилось больше всего?
   - Что можно улучшить?
   - Порекомендуете ли нас друзьям?
4. Поблагодарить за участие

Будь краток, говори медленно и четко. Если клиент отказывается - вежливо попрощайся.`,
    },
  },
  {
    id: 3,
    name: 'Напоминание о записи',
    description: 'Напоминание о запланированной записи',
    category: 'Поддержка',
    icon: Calendar,
    color: 'purple',
    template: {
      language: 'ru',
      voice: 'ymDCYd8puC7gYjxIamPt',
      greeting_message: 'Здравствуйте! Это напоминание о вашей записи.',
      funnel_goal: 'Подтвердить запись или перенести на другое время',
      prompt: `Ты - администратор, звонишь клиенту с напоминанием о записи. Твоя задача:

1. Напомнить о записи: дата, время, услуга
2. Спросить - клиент придет или нужно перенести
3. Если нужно перенести - предложить альтернативные даты/время
4. Подтвердить новое время или существующее
5. Попрощаться

Будь вежливым и кратким. Если клиент не может сейчас говорить - предложи позвонить позже.`,
    },
  },
  {
    id: 4,
    name: 'Квалификация лида',
    description: 'Оценка потенциальных клиентов',
    category: 'Продажи',
    icon: Target,
    color: 'orange',
    template: {
      language: 'ru',
      voice: '3EuKHIEZbSzrHGNmdYsx',
      greeting_message: 'Добрый день! Я HALO, специалист по работе с клиентами.',
      funnel_goal: 'Определить уровень заинтересованности и квалифицировать лида',
      prompt: `Ты - специалист по квалификации лидов. Твоя задача определить потенциал клиента:

1. Представиться и узнать о текущей ситуации клиента
2. Задать квалифицирующие вопросы:
   - Какой бюджет рассматривается?
   - Кто принимает решение о покупке?
   - Каковы сроки принятия решения?
   - Есть ли конкуренты/альтернативы в рассмотрении?
3. Оценить уровень заинтересованности (холодный/теплый/горячий)
4. Для теплых/горячих лидов - договориться о следующем шаге
5. Для холодных - попросить разрешение связаться через месяц

Будь профессиональным аналитиком, задавай точные вопросы.`,
    },
  },
  {
    id: 5,
    name: 'Поддержка клиентов',
    description: 'Обработка обращений клиентов',
    category: 'Поддержка',
    icon: HeadphonesIcon,
    color: 'cyan',
    template: {
      language: 'ru',
      voice: 'ymDCYd8puC7gYjxIamPt',
      greeting_message: 'Здравствуйте! Служба поддержки клиентов. Чем могу помочь?',
      funnel_goal: 'Решить проблему клиента или перенаправить на специалиста',
      prompt: `Ты - сотрудник службы поддержки. Твоя задача помочь клиенту:

1. Выслушать проблему клиента внимательно
2. Задать уточняющие вопросы для понимания ситуации
3. Если можешь решить - дай четкую инструкцию
4. Если проблема сложная - сообщи что передашь специалисту и он свяжется в течение 24 часов
5. Получить номер обращения/тикета для отслеживания
6. Убедиться что клиент всё понял

Будь терпеливым, эмпатичным и профессиональным. Если клиент расстроен - выслушай и успокой.`,
    },
  },
  {
    id: 6,
    name: 'Приглашение на мероприятие',
    description: 'Приглашение на предстоящее событие',
    category: 'Маркетинг',
    icon: PartyPopper,
    color: 'pink',
    template: {
      language: 'ru',
      voice: '3EuKHIEZbSzrHGNmdYsx',
      greeting_message: 'Добрый день! Хочу пригласить вас на интересное мероприятие.',
      funnel_goal: 'Получить подтверждение участия в мероприятии',
      prompt: `Ты - организатор мероприятия, приглашаешь клиента. Твоя задача:

1. Рассказать о мероприятии (что, когда, где)
2. Объяснить ценность для участника (что получит)
3. Спросить - интересно ли участие
4. Если да - зарегистрировать (имя, email, количество гостей)
5. Если нет - узнать причину и предложить другое мероприятие в будущем
6. Отправить подтверждение и детали

Будь энергичным и вдохновляющим, но не навязчивым.`,
    },
  },
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    badge: 'bg-cyan-100 text-cyan-700',
    border: 'border-cyan-200',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    badge: 'bg-pink-100 text-pink-700',
    border: 'border-pink-200',
  },
};

export default function Templates() {
  const navigate = useNavigate();

  const handleUseTemplate = (template) => {
    navigate('/start-call', { state: { template: template.template } });
  };

  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Шаблоны звонков</h1>
        <p className="page-subtitle">
          Выберите готовый шаблон для быстрого запуска звонка
        </p>
      </div>

      {/* Templates by category */}
      {categories.map((category) => (
        <div key={category} className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter((t) => t.category === category)
              .map((template) => {
                const colors = colorClasses[template.color];
                const Icon = template.icon;

                return (
                  <div
                    key={template.id}
                    className="card card-hover cursor-pointer group"
                    onClick={() => handleUseTemplate(template)}
                  >
                    {/* Icon and Category */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}
                      >
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <span className={`badge ${colors.badge}`}>
                        {template.category}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {template.description}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>
                        <span className="font-medium">Голос:</span>{' '}
                        {voiceNames[template.template.voice] || 'Николай'}
                      </span>
                      <span>
                        <span className="font-medium">Язык:</span>{' '}
                        {template.template.language.toUpperCase()}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                      <span>Использовать</span>
                      <ArrowRight
                        size={16}
                        className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
