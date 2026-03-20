'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore, type Locale } from '@/stores/useLocaleStore';

/* ── Types ───────────────────────────────────────────────────────── */

interface BlogArticle {
  slug: string;
  category: { ru: string; en: string };
  categoryColor: string;
  title: { ru: string; en: string };
  excerpt: { ru: string; en: string };
  date: string;
  readTime: { ru: string; en: string };
  content: { ru: string; en: string };
}

/* ── Translations ────────────────────────────────────────────────── */

const T: Record<string, Record<string, string>> = {
  back: { ru: '\u2190 На главную', en: '\u2190 Back to Home', kk: '\u2190 Басты бетке', es: '\u2190 Inicio' },
  heading: { ru: 'Блог TubeForge', en: 'TubeForge Blog', kk: 'TubeForge Блог', es: 'Blog TubeForge' },
  subtitle: {
    ru: 'Гайды, советы и инструменты для YouTube-креаторов',
    en: 'Guides, tips, and tools for YouTube creators',
    kk: 'YouTube-креаторлар \u04AF\u0448\u0456\u043D n\u04B1\u0441\u049B\u0430\u0443\u043B\u0430\u0440, \u043A\u0435\u04A3\u0435\u0441\u0442\u0435\u0440 \u0436\u04D9\u043D\u0435 \u049B\u04B1\u0440\u0430\u043B\u0434\u0430\u0440',
    es: 'Gu\u00edas, consejos y herramientas para creadores de YouTube',
  },
  readMore: { ru: 'Читать статью', en: 'Read article', kk: '\u041C\u0430\u049B\u0430\u043B\u0430\u043D\u044B \u043E\u049B\u0443', es: 'Leer art\u00edculo' },
  backToBlog: { ru: '\u2190 Все статьи', en: '\u2190 All articles', kk: '\u2190 \u0411\u0430\u0440\u043B\u044B\u049B \u043C\u0430\u049B\u0430\u043B\u0430\u043B\u0430\u0440', es: '\u2190 Todos los art\u00edculos' },
  footer: {
    ru: 'TubeForge. Все права защищены.',
    en: 'TubeForge. All rights reserved.',
    kk: 'TubeForge. \u0411\u0430\u0440\u043B\u044B\u049B \u049B\u04B1\u049B\u044B\u049B\u0442\u0430\u0440 \u049B\u043E\u0440\u0493\u0430\u043B\u0493\u0430\u043D.',
    es: 'TubeForge. Todos los derechos reservados.',
  },
};

function tr(key: string, locale: Locale): string {
  return T[key]?.[locale] ?? T[key]?.ru ?? key;
}

function loc(obj: { ru: string; en: string }, locale: Locale): string {
  if (locale === 'en') return obj.en;
  return obj.ru;
}

/* ── Articles Data ───────────────────────────────────────────────── */

