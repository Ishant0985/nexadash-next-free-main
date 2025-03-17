'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Image from 'next/image';

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
  const invoiceRef = useRef<HTMLDivElement>(null);

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
    if (!invoiceRef.current) {
      toast.error('Could not print invoice');
      return;
    }

    // Create a new window for printing just the invoice
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print invoice.');
      return;
    }

    // Get the HTML content of the invoice card
    const invoiceContent = invoiceRef.current.innerHTML;

    // Add styles for nice printing
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice?.invoiceNumber || invoiceId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
              text-align: left;
            }
            th {
              font-weight: bold;
              background-color: #f9fafb;
            }
            .flex {
              display: flex;
            }
            .flex-col {
              display: flex;
              flex-direction: column;
            }
            .justify-between {
              justify-content: space-between;
            }
            .mb-8 {
              margin-bottom: 2rem;
            }
            .mb-4 {
              margin-bottom: 1rem;
            }
            .items-center {
              align-items: center;
            }
            .grid {
              display: grid;
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            .gap-8 {
              gap: 2rem;
            }
            .gap-4 {
              gap: 1rem;
            }
            .p-6 {
              padding: 1.5rem;
            }
            .text-right {
              text-align: right;
            }
            .font-semibold {
              font-weight: 600;
            }
            .text-gray-600 {
              color: #4b5563;
            }
            .text-gray-500 {
              color: #6b7280;
            }
            .text-red-600 {
              color: #dc2626;
            }
            .text-green-600 {
              color: #059669;
            }
            .text-lg {
              font-size: 1.125rem;
            }
            .text-xl {
              font-size: 1.25rem;
            }
            .my-2 {
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
            }
            hr {
              border: 0;
              border-top: 1px solid #e5e7eb;
              margin: 1rem 0;
            }
            .invoice-logo {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              object-fit: cover;
              margin-right: 1rem;
            }
            .company-logo-container {
              display: inline-block;
              margin-right: 1rem;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="p-6">
            ${invoiceContent.replace(/<img[^>]*>/g, '<img src="/images/logo-footer.webp" class="invoice-logo" />')}
          </div>
          <script>
            // Preload the logo image
            const logoImg = new Image();
            logoImg.src = '/images/logo-footer.webp';
            
            // Wait for all content to be fully loaded
            document.addEventListener('DOMContentLoaded', function() {
              // Add a small delay to ensure everything is rendered
              setTimeout(function() {
                // Check if all images are loaded
                const allImagesLoaded = Array.from(document.images).every(img => img.complete);
                
                if (!allImagesLoaded) {
                  // Wait for images to load if they're not ready
                  const imageLoadPromises = Array.from(document.images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                      img.onload = resolve;
                      img.onerror = resolve; // Continue even if image fails
                    });
                  });
                  
                  Promise.all(imageLoadPromises).then(() => {
                    setTimeout(() => window.print(), 500);
                  });
                } else {
                  // All images already loaded, proceed with printing
                  setTimeout(() => window.print(), 500);
                }
                
                // Only close after printing is complete or cancelled
                window.addEventListener('afterprint', function() {
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                });
                
                // Fallback in case afterprint event is not supported
                setTimeout(function() {
                  window.close();
                }, 5000);
              }, 1000);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) {
      toast.error('Could not generate PDF');
      return;
    }

    toast.loading('Generating PDF...', { id: 'pdf-loading' });
    
    try {
      // Set some styles for better PDF rendering
      const originalStyle = invoiceRef.current.style.cssText;
      invoiceRef.current.style.background = 'white';
      
      // Capture the invoice element as an image
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Restore original styles
      invoiceRef.current.style.cssText = originalStyle;
      
      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm (210mm)
      const pageHeight = 297; // A4 height in mm (297mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add the image to the PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`Invoice_${invoice?.invoiceNumber || invoiceId}.pdf`);
      
      toast.dismiss('pdf-loading');
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.dismiss('pdf-loading');
      toast.error('Failed to generate PDF');
    }
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

      <Card className="mb-8" ref={invoiceRef}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className="h-12 w-12 relative rounded-full overflow-hidden bg-gray-100 mr-4 border">
                <Image
                  src="/images/invlogo.png" 
                  alt="Company Logo"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <p className="text-gray-600 font-medium">Motor Auto Care</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">
                Invoice #{invoice.invoiceNumber}
              </h2>
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