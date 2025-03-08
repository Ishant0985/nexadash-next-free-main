"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/firebaseClient';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [invoice, setInvoice] = useState({
    email: '',
    phone: '',
    name: '',
    address: '',
    profilePic: '',
    items: '',
    amount: '',
    status: 'Paid',
    createdAt: new Date().toISOString()
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInvoice({ ...invoice, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'invoices'), invoice);
      toast.success("Invoice created successfully!");
      router.push('/(auth)/invoice');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error("Error creating invoice.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Invoice</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Customer Email</label>
            <input
              type="email"
              name="email"
              value={invoice.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Customer Phone</label>
            <input
              type="tel"
              name="phone"
              value={invoice.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Customer Name</label>
            <input
              type="text"
              name="name"
              value={invoice.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Customer Address</label>
            <input
              type="text"
              name="address"
              value={invoice.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Profile Picture URL</label>
            <input
              type="url"
              name="profilePic"
              value={invoice.profilePic}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Items</label>
            <textarea
              name="items"
              value={invoice.items}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={invoice.amount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <button type="submit" className="w-full bg-green-500 text-white py-3 rounded">
            Create Invoice
          </button>
        </form>
      </div>
    </div>
  );
}
