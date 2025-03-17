"use client";
import { useState, useEffect } from 'react';
import PageHeading from '@/components/layout/page-heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { CalendarCheck, Plus, Edit, Trash2, Search, ChevronDown, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/firebaseClient';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  usertype: string;
  createdAt: string | number | Date;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  [key: string]: any; // For other potential properties
}

export default function ManageCustomers() {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>();
  const [mainDate, setMainDate] = useState<Date | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Sorting
  const [sortField, setSortField] = useState('customerId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const customerList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
      setCustomers(customerList);
      toast.success("Customers loaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch customers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = [...customers];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        (customer.customerId?.toLowerCase().includes(term)) ||
        (customer.firstName?.toLowerCase().includes(term)) ||
        (customer.lastName?.toLowerCase().includes(term)) ||
        (customer.email?.toLowerCase().includes(term)) ||
        (customer.phone?.includes(term))
      );
    }

    // Apply date filter if both dates are selected
    if (date && mainDate) {
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.createdAt);
        return customerDate >= date && customerDate <= mainDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;

      if (sortField === 'name') {
        valueA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
        valueB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      } else if (sortField === 'createdAt') {
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
      } else {
        valueA = a[sortField] || '';
        valueB = b[sortField] || '';
      }

      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredCustomers(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [customers, searchTerm, date, mainDate, sortField, sortDirection, itemsPerPage]);

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'customers', customerToDelete.id));
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      toast.success("Customer deleted successfully!");
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("Error deleting customer.");
    }
  };

  // Handle pagination
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Get current customers
  const getCurrentCustomers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
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

  const formatDate = (date: string | number | Date) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-4">
      <PageHeading heading={'Manage Customers'} />

      <div className="min-h-[calc(100vh_-_160px)] w-full">
        <Card>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant={'outline'} size="sm">
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PP') : <span>Start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <span className="text-xs font-medium text-gray-700">To</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant={'outline'} size="sm">
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      {mainDate ? format(mainDate, 'PPP') : <span>End date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={mainDate} onSelect={setMainDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Link href="/customer/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </Link>
            </div>
          </div>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('customerId')}
                  >
                    Customer ID
                    {sortField === 'customerId' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {sortField === 'name' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {sortField === 'email' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('phone')}
                  >
                    Phone
                    {sortField === 'phone' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('usertype')}
                  >
                    User Type
                    {sortField === 'usertype' && (
                      <ChevronDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created At
                    {sortField === 'createdAt' && (
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
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : getCurrentCustomers().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  getCurrentCustomers().map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{customer.customerId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                            {(customer.firstName?.charAt(0) || '?').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{`${customer.firstName || ''} ${customer.lastName || ''}`}</p>
                            <p className="text-xs text-gray-500">
                              {customer.city ? `${customer.city}, ${customer.country || ''}` : 'No location info'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {customer.usertype}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(customer.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/customer/details?id=${customer.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(customer)}
                              className="text-red-600 hover:text-red-800 focus:text-red-800"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show 5 pages max, centered around current page
                  let pageNum = currentPage;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // Ensure pageNum is within valid range
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => paginate(pageNum)}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer{' '}
              <span className="font-semibold">{customerToDelete?.firstName} {customerToDelete?.lastName}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
