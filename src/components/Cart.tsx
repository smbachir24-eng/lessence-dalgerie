import React from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';

export default function Cart({ isOpen, onClose, items, onRemove, onUpdateQuantity, settings }: any) {
  const { language, t, isRTL } = useLanguage();
  const total = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
  const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 10000;
  const remainingForFree = freeDeliveryThreshold - total;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ x: isRTL ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col",
              isRTL ? "left-0" : "right-0"
            )}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-serif italic">{t('cart.title')}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="text-gray-300" size={32} />
                  </div>
                  <p className="text-gray-400">{t('cart.empty')}</p>
                  <button onClick={onClose} className="text-sm font-medium underline">{t('cart.continue_shopping')}</button>
                </div>
              ) : (
                <>
                  {remainingForFree > 0 ? (
                    <div className="bg-black/5 p-4 rounded-2xl text-center space-y-1">
                      <p className="text-xs font-medium">
                        {language === 'ar' 
                          ? <>بقي <span className="font-bold">{remainingForFree} DZD</span> للحصول على توصيل مجاني!</>
                          : <>Plus que <span className="font-bold">{remainingForFree} DZD</span> pour la livraison gratuite !</>
                        }
                      </p>
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (total / freeDeliveryThreshold) * 100)}%` }}
                          className="h-full bg-black"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-2xl text-center">
                      <p className="text-xs font-medium text-green-600">
                        {language === 'ar'
                          ? <>تهانينا! لقد حصلت على <span className="font-bold">توصيل مجاني</span>.</>
                          : <>Félicitations ! Vous bénéficiez de la <span className="font-bold">livraison gratuite</span>.</>
                        }
                      </p>
                    </div>
                  )}
                  {items.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt={language === 'ar' ? (item.nameAr || item.name) : item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{language === 'ar' ? (item.nameAr || item.name) : item.name}</h3>
                          <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-black">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 uppercase tracking-tighter">
                          {t('store.inspired_by', { name: language === 'ar' ? (item.inspiredByAr || item.inspiredBy) : item.inspiredBy })}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:text-black text-gray-400">
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:text-black text-gray-400">
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-medium">{item.price * item.quantity} DZD</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 space-y-4 bg-gray-50/50">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>{total} DZD</span>
                </div>
                <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
                  {total >= freeDeliveryThreshold 
                    ? (language === 'ar' ? 'توصيل مجاني' : 'Livraison Gratuite') 
                    : `${language === 'ar' ? 'مصاريف التوصيل' : 'Frais de livraison'}: ${settings?.deliveryFee || 500} DZD`
                  }
                </p>
                <Link 
                  to="/checkout" 
                  onClick={onClose}
                  className="block w-full py-4 bg-black text-white text-center rounded-2xl font-medium hover:bg-gray-800 transition-colors"
                >
                  {t('cart.checkout')}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
