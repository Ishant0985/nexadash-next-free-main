"use client";
import { useState } from 'react';
import PageHeading from '@/components/layout/page-heading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StaffPayroll {
    id: string;
    name: string;
    position: string;
    department: string;
    salary: number;
    paymentStatus: 'paid' | 'pending' | 'overdue';
    lastPaymentDate: string;
}

const PayrollManagementPage = () => {
    const [staffPayrolls, setStaffPayrolls] = useState<StaffPayroll[]>([
        { id: '1', name: 'John Doe', position: 'Manager', department: 'Sales', salary: 5000, paymentStatus: 'paid', lastPaymentDate: '2023-06-01' },
        { id: '2', name: 'Jane Smith', position: 'Developer', department: 'IT', salary: 4500, paymentStatus: 'paid', lastPaymentDate: '2023-06-01' },
        { id: '3', name: 'Michael Brown', position: 'Designer', department: 'Marketing', salary: 4000, paymentStatus: 'pending', lastPaymentDate: '2023-05-01' },
        { id: '4', name: 'Emily Johnson', position: 'HR Specialist', department: 'HR', salary: 3800, paymentStatus: 'paid', lastPaymentDate: '2023-06-01' },
        { id: '5', name: 'Robert Wilson', position: 'Accountant', department: 'Finance', salary: 4200, paymentStatus: 'overdue', lastPaymentDate: '2023-04-01' },
        { id: '6', name: 'Sarah Davis', position: 'Sales Representative', department: 'Sales', salary: 3500, paymentStatus: 'pending', lastPaymentDate: '2023-05-01' },
    ]);

    const [newStaff, setNewStaff] = useState<Omit<StaffPayroll, 'id'>>({
        name: '',
        position: '',
        department: '',
        salary: 0,
        paymentStatus: 'pending',
        lastPaymentDate: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewStaff(prev => ({
            ...prev,
            [name]: name === 'salary' ? parseFloat(value) : value,
        }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewStaff(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAddStaff = () => {
        const newId = (staffPayrolls.length + 1).toString();
        setStaffPayrolls(prev => [
            ...prev,
            { ...newStaff, id: newId },
        ]);
        setNewStaff({
            name: '',
            position: '',
            department: '',
            salary: 0,
            paymentStatus: 'pending',
            lastPaymentDate: '',
        });
    };

    const updatePaymentStatus = (id: string, status: 'paid' | 'pending' | 'overdue') => {
        setStaffPayrolls(prev =>
            prev.map(staff =>
                staff.id === id
                    ? {
                          ...staff,
                          paymentStatus: status,
                          lastPaymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : staff.lastPaymentDate,
                      }
                    : staff
            )
        );
    };

    // Calculate total payroll
    const totalPayroll = staffPayrolls.reduce((sum, staff) => sum + staff.salary, 0);
    
    // Calculate paid, pending, and overdue amounts
    const paidAmount = staffPayrolls
        .filter(staff => staff.paymentStatus === 'paid')
        .reduce((sum, staff) => sum + staff.salary, 0);
    
    const pendingAmount = staffPayrolls
        .filter(staff => staff.paymentStatus === 'pending')
        .reduce((sum, staff) => sum + staff.salary, 0);
    
    const overdueAmount = staffPayrolls
        .filter(staff => staff.paymentStatus === 'overdue')
        .reduce((sum, staff) => sum + staff.salary, 0);

    // Data for department breakdown chart
    const departmentData = staffPayrolls.reduce((acc, staff) => {
        const existingDept = acc.find(item => item.department === staff.department);
        if (existingDept) {
            existingDept.totalSalary += staff.salary;
            existingDept.count += 1;
        } else {
            acc.push({
                department: staff.department,
                totalSalary: staff.salary,
                count: 1,
            });
        }
        return acc;
    }, [] as { department: string; totalSalary: number; count: number }[]);

    // Data for payment status chart
    const paymentStatusData = [
        { name: 'Paid', value: paidAmount },
        { name: 'Pending', value: pendingAmount },
        { name: 'Overdue', value: overdueAmount },
    ];

    const COLORS = ['#4ade80', '#facc15', '#f87171'];

    return (
        <div className="space-y-4">
            <PageHeading heading={"Payroll Management"} />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Total Payroll</h3>
                        <p className="text-2xl font-bold">${totalPayroll.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Paid</h3>
                        <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Pending</h3>
                        <p className="text-2xl font-bold text-yellow-500">${pendingAmount.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Overdue</h3>
                        <p className="text-2xl font-bold text-red-600">${overdueAmount.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="staff">
                <TabsList className="mb-4">
                    <TabsTrigger value="staff">Staff Payroll</TabsTrigger>
                    <TabsTrigger value="reports">Payroll Reports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="staff">
                    <Card>
                        <CardContent className="p-4">
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Name</label>
                                    <Input 
                                        type="text" 
                                        name="name" 
                                        value={newStaff.name} 
                                        onChange={handleInputChange} 
                                        placeholder="Staff Name" 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Position</label>
                                    <Input 
                                        type="text" 
                                        name="position" 
                                        value={newStaff.position} 
                                        onChange={handleInputChange} 
                                        placeholder="Position" 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Department</label>
                                    <Input 
                                        type="text" 
                                        name="department" 
                                        value={newStaff.department} 
                                        onChange={handleInputChange} 
                                        placeholder="Department" 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Salary</label>
                                    <Input 
                                        type="number" 
                                        name="salary" 
                                        value={newStaff.salary.toString()} 
                                        onChange={handleInputChange} 
                                        placeholder="Salary" 
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Payment Status</label>
                                    <select 
                                        name="paymentStatus" 
                                        value={newStaff.paymentStatus} 
                                        onChange={handleSelectChange}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Last Payment Date</label>
                                    <Input 
                                        type="date" 
                                        name="lastPaymentDate" 
                                        value={newStaff.lastPaymentDate} 
                                        onChange={handleInputChange} 
                                    />
                                </div>
                            </div>
                            <Button onClick={handleAddStaff} className="mb-4">Add Staff</Button>
                            
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border px-4 py-2">Name</th>
                                        <th className="border px-4 py-2">Position</th>
                                        <th className="border px-4 py-2">Department</th>
                                        <th className="border px-4 py-2">Salary</th>
                                        <th className="border px-4 py-2">Payment Status</th>
                                        <th className="border px-4 py-2">Last Payment Date</th>
                                        <th className="border px-4 py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffPayrolls.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-gray-100">
                                            <td className="border px-4 py-2">{staff.name}</td>
                                            <td className="border px-4 py-2">{staff.position}</td>
                                            <td className="border px-4 py-2">{staff.department}</td>
                                            <td className="border px-4 py-2">${staff.salary.toFixed(2)}</td>
                                            <td className="border px-4 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    staff.paymentStatus === 'paid' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : staff.paymentStatus === 'pending' 
                                                        ? 'bg-yellow-100 text-yellow-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {staff.paymentStatus.charAt(0).toUpperCase() + staff.paymentStatus.slice(1)}
                                                </span>
                                            </td>
                                            <td className="border px-4 py-2">{staff.lastPaymentDate}</td>
                                            <td className="border px-4 py-2">
                                                <div className="flex space-x-2">
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => updatePaymentStatus(staff.id, 'paid')}
                                                        className="text-green-600 border-green-600 hover:bg-green-50 text-xs py-1"
                                                    >
                                                        Mark Paid
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => updatePaymentStatus(staff.id, 'pending')}
                                                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 text-xs py-1"
                                                    >
                                                        Mark Pending
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="reports">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold mb-4">Department Salary Breakdown</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={departmentData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="department" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `$${value}`} />
                                            <Legend />
                                            <Bar dataKey="totalSalary" fill="#8884d8" name="Total Salary" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paymentStatusData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {paymentStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `$${value}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PayrollManagementPage; 