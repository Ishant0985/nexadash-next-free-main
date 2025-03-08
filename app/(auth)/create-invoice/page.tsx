"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/firebaseClient';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [invoice, setInvoice] = useState({
    email: '',
    phone: '',
    name: '',
    address: '',
    items: '',
    amount: '',
    tax: '',
    discount: '',
    subtotal: '',
    totalAmount: '',
    dueDate: '',
    status: 'Paid',
    createdAt: new Date().toISOString(),
    invoiceId: `INV-${Date.now()}`,
    paymentMethod: 'cash',
    upiDetails: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      const amount = parseFloat(value) || 0;
      const tax = amount * 0.18; // 18% tax
      const subtotal = amount;
      const totalAmount = subtotal + tax;
      
      setInvoice(prev => ({
        ...prev,
        [name]: value,
        tax: tax.toFixed(2),
        subtotal: subtotal.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      }));
    } else {
      setInvoice(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'invoices'), invoice);
      toast.success("Invoice created successfully!");
      router.push(`/(auth)/invoice-details?id=${docRef.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error("Error creating invoice.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Invoice</h1>
          <p className="mt-1 text-sm text-gray-600">Create a new invoice for your customer</p>
        </div>
        <div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Draft
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-gray-100">
                    <Image
                      src="/images/logo.svg"
                      alt="Company Logo"
                      width={64}
                      height={64}
                      className="rounded-lg object-contain p-2"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Your Company Name</h3>
                    <p className="text-sm text-gray-600">Invoice #{invoice.invoiceId}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bill To</label>
                  <input
                    type="text"
                    name="name"
                    value={invoice.name}
                    onChange={handleChange}
                    placeholder="Customer name"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    value={invoice.email}
                    onChange={handleChange}
                    placeholder="Customer email"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    name="phone"
                    value={invoice.phone}
                    onChange={handleChange}
                    placeholder="Customer phone"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <textarea
                    name="address"
                    value={invoice.address}
                    onChange={handleChange}
                    placeholder="Customer address"
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">Items</h3>
              <div className="mt-4">
                <textarea
                  name="items"
                  value={invoice.items}
                  onChange={handleChange}
                  placeholder="Enter items (comma separated)"
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Amount Details */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={invoice.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={invoice.dueDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={invoice.paymentMethod}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              {invoice.paymentMethod === 'upi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">UPI ID</label>
                  <input
                    type="text"
                    name="upiDetails"
                    value={invoice.upiDetails}
                    onChange={handleChange}
                    placeholder="Enter UPI ID"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={invoice.notes}
                onChange={handleChange}
                placeholder="Add any notes or terms"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Summary */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex justify-end">
                <div className="w-80">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-medium">${invoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Tax (18%):</span>
                    <span className="font-medium">${invoice.tax}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 py-2">
                    <span className="text-base font-medium">Total:</span>
                    <span className="text-base font-bold">${invoice.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Invoice
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
