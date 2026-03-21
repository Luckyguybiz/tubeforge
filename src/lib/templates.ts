/**
 * Project Template Library
 *
 * Pre-made templates that let users start projects with scenes already configured.
 * Each template has bilingual names/descriptions (Russian primary, English secondary)
 * and realistic scene prompts in Russian for AI image/video generation.
 */

export type TemplateCategory = 'youtube' | 'shorts' | 'social' | 'business' | 'education';

export interface ProjectTemplate {
  id: string;
  name: string;         // Russian name
  nameEn: string;       // English name
  description: string;  // Russian description
  descriptionEn: string;
  category: TemplateCategory;
  icon: string;         // Emoji icon
  sceneCount: number;
  scenes: { label: string; prompt: string; style: string; duration: number }[];
  tags: string[];
}

export const TEMPLATES: ProjectTemplate[] = [
  /* ── 1. YouTube Intro ─────────────────────────────────── */
  {
    id: 'youtube-intro',
    name: 'Интро для YouTube',
    nameEn: 'YouTube Intro',
    description: 'Динамичное интро с анимацией логотипа — 3 сцены',
    descriptionEn: 'Dynamic intro with logo reveal animation — 3 scenes',
    category: 'youtube',
    icon: '\uD83C\uDFAC',
    sceneCount: 3,
    scenes: [
      {
        label: 'Заставка',
        prompt: 'Яркая динамичная 3D-анимация: камера пролетает сквозь неоновый тоннель из светящихся частиц, быстрое движение, кинематографический свет, тёмный фон с электрическими бликами',
        style: 'cinematic',
        duration: 3,
      },
      {
        label: 'Логотип',
        prompt: 'Эпичное появление логотипа канала: металлические буквы собираются из рассыпающихся частиц, вспышки света, объёмные тени, глубокий тёмно-синий фон с градиентом',
        style: 'cinematic',
        duration: 4,
      },
      {
        label: 'Переход',
        prompt: 'Плавный переход: логотип уменьшается и улетает вверх, за ним раскрывается размытый фон основного контента, мягкий свет, лёгкая глубина резкости',
        style: 'cinematic',
        duration: 3,
      },
    ],
    tags: ['intro', 'youtube', 'branding'],
  },

  /* ── 2. YouTube Outro ─────────────────────────────────── */
  {
    id: 'youtube-outro',
    name: 'Аутро для YouTube',
    nameEn: 'YouTube Outro',
    description: 'Экран подписки и ссылки на соцсети — 2 сцены',
    descriptionEn: 'Subscribe CTA + social links — 2 scenes',
    category: 'youtube',
    icon: '\uD83D\uDC4B',
    sceneCount: 2,
    scenes: [
      {
        label: 'Подписка',
        prompt: 'Стильный end-screen: анимированная кнопка подписки по центру, вокруг неё появляются иконки лайка и колокольчика, тёплый градиентный фон, приятная типографика',
        style: 'motion-graphics',
        duration: 8,
      },
      {
        label: 'Соцсети',
        prompt: 'Минималистичный экран соцсетей: иконки Instagram, Telegram, TikTok плавно появляются в ряд, под ними текст с никнеймом, чистый светлый фон с мягкими тенями',
        style: 'motion-graphics',
        duration: 7,
      },
    ],
    tags: ['outro', 'youtube', 'subscribe'],
  },

  /* ── 3. Tutorial ──────────────────────────────────────── */
  {
    id: 'tutorial',
    name: 'Туториал',
    nameEn: 'Tutorial',
    description: 'Пошаговый образовательный контент — 5 сцен',
    descriptionEn: 'Step-by-step educational content — 5 scenes',
    category: 'education',
    icon: '\uD83D\uDCDA',
    sceneCount: 5,
    scenes: [
      {
        label: 'Введение',
        prompt: 'Учитель стоит перед интерактивной доской в современном классе, показывает на экран с темой урока, дружелюбная атмосфера, мягкий дневной свет из окна',
        style: 'realistic',
        duration: 10,
      },
      {
        label: 'Шаг 1',
        prompt: 'Крупный план рабочего стола: руки демонстрируют первый этап — открытие программы, на экране монитора видны элементы интерфейса, боковой мягкий свет',
        style: 'realistic',
        duration: 15,
      },
      {
        label: 'Шаг 2',
        prompt: 'Анимированная инфографика: схема показывает второй шаг процесса, стрелки и иконки последовательно появляются, минималистичный дизайн на белом фоне',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Шаг 3',
        prompt: 'Экран разделён на две части: слева — правильный результат с зелёной галочкой, справа — типичная ошибка с красным крестом, чёткая визуальная подсказка',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Итог',
        prompt: 'Финальный слайд с кратким резюме: три ключевых пункта урока на стильном фоне, внизу призыв задать вопрос в комментариях, мягкий градиент',
        style: 'motion-graphics',
        duration: 10,
      },
    ],
    tags: ['tutorial', 'education', 'howto'],
  },

  /* ── 4. Product Review ────────────────────────────────── */
  {
    id: 'product-review',
    name: 'Обзор продукта',
    nameEn: 'Product Review',
    description: 'Распаковка, обзор функций и вердикт — 4 сцены',
    descriptionEn: 'Unboxing + features + verdict — 4 scenes',
    category: 'youtube',
    icon: '\u2B50',
    sceneCount: 4,
    scenes: [
      {
        label: 'Распаковка',
        prompt: 'Стильная распаковка на чистом белом столе: руки аккуратно открывают красивую коробку, камера сверху, мягкий студийный свет, лёгкое боке на заднем плане',
        style: 'realistic',
        duration: 12,
      },
      {
        label: 'Обзор',
        prompt: 'Крупные планы продукта с разных ракурсов: медленное вращение на поворотном столе, камера фиксирует детали, текстуры и элементы дизайна, нейтральный серый фон',
        style: 'realistic',
        duration: 20,
      },
      {
        label: 'Плюсы и минусы',
        prompt: 'Разделённый экран: слева зелёная колонка с иконками плюсов, справа красная с минусами, каждый пункт появляется с анимацией, современный минималистичный дизайн',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Вердикт',
        prompt: 'Финальная оценка: большая цифра рейтинга в центре экрана с анимированными звёздами, краткий текст вердикта внизу, тёмный элегантный фон с акцентным цветом',
        style: 'motion-graphics',
        duration: 10,
      },
    ],
    tags: ['review', 'product', 'unboxing'],
  },

  /* ── 5. Vlog ──────────────────────────────────────────── */
  {
    id: 'vlog',
    name: 'Влог',
    nameEn: 'Vlog',
    description: 'День из жизни: утро, активность, вечер, итог — 4 сцены',
    descriptionEn: 'Day-in-the-life format — 4 scenes',
    category: 'youtube',
    icon: '\uD83C\uDFA5',
    sceneCount: 4,
    scenes: [
      {
        label: 'Утро',
        prompt: 'Тёплое утро: человек сидит у окна с чашкой кофе, мягкий золотистый свет из окна, уютная атмосфера, слегка размытый фон кухни, естественные цвета',
        style: 'realistic',
        duration: 10,
      },
      {
        label: 'Активность',
        prompt: 'Динамичный кадр: прогулка по городу, кафе и улицы в расфокусе, яркий дневной свет, городская жизнь вокруг, камера следует за человеком, уличная фотография',
        style: 'realistic',
        duration: 15,
      },
      {
        label: 'Вечер',
        prompt: 'Вечернее настроение: съёмка golden hour на крыше или в парке, тёплые оранжевые тона, силуэты на фоне заката, атмосферная кинематографическая картинка',
        style: 'cinematic',
        duration: 12,
      },
      {
        label: 'Итоги дня',
        prompt: 'Уютная обстановка вечером: разговор на камеру в комнате с мягким тёплым светом, книжная полка на фоне, лёгкое боке огоньков гирлянды',
        style: 'realistic',
        duration: 10,
      },
    ],
    tags: ['vlog', 'lifestyle', 'daily'],
  },

  /* ── 6. YouTube Shorts ────────────────────────────────── */
  {
    id: 'shorts-hook',
    name: 'YouTube Shorts',
    nameEn: 'YouTube Shorts',
    description: 'Вертикальное видео: хук, контент, призыв — 3 сцены',
    descriptionEn: 'Hook + content + CTA for vertical video — 3 scenes',
    category: 'shorts',
    icon: '\u26A1',
    sceneCount: 3,
    scenes: [
      {
        label: 'Хук',
        prompt: 'Яркий захватывающий кадр: крупный текст с провокационным вопросом на фоне динамичной графики, вертикальный формат 9:16, контрастные цвета, мгновенное внимание',
        style: 'motion-graphics',
        duration: 3,
      },
      {
        label: 'Контент',
        prompt: 'Быстрая смена кадров: основной контент с крупными титрами, каждый факт подкреплён визуалом, энергичная подача, яркие акцентные цвета, вертикальный формат',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'CTA',
        prompt: 'Финальный экран: анимированная стрелка указывает на кнопку подписки, текст "Подпишись, чтобы не пропустить!", пульсирующий акцентный цвет, вертикальный формат',
        style: 'motion-graphics',
        duration: 5,
      },
    ],
    tags: ['shorts', 'vertical', 'hook'],
  },

  /* ── 7. TikTok Trend ──────────────────────────────────── */
  {
    id: 'tiktok-trend',
    name: 'TikTok тренд',
    nameEn: 'TikTok Trend',
    description: 'Формат трендового ролика: завязка, развитие, финал — 3 сцены',
    descriptionEn: 'Trending video format — 3 scenes',
    category: 'social',
    icon: '\uD83C\uDFB5',
    sceneCount: 3,
    scenes: [
      {
        label: 'Завязка',
        prompt: 'Начало тренда: человек стоит перед камерой в стильной одежде, на экране появляется текст с вызовом или вопросом, яркий неоновый фон, вертикальный формат',
        style: 'realistic',
        duration: 5,
      },
      {
        label: 'Развитие',
        prompt: 'Быстрая трансформация: серия коротких переходов — смена образов, локаций, действий, каждый кадр длится секунду, динамичная музыкальная нарезка',
        style: 'cinematic',
        duration: 12,
      },
      {
        label: 'Финал',
        prompt: 'Эффектная концовка: неожиданный результат или забавный поворот, крупный план реакции, стоп-кадр с текстом и хештегами, яркие цвета',
        style: 'realistic',
        duration: 5,
      },
    ],
    tags: ['tiktok', 'trend', 'social'],
  },

  /* ── 8. Ad / Promo ────────────────────────────────────── */
  {
    id: 'ad-promo',
    name: 'Рекламный ролик',
    nameEn: 'Ad / Promo',
    description: 'Проблема, решение, предложение и призыв к действию — 4 сцены',
    descriptionEn: 'Problem + solution + offer + CTA — 4 scenes',
    category: 'business',
    icon: '\uD83D\uDCE2',
    sceneCount: 4,
    scenes: [
      {
        label: 'Проблема',
        prompt: 'Человек в затруднении: хмурый взгляд, вокруг хаос из бумаг или уведомлений на экране, серые приглушённые тона, лёгкое виньетирование, эмоциональный кадр',
        style: 'realistic',
        duration: 8,
      },
      {
        label: 'Решение',
        prompt: 'Момент озарения: яркий свет появляется на экране, человек улыбается, вокруг чистое пространство, цвета становятся насыщенными, продукт в руках крупным планом',
        style: 'realistic',
        duration: 10,
      },
      {
        label: 'Предложение',
        prompt: 'Элегантная презентация продукта: объект парит в центре кадра, вокруг него вращаются иконки преимуществ, минималистичный тёмный фон с акцентным освещением',
        style: 'cinematic',
        duration: 10,
      },
      {
        label: 'Призыв',
        prompt: 'Финальный CTA: крупная кнопка "Попробовать бесплатно" с пульсирующим свечением, под ней краткий текст оффера, таймер ограниченного предложения, фирменные цвета бренда',
        style: 'motion-graphics',
        duration: 7,
      },
    ],
    tags: ['ad', 'promo', 'marketing'],
  },

  /* ── 9. Explainer ─────────────────────────────────────── */
  {
    id: 'explainer',
    name: 'Объяснение',
    nameEn: 'Explainer',
    description: 'Анимированное объяснение: проблема, как работает, примеры — 5 сцен',
    descriptionEn: 'Animated explainer format — 5 scenes',
    category: 'education',
    icon: '\uD83D\uDCA1',
    sceneCount: 5,
    scenes: [
      {
        label: 'Вопрос',
        prompt: 'Большой знак вопроса в центре экрана, вокруг него появляются маленькие иконки связанных понятий, плоский дизайн, пастельные цвета, анимированные линии',
        style: 'motion-graphics',
        duration: 8,
      },
      {
        label: 'Контекст',
        prompt: 'Инфографика с таймлайном: ключевые даты и события появляются на временной шкале, иконки и стрелки связывают факты, чистый белый фон, акцентные цвета',
        style: 'motion-graphics',
        duration: 12,
      },
      {
        label: 'Механизм',
        prompt: 'Анимированная схема: шестерёнки и блоки показывают как работает процесс, стрелки указывают поток данных или действий, изометрический 3D-стиль, яркие цвета',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Пример',
        prompt: 'Реальный пример: сплит-экран до/после, числа и графики показывают результат, зелёные стрелки роста, убедительная визуализация данных',
        style: 'motion-graphics',
        duration: 12,
      },
      {
        label: 'Вывод',
        prompt: 'Итоговый слайд: три ключевых вывода с галочками, внизу ссылка или QR-код, минималистичный дизайн с градиентным фоном, профессиональная типографика',
        style: 'motion-graphics',
        duration: 8,
      },
    ],
    tags: ['explainer', 'animated', 'education'],
  },

  /* ── 10. Gaming ───────────────────────────────────────── */
  {
    id: 'gaming',
    name: 'Игровой контент',
    nameEn: 'Gaming Content',
    description: 'Хайлайты геймплея: лучшие моменты — 3 сцены',
    descriptionEn: 'Gameplay highlights — 3 scenes',
    category: 'youtube',
    icon: '\uD83C\uDFAE',
    sceneCount: 3,
    scenes: [
      {
        label: 'Эпичный момент',
        prompt: 'Игровой экран с эпичным моментом: взрыв эффектов, яркие вспышки, счётчик комбо, динамичный HUD-интерфейс, тёмный фон с неоновыми акцентами, формат игрового монтажа',
        style: 'cinematic',
        duration: 10,
      },
      {
        label: 'Фейл/Вин',
        prompt: 'Смешной или впечатляющий момент: стоп-кадр с увеличением, красная рамка "FAIL" или золотая "WIN", на фоне замедленная съёмка ключевого действия, игровая стилистика',
        style: 'cinematic',
        duration: 8,
      },
      {
        label: 'Аутро',
        prompt: 'Игровое аутро: неоновый текст "GG" с рейтингом матча, статистика по центру, вокруг частицы и эффекты, тёмно-фиолетовый фон с кибер-стилистикой',
        style: 'cinematic',
        duration: 7,
      },
    ],
    tags: ['gaming', 'highlights', 'gameplay'],
  },

  /* ── 11. News ─────────────────────────────────────────── */
  {
    id: 'news',
    name: 'Новостной выпуск',
    nameEn: 'News Segment',
    description: 'Заголовок, детали, анализ, итог — 4 сцены',
    descriptionEn: 'Headline + details + analysis + summary — 4 scenes',
    category: 'business',
    icon: '\uD83D\uDCF0',
    sceneCount: 4,
    scenes: [
      {
        label: 'Заголовок',
        prompt: 'Срочные новости: красная плашка "BREAKING NEWS" анимируется в верхней части экрана, крупный заголовок появляется по центру, профессиональный новостной дизайн, синий фон',
        style: 'motion-graphics',
        duration: 5,
      },
      {
        label: 'Детали',
        prompt: 'Подробности новости: карта или фото на фоне, информационная плашка внизу экрана с бегущей строкой, боковая панель с ключевыми фактами, новостная стилистика',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Анализ',
        prompt: 'Аналитическая графика: диаграммы и графики показывают тренды, стрелки указывают на ключевые данные, разделённый экран с цифрами и процентами, деловой стиль',
        style: 'motion-graphics',
        duration: 12,
      },
      {
        label: 'Итог',
        prompt: 'Заключение выпуска: три основных вывода в колонках, внизу дата и источник, фирменная плашка канала, призыв подписаться на новости, строгий профессиональный дизайн',
        style: 'motion-graphics',
        duration: 8,
      },
    ],
    tags: ['news', 'breaking', 'analysis'],
  },

  /* ── 12. Recipe ───────────────────────────────────────── */
  {
    id: 'recipe',
    name: 'Рецепт',
    nameEn: 'Recipe',
    description: 'Кулинарный рецепт: ингредиенты, шаги, результат, подача — 4 сцены',
    descriptionEn: 'Recipe: ingredients + steps + result + serve — 4 scenes',
    category: 'education',
    icon: '\uD83C\uDF73',
    sceneCount: 4,
    scenes: [
      {
        label: 'Ингредиенты',
        prompt: 'Красивая раскладка ингредиентов на мраморной столешнице: овощи, специи, масла разложены в аккуратных мисочках, вид сверху, мягкий дневной свет, food-фотография',
        style: 'realistic',
        duration: 8,
      },
      {
        label: 'Готовка',
        prompt: 'Процесс приготовления: руки шефа нарезают ингредиенты на деревянной доске, на сковороде что-то шипит, пар поднимается, тёплый свет, уютная кухня, детальные крупные планы',
        style: 'realistic',
        duration: 20,
      },
      {
        label: 'Результат',
        prompt: 'Готовое блюдо: красивая подача на тарелке, гарнир, соус, зелень, идеальная food-стилистика, мягкий боковой свет, лёгкий пар от горячего блюда, аппетитные цвета',
        style: 'realistic',
        duration: 8,
      },
      {
        label: 'Подача',
        prompt: 'Сервировка и наслаждение: стол накрыт, руки берут приборы, первый кусочек на вилке, довольное выражение, тёплая домашняя атмосфера, мягкий фокус на заднем плане',
        style: 'realistic',
        duration: 8,
      },
    ],
    tags: ['recipe', 'cooking', 'food'],
  },
];

/* ── Helper functions ───────────────────────────────────── */

export function getTemplatesByCategory(category: TemplateCategory): ProjectTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** All unique categories present in the templates list */
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'youtube',
  'shorts',
  'social',
  'business',
  'education',
];

/** Category display info (bilingual) */
export const CATEGORY_INFO: Record<TemplateCategory, { name: string; nameEn: string; color: string }> = {
  youtube:   { name: 'YouTube',      nameEn: 'YouTube',    color: '#ff0000' },
  shorts:    { name: 'Shorts',       nameEn: 'Shorts',     color: '#ff6b35' },
  social:    { name: 'Соцсети',      nameEn: 'Social',     color: '#e91e8c' },
  business:  { name: 'Бизнес',       nameEn: 'Business',   color: '#2563eb' },
  education: { name: 'Обучение',     nameEn: 'Education',  color: '#16a34a' },
};
