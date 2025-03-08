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

// Define our simple columns configuration for this table.
const customerColumns = [
  {
    header: "ID",
    accessorKey: "id",
  },
  {
    header: "Name",
    accessorKey: "firstName",
    cell: (info: any) => (
      <Link href={`/customer-details?id=${info.row.original.id}`}>
        {info.getValue()}
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
];

export default function ManageCustomers() {
  const [date, setDate] = useState<Date>();
  const [mainDate, setMainDate] = useState<Date>();
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const customerList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomers(customerList);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch customers.");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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
            <Button type="button" variant={'outline'} className="bg-light-theme ring-0">
              All
            </Button>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant={'outline-general'}>
                    <CalendarCheck />
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
                  <Button type="button" variant={'outline-general'}>
                    <CalendarCheck />
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
            <div id="search-table"></div>
            <Select>
              <SelectTrigger className="py-2 text-xs text-black shadow-sm ring-1 ring-gray-300">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <div className="space-y-1.5">
                  <SelectItem className="text-xs/tight" value="Weekly">
                    Weekly
                  </SelectItem>
                  <SelectItem className="text-xs/tight" value="Monthly">
                    Monthly
                  </SelectItem>
                  <SelectItem className="text-xs/tight" value="Yearly">
                    Yearly
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>
            <Link href="/add-customers">
              <Button variant={'black'}>
                <Plus />
                New Customer
              </Button>
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {customerColumns.map((col) => (
                  <th key={col.header} className="border px-4 py-2">{col.header}</th>
                ))}
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-100">
                  {customerColumns.map((col) => (
                    <td key={col.header} className="border px-4 py-2">
                      {col.cell
                        ? col.cell({
                            row: { original: customer, getValue: () => customer[col.accessorKey] },
                          })
                        : customer[col.accessorKey]}
                    </td>
                  ))}
                  <td className="border px-4 py-2">
                    <Button variant="outline" size="small" onClick={() => handleDelete(customer.id)}>
                      Delete
                    </Button>
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
