'use client';

import { useParams } from 'next/navigation';
import InvoiceViewContent from './invoice-view-content';

export default function InvoiceViewPage() {
  const params = useParams();
  const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  
  return <InvoiceViewContent invoiceId={invoiceId} />;
}