const ARTICLES: BlogArticle[] = [
  {
    slug: 'kak-skachat-video-s-youtube-2026',
    category: { ru: 'Инструменты', en: 'Tools' },
    categoryColor: '#3a7bfd',
    title: {
      ru: 'Как скачать видео с YouTube в 2026 году',
      en: 'How to Download YouTube Videos in 2026',
    },
    excerpt: {
      ru: 'Полный гайд по скачиванию видео с YouTube: лучшие способы, форматы и инструменты. Разбираем TubeForge и другие решения.',
      en: 'Complete guide to downloading YouTube videos: best methods, formats, and tools. We cover TubeForge and other solutions.',
    },
    date: '2026-03-15',
    readTime: { ru: '7 мин', en: '7 min' },
    content: {
      ru: `<p>Скачивание видео с YouTube остаётся одной из самых популярных задач в интернете. В 2026 году появилось множество новых инструментов, но не все из них безопасны и удобны. В этом гайде разберём лучшие способы скачать видео с ютуба.</p>

<h2>Зачем скачивать видео с YouTube?</h2>
<p>Причин множество: просмотр офлайн в дороге, сохранение обучающих материалов, создание компиляций, бэкап своего контента. Для креаторов это особенно важно — вы можете скачать свои видео для перезалива на другие платформы.</p>

<h2>Способ 1: TubeForge YouTube Downloader</h2>
<p><strong><a href="/tools/youtube-downloader" style="color: #3a7bfd">TubeForge YouTube Downloader</a></strong> — это встроенный инструмент нашей платформы, который позволяет скачивать видео в форматах MP4, WebM и MP3. Преимущества:</p>
<ul>
<li>Скачивание в качестве до 1080p</li>
<li>Извлечение аудио в MP3</li>
<li>Работает прямо в браузере, без установки</li>
<li>Поддержка пакетного скачивания для Pro-подписчиков</li>
</ul>

<h2>Способ 2: YouTube Premium</h2>
<p>Официальный способ от Google. YouTube Premium позволяет скачивать видео в мобильном приложении для офлайн-просмотра. Стоимость — от 199 рублей в месяц. Минус: видео нельзя сохранить на компьютер или конвертировать в другой формат.</p>

<h2>Способ 3: Расширения для браузера</h2>
<p>Существуют расширения для Chrome и Firefox, но Google активно блокирует их. Многие расширения содержат рекламу или вредоносный код. Мы рекомендуем использовать проверенные веб-инструменты, такие как <a href="/tools/youtube-downloader" style="color: #3a7bfd">TubeForge</a>.</p>

<h2>Какой формат выбрать?</h2>
<p><strong>MP4</strong> — универсальный формат, работает везде. <strong>WebM</strong> — легче по размеру, идеален для веб. <strong>MP3</strong> — если нужно только аудио (подкасты, музыка). В TubeForge вы можете выбрать нужный формат перед скачиванием, а также воспользоваться <a href="/tools/mp3-converter" style="color: #3a7bfd">MP3 конвертером</a> для извлечения аудио.</p>

<h2>Легально ли скачивать видео?</h2>
<p>Скачивание для личного использования в большинстве случаев допустимо. Однако перезалив чужого контента без разрешения нарушает авторские права. Всегда уважайте авторов и используйте скачанные материалы ответственно.</p>

<p><strong>Попробуйте <a href="/tools/youtube-downloader" style="color: #3a7bfd">TubeForge YouTube Downloader</a></strong> — простой и безопасный способ скачать видео с YouTube прямо сейчас.</p>`,

      en: `<p>Downloading videos from YouTube remains one of the most popular tasks on the internet. In 2026, many new tools have appeared, but not all of them are safe and convenient. In this guide, we cover the best ways to download YouTube videos.</p>

<h2>Why Download YouTube Videos?</h2>
<p>There are many reasons: offline viewing while traveling, saving educational materials, creating compilations, backing up your content. For creators, this is especially important — you can download your videos to re-upload on other platforms.</p>

<h2>Method 1: TubeForge YouTube Downloader</h2>
<p><strong><a href="/tools/youtube-downloader" style="color: #3a7bfd">TubeForge YouTube Downloader</a></strong> is our platform's built-in tool that lets you download videos in MP4, WebM, and MP3 formats. Advantages:</p>
<ul>
<li>Download in quality up to 1080p</li>
<li>Extract audio as MP3</li>
<li>Works right in your browser, no installation needed</li>
<li>Batch download support for Pro subscribers</li>
</ul>

<h2>Method 2: YouTube Premium</h2>
<p>The official method from Google. YouTube Premium lets you download videos in the mobile app for offline viewing. The cost starts at 199 rubles per month. Downside: you can't save videos to your computer or convert to other formats.</p>

<h2>Method 3: Browser Extensions</h2>
<p>There are Chrome and Firefox extensions, but Google actively blocks them. Many extensions contain ads or malicious code. We recommend using trusted web tools like <a href="/tools/youtube-downloader" style="color: #3a7bfd">TubeForge</a>.</p>

<h2>Which Format to Choose?</h2>
<p><strong>MP4</strong> — universal format, works everywhere. <strong>WebM</strong> — lighter in size, ideal for web. <strong>MP3</strong> — when you only need audio (podcasts, music). In TubeForge you can choose the format before downloading, and also use the <a href="/tools/mp3-converter" style="color: #3a7bfd">MP3 converter</a> to extract audio.</p>

<h2>Is Downloading Videos Legal?</h2>
<p>Downloading for personal use is generally acceptable. However, re-uploading someone else's content without permission violates copyright. Always respect authors and use downloaded materials responsibly.</p>

<p><strong>Try <a href="/tools/youtube-downloader" style="color: #3a7bfd">TubeForge YouTube Downloader</a></strong> — a simple and safe way to download YouTube videos right now.</p>`,
    },
  },
  {
    slug: 'vpn-dlya-youtube-v-rossii',
    category: { ru: 'VPN', en: 'VPN' },
    categoryColor: '#8b5cf6',
    title: {
      ru: 'VPN для YouTube в России — полное руководство',
      en: 'VPN for YouTube in Russia — Complete Guide',
    },
    excerpt: {
      ru: 'Как получить доступ к YouTube из России в 2026 году. Обзор VPN-решений, настройка WireGuard и встроенный VPN от TubeForge.',
      en: 'How to access YouTube from Russia in 2026. Overview of VPN solutions, WireGuard setup, and built-in VPN from TubeForge.',
    },
    date: '2026-03-10',
    readTime: { ru: '8 мин', en: '8 min' },
    content: {
      ru: `<p>С ограничением доступа к YouTube в России многие пользователи ищут надёжные VPN-решения. В этом руководстве расскажем, как зайти на ютуб из России, какие VPN выбрать и как настроить всё за 5 минут.</p>

<h2>Почему YouTube заблокирован?</h2>
<p>Роскомнадзор ограничил доступ к YouTube на территории России. Замедление и блокировка затрагивают всех пользователей: и зрителей, и креаторов. Для YouTube-блогеров это критично — невозможно загружать контент, отслеживать аналитику и общаться с аудиторией.</p>

<h2>Решение: VPN от TubeForge</h2>
<p><strong><a href="/vpn" style="color: #8b5cf6">TubeForge VPN</a></strong> — это встроенное решение для наших подписчиков Pro и Studio. Что вы получаете:</p>
<ul>
<li>Персональный WireGuard-сервер в Европе</li>
<li>Скорость до 1 Гбит/с — достаточно для 4K</li>
<li>Шифрование военного уровня</li>
<li>Работает на Windows, macOS, iOS, Android, Linux</li>
<li>Автоматическая настройка — просто скачайте конфиг</li>
</ul>

<h2>Как настроить VPN от TubeForge</h2>
<ol>
<li><strong>Оформите подписку</strong> Pro или Studio на <a href="/billing" style="color: #8b5cf6">странице тарифов</a></li>
<li><strong>Скачайте конфигурацию</strong> в <a href="/settings" style="color: #8b5cf6">настройках аккаунта</a></li>
<li><strong>Установите WireGuard</strong> на ваше устройство (бесплатное приложение)</li>
<li><strong>Импортируйте конфиг</strong> — YouTube работает!</li>
</ol>

<h2>Альтернативные VPN-сервисы</h2>
<p>Если вам нужен только VPN без инструментов для креаторов, рассмотрите: Mullvad VPN, ProtonVPN, или Amnezia VPN. Однако TubeForge VPN включён в подписку и не требует отдельной оплаты.</p>

<h2>Сравнение протоколов</h2>
<p><strong>WireGuard</strong> — самый быстрый и современный протокол. Он значительно быстрее OpenVPN и проще в настройке. Именно WireGuard использует TubeForge VPN.</p>

<h2>Безопасность</h2>
<p>Ваш трафик полностью шифруется. TubeForge не хранит логи подключений. Приватный ключ генерируется индивидуально для каждого пользователя.</p>

<p><strong><a href="/vpn" style="color: #8b5cf6">Подключите VPN от TubeForge</a></strong> и получите доступ к YouTube из любой точки мира.</p>`,

      en: `<p>With restricted access to YouTube in Russia, many users are looking for reliable VPN solutions. In this guide, we explain how to access YouTube from Russia, which VPNs to choose, and how to set everything up in 5 minutes.</p>

<h2>Why Is YouTube Blocked?</h2>
<p>Roskomnadzor has restricted access to YouTube in Russia. The throttling and blocking affects all users: both viewers and creators. For YouTube bloggers, this is critical — it's impossible to upload content, track analytics, and communicate with the audience.</p>

<h2>Solution: TubeForge VPN</h2>
<p><strong><a href="/vpn" style="color: #8b5cf6">TubeForge VPN</a></strong> is a built-in solution for our Pro and Studio subscribers. What you get:</p>
<ul>
<li>Personal WireGuard server in Europe</li>
<li>Speed up to 1 Gbps — enough for 4K</li>
<li>Military-grade encryption</li>
<li>Works on Windows, macOS, iOS, Android, Linux</li>
<li>Automatic setup — just download the config</li>
</ul>

<h2>How to Set Up TubeForge VPN</h2>
<ol>
<li><strong>Subscribe</strong> to Pro or Studio on the <a href="/billing" style="color: #8b5cf6">pricing page</a></li>
<li><strong>Download the configuration</strong> in <a href="/settings" style="color: #8b5cf6">account settings</a></li>
<li><strong>Install WireGuard</strong> on your device (free app)</li>
<li><strong>Import the config</strong> — YouTube works!</li>
</ol>

<h2>Alternative VPN Services</h2>
<p>If you only need a VPN without creator tools, consider: Mullvad VPN, ProtonVPN, or Amnezia VPN. However, TubeForge VPN is included in the subscription and doesn't require separate payment.</p>

<h2>Protocol Comparison</h2>
<p><strong>WireGuard</strong> is the fastest and most modern protocol. It's significantly faster than OpenVPN and easier to configure. TubeForge VPN uses WireGuard.</p>

<h2>Security</h2>
<p>Your traffic is fully encrypted. TubeForge doesn't store connection logs. The private key is generated individually for each user.</p>

<p><strong><a href="/vpn" style="color: #8b5cf6">Connect TubeForge VPN</a></strong> and get access to YouTube from anywhere in the world.</p>`,
    },
  },
  {
    slug: 'luchshie-ai-instrumenty-dlya-youtube',
    category: { ru: 'AI', en: 'AI' },
    categoryColor: '#2dd4a0',
    title: {
      ru: 'Лучшие AI инструменты для YouTube блогеров',
      en: 'Best AI Tools for YouTube Bloggers',
    },
    excerpt: {
      ru: 'Обзор нейросетей и AI-инструментов для YouTube в 2026: генерация видео, обложки, субтитры, озвучка и планирование контента.',
      en: 'Overview of neural networks and AI tools for YouTube in 2026: video generation, thumbnails, subtitles, voiceover, and content planning.',
    },
    date: '2026-03-05',
    readTime: { ru: '10 мин', en: '10 min' },
    content: {
      ru: `<p>Искусственный интеллект стал незаменимым помощником для YouTube-креаторов. В 2026 году нейросети умеют генерировать видео, создавать обложки, писать сценарии и даже озвучивать ролики. Разберём лучшие AI инструменты для ютубера.</p>

<h2>1. Генерация видео с AI</h2>
<p>Нейросети вроде Sora, Veo 3 и Runway Gen-3 позволяют создавать видеоконтент из текстового описания. В TubeForge доступен <a href="/tools/ai-video-generator" style="color: #2dd4a0">AI Video Generator</a> и <a href="/tools/veo3-generator" style="color: #2dd4a0">Veo 3 Generator</a> — генерируйте клипы прямо в браузере.</p>

<h2>2. AI-обложки для YouTube</h2>
<p>Обложка (thumbnail) — это первое, что видит зритель. <a href="/thumbnails" style="color: #2dd4a0">AI Thumbnail Generator</a> в TubeForge создаёт привлекательные обложки с помощью нейросетей. Вы описываете идею, а AI генерирует варианты.</p>

<h2>3. Автоматические субтитры</h2>
<p>Субтитры увеличивают охват и доступность видео. <a href="/tools/subtitle-editor" style="color: #2dd4a0">Subtitle Editor</a> в TubeForge автоматически транскрибирует речь и создаёт субтитры на нескольких языках.</p>

<h2>4. AI-озвучка</h2>
<p>Нужно озвучить видео на другом языке? <a href="/tools/voiceover-generator" style="color: #2dd4a0">Voiceover Generator</a> создаёт реалистичную озвучку на десятках языков. Идеально для мультиязычных каналов.</p>

<h2>5. Планирование контента</h2>
<p><a href="/tools/content-planner" style="color: #2dd4a0">Content Planner</a> анализирует тренды и помогает планировать контент-план на недели вперёд. AI подсказывает темы, которые набирают популярность.</p>

<h2>6. Улучшение аудио</h2>
<p><a href="/tools/speech-enhancer" style="color: #2dd4a0">Speech Enhancer</a> убирает фоновый шум и улучшает качество голоса. <a href="/tools/vocal-remover" style="color: #2dd4a0">Vocal Remover</a> извлекает голос из аудио для создания ремиксов или закадровки.</p>

<h2>7. Оптимизация метаданных</h2>
<p>Правильные заголовки, описания и теги — ключ к продвижению на YouTube. <a href="/metadata" style="color: #2dd4a0">Metadata Optimizer</a> в TubeForge анализирует ваши метаданные и предлагает улучшения для повышения CTR.</p>

<h2>Итог</h2>
<p>AI инструменты экономят десятки часов в неделю. TubeForge объединяет все необходимые инструменты в одной платформе — от генерации видео до оптимизации метаданных. <a href="/dashboard" style="color: #2dd4a0">Попробуйте бесплатно</a>.</p>`,

      en: `<p>Artificial intelligence has become an indispensable assistant for YouTube creators. In 2026, neural networks can generate videos, create thumbnails, write scripts, and even voice over clips. Let's review the best AI tools for YouTubers.</p>

<h2>1. AI Video Generation</h2>
<p>Neural networks like Sora, Veo 3, and Runway Gen-3 allow creating video content from text descriptions. TubeForge offers the <a href="/tools/ai-video-generator" style="color: #2dd4a0">AI Video Generator</a> and <a href="/tools/veo3-generator" style="color: #2dd4a0">Veo 3 Generator</a> — generate clips right in your browser.</p>

<h2>2. AI Thumbnails for YouTube</h2>
<p>The thumbnail is the first thing viewers see. The <a href="/thumbnails" style="color: #2dd4a0">AI Thumbnail Generator</a> in TubeForge creates attractive thumbnails using neural networks. Describe your idea, and AI generates variations.</p>

<h2>3. Automatic Subtitles</h2>
<p>Subtitles increase reach and accessibility. The <a href="/tools/subtitle-editor" style="color: #2dd4a0">Subtitle Editor</a> in TubeForge automatically transcribes speech and creates subtitles in multiple languages.</p>

<h2>4. AI Voiceover</h2>
<p>Need to voice a video in another language? The <a href="/tools/voiceover-generator" style="color: #2dd4a0">Voiceover Generator</a> creates realistic voiceovers in dozens of languages. Perfect for multilingual channels.</p>

<h2>5. Content Planning</h2>
<p>The <a href="/tools/content-planner" style="color: #2dd4a0">Content Planner</a> analyzes trends and helps plan content weeks ahead. AI suggests topics that are gaining popularity.</p>

<h2>6. Audio Enhancement</h2>
<p>The <a href="/tools/speech-enhancer" style="color: #2dd4a0">Speech Enhancer</a> removes background noise and improves voice quality. <a href="/tools/vocal-remover" style="color: #2dd4a0">Vocal Remover</a> extracts vocals for creating remixes or voice-overs.</p>

<h2>7. Metadata Optimization</h2>
<p>Proper titles, descriptions, and tags are key to YouTube promotion. The <a href="/metadata" style="color: #2dd4a0">Metadata Optimizer</a> in TubeForge analyzes your metadata and suggests improvements to boost CTR.</p>

<h2>Conclusion</h2>
<p>AI tools save dozens of hours per week. TubeForge combines all necessary tools in one platform — from video generation to metadata optimization. <a href="/dashboard" style="color: #2dd4a0">Try it for free</a>.</p>`,
    },
  },
  {
    slug: 'kak-sdelat-prevyu-dlya-youtube-2026',
    category: { ru: 'Дизайн', en: 'Design' },
    categoryColor: '#f59e0b',
    title: {
      ru: 'Как сделать превью для YouTube \u2014 гайд 2026',
      en: 'How to Create YouTube Thumbnails \u2014 2026 Guide',
    },
    excerpt: {
      ru: 'Пошаговое руководство по созданию кликабельных обложек для YouTube. Шрифты, цвета, композиция и AI-генерация.',
      en: 'Step-by-step guide to creating clickable YouTube thumbnails. Fonts, colors, composition, and AI generation.',
    },
    date: '2026-02-28',
    readTime: { ru: '9 мин', en: '9 min' },
    content: {
      ru: `<p>Обложка видео (thumbnail) — это ваша главная реклама на YouTube. По статистике, 90% самых просматриваемых видео имеют кастомное превью. Разберём, как сделать превью для ютуба, которое привлечёт клики.</p>

<h2>Правила эффективного превью</h2>
<p>Прежде чем открывать редактор, запомните ключевые принципы:</p>
<ul>
<li><strong>Контрастность</strong> — используйте яркие цвета, которые выделяются в ленте</li>
<li><strong>Крупный текст</strong> — 3-5 слов максимум, читаемые на мобильном</li>
<li><strong>Лицо с эмоцией</strong> — лица увеличивают CTR на 30-40%</li>
<li><strong>Минимализм</strong> — не перегружайте обложку деталями</li>
</ul>

<h2>Размер и формат</h2>
<p>YouTube рекомендует: <strong>1280x720 пикселей</strong> (соотношение 16:9). Формат: JPG или PNG, до 2 МБ. В <a href="/thumbnails" style="color: #f59e0b">TubeForge Thumbnail Editor</a> эти параметры настроены по умолчанию.</p>

<h2>Шрифты для превью</h2>
<p>Лучшие шрифты для YouTube-обложек: <strong>Montserrat Bold</strong>, <strong>Oswald</strong>, <strong>Impact</strong>. Для русского текста отлично работают <strong>Golos</strong> и <strong>Unbounded</strong>. Используйте обводку (stroke) для читаемости на любом фоне.</p>

<h2>Цветовые схемы</h2>
<p>Проверенные комбинации:</p>
<ul>
<li><strong>Красный + жёлтый</strong> — энергия, срочность (MrBeast стиль)</li>
<li><strong>Синий + белый</strong> — доверие, технологии</li>
<li><strong>Чёрный + неоновый</strong> — геймерская тематика</li>
<li><strong>Градиенты</strong> — современный и стильный вид</li>
</ul>

<h2>Создание превью в TubeForge</h2>
<p><a href="/thumbnails" style="color: #f59e0b">TubeForge Thumbnail Editor</a> предлагает:</p>
<ol>
<li><strong>AI-генерация</strong> — опишите идею, получите готовое превью</li>
<li><strong>Шаблоны</strong> — сотни профессиональных шаблонов</li>
<li><strong>Удаление фона</strong> — <a href="/tools/background-remover" style="color: #f59e0b">Background Remover</a> вырежет объект за секунды</li>
<li><strong>Текст и стикеры</strong> — добавьте заголовок прямо в редакторе</li>
</ol>

<h2>A/B тестирование</h2>
<p>YouTube позволяет тестировать несколько обложек. Создайте 2-3 варианта и отслеживайте CTR через аналитику. В TubeForge можно быстро генерировать вариации с помощью AI.</p>

<h2>Частые ошибки</h2>
<ul>
<li>Слишком мелкий текст — нечитаемый на телефоне</li>
<li>Кликбейт без связи с видео — увеличивает отток</li>
<li>Использование стоковых фото — выглядит неоригинально</li>
</ul>

<p><strong><a href="/thumbnails" style="color: #f59e0b">Создайте превью в TubeForge</a></strong> за минуту — с AI или в ручном редакторе.</p>`,

      en: `<p>The video thumbnail is your main advertisement on YouTube. Statistics show that 90% of the most-watched videos have custom thumbnails. Let's break down how to create YouTube thumbnails that attract clicks.</p>

<h2>Rules for Effective Thumbnails</h2>
<p>Before opening an editor, remember the key principles:</p>
<ul>
<li><strong>Contrast</strong> — use bright colors that stand out in the feed</li>
<li><strong>Large text</strong> — 3-5 words maximum, readable on mobile</li>
<li><strong>Face with emotion</strong> — faces increase CTR by 30-40%</li>
<li><strong>Minimalism</strong> — don't overload the thumbnail with details</li>
</ul>

<h2>Size and Format</h2>
<p>YouTube recommends: <strong>1280x720 pixels</strong> (16:9 aspect ratio). Format: JPG or PNG, up to 2 MB. In the <a href="/thumbnails" style="color: #f59e0b">TubeForge Thumbnail Editor</a>, these parameters are set by default.</p>

<h2>Fonts for Thumbnails</h2>
<p>Best fonts for YouTube thumbnails: <strong>Montserrat Bold</strong>, <strong>Oswald</strong>, <strong>Impact</strong>. For Russian text, <strong>Golos</strong> and <strong>Unbounded</strong> work great. Use stroke for readability on any background.</p>

<h2>Color Schemes</h2>
<p>Proven combinations:</p>
<ul>
<li><strong>Red + yellow</strong> — energy, urgency (MrBeast style)</li>
<li><strong>Blue + white</strong> — trust, technology</li>
<li><strong>Black + neon</strong> — gaming theme</li>
<li><strong>Gradients</strong> — modern and stylish look</li>
</ul>

<h2>Creating Thumbnails in TubeForge</h2>
<p>The <a href="/thumbnails" style="color: #f59e0b">TubeForge Thumbnail Editor</a> offers:</p>
<ol>
<li><strong>AI generation</strong> — describe your idea, get a ready thumbnail</li>
<li><strong>Templates</strong> — hundreds of professional templates</li>
<li><strong>Background removal</strong> — <a href="/tools/background-remover" style="color: #f59e0b">Background Remover</a> cuts out objects in seconds</li>
<li><strong>Text and stickers</strong> — add titles right in the editor</li>
</ol>

<h2>A/B Testing</h2>
<p>YouTube allows testing multiple thumbnails. Create 2-3 variations and track CTR through analytics. In TubeForge, you can quickly generate variations using AI.</p>

<h2>Common Mistakes</h2>
<ul>
<li>Text too small — unreadable on phones</li>
<li>Clickbait unrelated to the video — increases churn</li>
<li>Using stock photos — looks unoriginal</li>
</ul>

<p><strong><a href="/thumbnails" style="color: #f59e0b">Create a thumbnail in TubeForge</a></strong> in a minute — with AI or the manual editor.</p>`,
    },
  },
  {
    slug: 'tiktok-vs-youtube-shorts-2026',
    category: { ru: 'Аналитика', en: 'Analytics' },
    categoryColor: '#ec4899',
    title: {
      ru: 'TikTok vs YouTube Shorts \u2014 что выбрать в 2026',
      en: 'TikTok vs YouTube Shorts \u2014 What to Choose in 2026',
    },
    excerpt: {
      ru: 'Подробное сравнение TikTok и YouTube Shorts: монетизация, охваты, алгоритмы, аудитория и аналитика. Что лучше для блогера?',
      en: 'Detailed comparison of TikTok and YouTube Shorts: monetization, reach, algorithms, audience, and analytics. What\'s better for a blogger?',
    },
    date: '2026-02-20',
    readTime: { ru: '8 мин', en: '8 min' },
    content: {
      ru: `<p>Короткие видео доминируют в интернете. TikTok и YouTube Shorts борются за внимание создателей контента. Разберём, что выбрать в 2026 году и как использовать обе платформы максимально эффективно.</p>

<h2>Аудитория</h2>
<p><strong>TikTok:</strong> 1.5 млрд активных пользователей. Основная аудитория — 16-30 лет. Сильные позиции в Азии, Европе и Латинской Америке.</p>
<p><strong>YouTube Shorts:</strong> 2 млрд+ пользователей YouTube, растущая доля Shorts. Более широкий возрастной диапазон. Сильные позиции везде, кроме Китая.</p>

<h2>Алгоритмы продвижения</h2>
<p><strong>TikTok</strong> славится алгоритмом For You Page — даже новый аккаунт может получить миллионы просмотров. Алгоритм больше ценит engagement rate (лайки, комментарии, время просмотра).</p>
<p><strong>YouTube Shorts</strong> интегрированы с основным YouTube. Если Shorts залетает, это может привести подписчиков на ваш основной канал. Алгоритм учитывает историю канала.</p>

<h2>Монетизация</h2>
<p><strong>TikTok:</strong> Creator Fund (невысокие выплаты), TikTok Shop, брендированный контент, донаты в прямых эфирах. Средний CPM: $0.02-0.05.</p>
<p><strong>YouTube Shorts:</strong> Программа монетизации Shorts (45% от рекламы), Super Thanks, членство канала. Средний CPM: $0.04-0.08. Плюс — возможность перевести зрителя на длинные видео с более высоким CPM.</p>

<h2>Инструменты создания</h2>
<p>Обе платформы предлагают встроенные редакторы. Но для профессионального контента лучше использовать внешние инструменты:</p>
<ul>
<li><a href="/tools/auto-clip" style="color: #ec4899">Auto Clip</a> — автоматически нарезает длинное видео на Shorts/TikTok</li>
<li><a href="/tools/cut-crop" style="color: #ec4899">Cut & Crop</a> — быстрая обрезка под формат 9:16</li>
<li><a href="/tools/subtitle-editor" style="color: #ec4899">Subtitle Editor</a> — добавьте субтитры (критично для коротких видео)</li>
<li><a href="/tools/tiktok-downloader" style="color: #ec4899">TikTok Downloader</a> — скачайте ролики без водяного знака</li>
</ul>

<h2>Аналитика</h2>
<p>Для отслеживания эффективности используйте <a href="/analytics" style="color: #ec4899">TubeForge Analytics</a> — анализируйте Shorts-контент и TikTok-метрики в одном дашборде. Также доступна <a href="/shorts-analytics" style="color: #ec4899">Shorts Analytics</a> и <a href="/tiktok-analytics" style="color: #ec4899">TikTok Analytics</a>.</p>

<h2>Что выбрать?</h2>
<p><strong>Оптимальная стратегия в 2026 — публиковать на обеих платформах.</strong> Снимайте видео один раз, адаптируйте под каждую платформу. TikTok даёт быстрый рост, YouTube Shorts — долгосрочную монетизацию и связь с основным каналом.</p>

<h2>Рекомендация</h2>
<p>Используйте <a href="/tools/auto-clip" style="color: #ec4899">TubeForge Auto Clip</a> для автоматической нарезки контента и публикуйте на обеих платформах одновременно. Это экономит время и максимизирует охват.</p>`,

      en: `<p>Short videos dominate the internet. TikTok and YouTube Shorts compete for content creators' attention. Let's figure out what to choose in 2026 and how to use both platforms most effectively.</p>

<h2>Audience</h2>
<p><strong>TikTok:</strong> 1.5 billion active users. Core audience — ages 16-30. Strong presence in Asia, Europe, and Latin America.</p>
<p><strong>YouTube Shorts:</strong> 2 billion+ YouTube users, growing Shorts share. Broader age range. Strong presence everywhere except China.</p>

<h2>Promotion Algorithms</h2>
<p><strong>TikTok</strong> is famous for its For You Page algorithm — even a new account can get millions of views. The algorithm values engagement rate (likes, comments, watch time).</p>
<p><strong>YouTube Shorts</strong> are integrated with main YouTube. If a Short goes viral, it can bring subscribers to your main channel. The algorithm considers channel history.</p>

<h2>Monetization</h2>
<p><strong>TikTok:</strong> Creator Fund (low payouts), TikTok Shop, branded content, live stream donations. Average CPM: $0.02-0.05.</p>
<p><strong>YouTube Shorts:</strong> Shorts monetization program (45% of ad revenue), Super Thanks, channel memberships. Average CPM: $0.04-0.08. Plus — ability to funnel viewers to long-form videos with higher CPM.</p>

<h2>Creation Tools</h2>
<p>Both platforms offer built-in editors. But for professional content, use external tools:</p>
<ul>
<li><a href="/tools/auto-clip" style="color: #ec4899">Auto Clip</a> — automatically cuts long video into Shorts/TikTok</li>
<li><a href="/tools/cut-crop" style="color: #ec4899">Cut & Crop</a> — quick crop to 9:16 format</li>
<li><a href="/tools/subtitle-editor" style="color: #ec4899">Subtitle Editor</a> — add subtitles (critical for short videos)</li>
<li><a href="/tools/tiktok-downloader" style="color: #ec4899">TikTok Downloader</a> — download videos without watermark</li>
</ul>

<h2>Analytics</h2>
<p>To track performance, use <a href="/analytics" style="color: #ec4899">TubeForge Analytics</a> — analyze Shorts content and TikTok metrics in one dashboard. Also available: <a href="/shorts-analytics" style="color: #ec4899">Shorts Analytics</a> and <a href="/tiktok-analytics" style="color: #ec4899">TikTok Analytics</a>.</p>

<h2>What to Choose?</h2>
<p><strong>The optimal strategy in 2026 is to publish on both platforms.</strong> Record video once, adapt for each platform. TikTok gives rapid growth, YouTube Shorts — long-term monetization and connection to your main channel.</p>

<h2>Recommendation</h2>
<p>Use <a href="/tools/auto-clip" style="color: #ec4899">TubeForge Auto Clip</a> to automatically cut content and publish on both platforms simultaneously. This saves time and maximizes reach.</p>`,
    },
  },
];

