// app/payroll/payments/page.tsx
import { redirect } from 'next/navigation';

export default function StaffRedirect() {
  // This will immediately redirect the user to /staff/add
  redirect('/payroll/payments/status');
  return null; // This line won't actually render
}
