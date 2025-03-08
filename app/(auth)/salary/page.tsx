"use client";
import { useState } from 'react';
import PageHeading from '@/components/layout/page-heading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StaffSalary {
    id: string;
    name: string;
    salary: number;
    salaryPaid: boolean;
}

const SalaryPage = () => {
    const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>([
        { id: '1', name: 'John Doe', salary: 5000, salaryPaid: false },
        { id: '2', name: 'Jane Smith', salary: 4000, salaryPaid: true },
        // ...existing data...
    ]);

    const handleSalaryUpdate = (id: string, newSalary: number) => {
        setStaffSalaries(prev =>
            prev.map(staff =>
                staff.id === id ? { ...staff, salary: newSalary } : staff
            )
        );
    };

    const toggleSalaryStatus = (id: string) => {
        setStaffSalaries(prev =>
            prev.map(staff =>
                staff.id === id ? { ...staff, salaryPaid: !staff.salaryPaid } : staff
            )
        );
    };

    return (
        <div className="space-y-4">
            <PageHeading heading={"Staff Salary Management"} />
            <Card className="w-full">
                <CardContent>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="border px-4 py-2">ID</th>
                                <th className="border px-4 py-2">Name</th>
                                <th className="border px-4 py-2">Salary</th>
                                <th className="border px-4 py-2">Salary Paid</th>
                                <th className="border px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffSalaries.map((staff) => (
                                <tr key={staff.id} className="hover:bg-gray-100">
                                    <td className="border px-4 py-2">{staff.id}</td>
                                    <td className="border px-4 py-2">{staff.name}</td>
                                    <td className="border px-4 py-2">
                                        <Input
                                            type="number"
                                            value={staff.salary.toString()}
                                            onChange={(e) =>
                                                handleSalaryUpdate(
                                                    staff.id,
                                                    parseInt(e.target.value)
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="border px-4 py-2">
                                        {staff.salaryPaid ? "Paid" : "Unpaid"}
                                    </td>
                                    <td className="border px-4 py-2">
                                        <Button variant="outline" size="small" onClick={() => toggleSalaryStatus(staff.id)}>
                                            Toggle Payment
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};

export default SalaryPage;
