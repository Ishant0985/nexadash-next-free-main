"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/firebaseClient';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesCol = collection(db, 'invoices');
        const invoiceSnapshot = await getDocs(invoicesCol);
        const invoiceList = invoiceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setInvoices(invoiceList);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error("Failed to fetch invoices.");
      }
    };
    fetchInvoices();
  }, []);

  const handleDelete = async (invoiceId: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
      toast.success("Invoice deleted successfully!");
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error("Error deleting invoice.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <Link href="/(auth)/create-invoice">
            <a className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200">
              Create Invoice
            </a>
          </Link>
        </div>
        {invoices.length === 0 ? (
          <p className="text-gray-600">No invoices found. Create a new invoice to get started.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{inv.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{inv.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${inv.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{inv.status || 'Paid'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleDelete(inv.id)} className="text-red-500">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
