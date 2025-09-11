'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import ResponderList from '@/components/ResponderList';
import MapView from '@/components/MapView';

interface Responder {
  id: string;
  name: string;
  contact: string;
  specialization: string;
  status: 'available' | 'assigned' | 'unavailable';
  assignedLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    assignedBy: string;
    assignedAt: string;
  };
  skills: string[];
  profileImage?: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.email?.includes('admin')) {
      router.push('/');
      return;
    }
    fetchResponders();
  }, [user, router]);

  const fetchResponders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'responders'));
      const responderData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Responder[];
      setResponders(responderData);
    } catch (error) {
      console.error('Error fetching responders:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignResponder = async (responderId: string, location: { lat: number; lng: number; address: string }) => {
    try {
      const responderRef = doc(db, 'responders', responderId);
      await updateDoc(responderRef, {
        status: 'assigned',
        assignedLocation: {
          latitude: location.lat,
          longitude: location.lng,
          address: location.address,
          assignedBy: user?.email || '',
          assignedAt: new Date().toISOString()
        }
      });
      fetchResponders(); // Refresh data
    } catch (error) {
      console.error('Error assigning responder:', error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && over.id === 'map-drop-zone') {
      // For demo, assign to a fixed location
      const location = { lat: 14.5995, lng: 120.9842, address: 'Manila, Philippines' };
      assignResponder(active.id as string, location);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold mb-6">Responder Management Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Responders</h2>
            <ResponderList responders={responders.filter(r => r.status === 'available')} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Map - Drag to Assign</h2>
            <MapView responders={responders} onAssign={assignResponder} />
          </div>
        </div>
      </div>
    </DndContext>
  );
}