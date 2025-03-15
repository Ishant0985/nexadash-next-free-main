'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Firebase imports
import { db } from '@/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

// Helper functions
const formatDate = (date: any) => {
  if (!date) return 'N/A';
  try {
    const d = date instanceof Date
      ? date
      : new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerCountry?: string;
  customerDistrict?: string;
  customerPincode?: string;
  invoiceDate: any;
  dueDate: any;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  items: InvoiceItem[];
  taxRate: number;
  subTotal: number;
  taxAmount: number;
  discount?: number;
  notes?: string;
  fromName?: string;
  fromEmail?: string;
  fromPhone?: string;
  fromAddress?: string;
  fromCity?: string;
  fromState?: string;
  fromPincode?: string;
  createdAt: any;
}

export default function InvoiceViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true);
      try {
        const invoiceRef = doc(db, 'invoices', params.id);
        const invoiceSnap = await getDoc(invoiceRef);
        
        if (invoiceSnap.exists()) {
          const invoiceData = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
          
          // If we need to fetch customer details
          if (invoiceData.customer) {
            try {
              const customerRef = doc(db, 'customers', invoiceData.customer);
              const customerSnap = await getDoc(customerRef);
              if (customerSnap.exists()) {
                const customerData = customerSnap.data();
                invoiceData.customerName = customerData.name;
                invoiceData.customerEmail = customerData.email;
                invoiceData.customerPhone = customerData.phone;
                invoiceData.customerAddress = customerData.address;
                invoiceData.customerCity = customerData.city;
                invoiceData.customerState = customerData.state;
                invoiceData.customerCountry = customerData.country;
                invoiceData.customerDistrict = customerData.district;
                invoiceData.customerPincode = customerData.pincode;
              }
            } catch (customerError) {
              console.error('Error fetching customer details:', customerError);
            }
          }
          
          setInvoice(invoiceData);
        } else {
          setError('Invoice not found');
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // This would typically generate a PDF or trigger a download
    // For now, we'll just show a toast message
    toast.success('Download started');
  };

  // Format the full address
  const formatAddress = (address?: string, city?: string, state?: string, pincode?: string) => {
    return [address, city, state, pincode].filter(Boolean).join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-4">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="mt-2">{error || 'Invoice not found'}</p>
          <Button onClick={() => router.push('/invoice')} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoice Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                Invoice #{invoice.invoiceNumber}
              </h2>
              <p className="text-gray-600">{invoice.fromName || 'Your Company'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill From:</h3>
              <p className="font-semibold">
                {invoice.fromName || 'Din Djarin'}</p>
              <p>{invoice.fromEmail || 'WendyKFrazier@teleworm.us'}</p>
              <p>{invoice.fromPhone || '(+254)724-453-233'}</p>
              <p>{invoice.fromAddress || '4458 Dennison Street, Stockton, CA 95204'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To:</h3>
              <p className="font-semibold">{invoice.customerName || 'Starfleet Alliance'}</p>
              <p>{invoice.customerEmail || 'OliviaDKaiser@teleworm.us'}</p>
              <p>{invoice.customerPhone || '(+254)243-124-392'}</p>
              <p>
                {formatAddress(
                  invoice.customerAddress,
                  invoice.customerCity,
                  invoice.customerState,
                  invoice.customerPincode
                ) || '4548 Pinnickinnick Street, Piscataway, NJ 08854'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Date</h3>
              <p>{formatDate(invoice.invoiceDate) || '6 March, 2023'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
              <p>{formatDate(invoice.dueDate) || '7 March, 2023'}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Invoice Detail</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{formatINR(item.price)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatINR(item.total)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0 md:w-1/2">
              {invoice.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                  <p className="text-sm text-gray-700">{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="md:w-1/2 md:pl-8">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatINR(invoice.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total excluding tax</span>
                  <span>{formatINR(invoice.subTotal)}</span>
                </div>
                {invoice.discount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount ({invoice.discount}%)</span>
                    <span>{formatINR((invoice.subTotal * invoice.discount) / 100)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatINR(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Amount Due</span>
                  <span>{formatINR(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.push('/invoice')} className="mr-4">
          Back to Invoices
        </Button>
        <Button onClick={() => router.push(`/invoice/edit/${params.id}`)}>
          Edit Invoice
        </Button>
      </div>
    </div>
  );
}