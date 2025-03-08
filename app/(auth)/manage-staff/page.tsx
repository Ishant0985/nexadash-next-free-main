"use client";
import { useState, useEffect } from 'react';
import PageHeading from '@/components/layout/page-heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { db } from '@/firebaseClient';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ManageStaff = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
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

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
      setStaffList(staffList.filter((staff) => staff.id !== id));
      toast.success("Staff deleted successfully!");
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Error deleting staff.");
    }
  };

  const handleEdit = (staff: any) => {
    setSelectedStaff(staff);
    setEditModalOpen(true);
  };

  const handleSave = async () => {
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
      <PageHeading heading={'Manage Staff'} />
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-white">
              <th className="border px-4 py-2">Staff ID</th>
              <th className="border px-4 py-2">Staff Name</th>
              <th className="border px-4 py-2">Staff Role</th>
              <th className="border px-4 py-2">Staff Location</th>
              <th className="border px-4 py-2">Joining Date</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Permission to Login</th>
              <th className="border px-4 py-2">Access Type</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-100">
                <td className="border px-4 py-2">{staff.id}</td>
                <td className="border px-4 py-2">
                  <Link href={`/staff-details?id=${staff.id}`}>
                    {staff.name}
                  </Link>
                </td>
                <td className="border px-4 py-2">{staff.role}</td>
                <td className="border px-4 py-2">{staff.address}</td>
                <td className="border px-4 py-2">{staff.joiningDate || "N/A"}</td>
                <td className="border px-4 py-2">{staff.status}</td>
                <td className="border px-4 py-2">{staff.canLogin ? "Yes" : "No"}</td>
                <td className="border px-4 py-2">{staff.accessType || "N/A"}</td>
                <td className="border px-4 py-2">
                  <Button size="small" variant="outline" onClick={() => handleEdit(staff)}>Edit</Button>
                  <Button size="small" variant="outline" onClick={() => handleDelete(staff.id)} className="ml-2">Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Link href="/staff-details">
          <Button variant="black">View Staff Details</Button>
        </Link>
      </div>
      {editModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4">
            <h2 className="font-bold">Edit Staff Details</h2>
            <Input
              type="text"
              value={selectedStaff.name}
              onChange={(e) =>
                setSelectedStaff({ ...selectedStaff, name: e.target.value })
              }
              placeholder="Name"
            />
            <Input
              type="text"
              value={selectedStaff.role}
              onChange={(e) =>
                setSelectedStaff({ ...selectedStaff, role: e.target.value })
              }
              placeholder="Role"
            />
            <Input
              type="text"
              value={selectedStaff.address}
              onChange={(e) =>
                setSelectedStaff({ ...selectedStaff, address: e.target.value })
              }
              placeholder="Address"
            />
            <Input
              type="text"
              value={selectedStaff.joiningDate}
              onChange={(e) =>
                setSelectedStaff({ ...selectedStaff, joiningDate: e.target.value })
              }
              placeholder="Joining Date"
            />
            <Input
              type="text"
              value={selectedStaff.status}
              onChange={(e) =>
                setSelectedStaff({ ...selectedStaff, status: e.target.value })
              }
              placeholder="Status"
            />
            <Input
              type="text"
              value={selectedStaff.canLogin}
              onChange={(e) =>
                setSelectedStaff({ ...selectedStaff, canLogin: e.target.value })
              }
              placeholder="Permission to Login"
            />
            <Input
              type="text"
              value={selectedStaff.accessType}
              onChange={(e) =>
                setSelectedStaff({ ...selectedStaff, accessType: e.target.value })
              }
              placeholder="Access Type"
            />
            <div className="flex mt-2">
              <Button onClick={handleSave} className="mr-2">
                Save Changes
              </Button>
              <Button onClick={() => setEditModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
