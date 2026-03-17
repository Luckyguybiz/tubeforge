import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'ru' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  ru: {
    // Navigation & Layout
    'nav.dashboard': 'Дашборд',
    'nav.editor': 'Редактор',
    'nav.metadata': 'Метаданные',
    'nav.thumbnails': 'Обложки',
    'nav.preview': 'Превью',
    'nav.team': 'Команда',
    'nav.settings': 'Настройки',
    'nav.admin': 'Админка',
    'nav.billing': 'Оплата',

    // Sidebar
    'sidebar.search': 'Поиск...',
    'sidebar.upgrade': 'Перейти на Pro',
    'sidebar.upgradeCta': 'Улучшить план',
    'sidebar.upgradeDesc': 'Безлимитная ИИ-генерация и приоритетная поддержка',
    'sidebar.creation': 'Создание',
    'sidebar.tools': 'Инструменты',
    'sidebar.team': 'Команда',
    'sidebar.system': 'Система',
    'sidebar.collapse': 'Свернуть',
    'sidebar.collapseLabel': 'Свернуть боковую панель',
    'sidebar.expand': 'Развернуть',
    'sidebar.expandLabel': 'Развернуть боковую панель',
    'sidebar.searchLabel': 'Поиск (⌘K)',
    'sidebar.settingsLabel': 'Настройки',
    'sidebar.logoutLabel': 'Выйти из аккаунта',
    'sidebar.logout': 'Выйти',

    // TopBar
    'topbar.search': 'Поиск...',
    'topbar.searchProjects': 'Поиск по проектам...',
    'topbar.clearSearch': 'Очистить поиск',
    'topbar.newProject': 'Новый проект',
    'topbar.newProjectLabel': 'Создать новый проект',
    'topbar.notifications': 'Уведомления',
    'topbar.noNotifications': 'Нет уведомлений',
    'topbar.noNotificationsHint': 'Они появятся здесь',
    'topbar.markAllRead': 'Прочитать все',
    'topbar.profile': 'Профиль',
    'topbar.settings': 'Настройки',
    'topbar.logout': 'Выйти',
    'topbar.shortcuts': 'Горячие клавиши',
    'topbar.shortcutsLabel': 'Горячие клавиши (?)',
    'topbar.close': 'Закрыть',
    'topbar.searchTrigger': 'Поиск (⌘K)',

    // Auth - Login
    'auth.login.title': 'Войти в аккаунт',
    'auth.login.subtitle': 'С возвращением! Войдите чтобы продолжить.',
    'auth.login.google': 'Продолжить с Google',
    'auth.login.or': 'ИЛИ',
    'auth.login.email': 'Email',
    'auth.login.submit': 'Войти',
    'auth.login.noAccount': 'Нет аккаунта?',
    'auth.login.register': 'Регистрация',
    'auth.login.consent': 'Подключая аккаунт, вы даёте доступ к YouTube API для аналитики и загрузки видео.',
    'auth.login.errorLinked': 'Этот email уже привязан к другому аккаунту.',
    'auth.login.errorSignin': 'Не удалось начать авторизацию. Попробуйте снова.',
    'auth.login.errorGeneric': 'Не удалось войти. Попробуйте снова.',

    // Auth - Register
    'auth.register.title': 'Создайте бесплатный аккаунт',
    'auth.register.subtitle': 'Создавайте видео с помощью ИИ уже сегодня.',
    'auth.register.google': 'Продолжить с Google',
    'auth.register.or': 'ИЛИ',
    'auth.register.email': 'Email',
    'auth.register.submit': 'Зарегистрироваться',
    'auth.register.hasAccount': 'Уже есть аккаунт?',
    'auth.register.login': 'Войти',
    'auth.register.terms': 'Регистрируясь, вы соглашаетесь с',
    'auth.register.termsLink': 'Условиями использования',
    'auth.register.privacyLink': 'Политикой конфиденциальности',
    'auth.register.and': 'и',
    'auth.register.errorLinked': 'Этот email уже привязан к другому аккаунту.',
    'auth.register.errorGeneric': 'Не удалось войти через Google. Попробуйте снова.',

    // Dashboard
    'dashboard.greeting.morning': 'Доброе утро',
    'dashboard.greeting.afternoon': 'Добрый день',
    'dashboard.greeting.evening': 'Добрый вечер',
    'dashboard.subtitle': 'Ваши идеи ждут воплощения',
    'dashboard.quickActions': 'Быстрые действия',
    'dashboard.newVideo': 'Новое видео',
    'dashboard.newThumbnail': 'Новая обложка',
    'dashboard.optimizeSEO': 'Оптимизировать SEO',
    'dashboard.analytics': 'Аналитика',
    'dashboard.recentProjects': 'Последние проекты',
    'dashboard.noProjects': 'У вас пока нет проектов',
    'dashboard.createFirst': 'Создать первый проект',
    'dashboard.stats.views': 'Просмотры',
    'dashboard.stats.subscribers': 'Подписчики',
    'dashboard.stats.videos': 'Видео',
    'dashboard.stats.watchTime': 'Время просмотра',

    // Editor
    'editor.scenes': 'Сцены',
    'editor.addScene': 'Добавить сцену',
    'editor.generate': 'Генерировать',
    'editor.prompt': 'Промпт',
    'editor.duration': 'Длительность',
    'editor.voiceover': 'Озвучка',
    'editor.transition': 'Переход',
    'editor.toolbar.undo': 'Отменить',
    'editor.toolbar.redo': 'Повторить',
    'editor.toolbar.save': 'Сохранить',

    // Settings
    'settings.title': 'Настройки',
    'settings.subtitle': 'Управление аккаунтом, подпиской и предпочтениями',
    'settings.profile': 'Профиль',
    'settings.appearance': 'Внешний вид',
    'settings.notifications': 'Уведомления',
    'settings.language': 'Язык',
    'settings.languageTitle': 'Язык интерфейса',
    'settings.languageDesc': 'Выберите предпочтительный язык',
    'settings.dangerZone': 'Опасная зона',
    'settings.deleteAccount': 'Удалить аккаунт',
    'settings.save': 'Сохранить изменения',

    // Onboarding
    'onboarding.welcome': 'Добро пожаловать в TubeForge',
    'onboarding.welcomeDesc': 'Ваша ИИ-студия для YouTube. Создавайте видео, обложки и метаданные — всё в одном месте. Давайте покажем, как всё устроено!',
    'onboarding.dashboardTitle': 'Обзор дашборда',
    'onboarding.dashboardDesc': 'Здесь отображается статистика канала, последние видео и быстрые действия. Всё начинается с вашего дашборда.',
    'onboarding.projectTitle': 'Создайте первый проект',
    'onboarding.projectDesc': 'В основной области вы работаете над видео, редактируете метаданные и управляете проектами. Начните с создания нового проекта!',
    'onboarding.aiTitle': 'ИИ-инструменты',
    'onboarding.aiDesc': 'Используйте боковое меню для доступа к ИИ-генерации видео, редактору обложек, оптимизатору метаданных и другим инструментам.',
    'onboarding.next': 'Далее',
    'onboarding.start': 'Начать',
    'onboarding.back': 'Назад',
    'onboarding.skip': 'Пропустить',

    // Common
    'common.loading': 'Загрузка...',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.close': 'Закрыть',
    'common.confirm': 'Подтвердить',
    'common.termsOfService': 'Условия использования',
    'common.privacyPolicy': 'Политика конфиденциальности',
    'common.copyright': '© 2026 TubeForge',
    'common.free': 'Бесплатный',
    'common.pro': 'Pro',
    'common.studio': 'Studio',
    'common.user': 'Пользователь',

    // Footer
    'footer.terms': 'Условия использования',
    'footer.privacy': 'Политика конфиденциальности',
    'footer.copyright': '© 2026 TubeForge. Все права защищены.',
  },
  en: {
    // Navigation & Layout
    'nav.dashboard': 'Dashboard',
    'nav.editor': 'Editor',
    'nav.metadata': 'Metadata',
    'nav.thumbnails': 'Thumbnails',
    'nav.preview': 'Preview',
    'nav.team': 'Team',
    'nav.settings': 'Settings',
    'nav.admin': 'Admin',
    'nav.billing': 'Billing',

    // Sidebar
    'sidebar.search': 'Search...',
    'sidebar.upgrade': 'Upgrade to Pro',
    'sidebar.upgradeCta': 'Upgrade Plan',
    'sidebar.upgradeDesc': 'Unlimited AI generation and priority support',
    'sidebar.creation': 'Creation',
    'sidebar.tools': 'Tools',
    'sidebar.team': 'Team',
    'sidebar.system': 'System',
    'sidebar.collapse': 'Collapse',
    'sidebar.collapseLabel': 'Collapse sidebar',
    'sidebar.expand': 'Expand',
    'sidebar.expandLabel': 'Expand sidebar',
    'sidebar.searchLabel': 'Search (⌘K)',
    'sidebar.settingsLabel': 'Settings',
    'sidebar.logoutLabel': 'Sign out',
    'sidebar.logout': 'Sign Out',

    // TopBar
    'topbar.search': 'Search...',
    'topbar.searchProjects': 'Search projects...',
    'topbar.clearSearch': 'Clear search',
    'topbar.newProject': 'New Project',
    'topbar.newProjectLabel': 'Create new project',
    'topbar.notifications': 'Notifications',
    'topbar.noNotifications': 'No notifications',
    'topbar.noNotificationsHint': 'They will appear here',
    'topbar.markAllRead': 'Mark all read',
    'topbar.profile': 'Profile',
    'topbar.settings': 'Settings',
    'topbar.logout': 'Sign Out',
    'topbar.shortcuts': 'Keyboard Shortcuts',
    'topbar.shortcutsLabel': 'Keyboard Shortcuts (?)',
    'topbar.close': 'Close',
    'topbar.searchTrigger': 'Search (⌘K)',

    // Auth - Login
    'auth.login.title': 'Sign in to your account',
    'auth.login.subtitle': 'Welcome back! Sign in to continue.',
    'auth.login.google': 'Continue with Google',
    'auth.login.or': 'OR',
    'auth.login.email': 'Email',
    'auth.login.submit': 'Sign In',
    'auth.login.noAccount': "Don't have an account?",
    'auth.login.register': 'Sign Up',
    'auth.login.consent': 'By connecting your account, you grant access to YouTube API for analytics and video uploads.',
    'auth.login.errorLinked': 'This email is already linked to another account.',
    'auth.login.errorSignin': 'Could not start authorization. Please try again.',
    'auth.login.errorGeneric': 'Could not sign in. Please try again.',

    // Auth - Register
    'auth.register.title': 'Create a free account',
    'auth.register.subtitle': 'Start creating videos with AI today.',
    'auth.register.google': 'Continue with Google',
    'auth.register.or': 'OR',
    'auth.register.email': 'Email',
    'auth.register.submit': 'Sign Up',
    'auth.register.hasAccount': 'Already have an account?',
    'auth.register.login': 'Sign In',
    'auth.register.terms': 'By signing up, you agree to the',
    'auth.register.termsLink': 'Terms of Service',
    'auth.register.privacyLink': 'Privacy Policy',
    'auth.register.and': 'and',
    'auth.register.errorLinked': 'This email is already linked to another account.',
    'auth.register.errorGeneric': 'Could not sign in via Google. Please try again.',

    // Dashboard
    'dashboard.greeting.morning': 'Good morning',
    'dashboard.greeting.afternoon': 'Good afternoon',
    'dashboard.greeting.evening': 'Good evening',
    'dashboard.subtitle': 'Your ideas await',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.newVideo': 'New Video',
    'dashboard.newThumbnail': 'New Thumbnail',
    'dashboard.optimizeSEO': 'Optimize SEO',
    'dashboard.analytics': 'Analytics',
    'dashboard.recentProjects': 'Recent Projects',
    'dashboard.noProjects': "You don't have any projects yet",
    'dashboard.createFirst': 'Create your first project',
    'dashboard.stats.views': 'Views',
    'dashboard.stats.subscribers': 'Subscribers',
    'dashboard.stats.videos': 'Videos',
    'dashboard.stats.watchTime': 'Watch Time',

    // Editor
    'editor.scenes': 'Scenes',
    'editor.addScene': 'Add Scene',
    'editor.generate': 'Generate',
    'editor.prompt': 'Prompt',
    'editor.duration': 'Duration',
    'editor.voiceover': 'Voiceover',
    'editor.transition': 'Transition',
    'editor.toolbar.undo': 'Undo',
    'editor.toolbar.redo': 'Redo',
    'editor.toolbar.save': 'Save',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account, subscription and preferences',
    'settings.profile': 'Profile',
    'settings.appearance': 'Appearance',
    'settings.notifications': 'Notifications',
    'settings.language': 'Language',
    'settings.languageTitle': 'Interface Language',
    'settings.languageDesc': 'Choose your preferred language',
    'settings.dangerZone': 'Danger Zone',
    'settings.deleteAccount': 'Delete Account',
    'settings.save': 'Save Changes',

    // Onboarding
    'onboarding.welcome': 'Welcome to TubeForge',
    'onboarding.welcomeDesc': 'Your AI studio for YouTube. Create videos, thumbnails and metadata — all in one place. Let us show you how it works!',
    'onboarding.dashboardTitle': 'Dashboard Overview',
    'onboarding.dashboardDesc': "Here you'll find channel stats, recent videos and quick actions. Everything starts from your dashboard.",
    'onboarding.projectTitle': 'Create your first project',
    'onboarding.projectDesc': 'In the main area you work on videos, edit metadata and manage projects. Start by creating a new project!',
    'onboarding.aiTitle': 'AI Tools',
    'onboarding.aiDesc': 'Use the sidebar menu to access AI video generation, thumbnail editor, metadata optimizer and other tools.',
    'onboarding.next': 'Next',
    'onboarding.start': 'Get Started',
    'onboarding.back': 'Back',
    'onboarding.skip': 'Skip',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.termsOfService': 'Terms of Service',
    'common.privacyPolicy': 'Privacy Policy',
    'common.copyright': '© 2026 TubeForge',
    'common.free': 'Free',
    'common.pro': 'Pro',
    'common.studio': 'Studio',
    'common.user': 'User',

    // Footer
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.copyright': '© 2026 TubeForge. All rights reserved.',
  },
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'ru',
      setLocale: (locale) => set({ locale }),
      t: (key: string) => {
        const { locale } = get();
        return translations[locale][key] ?? translations['ru'][key] ?? key;
      },
    }),
    {
      name: 'tf-locale',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
