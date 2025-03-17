"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/firebaseClient';
import { collection, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, ArrowUpDown, Eye, Trash2, Search, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import PageHeading from '@/components/layout/page-heading';

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  usertype: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ManageCustomers() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Customer>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchTerm, dateRange]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const customersCollection = collection(db, 'customers');
      const customersSnapshot = await getDocs(query(customersCollection, orderBy('createdAt', 'desc')));
      
      if (customersSnapshot.empty) {
        setCustomers([]);
        setFilteredCustomers([]);
        toast.error('No customers found');
      } else {
        const customersList = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Customer));
        
        setCustomers(customersList);
        setFilteredCustomers(customersList);
        toast.success(`${customersList.length} customers loaded`);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.customerId?.toLowerCase().includes(searchLower) ||
        customer.firstName?.toLowerCase().includes(searchLower) ||
        customer.lastName?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply date filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(customer => {
        const createdDate = new Date(customer.createdAt);
        
        if (dateRange.from && dateRange.to) {
          return createdDate >= dateRange.from && createdDate <= dateRange.to;
        } else if (dateRange.from) {
          return createdDate >= dateRange.from;
        } else if (dateRange.to) {
          return createdDate <= dateRange.to;
        }
        
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Special case for customer name (combining first and last name)
      if (sortField === 'firstName') {
        valueA = `${a.firstName} ${a.lastName || ''}`.trim();
        valueB = `${b.firstName} ${b.lastName || ''}`.trim();
      }
      
      if (!valueA) return sortDirection === 'asc' ? -1 : 1;
      if (!valueB) return sortDirection === 'asc' ? 1 : -1;
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Default comparison
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: keyof Customer) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
    
    // Re-apply filters with new sort
    setTimeout(() => {
      applyFilters();
    }, 0);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerId) return;
    
    try {
      await deleteDoc(doc(db, 'customers', deleteCustomerId));
      setCustomers(prevCustomers => 
        prevCustomers.filter(customer => customer.id !== deleteCustomerId)
      );
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleteCustomerId(null);
      setDeleteDialogOpen(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteCustomerId(id);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/customer/details?id=${id}`);
  };

  const handleAddCustomer = () => {
    router.push('/customer/add');
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    
    if (checked) {
      const currentPageCustomers = getCurrentPageItems();
      const idsSet = new Set<string>();
      currentPageCustomers.forEach(customer => idsSet.add(customer.id));
      setSelectedCustomers(idsSet);
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCustomers);
    
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    
    setSelectedCustomers(newSelected);
    
    // Update selectAll based on whether all current page items are selected
    const currentPageIds = getCurrentPageItems().map(customer => customer.id);
    const allSelected = currentPageIds.every(id => newSelected.has(id));
    setSelectAll(allSelected && currentPageIds.length > 0);
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handleBulkDelete = () => {
    // Implementation for bulk delete would go here
    toast.error('Bulk delete not implemented yet');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading heading="Manage Customers" />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search customers..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start whitespace-nowrap">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`
                ) : dateRange.from ? (
                  `From ${format(dateRange.from, 'LLL dd, y')}`
                ) : dateRange.to ? (
                  `Until ${format(dateRange.to, 'LLL dd, y')}`
                ) : (
                  "Date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ 
                  from: range?.from, 
                  to: range?.to 
                })}
                numberOfMonths={2}
              />
              <div className="flex items-center justify-end gap-2 p-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Clear
                </Button>
                <Button size="sm" onClick={() => document.body.click()}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex space-x-2">
          {selectedCustomers.size > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          )}
          
          <Button onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectAll} 
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[180px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('customerId')}
                      className="flex items-center"
                    >
                      Customer ID
                      {sortField === 'customerId' && (
                        <ChevronDown className={`ml-2 h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('firstName')}
                      className="flex items-center"
                    >
                      Name
                      {sortField === 'firstName' && (
                        <ChevronDown className={`ml-2 h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('email')}
                      className="flex items-center"
                    >
                      Email/Phone
                      {sortField === 'email' && (
                        <ChevronDown className={`ml-2 h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('usertype')}
                      className="flex items-center"
                    >
                      Type
                      {sortField === 'usertype' && (
                        <ChevronDown className={`ml-2 h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center"
                    >
                      Created At
                      {sortField === 'createdAt' && (
                        <ChevronDown className={`ml-2 h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ml-2">Loading customers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  getCurrentPageItems().map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="p-4">
                        <Checkbox 
                          checked={selectedCustomers.has(customer.id)}
                          onCheckedChange={(checked) => 
                            handleSelectCustomer(customer.id, checked === true)
                          }
                          aria-label={`Select ${customer.firstName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium" onClick={() => handleViewDetails(customer.id)}>
                        {customer.customerId}
                      </TableCell>
                      <TableCell onClick={() => handleViewDetails(customer.id)}>
                        {`${customer.firstName} ${customer.lastName || ''}`}
                      </TableCell>
                      <TableCell className="hidden md:table-cell" onClick={() => handleViewDetails(customer.id)}>
                        <div className="flex flex-col">
                          {customer.email && (
                            <span className="text-sm truncate max-w-[200px]">{customer.email}</span>
                          )}
                          {customer.phone && (
                            <span className="text-sm text-gray-500">{customer.phone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell" onClick={() => handleViewDetails(customer.id)}>
                        <Badge variant="outline">
                          {customer.usertype.charAt(0).toUpperCase() + customer.usertype.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={() => handleViewDetails(customer.id)}>
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewDetails(customer.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(customer.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {filteredCustomers.length > 0 && (
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {Math.min(itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <select
                  className="h-8 w-16 rounded-md border border-input bg-transparent"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
