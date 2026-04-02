import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Package, LayoutDashboard, LogOut, Globe } from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, query, where, getDocs, limit, setDoc, updateDoc, deleteDoc, serverTimestamp, collection } from 'firebase/firestore';
import { Toaster } from 'sonner';
import { useLanguage } from '../lib/i18n';
import Store from './Store';
import Admin from './Admin';
import Cart from './Cart';
import Checkout from './Checkout';
import Auth from './Auth';
import { cn } from '../lib/utils';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [settings, setSettings] = useState<any>({
    storeName: "L'Essence d'Algérie",
    storeNameAr: 'جوهر الجزائر',
    contactEmail: 'contact@lessence.dz',
    contactPhone: '+213 (0) 555 00 00 00',
    address: 'Alger, Algérie',
    addressAr: 'الجزائر العاصمة، الجزائر',
    facebookUrl: '#',
    instagramUrl: '#',
    twitterUrl: '#',
    deliveryFee: 500,
    freeDeliveryThreshold: 10000,
    freeDeliveryMessage: 'Livraison GRATUITE pour toute commande supérieure à 10000 DZD !',
    freeDeliveryMessageAr: 'توصيل مجاني لجميع الطلبات التي تزيد عن 10000 دج!',
    showFreeDeliveryBanner: true
  });

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });
    return () => unsubscribeSettings();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // First try by UID
        let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!userDoc.exists() && firebaseUser.email) {
          // If not found by UID, try by email (for pre-assigned admins)
          const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            // Update the document to use the UID as ID for future lookups
            const userData = existingDoc.data();
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...userData,
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || userData.displayName || 'Utilisateur',
              photoURL: firebaseUser.photoURL || userData.photoURL || '',
              lastLogin: serverTimestamp()
            });
            // Delete the old document if it had a different ID
            if (existingDoc.id !== firebaseUser.uid) {
              await deleteDoc(doc(db, 'users', existingDoc.id));
            }
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } else {
            // Create new user document
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Utilisateur',
              photoURL: firebaseUser.photoURL || '',
              role: firebaseUser.email === 'smbachir24@gmail.com' ? 'admin' : 'client',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          }
        } else if (userDoc.exists()) {
          // Update last login and ensure admin role for smbachir24@gmail.com
          const updateData: any = {
            lastLogin: serverTimestamp(),
            displayName: firebaseUser.displayName || userDoc.data().displayName || 'Utilisateur',
            photoURL: firebaseUser.photoURL || userDoc.data().photoURL || ''
          };
          
          if (firebaseUser.email === 'smbachir24@gmail.com' && userDoc.data().role !== 'admin') {
            updateData.role = 'admin';
          }
          
          await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);
          userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        }

        if (userDoc.exists()) {
          setUser({ ...firebaseUser, ...userDoc.data() });
        } else {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (perfume: any) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === perfume.id);
      if (existing) {
        return prev.map((item) =>
          item.id === perfume.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...perfume, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  return (
    <Router>
      <div className={cn("min-h-screen bg-[#fcfcfc] text-[#1a1a1a] font-sans", isRTL ? "font-arabic" : "font-sans")}>
        <Navbar 
          user={user} 
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)} 
          settings={settings}
        />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Store onAddToCart={addToCart} user={user} settings={settings} />} />
            <Route path="/admin/*" element={<Admin user={user} authLoading={authLoading} />} />
            <Route path="/checkout" element={<Checkout cartItems={cartItems} clearCart={() => setCartItems([])} settings={settings} />} />
            <Route path="/admin-portal" element={<Auth />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-100 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-serif italic">
                  {(language === 'ar' ? (settings.storeNameAr || settings.storeName || 'D') : (settings.storeName || 'D')).charAt(0)}
                </div>
                <span className="text-xl font-serif italic tracking-tight">
                  {language === 'ar' ? (settings.storeNameAr || settings.storeName) : settings.storeName}
                </span>
              </Link>
              <p className="text-sm text-gray-400">
                {t('footer.description')}
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('footer.follow')}</h4>
              <div className="flex gap-4">
                {settings.facebookUrl && (
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                )}
                {settings.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </a>
                )}
                {settings.twitterUrl && (
                  <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                  </a>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('footer.contact')}</h4>
              <p className="text-sm text-gray-400">Email: {settings.contactEmail}</p>
              <p className="text-sm text-gray-400">Tél: {settings.contactPhone}</p>
              <p className="text-sm text-gray-400">{t('checkout.address')}: {language === 'ar' ? settings.addressAr : settings.address}</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 pt-12 mt-12 border-t border-gray-50 text-center">
            <p className="text-[10px] text-gray-300 uppercase tracking-widest">
              © 2026 {language === 'ar' ? settings.storeNameAr : settings.storeName}. {t('footer.rights')}
            </p>
          </div>
        </footer>

        <Cart 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          items={cartItems} 
          onRemove={removeFromCart} 
          onUpdateQuantity={updateQuantity} 
          settings={settings}
        />
        
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

function Navbar({ user, cartCount, onCartClick, settings }: { user: any; cartCount: number; onCartClick: () => void; settings: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-serif italic">
            {(language === 'ar' ? (settings.storeNameAr || settings.storeName || 'D') : (settings.storeName || 'D')).charAt(0)}
          </div>
          <span className="text-xl font-serif italic tracking-tight">
            {language === 'ar' ? (settings.storeNameAr || settings.storeName) : settings.storeName}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={cn("text-sm font-medium hover:text-black transition-colors", location.pathname === "/" ? "text-black" : "text-gray-500")}>{t('nav.store')}</Link>
          {user && (
            <Link to="/admin" className={cn("text-sm font-medium hover:text-black transition-colors", location.pathname.startsWith("/admin") ? "text-black" : "text-gray-500")}>{t('nav.dashboard')}</Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center bg-gray-50 rounded-full p-1">
            <button 
              onClick={() => setLanguage('fr')}
              className={cn("px-3 py-1 text-[10px] font-bold rounded-full transition-all", language === 'fr' ? "bg-black text-white" : "text-gray-400 hover:text-black")}
            >
              FR
            </button>
            <button 
              onClick={() => setLanguage('ar')}
              className={cn("px-3 py-1 text-[10px] font-bold rounded-full transition-all", language === 'ar' ? "bg-black text-white" : "text-gray-400 hover:text-black")}
            >
              AR
            </button>
          </div>
          <button 
            onClick={onCartClick}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <LogOut size={20} />
              </button>
            </div>
          )}

          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 flex flex-col gap-4">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium">{t('nav.store')}</Link>
          {user && (
            <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium">{t('nav.dashboard')}</Link>
          )}
        </div>
      )}
    </nav>
  );
}