/* ── SVG Icons ───────────────────────────────────────────────────── */

const CalendarIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="2.5" width="13" height="11.5" rx="2" stroke={color} strokeWidth="1.2" />
    <path d="M1.5 6.5H14.5" stroke={color} strokeWidth="1.2" />
    <path d="M5 1V4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M11 1V4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const ClockIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.2" />
    <path d="M8 4V8L10.5 10.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Article Card ────────────────────────────────────────────────── */

function ArticleCard({
  article,
  locale,
  theme,
  isDark,
  onSelect,
}: {
  article: BlogArticle;
  locale: Locale;
  theme: Record<string, string>;
  isDark: boolean;
  onSelect: (slug: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onClick={() => onSelect(article.slug)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(article.slug); } }}
      style={{
        background: isDark
          ? hovered ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)'
          : hovered ? '#fff' : theme.card,
        border: `1px solid ${hovered ? theme.borderActive : theme.border}`,
        borderRadius: 16,
        padding: '28px 24px',
        cursor: 'pointer',
        transition: 'all .2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered
          ? isDark ? '0 8px 24px rgba(0,0,0,.3)' : '0 8px 24px rgba(0,0,0,.08)'
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Category badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            color: article.categoryColor,
            background: `${article.categoryColor}15`,
            padding: '3px 10px',
            borderRadius: 6,
          }}
        >
          {loc(article.category, locale)}
        </span>
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: 19,
          fontWeight: 750,
          color: theme.text,
          letterSpacing: '-.02em',
          lineHeight: 1.35,
          margin: 0,
        }}
      >
        {loc(article.title, locale)}
      </h2>

      {/* Excerpt */}
      <p
        style={{
          fontSize: 13.5,
          color: theme.sub,
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
        }}
      >
        {loc(article.excerpt, locale)}
      </p>

      {/* Footer: date + read time + arrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: theme.dim }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CalendarIcon color={theme.dim} />
            {article.date}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ClockIcon color={theme.dim} />
            {loc(article.readTime, locale)}
          </span>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            color: hovered ? theme.accent : theme.sub,
            transition: 'color .2s',
          }}
        >
          {tr('readMore', locale)}
          <ArrowIcon color={hovered ? theme.accent : theme.sub} />
        </span>
      </div>
    </article>
  );
}

/* ── Article Detail ──────────────────────────────────────────────── */

function ArticleDetail({
  article,
  locale,
  theme,
  isDark,
  onBack,
}: {
  article: BlogArticle;
  locale: Locale;
  theme: Record<string, string>;
  isDark: boolean;
  onBack: () => void;
}) {
  return (
    <article style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: theme.sub,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          padding: '4px 0',
          marginBottom: 24,
          fontFamily: 'inherit',
          transition: 'color .15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.accent; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.sub; }}
      >
        {tr('backToBlog', locale)}
      </button>

      {/* Article header */}
      <div
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${theme.card}, rgba(17,17,25,.9))`
            : theme.card,
          border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : theme.border}`,
          borderRadius: 20,
          padding: '40px 36px',
        }}
      >
        {/* Category badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            color: article.categoryColor,
            background: `${article.categoryColor}15`,
            padding: '4px 12px',
            borderRadius: 6,
            display: 'inline-block',
            marginBottom: 16,
          }}
        >
          {loc(article.category, locale)}
        </span>

        {/* Title */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: theme.text,
            letterSpacing: '-.03em',
            lineHeight: 1.3,
            margin: '0 0 12px',
          }}
        >
          {loc(article.title, locale)}
        </h1>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 13,
            color: theme.dim,
            marginBottom: 32,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <CalendarIcon color={theme.dim} />
            {article.date}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ClockIcon color={theme.dim} />
            {loc(article.readTime, locale)}
          </span>
        </div>

        {/* Content */}
        <div
          className="blog-article-content"
          dangerouslySetInnerHTML={{ __html: loc(article.content, locale) }}
          style={{
            fontSize: 15,
            lineHeight: 1.75,
            color: theme.text,
          }}
        />
      </div>
    </article>
  );
}

