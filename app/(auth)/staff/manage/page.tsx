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
import { CalendarIcon, ChevronDown, ArrowUpDown, Eye, Trash2, Search, Plus, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import PageHeading from '@/components/layout/page-heading';
import Link from 'next/link';
import Image from 'next/image';

interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  joiningDate: string | number | Date;
  status: string;
  salary: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  profilePic?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ManageStaff() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting
  const [sortField, setSortField] = useState<keyof StaffMember>('joiningDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [staffList, searchTerm, dateRange, statusFilter, sortField, sortDirection]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const staffCollection = collection(db, 'staff');
      const staffSnapshot = await getDocs(query(staffCollection, orderBy('joiningDate', 'desc')));
      
      if (staffSnapshot.empty) {
        setStaffList([]);
        setFilteredStaff([]);
        toast.error('No staff members found');
      } else {
        const list = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StaffMember[];
        setStaffList(list);
        setFilteredStaff(list);
        toast.success(`${list.length} staff members loaded`);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to fetch staff data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...staffList];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(staff => 
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone?.includes(searchTerm) ||
        staff.staffId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(staff => {
        const staffDate = new Date(staff.joiningDate);
        return staffDate >= dateRange.from! && staffDate <= dateRange.to!;
      });
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(staff => 
        staff.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Sorting
    filtered.sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      if (fieldA instanceof Date && fieldB instanceof Date) {
        return sortDirection === 'asc' 
          ? fieldA.getTime() - fieldB.getTime() 
          : fieldB.getTime() - fieldA.getTime();
      }
      
      // Handle date strings
      if (sortField === 'joiningDate' || sortField === 'createdAt' || sortField === 'updatedAt') {
        const dateA = new Date(fieldA as string | number | Date);
        const dateB = new Date(fieldB as string | number | Date);
        return sortDirection === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      }
      
      return 0;
    });
    
    setFilteredStaff(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
      setStaffList(staffList.filter(staff => staff.id !== id));
      setDeleteDialogOpen(false);
      setDeleteStaffId(null);
      toast.success("Staff member deleted successfully");
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff member");
    }
  };

  const handleSort = (field: keyof StaffMember) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStaff(new Set());
    } else {
      const allIds = filteredStaff.map(staff => staff.id);
      setSelectedStaff(new Set(allIds));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectStaff = (id: string) => {
    const newSelected = new Set(selectedStaff);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStaff(newSelected);
    setSelectAll(newSelected.size === filteredStaff.length);
  };

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedStaff).map(id => 
        deleteDoc(doc(db, 'staff', id))
      );
      
      await Promise.all(promises);
      setStaffList(staffList.filter(staff => !selectedStaff.has(staff.id)));
      setSelectedStaff(new Set());
      setSelectAll(false);
      toast.success(`${selectedStaff.size} staff members deleted successfully`);
    } catch (error) {
      console.error("Error bulk deleting staff:", error);
      toast.error("Failed to delete selected staff members");
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      <PageHeading heading="Manage Staff" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search staff..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Filter by date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range) {
                    setDateRange({ 
                      from: range.from, 
                      to: range.to || range.from 
                    });
                  } else {
                    setDateRange({ from: undefined, to: undefined });
                  }
                }}
                numberOfMonths={2}
              />
              <div className="flex items-center justify-between p-3 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                  className="text-xs h-7"
                >
                  Clear
                </Button>
                <Button 
                  variant="default"
                  onClick={() => applyFilters()}
                  className="text-xs h-7"
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto justify-start">
                Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('onleave')}>
                On Leave
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {selectedStaff.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full md:w-auto">
                  Delete Selected ({selectedStaff.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedStaff.size} selected staff members? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Button className="w-full md:w-auto" onClick={() => router.push('/staff/add')}>
            <Plus className="mr-2 h-4 w-4" /> Add Staff
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500 mb-4">No staff members found</p>
              <Button onClick={() => router.push('/staff/add')}>Add Staff</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectAll} 
                        onCheckedChange={toggleSelectAll} 
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-14"></TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 p-0 font-medium"
                        onClick={() => handleSort('staffId')}
                      >
                        ID
                        {sortField === 'staffId' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 p-0 font-medium"
                        onClick={() => handleSort('name')}
                      >
                        Name
                        {sortField === 'name' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 p-0 font-medium"
                        onClick={() => handleSort('role')}
                      >
                        Role
                        {sortField === 'role' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 p-0 font-medium"
                        onClick={() => handleSort('joiningDate')}
                      >
                        Joining Date
                        {sortField === 'joiningDate' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 p-0 font-medium"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {sortField === 'status' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedStaff.has(staff.id)} 
                          onCheckedChange={() => toggleSelectStaff(staff.id)}
                          aria-label={`Select ${staff.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                          {staff.profilePic ? (
                            <Image 
                              src={staff.profilePic} 
                              alt={staff.name} 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full text-gray-500 text-lg font-medium">
                              {staff.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{staff.staffId}</TableCell>
                      <TableCell>{staff.name}</TableCell>
                      <TableCell>{staff.role}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>
                        {staff.joiningDate ? format(new Date(staff.joiningDate), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            staff.status.toLowerCase() === 'active' ? 'success' : 
                            staff.status.toLowerCase() === 'inactive' ? 'danger' : 
                            'outline'
                          }
                        >
                          {staff.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/staff/details?id=${staff.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setDeleteStaffId(staff.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStaff.length)} of {filteredStaff.length} staff
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => paginate(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={indexOfLastItem >= filteredStaff.length}
                    onClick={() => paginate(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteStaffId && handleDelete(deleteStaffId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
