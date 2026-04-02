export interface Perfume {
  id: string;
  name: string;
  nameAr?: string;
  inspiredBy: string;
  inspiredByAr?: string;
  price: number;
  oldPrice?: number;
  description: string;
  descriptionAr?: string;
  notes: string[];
  notesAr?: string[];
  category: 'Men' | 'Women' | 'Unisex';
  imageUrl: string;
  stock: number;
  isFeatured: boolean;
}

export interface OrderItem {
  perfumeId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  wilaya: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp
  paymentMethod: 'COD' | 'SATIM';
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'staff';
}
