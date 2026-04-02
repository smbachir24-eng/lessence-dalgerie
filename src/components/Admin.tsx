import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, addDoc, increment, serverTimestamp, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, OperationType, handleFirestoreError } from '../firebase';
import { Order, Perfume } from '../types';
import { cn } from '../lib/utils';
import { Package, ShoppingBag, TrendingUp, Check, X, Clock, Truck, CheckCircle, Edit, Trash2, Plus, Upload, Image as ImageIcon, Settings as SettingsIcon, Facebook, Instagram, Twitter, Mail, Phone, MapPin, LayoutDashboard, Search, Eye, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setDoc } from 'firebase/firestore';
import { useLanguage } from '../lib/i18n';

export default function Admin({ user, authLoading }: { user: any; authLoading: boolean }) {
  const { language, t, isRTL } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [perfumesLoading, setPerfumesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'customers' | 'subscribers' | 'settings' | 'team'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Perfume | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    storeName: 'DZ Luxury Perfumes',
    contactEmail: 'contact@dzluxury.com',
    contactPhone: '+213 555 123 456',
    address: 'Alger, Algérie',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    deliveryFee: 500,
    freeDeliveryThreshold: 10000,
    heroImageUrl: '',
    newsletterImageUrl: '',
    freeDeliveryMessage: 'Livraison GRATUITE pour toute commande supérieure à 10000 DZD !',
    showFreeDeliveryBanner: true
  });

  useEffect(() => {
    // Fetch settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });

    // Fetch subscribers
    const unsubscribeSubscribers = onSnapshot(collection(db, 'subscribers'), (snapshot) => {
      setSubscribers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch team (users)
    const unsubscribeTeam = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeSettings();
      unsubscribeSubscribers();
      unsubscribeTeam();
    };
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      toast.success('Paramètres mis à jour avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleSettingsImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, [field]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    // Process the edit param when data is ready
    if (authLoading || perfumesLoading || perfumes.length === 0) return;
    
    const editId = searchParams.get('edit');
    if (editId) {
      const product = perfumes.find(p => p.id === editId);
      if (product) {
        console.log('Found product for editing:', product.name);
        setEditingProduct(product);
        setIsProductModalOpen(true);
        setActiveTab('inventory');
        // Clear the search param after opening to avoid re-opening on every refresh
        setSearchParams({}, { replace: true });
      } else {
        console.warn('Product not found for ID:', editId);
      }
    }
  }, [perfumes, perfumesLoading, authLoading, searchParams, setSearchParams]);

  if (authLoading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" /></div>;
  
  if (!user) return <Navigate to="/admin-portal" />;
  
  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <X className="text-red-500" size={40} />
        </div>
        <h2 className="text-2xl font-serif italic">Accès Refusé</h2>
        <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-black text-white rounded-full">Retour à la boutique</button>
      </div>
    );
  }

  useEffect(() => {
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const qPerfumes = query(collection(db, 'perfumes'), orderBy('name', 'asc'));
    const unsubscribePerfumes = onSnapshot(qPerfumes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Perfume));
      setPerfumes(data);
      setPerfumesLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'perfumes');
      setPerfumesLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribePerfumes();
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const oldStatus = order.status;
      
      // Update order status
      await updateDoc(doc(db, 'orders', orderId), { status });

      // Stock management logic
      // If status changes to 'confirmed' from 'pending', decrement stock
      if (status === 'confirmed' && oldStatus === 'pending') {
        for (const item of order.items) {
          const perfumeId = item.perfumeId || item.id; // Support both just in case
          const perfumeRef = doc(db, 'perfumes', perfumeId);
          await updateDoc(perfumeRef, { stock: increment(-item.quantity) });
        }
        toast.info('Stock mis à jour (déduit)');
      }
      
      // If status changes to 'cancelled' from a state that already reduced stock, increment back
      if (status === 'cancelled' && (oldStatus === 'confirmed' || oldStatus === 'shipped' || oldStatus === 'delivered')) {
        for (const item of order.items) {
          const perfumeId = item.perfumeId || item.id;
          const perfumeRef = doc(db, 'perfumes', perfumeId);
          await updateDoc(perfumeRef, { stock: increment(item.quantity) });
        }
        toast.info('Stock mis à jour (réintégré)');
      }

      toast.success(`Statut mis à jour: ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // Check for pending orders containing this product
    const pendingOrders = orders.filter(order => 
      order.status !== 'delivered' && 
      order.status !== 'cancelled' && 
      order.items.some((item: any) => item.id === id)
    );

    if (pendingOrders.length > 0) {
      toast.error(language === 'ar' 
        ? 'لا يمكن حذف هذا المنتج لأن هناك طلبات معلقة تحتوي عليه. يرجى معالجة الطلبات أولاً.' 
        : 'Impossible de supprimer ce produit car il y a des commandes en cours le contenant. Veuillez traiter les commandes d\'abord.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'perfumes', id));
      toast.success('Produit supprimé');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `perfumes/${id}`);
    }
  };

  const stats = {
    totalRevenue: orders.reduce((acc, o) => o.status === 'delivered' ? acc + o.totalAmount : acc, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalProducts: perfumes.length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-serif italic">Dashboard Admin</h1>
        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap", activeTab === 'dashboard' ? "bg-white shadow-sm" : "text-gray-500")}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap", activeTab === 'orders' ? "bg-white shadow-sm" : "text-gray-500")}
          >
            Commandes
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap", activeTab === 'inventory' ? "bg-white shadow-sm" : "text-gray-500")}
          >
            Inventaire
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap", activeTab === 'customers' ? "bg-white shadow-sm" : "text-gray-500")}
          >
            Clients
          </button>
          <button 
            onClick={() => setActiveTab('subscribers')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap", activeTab === 'subscribers' ? "bg-white shadow-sm" : "text-gray-500")}
          >
            Newsletter
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap", activeTab === 'settings' ? "bg-white shadow-sm" : "text-gray-500")}
          >
            Paramètres
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap", activeTab === 'team' ? "bg-white shadow-sm" : "text-gray-500")}
          >
            Équipe
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<TrendingUp size={20} />} label="Revenu Livré" value={`${stats.totalRevenue} DZD`} color="bg-green-50 text-green-600" />
        <StatCard icon={<Clock size={20} />} label="En Attente" value={stats.pendingOrders} color="bg-orange-50 text-orange-600" />
        <StatCard icon={<Package size={20} />} label="Produits" value={stats.totalProducts} color="bg-blue-50 text-blue-600" />
        <StatCard icon={<CheckCircle size={20} />} label="Livrés" value={stats.deliveredOrders} color="bg-purple-50 text-purple-600" />
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Alerts */}
          {perfumes.filter(p => p.stock < 10).length > 0 && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 text-red-600">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">Alerte Stock Bas</p>
                <p className="text-xs opacity-80">{perfumes.filter(p => p.stock < 10).length} produits ont moins de 10 unités en stock.</p>
              </div>
              <button 
                onClick={() => setActiveTab('inventory')}
                className="ml-auto px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-700 transition-all"
              >
                Voir
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-lg font-serif italic">Revenu par Wilaya</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orders.reduce((acc: any[], order) => {
                    if (order.status !== 'delivered') return acc;
                    const existing = acc.find(a => a.wilaya === order.wilaya);
                    if (existing) existing.revenue += order.totalAmount;
                    else acc.push({ wilaya: order.wilaya, revenue: order.totalAmount });
                    return acc;
                  }, [])}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="wilaya" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Bar dataKey="revenue" fill="#000" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-lg font-serif italic">Ventes par Catégorie</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orders.reduce((acc: any[], order) => {
                        order.items.forEach(item => {
                          const perfume = perfumes.find(p => p.id === item.perfumeId);
                          const category = perfume?.category || 'Inconnu';
                          const existing = acc.find(a => a.name === category);
                          if (existing) existing.value += item.quantity;
                          else acc.push({ name: category, value: item.quantity });
                        });
                        return acc;
                      }, [])}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {['#000', '#666', '#999', '#ccc'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sales Trend */}
          <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-6">
            <h3 className="text-lg font-serif italic">Tendance des Ventes (7 derniers jours)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                  }).reverse();

                  return last7Days.map(date => {
                    const dailyOrders = orders.filter(o => {
                      const orderDate = o.createdAt?.toDate?.()?.toISOString().split('T')[0] || 
                                      (o.createdAt instanceof Date ? o.createdAt.toISOString().split('T')[0] : '');
                      return orderDate === date && o.status === 'delivered';
                    });
                    return {
                      date: date.split('-').slice(1).join('/'),
                      revenue: dailyOrders.reduce((sum, o) => sum + o.totalAmount, 0)
                    };
                  });
                })()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Client</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Détails</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Total</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-400">{order.phoneNumber}</div>
                      <div className="text-xs text-gray-400">{order.wilaya} - {order.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i}>{item.quantity}x {item.name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{order.totalAmount} DZD</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }}
                          className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        {order.status === 'pending' && (
                          <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                            <Check size={16} />
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                            <Truck size={16} />
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {perfumes.map((perfume) => (
            <div key={perfume.id} className="bg-white p-6 border border-gray-100 rounded-3xl flex gap-4 group relative">
              <div className="w-20 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={perfume.imageUrl} alt={perfume.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-serif italic">{perfume.name}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Inspired by {perfume.inspiredBy}</p>
                <p className="text-xs text-gray-400">Stock: {perfume.stock}</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{perfume.price} DZD</span>
                  {perfume.oldPrice && <span className="text-[10px] text-gray-400 line-through">{perfume.oldPrice}</span>}
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingProduct(perfume); setIsProductModalOpen(true); }}
                  className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteProduct(perfume.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <button 
            onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
            className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all"
          >
            <Plus size={24} className="mb-2" />
            <span className="text-sm font-medium">Ajouter un Produit</span>
          </button>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-serif italic">Liste des Clients</h3>
            <div className="text-sm text-gray-400">{Array.from(new Set(orders.map(o => o.phoneNumber))).length} Clients uniques</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Client</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Total Commandes</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Dépense Totale</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Dernière Commande</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const customersMap = new Map();
                  orders.forEach(order => {
                    const existing = customersMap.get(order.phoneNumber);
                    if (existing) {
                      existing.count += 1;
                      existing.total += order.totalAmount;
                      if (order.createdAt?.toDate?.() > existing.lastDate) {
                        existing.lastDate = order.createdAt.toDate();
                      }
                    } else {
                      customersMap.set(order.phoneNumber, {
                        name: order.customerName,
                        phone: order.phoneNumber,
                        count: 1,
                        total: order.totalAmount,
                        lastDate: order.createdAt?.toDate?.() || new Date()
                      });
                    }
                  });
                  return Array.from(customersMap.values()).sort((a, b) => b.total - a.total).map((customer, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-gray-400">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4">{customer.count}</td>
                      <td className="px-6 py-4 font-medium">{customer.total} DZD</td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {customer.lastDate.toLocaleDateString()}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subscribers' && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-serif italic">Inscriptions Newsletter</h3>
            <div className="text-sm text-gray-400">{subscribers.length} Abonnés</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Email</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Date d'inscription</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()).map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{sub.email}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {sub.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={async () => {
                          try {
                            await deleteDoc(doc(db, 'subscribers', sub.id));
                            toast.success('Abonné supprimé');
                          } catch (error) {
                            toast.error('Erreur lors de la suppression');
                          }
                        }}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif italic">{t('admin.team.add_member')}</h3>
            </div>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const email = (e.target as any).email.value;
                if (!email) return;
                try {
                  await addDoc(collection(db, 'users'), {
                    email,
                    role: 'admin',
                    createdAt: serverTimestamp()
                  });
                  toast.success(t('admin.team.invite_success', { email }));
                  (e.target as any).reset();
                } catch (error) {
                  toast.error(t('admin.team.error_add'));
                }
              }}
              className="flex gap-4"
            >
              <input 
                name="email"
                type="email" 
                placeholder={t('admin.team.email_placeholder')}
                className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                required
              />
              <button type="submit" className="px-8 py-3 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-all">
                {t('admin.team.add_button')}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif italic">{t('admin.team.title')}</h3>
              <p className="text-xs text-gray-400 uppercase tracking-widest">{team.length} {language === 'ar' ? 'مستخدمين' : 'Utilisateurs'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn("border-b border-gray-50", isRTL ? "text-right" : "text-left")}>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('admin.team.user')}</th>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('admin.team.email')}</th>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('admin.team.role')}</th>
                    <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('admin.team.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {team.map((member) => (
                    <tr key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {member.email?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{member.displayName || (language === 'ar' ? 'مستخدم' : 'Utilisateur')}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{member.email}</td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          member.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"
                        )}>
                          {member.role || 'client'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {member.id !== user.uid && (
                            <button 
                              onClick={async () => {
                                try {
                                  const newRole = member.role === 'admin' ? 'client' : 'admin';
                                  await updateDoc(doc(db, 'users', member.id), { role: newRole });
                                  toast.success(t('admin.team.update_success', { role: newRole }));
                                } catch (error) {
                                  toast.error(t('admin.team.error_update'));
                                }
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-all"
                              title={member.role === 'admin' ? (language === 'ar' ? "إزالة مسؤول" : "Retirer Admin") : (language === 'ar' ? "تعيين مسؤول" : "Nommer Admin")}
                            >
                              <Users size={16} />
                            </button>
                          )}
                          {member.id !== user.uid && (
                            <button 
                              onClick={async () => {
                                try {
                                  await deleteDoc(doc(db, 'users', member.id));
                                  toast.success(t('admin.team.delete_success'));
                                } catch (error) {
                                  toast.error(t('admin.team.error_delete'));
                                }
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                              title={language === 'ar' ? "حذف" : "Supprimer"}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm max-w-4xl mx-auto">
          <form onSubmit={saveSettings} className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-xl font-serif italic border-b pb-2">Design de la Boutique</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Image de Couverture (Hero)</label>
                  <div className="relative group aspect-video rounded-3xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                    {settings.heroImageUrl ? (
                      <>
                        <img src={settings.heroImageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setSettings({ ...settings, heroImageUrl: '' })}
                            className="p-2 bg-white rounded-full text-red-500"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400">
                        <Upload size={32} />
                        <span className="text-xs">Télécharger l'image</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleSettingsImageUpload(e, 'heroImageUrl')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Image Newsletter (Bottom)</label>
                  <div className="relative group aspect-video rounded-3xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                    {settings.newsletterImageUrl ? (
                      <>
                        <img src={settings.newsletterImageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setSettings({ ...settings, newsletterImageUrl: '' })}
                            className="p-2 bg-white rounded-full text-red-500"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400">
                        <Upload size={32} />
                        <span className="text-xs">Télécharger l'image</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleSettingsImageUpload(e, 'newsletterImageUrl')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-serif italic border-b pb-2">Informations de la Boutique</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Nom de la Boutique (FR)</label>
                  <input 
                    type="text" 
                    value={settings.storeName} 
                    onChange={e => setSettings({...settings, storeName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400 text-right block">اسم المتجر (AR)</label>
                  <input 
                    dir="rtl"
                    type="text" 
                    value={settings.storeNameAr} 
                    onChange={e => setSettings({...settings, storeNameAr: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Email de Contact</label>
                  <input 
                    type="email" 
                    value={settings.contactEmail} 
                    onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Téléphone</label>
                  <input 
                    type="text" 
                    value={settings.contactPhone} 
                    onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Adresse (FR)</label>
                  <input 
                    type="text" 
                    value={settings.address} 
                    onChange={e => setSettings({...settings, address: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400 text-right block">العنوان (AR)</label>
                  <input 
                    dir="rtl"
                    type="text" 
                    value={settings.addressAr} 
                    onChange={e => setSettings({...settings, addressAr: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all text-right"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-serif italic border-b pb-2">Réseaux Sociaux</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2"><Facebook size={12} /> Facebook URL</label>
                  <input 
                    type="text" 
                    value={settings.facebookUrl} 
                    onChange={e => setSettings({...settings, facebookUrl: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2"><Instagram size={12} /> Instagram URL</label>
                  <input 
                    type="text" 
                    value={settings.instagramUrl} 
                    onChange={e => setSettings({...settings, instagramUrl: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2"><Twitter size={12} /> Twitter URL</label>
                  <input 
                    type="text" 
                    value={settings.twitterUrl} 
                    onChange={e => setSettings({...settings, twitterUrl: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-serif italic border-b pb-2">Livraison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Frais de Livraison (DZD)</label>
                  <input 
                    type="number" 
                    value={settings.deliveryFee} 
                    onChange={e => setSettings({...settings, deliveryFee: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Seuil Livraison Gratuite (DZD)</label>
                  <input 
                    type="number" 
                    value={settings.freeDeliveryThreshold} 
                    onChange={e => setSettings({...settings, freeDeliveryThreshold: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Message Livraison Gratuite (FR)</label>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="text" 
                      value={settings.freeDeliveryMessage} 
                      onChange={e => setSettings({...settings, freeDeliveryMessage: e.target.value})}
                      className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      placeholder="Ex: Livraison GRATUITE pour toute commande supérieure à 10000 DZD !"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.showFreeDeliveryBanner}
                        onChange={e => setSettings({...settings, showFreeDeliveryBanner: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-xs font-medium">Afficher</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-bold uppercase text-gray-400 text-right block">رسالة التوصيل المجاني (AR)</label>
                  <input 
                    dir="rtl"
                    type="text" 
                    value={settings.freeDeliveryMessageAr} 
                    onChange={e => setSettings({...settings, freeDeliveryMessageAr: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all text-right"
                    placeholder="مثال: توصيل مجاني لجميع الطلبات التي تزيد عن 10000 دج!"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                className="w-full py-4 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
              >
                Sauvegarder les Paramètres
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {isOrderModalOpen && selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setIsOrderModalOpen(false)} 
            onUpdateStatus={updateOrderStatus}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isProductModalOpen && (
          <ProductModal 
            product={editingProduct} 
            onClose={() => setIsProductModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderDetailsModal({ order, onClose, onUpdateStatus }: { order: Order; onClose: () => void; onUpdateStatus: (id: string, status: string) => void }) {
  const { language, isRTL } = useLanguage();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-serif italic">{language === 'ar' ? 'تفاصيل الطلب' : 'Détails de la Commande'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className={cn("p-6 overflow-y-auto space-y-6", isRTL && "text-right")}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className={isRTL ? "order-2" : "order-1"}>
                <p className="text-[10px] font-bold uppercase text-gray-400">{language === 'ar' ? 'العميل' : 'Client'}</p>
                <p className="font-medium text-lg">{order.customerName}</p>
                <p className="text-sm text-gray-500">{order.phoneNumber}</p>
              </div>
              <div className={isRTL ? "order-1" : "order-2"}>
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">{language === 'ar' ? 'عنوان التوصيل' : 'Adresse de Livraison'}</p>
              <p className="text-sm">{order.wilaya}, {order.address}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">{language === 'ar' ? 'الأصناف' : 'Articles'}</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className={isRTL ? "order-2" : "order-1"}>{item.quantity}x {item.name}</span>
                    <span className={cn("font-medium", isRTL ? "order-1" : "order-2")}>{item.price * item.quantity} DZD</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{order.totalAmount} DZD</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className={cn("text-[10px] font-bold uppercase text-gray-400", isRTL && "text-right")}>{language === 'ar' ? 'تعديل الحالة' : 'Modifier le Statut'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onUpdateStatus(order.id, 'confirmed')} className="py-2 px-4 bg-green-50 text-green-600 rounded-xl text-xs font-bold uppercase hover:bg-green-100 transition-all">{language === 'ar' ? 'تأكيد' : 'Confirmer'}</button>
              <button onClick={() => onUpdateStatus(order.id, 'shipped')} className="py-2 px-4 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold uppercase hover:bg-blue-100 transition-all">{language === 'ar' ? 'شحن' : 'Expédier'}</button>
              <button onClick={() => onUpdateStatus(order.id, 'delivered')} className="py-2 px-4 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold uppercase hover:bg-purple-100 transition-all">{language === 'ar' ? 'تسليم' : 'Livrer'}</button>
              <button onClick={() => onUpdateStatus(order.id, 'cancelled')} className="py-2 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase hover:bg-red-100 transition-all">{language === 'ar' ? 'إلغاء' : 'Annuler'}</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProductModal({ product, onClose }: { product: Perfume | null; onClose: () => void }) {
  const { language, t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Perfume>>(product || {
    name: '',
    nameAr: '',
    inspiredBy: '',
    inspiredByAr: '',
    price: 0,
    oldPrice: undefined,
    description: '',
    descriptionAr: '',
    category: 'Unisex',
    imageUrl: '',
    stock: 0,
    isFeatured: false,
    notes: '',
    notesAr: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        notes: Array.isArray(product.notes) ? product.notes.join(', ') : (product.notes || ''),
        notesAr: Array.isArray(product.notesAr) ? product.notesAr.join(', ') : (product.notesAr || '')
      });
    } else {
      setFormData({
        name: '',
        nameAr: '',
        inspiredBy: '',
        inspiredByAr: '',
        price: 0,
        oldPrice: undefined,
        description: '',
        descriptionAr: '',
        category: 'Unisex',
        imageUrl: '',
        stock: 0,
        isFeatured: false,
        notes: '',
        notesAr: ''
      });
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size check (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    setUploading(true);
    console.log('Starting Base64 conversion for file:', file.name, 'size:', file.size);
    try {
      // Convert image to Base64 string
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log('Base64 conversion successful');
        setFormData(prev => ({ ...prev, imageUrl: base64String }));
        toast.success('Image traitée avec succès');
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Erreur lors de la lecture du fichier');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Conversion Error:', error);
      toast.error(`Erreur: ${error.message}`);
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      toast.error('Veuillez ajouter une image');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Le prix doit être supérieur à 0');
      return;
    }
    setLoading(true);
    try {
      // Ensure stock is an integer as required by rules
      const dataToSave: any = {
        ...formData,
        stock: Math.floor(formData.stock || 0),
        price: Number(formData.price),
        updatedAt: serverTimestamp()
      };

      if (formData.oldPrice && formData.oldPrice > 0) {
        dataToSave.oldPrice = Number(formData.oldPrice);
      } else {
        // For updates, we use deleteField to remove it if it was there
        if (product && !['1', '2', '3', '4'].includes(product.id)) {
          dataToSave.oldPrice = deleteField();
        } else {
          delete dataToSave.oldPrice;
        }
      }

      console.log('Attempting to save product data:', dataToSave);

      // Check if we are editing a sample product (IDs 1-4)
      const isSample = product && ['1', '2', '3', '4'].includes(product.id);

      if (product && !isSample) {
        console.log('Updating existing product:', product.id);
        await updateDoc(doc(db, 'perfumes', product.id), dataToSave);
        toast.success('Produit mis à jour');
      } else {
        console.log('Adding new product (or saving sample as new)');
        // Remove ID if it's a sample to let Firestore generate a real one
        const { id, ...finalData } = dataToSave;
        await addDoc(collection(db, 'perfumes'), {
          ...finalData,
          createdAt: serverTimestamp()
        });
        toast.success('Produit ajouté');
      }
      onClose();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`Erreur lors de l'enregistrement: ${error.message || 'Erreur inconnue'}`);
      // Only call handleFirestoreError if it's a permission/firestore error
      if (error.code?.startsWith('permission-') || error.code?.startsWith('unauthenticated')) {
        handleFirestoreError(error, OperationType.WRITE, 'perfumes');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-serif italic">{product ? 'Modifier le Produit' : 'Ajouter un Produit'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="flex justify-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-40 h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all overflow-hidden"
            >
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon className="text-gray-300 mb-2" size={32} />
                  <span className="text-[10px] font-bold uppercase text-gray-400">Ajouter Image</span>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Nom du Produit (FR)</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 text-right block">اسم المنتج (AR)</label>
              <input dir="rtl" type="text" value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-right" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Inspiré par (FR)</label>
              <input required type="text" value={formData.inspiredBy} onChange={e => setFormData({...formData, inspiredBy: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 text-right block">مستوحى من (AR)</label>
              <input dir="rtl" type="text" value={formData.inspiredByAr} onChange={e => setFormData({...formData, inspiredByAr: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-right" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Prix (DZD)</label>
              <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Ancien Prix (Optionnel)</label>
              <input type="number" value={formData.oldPrice || ''} onChange={e => setFormData({...formData, oldPrice: e.target.value ? Number(e.target.value) : undefined})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Catégorie</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full px-4 py-2 border rounded-xl">
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Stock</label>
              <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Description (FR)</label>
              <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 text-right block">الوصف (AR)</label>
              <textarea dir="rtl" rows={3} value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-right" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Notes (FR)</label>
              <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="Ex: Citron, Bergamote, Musc" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 text-right block">النوتات العطرية (AR)</label>
              <textarea dir="rtl" rows={2} value={formData.notesAr} onChange={e => setFormData({...formData, notesAr: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-right" placeholder="مثال: ليمون، برغموت، مسك" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} id="featured" />
            <label htmlFor="featured" className="text-sm">Produit en vedette</label>
          </div>
          <button disabled={loading || uploading} className="w-full py-4 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white p-6 border border-gray-100 rounded-3xl space-y-4 shadow-sm">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-2xl font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: "bg-orange-50 text-orange-600",
    confirmed: "bg-green-50 text-green-600",
    shipped: "bg-blue-50 text-blue-600",
    delivered: "bg-purple-50 text-purple-600",
    cancelled: "bg-red-50 text-red-600"
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", styles[status])}>
      {status}
    </span>
  );
}