/* ── Main Blog Page ──────────────────────────────────────────────── */

export default function BlogPage() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const locale = useLocaleStore((s) => s.locale);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Read hash on mount and respond to hash changes
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ARTICLES.some((a) => a.slug === hash)) {
        setSelectedSlug(hash);
      } else {
        setSelectedSlug(null);
      }
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  const handleSelect = useCallback((slug: string) => {
    setSelectedSlug(slug);
    window.history.pushState(null, '', `#${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedSlug(null);
    window.history.pushState(null, '', window.location.pathname);
  }, []);

  const selectedArticle = selectedSlug ? ARTICLES.find((a) => a.slug === selectedSlug) : null;

  // Cast theme to Record<string, string> for easier access
  const theme = C as unknown as Record<string, string>;

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: isDark ? theme.bg : '#f8f8fc',
        color: theme.text,
        fontFamily: "var(--font-sans), 'Instrument Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Back to home */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: theme.sub,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 32,
            transition: 'color .15s',
          }}
        >
          {tr('back', locale)}
        </Link>

        {selectedArticle ? (
          /* ── Article Detail View ──────────────── */
          <ArticleDetail
            article={selectedArticle}
            locale={locale}
            theme={theme}
            isDark={isDark}
            onBack={handleBack}
          />
        ) : (
          /* ── Article List View ───────────────── */
          <>
            {/* Header */}
            <div style={{ marginBottom: 36 }}>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: '-.04em',
                  color: theme.text,
                  margin: '0 0 8px',
                }}
              >
                {tr('heading', locale)}
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: theme.sub,
                  margin: 0,
                  fontWeight: 450,
                }}
              >
                {tr('subtitle', locale)}
              </p>
            </div>

            {/* Articles Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
                gap: 16,
              }}
            >
              {ARTICLES.map((article) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  locale={locale}
                  theme={theme}
                  isDark={isDark}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 48,
            fontSize: 13,
            color: theme.dim,
          }}
        >
          {'\u00A9'} {new Date().getFullYear()} {tr('footer', locale)}
        </div>
      </div>

      {/* Article content styles */}
      <style>{`
        .blog-article-content h2 {
          font-size: 20px;
          font-weight: 750;
          letter-spacing: -.02em;
          margin: 28px 0 12px;
          color: ${theme.text};
        }
        .blog-article-content p {
          margin: 0 0 16px;
        }
        .blog-article-content ul,
        .blog-article-content ol {
          margin: 0 0 16px;
          padding-left: 24px;
        }
        .blog-article-content li {
          margin-bottom: 6px;
        }
        .blog-article-content a {
          text-decoration: none;
          font-weight: 600;
          transition: opacity .15s;
        }
        .blog-article-content a:hover {
          opacity: .8;
          text-decoration: underline;
        }
        .blog-article-content strong {
          font-weight: 700;
          color: ${theme.text};
        }
        @media (max-width: 640px) {
          .blog-article-content h2 {
            font-size: 18px;
          }
        }
      `}</style>
    </main>
  );
}
