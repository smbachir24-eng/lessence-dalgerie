import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'fr' | 'ar';

interface Translations {
  [key: string]: {
    fr: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.store': { fr: 'Boutique', ar: 'المتجر' },
  'nav.dashboard': { fr: 'Tableau de bord', ar: 'لوحة التحكم' },
  'nav.logout': { fr: 'Déconnexion', ar: 'تسجيل الخروج' },
  
  // Store
  'store.hero.title': { fr: 'L\'Art de la Parfumerie Inspirée', ar: 'فن العطور المستوحاة' },
  'store.hero.subtitle': { fr: 'Des fragrances de luxe accessibles à tous les Algériens.', ar: 'عطور فاخرة في متناول جميع الجزائريين.' },
  'store.featured': { fr: 'Produits Vedettes', ar: 'المنتجات المميزة' },
  'store.all_products': { fr: 'Tous nos Parfums', ar: 'جميع عطورنا' },
  'store.search_placeholder': { fr: 'Rechercher un parfum...', ar: 'ابحث عن عطر...' },
  'store.add_to_cart': { fr: 'Ajouter au panier', ar: 'أضف إلى السلة' },
  'store.out_of_stock': { fr: 'Rupture de stock', ar: 'نفدت الكمية' },
  'store.low_stock': { fr: 'Plus que {count} en stock !', ar: 'بقي {count} فقط في المخزن!' },
  'store.inspired_by': { fr: 'Inspiré par {name}', ar: 'مستوحى من {name}' },
  
  // Categories
  'category.all': { fr: 'Tous', ar: 'الكل' },
  'category.men': { fr: 'Hommes', ar: 'الرجال' },
  'category.women': { fr: 'Femmes', ar: 'النساء' },
  'category.unisex': { fr: 'Unisexe', ar: 'للجنسين' },
  
  // Cart
  'cart.title': { fr: 'Votre Panier', ar: 'سلة التسوق' },
  'cart.empty': { fr: 'Votre panier est vide', ar: 'سلتك فارغة' },
  'cart.subtotal': { fr: 'Sous-total', ar: 'المجموع الفرعي' },
  'cart.checkout': { fr: 'Commander', ar: 'إتمام الطلب' },
  'cart.continue_shopping': { fr: 'Continuer mes achats', ar: 'مواصلة التسوق' },
  
  // Checkout
  'checkout.title': { fr: 'Finaliser la commande', ar: 'إتمام الطلب' },
  'checkout.info': { fr: 'Informations de livraison', ar: 'معلومات التوصيل' },
  'checkout.name': { fr: 'Nom complet', ar: 'الاسم الكامل' },
  'checkout.phone': { fr: 'Numéro de téléphone', ar: 'رقم الهاتف' },
  'checkout.address': { fr: 'Adresse exacte', ar: 'العنوان بالتفصيل' },
  'checkout.wilaya': { fr: 'Wilaya', ar: 'الولاية' },
  'checkout.payment': { fr: 'Mode de paiement', ar: 'طريقة الدفع' },
  'checkout.cod': { fr: 'Paiement à la livraison', ar: 'الدفع عند الاستلام' },
  'checkout.satim': { fr: 'Carte CIB / Edahabia (Bientôt)', ar: 'بطاقة CIB / الذهبية (قريباً)' },
  'checkout.submit': { fr: 'Confirmer la commande', ar: 'تأكيد الطلب' },
  'checkout.submitting': { fr: 'Traitement...', ar: 'جاري المعالجة...' },
  'checkout.success': { fr: 'Commande réussie !', ar: 'تم الطلب بنجاح!' },
  'checkout.success_msg': { fr: 'Merci pour votre confiance. Nous vous contacterons bientôt.', ar: 'شكراً لثقتكم. سنتصل بكم قريباً.' },
  
  // Footer
  'footer.follow': { fr: 'Suivez-nous', ar: 'تابعونا' },
  'footer.contact': { fr: 'Contact', ar: 'اتصل بنا' },
  'footer.rights': { fr: 'Tous droits réservés.', ar: 'جميع الحقوق محفوظة.' },
  'footer.description': { fr: 'L\'art de la parfumerie inspirée, accessible à tous les Algériens.', ar: 'فن العطور المستوحاة، في متناول جميع الجزائريين.' },

  // Admin
  'admin.dashboard': { fr: 'Tableau de bord', ar: 'لوحة القيادة' },
  'admin.orders': { fr: 'Commandes', ar: 'الطلبات' },
  'admin.inventory': { fr: 'Inventaire', ar: 'المخزون' },
  'admin.customers': { fr: 'Clients', ar: 'العملاء' },
  'admin.subscribers': { fr: 'Abonnés', ar: 'المشتركين' },
  'admin.settings': { fr: 'Paramètres', ar: 'الإعدادات' },
  'admin.team': { fr: 'Équipe', ar: 'الفريق' },
  
  // Team
  'admin.team.title': { fr: 'Gestion de l\'Équipe', ar: 'إدارة الفريق' },
  'admin.team.add_member': { fr: 'Ajouter un Membre', ar: 'إضافة عضو' },
  'admin.team.email_placeholder': { fr: 'Email du futur admin', ar: 'البريد الإلكتروني للمسؤول الجديد' },
  'admin.team.add_button': { fr: 'Ajouter Admin', ar: 'إضافة مسؤول' },
  'admin.team.user': { fr: 'Utilisateur', ar: 'المستخدم' },
  'admin.team.email': { fr: 'Email', ar: 'البريد الإلكتروني' },
  'admin.team.role': { fr: 'Rôle', ar: 'الدور' },
  'admin.team.actions': { fr: 'Actions', ar: 'الإجراءات' },
  'admin.team.delete_confirm': { fr: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?', ar: 'هل أنت متأكد من حذف هذا المستخدم؟' },
  'admin.team.invite_success': { fr: 'Invitation envoyée (Rôle Admin pour {email})', ar: 'تم إرسال الدعوة (دور مسؤول لـ {email})' },
  'admin.team.update_success': { fr: 'Rôle mis à jour: {role}', ar: 'تم تحديث الدور: {role}' },
  'admin.team.delete_success': { fr: 'Utilisateur supprimé', ar: 'تم حذف المستخدم' },
  'admin.team.error_add': { fr: 'Erreur lors de l\'ajout', ar: 'خطأ أثناء الإضافة' },
  'admin.team.error_update': { fr: 'Erreur lors de la mise à jour du rôle', ar: 'خطأ أثناء تحديث الدور' },
  'admin.team.error_delete': { fr: 'Erreur lors de la suppression', ar: 'خطأ أثناء الحذف' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: { [key: string]: any }) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: { [key: string]: any }) => {
    let text = translations[key]?.[language] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
