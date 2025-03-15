 "use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/firebaseClient';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import PageHeading from '@/components/layout/page-heading';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoicePage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });

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
        setFilteredInvoices(invoiceList);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error("Failed to fetch invoices.");
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    let filtered = [...invoices];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status.toLowerCase() === statusFilter);
    }
    
    // Date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate >= dateRange.from! && invDate <= dateRange.to!;
      });
    }
    
    setFilteredInvoices(filtered);
  }, [searchTerm, statusFilter, dateRange, invoices]);

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

  const handleRowClick = (id: string) => {
    router.push(`/invoice/view/${id}`);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <PageHeading heading="Invoices" />
        <Link 
          href="/(auth)/create-invoice"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create New Invoice
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={{ from: dateRange.from!, to: dateRange.to! }}
                    onSelect={(range) => setDateRange({ from: range?.from || null, to: range?.to || null })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    onClick={() => handleRowClick(inv.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{inv.invoiceId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{inv.name}</div>
                          <div className="text-sm text-gray-500">{inv.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(inv.createdAt), 'MMM dd, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${inv.totalAmount || inv.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                          inv.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(inv.id);
                        }}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
