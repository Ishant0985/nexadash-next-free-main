// app/finacials/reports/page.tsx
import { redirect } from 'next/navigation';

export default function FinacialsRedirect() {
  // This will immediately redirect the user to /finacials/reports/visuals
  redirect('/finacials/reports/visuals');
  return null; // This line won't actually render
}
