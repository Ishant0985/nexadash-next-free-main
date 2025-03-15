// app/finacials/calculate/page.tsx
import { redirect } from 'next/navigation';

export default function FinacialsRedirect() {
  // This will immediately redirect the user to /finacials/calculate/profits
  redirect('/finacials/calculate/profits');
  return null; // This line won't actually render
}
