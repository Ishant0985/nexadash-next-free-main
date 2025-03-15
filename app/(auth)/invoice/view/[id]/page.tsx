"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { db } from "@/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { CalendarIcon, DownloadIcon, PrinterIcon } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Example UI components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Fetch the invoice from Firestore on mount
  useEffect(() => {
    if (!invoiceId) {
      setLoading(false);
      return;
    }
    const fetchInvoice = async () => {
      try {
        const docRef = doc(db, "invoices", invoiceId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setInvoiceData({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      // Convert invoice HTML to canvas
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Increase resolution
      });
      const imgData = canvas.toDataURL("image/png");

      // Create PDF
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate image height to maintain aspect ratio
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pdfHeight);
      pdf.save(`invoice-${invoiceData?.invoiceId || invoiceData?.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading invoice...</div>;
  }

  if (!invoiceData) {
    return (
      <div className="p-6">
        <p>Invoice not found.</p>
      </div>
    );
  }

  // Extract fields from invoice
  const {
    invoiceId: invoiceIdFromData,
    gstNumber,
    name,
    email,
    phone,
    address,
    items = [],
    subTotal,
    taxAmount,
    totalAmount,
    amountDue,
    createdAt,
    dueDate,
    status = "Pending",
    paymentMethod,
    paymentDate,
    notes,
  } = invoiceData;

  // Example fallback for older invoices
  const invoiceNumber = invoiceIdFromData || invoiceData.id;
  const invoiceDateString = createdAt
    ? format(new Date(createdAt), "dd MMM, yyyy")
    : "N/A";
  const dueDateString = dueDate ? format(new Date(dueDate), "dd MMM, yyyy") : "N/A";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Invoice Details
        </h1>
        {/* Example "Status" badge in top-right */}
        <div>
          <Badge
            variant="outline"
            className={`${
              status === "Paid"
                ? "bg-green-100 text-green-800"
                : status === "Overdue"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent>
          {/* REF for PDF & Print capture */}
          <div ref={invoiceRef} className="p-4 md:p-6">
            {/* Invoice Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-700">
                  Invoice #{invoiceNumber}
                </h2>
                {gstNumber && (
                  <p className="text-sm text-gray-500">GST: {gstNumber}</p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                <p>
                  Invoice Date:{" "}
                  <span className="font-medium text-gray-700">
                    {invoiceDateString}
                  </span>
                </p>
                <p>
                  Due Date:{" "}
                  <span className="font-medium text-gray-700">
                    {dueDateString}
                  </span>
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-4" />

            {/* Billing Info */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Bill To */}
              <div>
                <h3 className="font-semibold text-gray-700">Bill To:</h3>
                <p className="mt-1 text-sm text-gray-700">{name}</p>
                <p className="text-sm text-gray-500">{email}</p>
                <p className="text-sm text-gray-500">{phone}</p>
                <p className="mt-1 text-sm text-gray-500 whitespace-pre-line">
                  {address}
                </p>
              </div>
              {/* Example "Billed From" or your own company info (hard-coded or from DB) */}
              <div>
                <h3 className="font-semibold text-gray-700">Billed From:</h3>
                <p className="mt-1 text-sm text-gray-700">Your Company Name</p>
                <p className="text-sm text-gray-500">
                  123 Business Street, Province, Zip 00000
                </p>
                <p className="text-sm text-gray-500">info@company.com</p>
                <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-6" />

            {/* Items Table */}
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">Invoice Detail</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                        Price
                      </th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(items) && items.length > 0 ? (
                      items.map((item: any, idx: number) => (
                        <tr
                          key={item.id || idx}
                          className="border-b last:border-none"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700">
                            ${item.price?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
                            ${item.total?.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-center text-gray-500"
                        >
                          No items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 flex flex-col items-end">
              <div className="w-full border-t border-gray-200 pt-4 sm:w-1/2 md:w-1/3">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Subtotal</span>
                  <span>${subTotal?.toFixed(2) ?? "0.00"}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 mt-1">
                  <span>Tax</span>
                  <span>${taxAmount?.toFixed(2) ?? "0.00"}</span>
                </div>
                {/* If you have discount or other fields, include them here */}
                <div className="flex justify-between text-base font-semibold mt-2">
                  <span>Total</span>
                  <span>${totalAmount?.toFixed(2) ?? "0.00"}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 mt-1">
                  <span>Amount Due</span>
                  <span>${amountDue?.toFixed(2) ?? "0.00"}</span>
                </div>
              </div>
            </div>

            {/* Notes / Payment Info */}
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                <strong>Notes: </strong>
                {notes || "No additional notes."}
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col gap-2 justify-end border-t border-gray-200 p-4 md:flex-row">
            <Button variant="outline" onClick={() => router.push("/(auth)/invoice/manage")}>
              Back to List
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
