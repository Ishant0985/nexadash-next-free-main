"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import PageHeading from '@/components/layout/page-heading';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PrinterIcon, DownloadIcon } from 'lucide-react';

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
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error("Error fetching invoice details.");
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(20);
      doc.text('Invoice', 20, 20);
      
      // Add company logo and info
      doc.setFontSize(12);
      doc.text('Your Company Name', 20, 40);
      doc.text(invoice.invoiceId, 20, 50);
      
      // Add invoice details
      doc.text('Bill To:', 20, 70);
      doc.text(invoice.name, 20, 80);
      doc.text(invoice.email, 20, 90);
      doc.text(invoice.phone, 20, 100);
      doc.text(invoice.address, 20, 110);

      // Add items table
      const items = invoice.items.split(',').map((item: string) => [item.trim()]);
      
      (doc as any).autoTable({
        startY: 130,
        head: [['Item Description']],
        body: items,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });

      // Add summary
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(10);
      
      doc.text('Payment Details:', 20, finalY + 20);
      doc.text(`Method: ${invoice.paymentMethod.toUpperCase()}`, 20, finalY + 30);
      if (invoice.paymentMethod === 'upi' && invoice.upiDetails) {
        doc.text(`UPI ID: ${invoice.upiDetails}`, 20, finalY + 40);
      }
      
      doc.text('Amount Summary:', 140, finalY + 20);
      doc.text(`Subtotal: $${invoice.subtotal || invoice.amount}`, 140, finalY + 30);
      doc.text(`Tax (18%): $${invoice.tax || '0.00'}`, 140, finalY + 40);
      doc.text(`Total: $${invoice.totalAmount || invoice.amount}`, 140, finalY + 50);
      
      // Save PDF
      doc.save(`invoice-${invoice.invoiceId}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-600">Loading invoice details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <PageHeading heading="Invoice Details" />
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={generatePDF}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <DownloadIcon className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        <Card className="print:shadow-none">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex justify-between border-b border-gray-200 pb-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src="/images/logo.svg"
                    alt="Company Logo"
                    width={64}
                    height={64}
                    className="h-full w-full object-contain p-2"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Company Name</h3>
                  <p className="text-sm text-gray-600">Invoice #{invoice.invoiceId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Date Issued</p>
                <p className="font-medium">{format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}</p>
                {invoice.dueDate && (
                  <>
                    <p className="mt-2 text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">{format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Client & Status */}
            <div className="grid grid-cols-2 gap-8 py-8">
              <div>
                <h4 className="mb-4 text-sm font-medium text-gray-600">Bill To:</h4>
                <h5 className="font-semibold">{invoice.name}</h5>
                <p className="mt-1 text-sm text-gray-600">{invoice.email}</p>
                <p className="text-sm text-gray-600">{invoice.phone}</p>
                <p className="mt-2 text-sm text-gray-600">{invoice.address}</p>
              </div>
              <div className="text-right">
                <h4 className="mb-4 text-sm font-medium text-gray-600">Status</h4>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                  ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                    invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="mt-8">
              <h4 className="mb-4 text-sm font-medium text-gray-600">Items</h4>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.split(',').map((item: string, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.trim()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment & Summary */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <h4 className="mb-4 text-sm font-medium text-gray-600">Payment Method</h4>
                <p className="text-sm text-gray-900">{invoice.paymentMethod.toUpperCase()}</p>
                {invoice.paymentMethod === 'upi' && invoice.upiDetails && (
                  <p className="mt-1 text-sm text-gray-600">UPI ID: {invoice.upiDetails}</p>
                )}
                {invoice.notes && (
                  <>
                    <h4 className="mb-2 mt-6 text-sm font-medium text-gray-600">Notes</h4>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-medium">${invoice.subtotal || invoice.amount}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-sm text-gray-600">Tax (18%)</span>
                  <span className="font-medium">${invoice.tax || '0.00'}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-base font-medium">Total Amount</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${invoice.totalAmount || invoice.amount}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
