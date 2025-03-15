// app/customer/page.tsx
import { redirect } from 'next/navigation';

export default function CustomerRedirect() {
  // This will immediately redirect the user to /customer/add
  redirect('/customer/add');
  return null; // This line won't actually render
}
