// app/invoice/page.tsx
import { redirect } from 'next/navigation';

export default function InvoiceRedirect() {
  // This will immediately redirect the user to /staff/add
  redirect('/invoice/create');
  return null; // This line won't actually render
}
