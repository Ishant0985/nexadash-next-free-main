 "use client";
import { useState, useEffect } from 'react';
import PageHeading from '@/components/layout/page-heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/firebaseClient';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  usertype: string;
  createdAt: string | number | Date;
  [key: string]: any; // For other potential properties
}

interface CustomerColumnProps {
  row: {
    original: Customer;
  };
  getValue: () => any;
}

// Update columns configuration for the table
const customerColumns = [
  {
    header: "Customer ID",
    accessorKey: "customerId",
  },
  {
    header: "Name",
    accessorKey: "firstName",
    cell: (info: CustomerColumnProps) => (
      <Link href={`/customer-details?id=${info.row.original.id}`} className="text-blue-600 hover:underline">
        {`${info.row.original.firstName} ${info.row.original.lastName || ''}`}
      </Link>
    ),
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Phone",
    accessorKey: "phone",
  },
  {
    header: "User Type",
    accessorKey: "usertype",
  },
  {
    header: "Created At",
    accessorKey: "createdAt",
    cell: (info: CustomerColumnProps) => {
      const date = info.getValue() ? new Date(info.getValue()) : null;
      return date ? format(date, 'PP') : '';
    }
  }
];

export default function ManageCustomers() {
  const [date, setDate] = useState<Date | undefined>();
  const [mainDate, setMainDate] = useState<Date | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const customerList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
      setCustomers(customerList);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch customers.");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = [...customers];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    // Apply date filter if both dates are selected
    if (date && mainDate) {
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.createdAt);
        return customerDate >= date && customerDate <= mainDate;
      });
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, date, mainDate]);

  const handleDelete = async (customerId: string) => {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      setCustomers(customers.filter((c) => c.id !== customerId));
      toast.success("Customer deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error deleting customer.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeading heading={'Manage Customers'} />
      <div className="min-h-[calc(100vh_-_160px)] w-full">
        <div className="flex items-center justify-between gap-4 overflow-x-auto rounded-t-lg bg-white px-5 py-[17px]">
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant={'outline'}>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PP') : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="!w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
              <span className="text-xs font-medium text-gray-700">To</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant={'outline'}>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    {mainDate ? format(mainDate, 'PPP') : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="!w-auto p-0">
                  <Calendar mode="single" selected={mainDate} onSelect={setMainDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/add-customers">
              <Button variant={'outline'}>
                <Plus className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {customerColumns.map((col) => (
                  <th key={col.header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  {customerColumns.map((col) => (
                    <td key={col.header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {col.cell
                        ? col.cell({
                            row: { original: customer },
                            getValue: () => customer[col.accessorKey]
                          })
                        : customer[col.accessorKey]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <Link href={`/customer-details?id=${customer.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this customer?')) {
                            handleDelete(customer.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
