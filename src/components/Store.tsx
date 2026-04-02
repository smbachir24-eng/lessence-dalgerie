import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Perfume } from '../types';
import { ShoppingCart, Info, Search, Filter, Package, LayoutDashboard, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../lib/i18n';

const SAMPLE_PERFUMES: Perfume[] = [];

export default function Store({ onAddToCart, user, settings }: { onAddToCart: (p: Perfume) => void; user: any; settings: any }) {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const navigate = useNavigate();
  const { language, t, isRTL } = useLanguage();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await addDoc(collection(db, 'subscribers'), {
        email,
        createdAt: serverTimestamp()
      });
      toast.success('Merci pour votre inscription!');
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Une erreur est survenue.');
    } finally {
      setSubscribing(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const q = query(collection(db, 'perfumes'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Perfume));
      setPerfumes(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'perfumes');
      setPerfumes([]); 
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPerfumes = perfumes.filter(p => {
    const name = language === 'ar' ? (p.nameAr || p.name || '') : (p.name || '');
    const inspiredBy = language === 'ar' ? (p.inspiredByAr || p.inspiredBy || '') : (p.inspiredBy || '');
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                         inspiredBy.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative h-[60vh] rounded-3xl overflow-hidden flex items-center justify-center text-center px-4">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${settings.heroImageUrl || 'https://picsum.photos/seed/luxury/1920/1080?blur=4'})` }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-2xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-serif italic text-white leading-tight">
            {language === 'ar' ? settings.storeNameAr : settings.storeName}
          </h1>
          <p className="text-white/80 text-lg font-light tracking-wide">
            {t('store.hero.subtitle')}
          </p>
          <button 
            onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors inline-block"
          >
            {language === 'ar' ? 'استكشف الكتالوج' : 'Explorer le Catalogue'}
          </button>
        </div>
      </section>

      {/* Featured Products */}
      {perfumes.some(p => p.isFeatured) && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif italic">{t('store.featured')}</h2>
            <div className="h-px flex-1 bg-gray-100 mx-8 hidden md:block" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {perfumes.filter(p => p.isFeatured).slice(0, 2).map((perfume) => (
              <div key={perfume.id} className="relative group rounded-3xl overflow-hidden aspect-[16/9]">
                <img 
                  src={perfume.imageUrl} 
                  alt={language === 'ar' ? (perfume.nameAr || perfume.name) : perfume.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">{language === 'ar' ? 'إصدار محدود' : 'Édition Limitée'}</span>
                  <h3 className="text-3xl font-serif italic mb-2">{language === 'ar' ? (perfume.nameAr || perfume.name) : perfume.name}</h3>
                  <p className="text-sm text-white/70 mb-6 max-w-md line-clamp-2">{language === 'ar' ? (perfume.descriptionAr || perfume.description) : perfume.description}</p>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onAddToCart(perfume)}
                      className="px-6 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-all"
                    >
                      {t('store.add_to_cart')}
                    </button>
                    <span className="text-xl font-medium">{perfume.price} DZD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <section id="catalog" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", isRTL ? "right-3" : "left-3")} size={18} />
            <input 
              type="text" 
              placeholder={t('store.search_placeholder')} 
              className={cn("w-full py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5", isRTL ? "pr-10 pl-4" : "pl-10 pr-4")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['All', 'Men', 'Women', 'Unisex'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  category === cat ? "bg-black text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-black"
                )}
              >
                {cat === 'All' ? t('category.all') : 
                 cat === 'Men' ? t('category.men') : 
                 cat === 'Women' ? t('category.women') : t('category.unisex')}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPerfumes.length > 0 ? (
              filteredPerfumes.map((perfume) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={perfume.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img 
                      src={perfume.imageUrl} 
                      alt={language === 'ar' ? (perfume.nameAr || perfume.name) : perfume.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className={cn("absolute top-3 flex flex-col gap-2 items-end", isRTL ? "left-3" : "right-3")}>
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {perfume.category === 'Men' ? t('category.men') : 
                         perfume.category === 'Women' ? t('category.women') : t('category.unisex')}
                      </span>
                      {perfume.stock <= 0 && (
                        <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                          {t('store.out_of_stock')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-serif italic">{language === 'ar' ? (perfume.nameAr || perfume.name) : perfume.name}</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-tighter">
                        {t('store.inspired_by', { name: language === 'ar' ? (perfume.inspiredByAr || perfume.inspiredBy) : perfume.inspiredBy })}
                      </p>
                      {(language === 'ar' ? (perfume.notesAr || perfume.notes) : perfume.notes) && (
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                          {language === 'ar' ? (perfume.notesAr || perfume.notes) : perfume.notes}
                        </p>
                      )}
                      {perfume.stock > 0 && perfume.stock <= 5 && (
                        <p className="text-[10px] text-orange-500 font-bold uppercase mt-1">
                          {t('store.low_stock', { count: perfume.stock })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {perfume.oldPrice && (
                          <span className="text-xs text-gray-400 line-through">{perfume.oldPrice} DZD</span>
                        )}
                        <span className="text-xl font-medium">{perfume.price} DZD</span>
                      </div>
                      <div className="flex gap-2">
                        {isAdmin && (
                          <button 
                            onClick={() => navigate(`/admin?edit=${perfume.id}`)}
                            className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => onAddToCart(perfume)}
                          disabled={perfume.stock <= 0}
                          className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                  <Search className="text-gray-300" size={40} />
                </div>
                <h3 className="text-xl font-serif italic">{language === 'ar' ? 'لم يتم العثور على منتجات' : 'Aucun produit trouvé'}</h3>
                <p className="text-gray-500">{language === 'ar' ? 'حاول تغيير الفلاتر أو البحث.' : 'Essayez de modifier vos filtres ou votre recherche.'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Delivery Info */}
      <section className="bg-gray-50 rounded-3xl p-12 text-center space-y-6">
        <h2 className="text-3xl font-serif italic">{language === 'ar' ? 'التوصيل في جميع أنحاء الجزائر' : 'Livraison Partout en Algérie'}</h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          {language === 'ar' 
            ? 'نقوم بتوصيل عطورك المفضلة مباشرة إلى باب منزلك. الدفع عند الاستلام متاح لجميع الولايات.'
            : 'Nous livrons vos parfums préférés directement à votre porte. Paiement à la livraison (Cash on Delivery) disponible pour toutes les wilayas.'}
          {settings.showFreeDeliveryBanner !== false && (
            <span className="block mt-2 font-medium text-black">
              {language === 'ar' 
                ? (settings.freeDeliveryMessageAr || `توصيل مجاني لجميع الطلبات التي تزيد عن ${settings.freeDeliveryThreshold} دج!`)
                : (settings.freeDeliveryMessage || `Livraison GRATUITE pour toute commande supérieure à ${settings.freeDeliveryThreshold} DZD !`)}
            </span>
          )}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Package className="text-black" />
            </div>
            <h4 className="font-medium">{language === 'ar' ? 'تغليف فاخر' : 'Emballage Premium'}</h4>
            <p className="text-xs text-gray-400">{language === 'ar' ? 'عطورك محمية بعناية.' : 'Vos parfums sont protégés avec soin.'}</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <LayoutDashboard className="text-black" />
            </div>
            <h4 className="font-medium">{language === 'ar' ? 'تتبع الطلب' : 'Suivi de Commande'}</h4>
            <p className="text-xs text-gray-400">{language === 'ar' ? 'ابق على اطلاع بحالة توصيلك.' : "Restez informé de l'état de votre livraison."}</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <ShoppingCart className="text-black" />
            </div>
            <h4 className="font-medium">{language === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la Livraison'}</h4>
            <p className="text-xs text-gray-400">{language === 'ar' ? 'ادفع فقط عند الاستلام.' : 'Payez seulement quand vous recevez.'}</p>
          </div>
        </div>
      </section>
      {/* Newsletter */}
      <section className="relative rounded-3xl overflow-hidden p-12 md:p-24 text-center space-y-8">
        <div className="absolute inset-0 bg-black" />
        <div 
          className="absolute inset-0 opacity-30 bg-cover bg-center" 
          style={{ backgroundImage: `url(${settings.newsletterImageUrl || 'https://picsum.photos/seed/perfume-bg/1920/1080?blur=10'})` }}
        />
        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <h2 className="text-4xl font-serif italic text-white">{language === 'ar' ? 'انضم إلى النادي الخاص' : 'Rejoignez le Club Privé'}</h2>
          <p className="text-white/60 font-light">
            {language === 'ar' 
              ? 'سجل لتلقي أحدث ابتكاراتنا وعروضنا الحصرية مباشرة في بريدك الإلكتروني.'
              : 'Inscrivez-vous pour recevoir nos dernières créations et des offres exclusives directement dans votre boîte mail.'}
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              required
              placeholder={language === 'ar' ? 'بريدك@الإلكتروني.com' : 'votre@email.com'} 
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button 
              disabled={subscribing}
              className="px-8 py-4 bg-white text-black rounded-2xl font-medium hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              {subscribing ? (language === 'ar' ? 'جاري المعالجة...' : 'Traitement...') : (language === 'ar' ? 'اشترك' : "S'abonner")}
            </button>
          </form>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">{language === 'ar' ? 'لا توجد رسائل مزعجة، نعدك.' : 'Pas de spam, promis.'}</p>
        </div>
      </section>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
