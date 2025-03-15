// app/payroll/page.tsx
import { redirect } from 'next/navigation';

export default function PayrollRedirect() {
  // This will immediately redirect the user to /payroll/slaries
  redirect('/payroll/slaries');
  return null; // This line won't actually render
}
