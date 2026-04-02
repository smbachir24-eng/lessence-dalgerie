import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Truck, CreditCard } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annabba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara",
  "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt",
  "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane"
];

export default function Checkout({ cartItems, clearCart, settings }: any) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { language, t, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    address: '',
    wilaya: 'Alger',
    paymentMethod: 'COD' as const
  });

  const subtotal = cartItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= (settings.freeDeliveryThreshold || 10000);
  const deliveryFee = isFreeDelivery ? 0 : (settings.deliveryFee || 500);
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setLoading(true);
    try {
      // Check stock before submitting
      const outOfStockItems = cartItems.filter(item => item.stock <= 0);
      if (outOfStockItems.length > 0) {
        const names = outOfStockItems.map(i => language === 'ar' ? (i.nameAr || i.name) : i.name).join(', ');
        toast.error(language === 'ar' ? `بعض الأصناف نفدت من المخزن: ${names}` : `Certains articles ne sont plus en stock: ${names}`);
        return;
      }

      const orderData = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        wilaya: formData.wilaya,
        paymentMethod: formData.paymentMethod,
        items: cartItems.map((item: any) => ({
          perfumeId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      console.log('Sending order data:', orderData);
      await addDoc(collection(db, 'orders'), orderData);
      toast.success(t('checkout.success'));
      clearCart();
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      toast.error(language === 'ar' ? 'حدث خطأ أثناء الطلب.' : 'Une erreur est survenue lors de la commande.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="text-gray-200" size={40} />
        </div>
        <h2 className="text-2xl font-serif italic">{t('cart.empty')}</h2>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-black text-white rounded-full">{t('cart.continue_shopping')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <h2 className="text-3xl font-serif italic">{t('checkout.title')}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className={cn("text-xs font-bold uppercase tracking-widest text-gray-400 block", isRTL && "text-right")}>{t('checkout.name')}</label>
            <input 
              required
              type="text" 
              dir={isRTL ? "rtl" : "ltr"}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className={cn("text-xs font-bold uppercase tracking-widest text-gray-400 block", isRTL && "text-right")}>{t('checkout.phone')}</label>
            <input 
              required
              type="tel" 
              dir="ltr"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={cn("text-xs font-bold uppercase tracking-widest text-gray-400 block", isRTL && "text-right")}>{t('checkout.wilaya')}</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                value={formData.wilaya}
                onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
              >
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className={cn("text-xs font-bold uppercase tracking-widest text-gray-400 block", isRTL && "text-right")}>{t('checkout.address')}</label>
            <textarea 
              required
              rows={3}
              dir={isRTL ? "rtl" : "ltr"}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <label className={cn("text-xs font-bold uppercase tracking-widest text-gray-400 block", isRTL && "text-right")}>{t('checkout.payment')}</label>
            <div className="grid grid-cols-1 gap-3">
              <label className={cn(
                "flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all",
                formData.paymentMethod === 'COD' ? "border-black bg-black/5" : "border-gray-100 hover:border-gray-300"
              )}>
                <div className="flex items-center gap-3">
                  <Truck size={20} />
                  <div>
                    <p className="font-medium">{t('checkout.cod')}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{language === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la livraison'}</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  className="hidden" 
                  checked={formData.paymentMethod === 'COD'} 
                  onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                />
                {formData.paymentMethod === 'COD' && <CheckCircle2 size={20} className="text-black" />}
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} />
                  <div>
                    <p className="font-medium">{t('checkout.satim')}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{language === 'ar' ? 'قريباً' : 'Bientôt disponible'}</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? t('checkout.submitting') : `${t('checkout.submit')} (${total} DZD)`}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 rounded-3xl p-8 h-fit space-y-6">
        <h3 className="text-xl font-serif italic">{language === 'ar' ? 'ملخص الطلب' : 'Résumé de la commande'}</h3>
        <div className="space-y-4">
          {cartItems.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-500">{item.quantity}x {language === 'ar' ? (item.nameAr || item.name) : item.name}</span>
              <span className="font-medium">{item.price * item.quantity} DZD</span>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('cart.subtotal')}</span>
            <span className="font-medium">{subtotal} DZD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{language === 'ar' ? 'التوصيل' : 'Frais de livraison'}</span>
            <span className="font-medium">{deliveryFee === 0 ? (language === 'ar' ? 'مجاني' : 'Gratuite') : `${deliveryFee} DZD`}</span>
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-between text-lg font-medium">
            <span>Total</span>
            <span>{total} DZD</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
