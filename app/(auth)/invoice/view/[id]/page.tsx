'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
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

interface BillerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  gstin?: string;
}

interface CustomerDetails {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  address?: string;
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
  customerDetails?: CustomerDetails;
  biller?: string;
  billerDetails?: BillerDetails;
  fromName?: string;
  fromEmail?: string;
  fromPhone?: string;
  fromAddress?: string;
  fromCity?: string;
  fromState?: string;
  fromPincode?: string;
  invoiceDate: any;
  dueDate: any;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  paymentType?: 'all' | 'custom';
  amountPaid?: number;
  dueAmount?: number;
  items: InvoiceItem[];
  taxRate: number;
  subTotal: number;
  taxAmount: number;
  discount?: number;
  notes?: string;
  createdAt: any;
}

export default function InvoiceViewPage() {
  const params = useParams();
  const invoiceId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;
      
      setIsLoading(true);
      try {
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        
        if (invoiceSnap.exists()) {
          const invoiceData = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
          
          // If we need to fetch customer details (for older invoices)
          if (invoiceData.customer && !invoiceData.customerDetails) {
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
          
          // If we need to fetch biller details (for older invoices)
          if (invoiceData.biller && !invoiceData.billerDetails) {
            try {
              const billerRef = doc(db, 'billers', invoiceData.biller);
              const billerSnap = await getDoc(billerRef);
              if (billerSnap.exists()) {
                const billerData = billerSnap.data();
                invoiceData.fromName = billerData.name;
                invoiceData.fromEmail = billerData.email;
                invoiceData.fromPhone = billerData.phone;
                invoiceData.fromAddress = billerData.address;
                invoiceData.fromCity = billerData.city;
                invoiceData.fromState = billerData.state;
                invoiceData.fromPincode = billerData.pincode;
              }
            } catch (billerError) {
              console.error('Error fetching biller details:', billerError);
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

    fetchInvoice();
  }, [invoiceId, router]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
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

  // Get biller information from either the new billerDetails field or from the old fields
  const billerName = invoice.billerDetails?.name || invoice.fromName || 'Motor Auto Care';
  const billerEmail = invoice.billerDetails?.email || invoice.fromEmail || 'contact@motorautocare.com';
  const billerPhone = invoice.billerDetails?.phone || invoice.fromPhone || '';
  const billerGstin = invoice.billerDetails?.gstin || '';
  
  // Format biller address
  const billerAddress = formatAddress(
    '',
    invoice.billerDetails?.city || invoice.fromCity,
    invoice.billerDetails?.state || invoice.fromState,
    invoice.billerDetails?.pincode || invoice.fromPincode
  );
  
  // Get customer information from either the new customerDetails field or from the old fields
  const customerName = invoice.customerDetails?.name || invoice.customerName || 'Customer';
  const customerEmail = invoice.customerDetails?.email || invoice.customerEmail || '';
  const customerPhone = invoice.customerDetails?.phone || invoice.customerPhone || '';
  
  // Format customer address
  const customerAddress = formatAddress(
    invoice.customerDetails?.address || invoice.customerAddress,
    invoice.customerDetails?.city || invoice.customerCity,
    invoice.customerDetails?.state || invoice.customerState,
    invoice.customerDetails?.pincode || invoice.customerPincode
  );

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
              <p className="text-gray-600">Moto Auto Care</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill From:</h3>
              <p className="font-semibold">{billerName}</p>
              <p>{billerEmail}</p>
              <p>{billerPhone}</p>
              {billerGstin && <p>GSTIN: {billerGstin}</p>}
              {billerAddress && <p>{billerAddress}</p>}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To:</h3>
              <p className="font-semibold">{customerName}</p>
              <p>{customerEmail}</p>
              <p>{customerPhone}</p>
              <p>{customerAddress || 'No address provided'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Date</h3>
              <p>{formatDate(invoice.invoiceDate) || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
              <p>{formatDate(invoice.dueDate) || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h3>
              <p className={invoice.paymentStatus === 'Paid' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {invoice.paymentStatus}
              </p>
              {invoice.amountPaid !== undefined && invoice.amountPaid > 0 && (
                <p className="text-sm">
                  Amount Paid: {formatINR(invoice.amountPaid)}
                </p>
              )}
              {invoice.dueAmount !== undefined && invoice.dueAmount > 0 && (
                <p className="text-sm">
                  Amount Due: {formatINR(invoice.dueAmount)}
                </p>
              )}
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
                  <span>{formatINR(invoice.dueAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button onClick={() => router.push(`/invoice/edit/${invoiceId}`)}>
          Edit Invoice
        </Button>
      </div>
    </div>
  );
}