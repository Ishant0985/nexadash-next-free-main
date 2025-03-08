"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/firebaseClient';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function InvoiceDetailsPage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (invoiceId) {
          const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
          if (invoiceDoc.exists()) {
            setInvoice({ id: invoiceDoc.id, ...invoiceDoc.data() });
          }
        } else {
          const invoicesRef = collection(db, 'invoices');
          const q = query(invoicesRef, orderBy('createdAt', 'desc'), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const latestInvoice = querySnapshot.docs[0];
            setInvoice({ id: latestInvoice.id, ...latestInvoice.data() });
          }
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error("Error fetching invoice details.");
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-600">No invoice details available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Invoice Details</h1>
        <div className="mb-4">
          <span className="font-semibold">Invoice ID:</span> {invoice.id}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Client:</span> {invoice.name}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Date:</span> {new Date(invoice.createdAt).toLocaleDateString()}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Email:</span> {invoice.email}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Phone:</span> {invoice.phone}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Address:</span> {invoice.address}
        </div>
        {invoice.profilePic && (
          <div className="mb-4">
            <Image src={invoice.profilePic} alt="Profile" width={80} height={80} className="rounded-full" />
          </div>
        )}
        <div className="mb-4">
          <span className="font-semibold">Items:</span>
          <p>{invoice.items}</p>
        </div>
        <div className="mt-4 text-right">
          <span className="font-bold text-xl">Total: ${invoice.amount}</span>
        </div>
      </div>
    </div>
  );
}
