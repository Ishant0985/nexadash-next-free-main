'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Edit, Trash2, Search, FileDown, MoreVertical, ChevronDown, MoreHorizontal } from 'lucide-react';
import PageHeading from '@/components/layout/page-heading';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Firebase imports
import { db } from '@/firebaseClient';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
  limit,
  startAfter,
  getDoc
} from 'firebase/firestore';

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
  items: any[];
  taxRate: number;
  subTotal: number;
  taxAmount: number;
  createdAt: any;
}

interface Customer {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  district?: string;
  pincode?: string;
  customerId?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Service {
  id: string;
  name: string;
  cost: number;
}

// Helper functions
const formatDate = (date: any) => {
  if (!date) return 'N/A';
  try {
    const d = date instanceof Date
      ? date
      : new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
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

// CSV Export function
const exportToCSV = (invoices: Invoice[], filename = 'invoices.csv') => {
  const csvHeaders = [
    'Invoice ID',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Customer Address',
    'Issued Date',
    'Due Date',
    'Subtotal Amount',
    'Tax Rate',
    'Tax Amount',
    'Total Amount',
    'Payment Status',
    'Payment Method',
    'Items'
  ];

  const csvContent = invoices.map(invoice => {
    // Safely handle items information
    const itemsDetails = Array.isArray(invoice.items)
      ? invoice.items.map(item => {
        const description = item.description || item.productName || item.serviceName || 'Unnamed item';
        const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
        const price = typeof item.price === 'number' ? item.price : 0;
        const total = typeof item.total === 'number' ? item.total : (quantity * price);
        return `${description} (${quantity} x ${price} = ${total})`;
      }).join('; ')
      : 'No items';

    // Format address from all address components
    const customerAddress = [
      invoice.customerAddress,
      invoice.customerCity,
      invoice.customerDistrict,
      invoice.customerState,
      invoice.customerCountry,
      invoice.customerPincode
    ].filter(Boolean).join(', ');

    return [
      invoice.invoiceNumber || `INV-${invoice.id}`,
      invoice.customerName || 'Unknown',
      invoice.customerEmail || '',
      invoice.customerPhone || '',
      customerAddress || '',
      formatDate(invoice.invoiceDate),
      formatDate(invoice.dueDate),
      typeof invoice.subTotal === 'number' ? invoice.subTotal : 0,
      invoice.taxRate ? `${invoice.taxRate}%` : '0%',
      typeof invoice.taxAmount === 'number' ? invoice.taxAmount : 0,
      typeof invoice.totalAmount === 'number' ? invoice.totalAmount : 0,
      invoice.paymentStatus || 'Unknown',
      invoice.paymentMethod || '',
      itemsDetails
    ];
  });

  const csv = [
    csvHeaders.join(','),
    ...csvContent.map(row => row.map(cell =>
      // Ensure proper CSV escaping for any value that might contain commas or quotes
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Custom Pagination Ellipsis component
const PaginationEllipsis = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex h-9 w-9 items-center justify-center", className)}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </div>
  );
};

export default function InvoiceListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<{ [key: string]: Customer }>({});
  const [products, setProducts] = useState<{ [key: string]: Product }>({});
  const [services, setServices] = useState<{ [key: string]: Service }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('issuedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch customers first
        const customersRef = collection(db, 'customers');
        const customersSnapshot = await getDocs(customersRef);
        const customersData: { [key: string]: Customer } = {};
        customersSnapshot.forEach((doc) => {
          customersData[doc.id] = { id: doc.id, ...doc.data() } as Customer;
        });
        setCustomers(customersData);

        // Fetch products
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        const productsData: { [key: string]: Product } = {};
        productsSnapshot.forEach((doc) => {
          productsData[doc.id] = { id: doc.id, ...doc.data() } as Product;
        });
        setProducts(productsData);

        // Fetch services
        const servicesRef = collection(db, 'services');
        const servicesSnapshot = await getDocs(servicesRef);
        const servicesData: { [key: string]: Service } = {};
        servicesSnapshot.forEach((doc) => {
          servicesData[doc.id] = { id: doc.id, ...doc.data() } as Service;
        });
        setServices(servicesData);

        // Now fetch invoices
        const invoicesRef = collection(db, 'invoices');
        const q = query(invoicesRef, orderBy('createdAt', 'desc'));
        const invoicesSnapshot = await getDocs(q);
        const invoicesData: Invoice[] = [];

        invoicesSnapshot.forEach((doc) => {
          const invoiceData = doc.data() as Invoice;
          invoiceData.id = doc.id;

          // Add customer info
          if (invoiceData.customer && customersData[invoiceData.customer]) {
            const customer = customersData[invoiceData.customer];
            // Create proper customer name from firstName and lastName if available
            invoiceData.customerName = customer.firstName && customer.lastName 
              ? `${customer.firstName} ${customer.lastName}`
              : customer.firstName || customer.lastName || customer.name || 'Unknown';
            invoiceData.customerEmail = customer.email;
            invoiceData.customerPhone = customer.phone;
            invoiceData.customerAddress = customer.address;
            invoiceData.customerCity = customer.city;
            invoiceData.customerState = customer.state;
            invoiceData.customerCountry = customer.country;
            invoiceData.customerDistrict = customer.district;
            invoiceData.customerPincode = customer.pincode;
          }

          // Enrich items with product/service details if needed
          if (invoiceData.items && Array.isArray(invoiceData.items)) {
            invoiceData.items = invoiceData.items.map(item => {
              // If it's a product reference, add product details
              if (item.productId && productsData[item.productId]) {
                const product = productsData[item.productId];
                item.productName = product.name;
                // If description is missing, use product name
                if (!item.description) {
                  item.description = product.name;
                }
              }
              // If it's a service reference, add service details
              else if (item.serviceId && servicesData[item.serviceId]) {
                const service = servicesData[item.serviceId];
                item.serviceName = service.name;
                // If description is missing, use service name
                if (!item.description) {
                  item.description = service.name;
                }
              }
              return item;
            });
          }

          invoicesData.push(invoiceData);
        });

        setInvoices(invoicesData);
        setFilteredInvoices(invoicesData);
        setTotalPages(Math.ceil(invoicesData.length / ITEMS_PER_PAGE));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch invoices. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle tab changes
  useEffect(() => {
    let filtered = [...invoices];

    // Apply tab filtering
    if (activeTab === 'unpaid') {
      filtered = filtered.filter(inv => inv.paymentStatus === 'Unpaid');
    } else if (activeTab === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(inv => {
        if (!inv.dueDate) return false;
        const dueDate = inv.dueDate.seconds
          ? new Date(inv.dueDate.seconds * 1000)
          : new Date(inv.dueDate);
        return inv.paymentStatus !== 'Paid' && dueDate < now;
      });
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(inv => inv.paymentStatus === 'Paid');
    }

    // Apply search filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(term)) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(term)) ||
        (inv.customerEmail && inv.customerEmail.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;

      if (sortField === 'amount') {
        valueA = a.totalAmount || 0;
        valueB = b.totalAmount || 0;
      } else if (sortField === 'issuedDate') {
        valueA = a.invoiceDate ? (a.invoiceDate.seconds ? a.invoiceDate.seconds * 1000 : new Date(a.invoiceDate).getTime()) : 0;
        valueB = b.invoiceDate ? (b.invoiceDate.seconds ? b.invoiceDate.seconds * 1000 : new Date(b.invoiceDate).getTime()) : 0;
      } else if (sortField === 'dueDate') {
        valueA = a.dueDate ? (a.dueDate.seconds ? a.dueDate.seconds * 1000 : new Date(a.dueDate).getTime()) : 0;
        valueB = b.dueDate ? (b.dueDate.seconds ? b.dueDate.seconds * 1000 : new Date(b.dueDate).getTime()) : 0;
      } else if (sortField === 'client') {
        valueA = a.customerName || '';
        valueB = b.customerName || '';
      } else {
        valueA = a[sortField as keyof Invoice] || '';
        valueB = b[sortField as keyof Invoice] || '';
      }

      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAll(false);
  }, [activeTab, searchTerm, sortField, sortDirection, invoices]);

  // Handle pagination
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setSelectedRows([]);
    setSelectAll(false);
  };

  // Get current invoices
  const getCurrentInvoices = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(getCurrentInvoices().map(inv => inv.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle row selection
  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    if (!currentInvoice) return;

    try {
      await deleteDoc(doc(db, 'invoices', currentInvoice.id));

      // Update the invoice list
      setInvoices(invoices.filter(inv => inv.id !== currentInvoice.id));
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeleteDialogOpen(false);
      setCurrentInvoice(null);
    }
  };

  // Edit invoice payment status
  const handleUpdateStatus = async (newStatus: string) => {
    if (!currentInvoice) return;

    try {
      await updateDoc(doc(db, 'invoices', currentInvoice.id), {
        paymentStatus: newStatus
      });

      // Update the invoice list
      setInvoices(invoices.map(inv =>
        inv.id === currentInvoice.id ? { ...inv, paymentStatus: newStatus } : inv
      ));

      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice status');
    } finally {
      setEditDialogOpen(false);
      setCurrentInvoice(null);
    }
  };

  // Export invoices
  const handleExport = (exportAll: boolean) => {
    let dataToExport = exportAll
      ? filteredInvoices
      : getCurrentInvoices();

    // If rows are selected, only export those
    if (selectedRows.length > 0 && !exportAll) {
      dataToExport = dataToExport.filter(inv => selectedRows.includes(inv.id));
    }

    // Use a more robust filename that includes date in a clean format
    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    const filename = `invoices_export_${currentDate}.csv`;

    exportToCSV(dataToExport, filename);
    setExportDialogOpen(false);
    toast.success('Invoices exported successfully!');
  };
  return (
    <div className="relative space-y-4">
      <PageHeading heading="Invoice" button1={
        <Button
          variant="outline"
          onClick={() => setExportDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <FileDown size={16} />
          Export
        </Button>
      }
        button2={
          <Button
            onClick={() => router.push('/invoice/create')}
            className="flex items-center gap-2"
          >
            <span>+</span> Create Invoice
          </Button>
        }
      />
      {/* <div className="p-4 max-w-7xl mx-auto"> */}

      <div className="relative space-y-4">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex justify-between items-center mb-5 overflow-x-auto rounded-lg bg-white shadow-sm">
            <div className="inline-flex gap-2.5 px-5 py-[11px] text-sm/[18px] font-semibold">
              <TabsTrigger
                value="all"
                className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Invoices
              </TabsTrigger>
              <TabsTrigger value="unpaid" className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white">Unpaid</TabsTrigger>
              <TabsTrigger value="overdue" className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white">Overdue</TabsTrigger>
              <TabsTrigger value="paid" className="leading-3 data-[state=active]:bg-black data-[state=active]:text-white">Paid</TabsTrigger>
            </div>
            <div className="inline-flex text-sm/[18px] font-semibold">
              <div className="relative mr-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search client"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-8"
                />
              </div>
            </div>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('invoiceNumber')}
                  >
                    ID
                    {sortField === 'invoiceNumber' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('client')}
                  >
                    Client
                    {sortField === 'client' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('issuedDate')}
                  >
                    Issued Date
                    {sortField === 'issuedDate' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    Amount
                    {sortField === 'amount' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('paymentStatus')}
                  >
                    Status
                    {sortField === 'paymentStatus' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('dueDate')}
                  >
                    Due Date
                    {sortField === 'dueDate' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : getCurrentInvoices().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  getCurrentInvoices().map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(invoice.id)}
                          onCheckedChange={() => handleSelectRow(invoice.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">#{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                            {invoice.customerName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{invoice.customerName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">
                              {invoice.customerEmail || (invoice.customerPhone ? invoice.customerPhone : 'No contact info')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>{formatINR(invoice.totalAmount)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.paymentStatus === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.paymentStatus === 'Unpaid'
                            ? 'bg-red-100 text-red-800'
                            : invoice.paymentStatus === 'Overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {invoice.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/invoice/edit/${invoice.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setCurrentInvoice(invoice);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentInvoice(invoice);
                                  setEditDialogOpen(true);
                                }}
                              >
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/invoice/view/${invoice.id}`)}
                              >
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {!isLoading && filteredInvoices.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)} of {filteredInvoices.length} entries
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;

                  // Display current page, first, last, and nearby pages
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={currentPage === pageNum}
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // Add ellipsis
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <PaginationEllipsis key={i} />;
                  }

                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete invoice
                #{currentInvoice?.invoiceNumber} and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Status Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Invoice Status</DialogTitle>
              <DialogDescription>
                Change the payment status for invoice #{currentInvoice?.invoiceNumber}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="status">Payment Status</Label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={currentInvoice?.paymentStatus === 'Paid' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('Paid')}
                      className="w-full"
                    >
                      Paid
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={currentInvoice?.paymentStatus === 'Unpaid' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('Unpaid')}
                      className="w-full"
                    >
                      Unpaid
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={currentInvoice?.paymentStatus === 'Pending' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('Pending')}
                      className="w-full"
                    >
                      Pending
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={currentInvoice?.paymentStatus === 'Overdue' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('Overdue')}
                      className="w-full"
                    >
                      Overdue
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Invoices</DialogTitle>
              <DialogDescription>
                Choose which invoices you would like to export.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                onClick={() => handleExport(false)}
                className="w-full"
                variant="outline"
              >
                Export this page only
              </Button>
              <Button
                onClick={() => handleExport(true)}
                className="w-full"
              >
                Export all invoices
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}