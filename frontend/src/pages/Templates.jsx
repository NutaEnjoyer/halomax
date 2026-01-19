import React from 'react';
import { useNavigate } from 'react-router-dom';

// Маппинг voiceId -> название голоса
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
    color: 'from-blue-500 to-indigo-600',
    template: {
      language: 'ru',
      voice: '0BcDz9UPwL3MpsnTeUlO',  // Denis
      greeting_message: 'Здравствуйте! Меня зовут HALO, я звоню от компании по продаже инновационных решений.',
      funnel_goal: 'Получить контактные данные клиента и договориться о встрече',
      prompt: `Ты - профессиональный менеджер по продажам. Твоя задача:

1. Представиться и кратко рассказать о компании
2. Выяснить потребности клиента через вопросы
3. Презентовать продукт как решение их проблем
4. Обработать возражения спокойно и аргументированно
5. Получить контактные данные (email, предпочитаемое время для встречи)

Будь дружелюбным, но профессиональным. Не давай на клиента, слушай внимательно. Если клиент занят - предложи перезвонить в удобное время.`
    }
  },
  {
    id: 2,
    name: 'Опрос клиентов',
    description: 'Сбор обратной связи от клиентов',
    category: 'Исследования',
    color: 'from-green-500 to-emerald-600',
    template: {
      language: 'ru',
      voice: 'ymDCYd8puC7gYjxIamPt',  // Marina
      greeting_message: 'Добрый день! Я провожу короткий опрос для улучшения качества обслуживания.',
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

Будь краток, говори медленно и четко. Если клиент отказывается - вежливо попрощайся.`
    }
  },
  {
    id: 3,
    name: 'Напоминание о записи',
    description: 'Напоминание о запланированной записи',
    category: 'Поддержка',
    color: 'from-purple-500 to-pink-600',
    template: {
      language: 'ru',
      voice: 'Jbte7ht1CqapnZvc4KpK',  // Kari
      greeting_message: 'Здравствуйте! Это напоминание о вашей записи.',
      funnel_goal: 'Подтвердить запись или перенести на другое время',
      prompt: `Ты - администратор, звонишь клиенту с напоминанием о записи. Твоя задача:

1. Напомнить о записи: дата, время, услуга
2. Спросить - клиент придет или нужно перенести
3. Если нужно перенести - предложить альтернативные даты/время
4. Подтвердить новое время или существующее
5. Попрощаться

Будь вежливым и кратким. Если клиент не может сейчас говорить - предложи позвонить позже.`
    }
  },
  {
    id: 4,
    name: 'Квалификация лида',
    description: 'Оценка потенциальных клиентов',
    category: 'Продажи',
    color: 'from-orange-500 to-red-600',
    template: {
      language: 'ru',
      voice: '3EuKHIEZbSzrHGNmdYsx',  // Nikolay
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

Будь профессиональным аналитиком, задавай точные вопросы.`
    }
  },
  {
    id: 5,
    name: 'Поддержка клиентов',
    description: 'Обработка обращений клиентов',
    category: 'Поддержка',
    color: 'from-cyan-500 to-blue-600',
    template: {
      language: 'ru',
      voice: 'EDpEYNf6XIeKYRzYcx4I',  // Maria
      greeting_message: 'Здравствуйте! Служба поддержки клиентов. Чем могу помочь?',
      funnel_goal: 'Решить проблему клиента или перенаправить на специалиста',
      prompt: `Ты - сотрудник службы поддержки. Твоя задача помочь клиенту:

1. Выслушать проблему клиента внимательно
2. Задать уточняющие вопросы для понимания ситуации
3. Если можешь решить - дай четкую инструкцию
4. Если проблема сложная - сообщи что передашь специалисту и он свяжется в течение 24 часов
5. Получить номер обращения/тикета для отслеживания
6. Убедиться что клиент всё понял

Будь терпеливым, эмпатичным и профессиональным. Если клиент расстроен - выслушай и успокой.`
    }
  },
  {
    id: 6,
    name: 'Приглашение на мероприятие',
    description: 'Приглашение на предстоящее событие',
    category: 'Маркетинг',
    color: 'from-pink-500 to-rose-600',
    template: {
      language: 'ru',
      voice: 'HcaxAsrhw4ByUo4CBCBN',  // Maxim
      greeting_message: 'Добрый день! Хочу пригласить вас на интересное мероприятие.',
      funnel_goal: 'Получить подтверждение участия в мероприятии',
      prompt: `Ты - организатор мероприятия, приглашаешь клиента. Твоя задача:

1. Рассказать о мероприятии (что, когда, где)
2. Объяснить ценность для участника (что получит)
3. Спросить - интересно ли участие
4. Если да - зарегистрировать (имя, email, количество гостей)
5. Если нет - узнать причину и предложить другое мероприятие в будущем
6. Отправить подтверждение и детали

Будь энергичным и вдохновляющим, но не навязчивым.`
    }
  }
];

function Templates() {
  const navigate = useNavigate();

  const handleUseTemplate = (template) => {
    navigate('/start-call', { state: { template: template.template } });
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card rounded-2xl p-8 mb-10">
          <h1 className="text-5xl font-bold text-white mb-3">Шаблоны звонков</h1>
          <p className="text-white/80 text-lg">
            Выберите готовый шаблон, чтобы быстро запустить звонок с оптимальными настройками
          </p>
        </div>

        {categories.map(category => (
          <div key={category} className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-6 ml-2">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates
                .filter(t => t.category === category)
                .map(template => (
                  <div
                    key={template.id}
                    className="glass-card rounded-2xl p-7 hover:scale-105 transition-all duration-300 cursor-pointer group"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className={`w-full h-2 rounded-full bg-gradient-to-r ${template.color} mb-6`}></div>

                    <div className="flex items-start justify-between mb-4">
                      <span className={`px-4 py-1.5 bg-gradient-to-r ${template.color} text-white text-xs font-bold rounded-xl`}>
                        {template.category}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-white transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-white/70 mb-6 text-sm leading-relaxed">
                      {template.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center">
                        <span className="text-xs font-bold text-white/60 uppercase tracking-wide mr-3">Голос:</span>
                        <span className="text-sm font-semibold text-white">{voiceNames[template.template.voice] || template.template.voice}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-bold text-white/60 uppercase tracking-wide mr-3">Язык:</span>
                        <span className="text-sm font-semibold text-white uppercase">{template.template.language}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="glass-button w-full text-white font-bold py-3 rounded-xl glow-hover transition-smooth"
                    >
                      Использовать шаблон
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Templates;
