import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in our users collection
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // If it's the first admin (smbachir24@gmail.com), create them as admin
        const role = user.email === 'smbachir24@gmail.com' ? 'admin' : 'staff';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: role
        });
      }

      toast.success('Connexion réussie!');
      navigate('/admin');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-serif italic">Accès Admin</h1>
        <p className="text-gray-500">Connectez-vous pour gérer vos commandes et votre inventaire.</p>
      </div>

      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 rounded-2xl font-medium hover:bg-gray-50 transition-all shadow-sm"
      >
        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
        {loading ? 'Connexion...' : 'Continuer avec Google'}
      </button>

      <p className="text-[10px] text-gray-400 uppercase tracking-widest">
        Seuls les administrateurs autorisés peuvent accéder au dashboard.
      </p>
    </div>
  );
}
