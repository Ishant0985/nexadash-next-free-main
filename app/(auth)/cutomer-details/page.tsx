"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function CustomerDetailsPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        if (customerId) {
          const customerDoc = await getDoc(doc(db, 'customers', customerId));
          if (customerDoc.exists()) {
            setCustomer({ id: customerDoc.id, ...customerDoc.data() });
          } else {
            toast.error("Customer not found.");
          }
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast.error("Error fetching customer details.");
      }
    };
    fetchCustomer();
  }, [customerId]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-600">No customer details available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Customer Details</h1>
        <div className="mb-4">
          <span className="font-semibold">Customer ID:</span> {customer.id}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Name:</span> {customer.firstName} {customer.lastName}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Email:</span> {customer.email}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Phone:</span> {customer.phone}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Country:</span> {customer.country}
        </div>
        <div className="mb-4">
          <span className="font-semibold">State:</span> {customer.state}
        </div>
        <div className="mb-4">
          <span className="font-semibold">District:</span> {customer.district}
        </div>
        <div className="mb-4">
          <span className="font-semibold">City:</span> {customer.city}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Pincode:</span> {customer.pincode}
        </div>
        {customer.profilePic && (
          <div className="mb-4">
            <Image src={customer.profilePic} alt="Profile" width={80} height={80} className="rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
