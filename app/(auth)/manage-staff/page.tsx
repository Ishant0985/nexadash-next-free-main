"use client";
import { useState, useEffect } from 'react';
import PageHeading from '@/components/layout/page-heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/firebaseClient';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const staffColumns = [
  { header: "Staff ID", accessorKey: "staffId" },
  { header: "Name", accessorKey: "name" },
  { header: "Role", accessorKey: "role" },
  { header: "Location", accessorKey: "address" },
  { header: "Email", accessorKey: "email" },
  { header: "Phone", accessorKey: "phone" },
  { header: "Joining Date", 
    accessorKey: "joiningDate",
    cell: (info: any) => {
      const date = info.getValue() ? new Date(info.getValue()) : null;
      return date ? format(date, 'PP') : 'N/A';
    }
  },
  { header: "Status", accessorKey: "status" }
];

const ManageStaff = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [date, setDate] = useState<Date>();
  const [mainDate, setMainDate] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const fetchStaff = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'staff'));
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStaffList(list);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch staff data.");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    let filtered = [...staffList];
    
    if (searchTerm) {
      filtered = filtered.filter(staff => 
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone?.includes(searchTerm) ||
        staff.staffId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (date && mainDate) {
      filtered = filtered.filter(staff => {
        const staffDate = new Date(staff.joiningDate);
        return staffDate >= date && staffDate <= mainDate;
      });
    }

    setFilteredStaff(filtered);
  }, [staffList, searchTerm, date, mainDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      await deleteDoc(doc(db, 'staff', id));
      setStaffList(staffList.filter((staff) => staff.id !== id));
      toast.success("Staff deleted successfully!");
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Error deleting staff.");
    }
  };

  const handleEdit = async () => {
    try {
      await updateDoc(doc(db, 'staff', selectedStaff.id), selectedStaff);
      toast.success("Staff updated successfully!");
      fetchStaff();
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Error updating staff.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeading heading={'Manage Staff'} />
        <Link href="/add-staff">
          <Button variant={'black'}>
            <Plus className="mr-2 h-4 w-4" />
            New Staff
          </Button>
        </Link>
      </div>

      <div className="min-h-[calc(100vh_-_160px)] w-full">
        <div className="flex items-center justify-between gap-4 overflow-x-auto rounded-t-lg bg-white px-5 py-[17px]">
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant={'outline-general'}>
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
                  <Button type="button" variant={'outline-general'}>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    {mainDate ? format(mainDate, 'PP') : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="!w-auto p-0">
                  <Calendar mode="single" selected={mainDate} onSelect={setMainDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {staffColumns.map((col) => (
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
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  {staffColumns.map((col) => (
                    <td key={col.header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {col.cell
                        ? col.cell({ getValue: () => staff[col.accessorKey] })
                        : staff[col.accessorKey]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <Link href={`/staff-details?id=${staff.id}`}>
                        <Button variant="outline" size="small">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setEditModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleDelete(staff.id)}
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

      {editModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Staff Details</h2>
            <div className="space-y-4">
              <Input
                type="text"
                value={selectedStaff.name}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, name: e.target.value })}
                placeholder="Name"
              />
              <Input
                type="text"
                value={selectedStaff.role}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, role: e.target.value })}
                placeholder="Role"
              />
              <Input
                type="text"
                value={selectedStaff.address}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, address: e.target.value })}
                placeholder="Address"
              />
              <Input
                type="email"
                value={selectedStaff.email}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                placeholder="Email"
              />
              <Input
                type="tel"
                value={selectedStaff.phone}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                placeholder="Phone"
              />
              <Input
                type="text"
                value={selectedStaff.status}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, status: e.target.value })}
                placeholder="Status"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
