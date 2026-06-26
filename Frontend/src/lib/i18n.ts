import { useState, useEffect } from 'react';

export const translations: Record<string, Record<string, string>> = {
  en: {
    // Nav / Titles
    dashboard: 'Dashboard',
    sites: 'Sites',
    agents: 'Agents',
    devices: 'Devices',
    live: 'Live Monitoring',
    assignments: 'Assignments',
    alerts: 'Alerts',
    data: 'Data',
    analytics: 'Analytics',
    reports: 'Reports',
    settings: 'Settings',
    sos: 'SOS Emergency',
    need_help: 'Need Help?',
    contact_support: 'Contact Support',
    sign_out: 'Sign Out',
    // Settings / Preferences
    my_account: 'My Account',
    my_account_team: 'My Account Team',
    preferences: 'Preferences',
    theme: 'Theme',
    language: 'Language',
    time_zone: 'Time Zone',
    units: 'Units',
    change_password: 'Change Password',
    two_factor: 'Two-Factor Authentication',
    app_version: 'App Version',
    invite_user: 'Invite User',
    add_agent: 'Add Agent',
    view_all_agents: 'View all team Agents',
    save_changes: 'Save Changes'
  },
  es: {
    // Nav / Titles
    dashboard: 'Tablero',
    sites: 'Sitios',
    agents: 'Agentes',
    devices: 'Dispositivos',
    live: 'Monitoreo en Vivo',
    assignments: 'Asignaciones',
    alerts: 'Alertas',
    data: 'Datos',
    analytics: 'Análisis',
    reports: 'Informes',
    settings: 'Configuración',
    sos: 'Emergencia SOS',
    need_help: '¿Necesita Ayuda?',
    contact_support: 'Soporte Técnico',
    sign_out: 'Cerrar Sesión',
    // Settings / Preferences
    my_account: 'Mi Cuenta',
    my_account_team: 'Equipo de Cuenta',
    preferences: 'Preferencias',
    theme: 'Tema',
    language: 'Idioma',
    time_zone: 'Zona Horaria',
    units: 'Unidades',
    change_password: 'Cambiar Contraseña',
    two_factor: 'Autenticación de Dos Factores',
    app_version: 'Versión de la App',
    invite_user: 'Invitar Usuario',
    add_agent: 'Añadir Agente',
    view_all_agents: 'Ver todos los agentes del equipo',
    save_changes: 'Guardar Cambios'
  },
  fr: {
    // Nav / Titles
    dashboard: 'Tableau de bord',
    sites: 'Sites',
    agents: 'Agents',
    devices: 'Appareils',
    live: 'Surveillance en Direct',
    assignments: 'Affectations',
    alerts: 'Alertes',
    data: 'Données',
    analytics: 'Analyses',
    reports: 'Rapports',
    settings: 'Paramètres',
    sos: 'Urgence SOS',
    need_help: 'Besoin d\'Aide ?',
    contact_support: 'Contacter le Support',
    sign_out: 'Se Déconnecter',
    // Settings / Preferences
    my_account: 'Mon Compte',
    my_account_team: 'Équipe du Compte',
    preferences: 'Préférences',
    theme: 'Thème',
    language: 'Langue',
    time_zone: 'Fuseau Horaire',
    units: 'Unités',
    change_password: 'Modifier le Mot de Passe',
    two_factor: 'Authentification à Deux Facteurs',
    app_version: 'Version de l\'App',
    invite_user: 'Inviter un Utilisateur',
    add_agent: 'Ajouter un Agent',
    view_all_agents: 'Voir tous les agents',
    save_changes: 'Enregistrer les Modifications'
  },
  te: {
    // Nav / Titles
    dashboard: 'డాష్‌బోర్డ్',
    sites: 'సైట్లు',
    agents: 'ఏజెంట్లు',
    devices: 'పరికరాలు',
    live: 'లైవ్ మానిటరింగ్',
    assignments: 'అసైన్‌మెంట్లు',
    alerts: 'హెచ్చరికలు',
    data: 'డేటా',
    analytics: 'విశ్లేషణలు',
    reports: 'నివేదికలు',
    settings: 'సెట్టింగులు',
    sos: 'అత్యవసర SOS',
    need_help: 'సహాయం కావాలా?',
    contact_support: 'మద్దతును సంప్రదించండి',
    sign_out: 'సైన్ అవుట్',
    // Settings / Preferences
    my_account: 'నా ఖాతా',
    my_account_team: 'నా ఖాతా బృందం',
    preferences: 'ప్రాధాన్యతలు',
    theme: 'థీమ్',
    language: 'భాష',
    time_zone: 'సమయ మండలి',
    units: 'కొలతలు',
    change_password: 'పాస్‌వర్డ్ మార్చండి',
    two_factor: 'ద్వి-కారక ప్రామాణీకరణ',
    app_version: 'యాప్ వెర్షన్',
    invite_user: 'వినియోగదారుని ఆహ్వానించండి',
    add_agent: 'ఏజెంట్‌ను జోడించండి',
    view_all_agents: 'బృంద ఏజెంట్లందరినీ చూడండి',
    save_changes: 'మార్పులను సేవ్ చేయి'
  }
};

export function useTranslation() {
  const [lang, setLang] = useState(() => localStorage.getItem('app-lang') || 'en');

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('app-lang') || 'en');
    };
    window.addEventListener('app-lang-change', handleLangChange);
    return () => window.removeEventListener('app-lang-change', handleLangChange);
  }, []);

  const translate = (key: string, defaultText?: string) => {
    const lowerKey = key.toLowerCase().replace(/\s+/g, '_');
    return translations[lang]?.[lowerKey] || translations['en']?.[lowerKey] || defaultText || key;
  };

  const changeLanguage = (newLang: string) => {
    localStorage.setItem('app-lang', newLang);
    window.dispatchEvent(new Event('app-lang-change'));
  };

  return { t: translate, lang, changeLanguage };
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'Dark');

  useEffect(() => {
    // Apply styling on load or state change
    if (theme === 'Light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const changeTheme = (newTheme: string) => {
    localStorage.setItem('app-theme', newTheme);
    setTheme(newTheme);
    // Dispatch event to synchronize all tabs/components immediately
    window.dispatchEvent(new Event('app-theme-change'));
  };

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('app-theme') || 'Dark');
    };
    window.addEventListener('app-theme-change', handleThemeChange);
    return () => window.removeEventListener('app-theme-change', handleThemeChange);
  }, []);

  return { theme, changeTheme };
}
