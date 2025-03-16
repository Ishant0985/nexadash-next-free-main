import InvoiceViewContent from './invoice-view-content';

export default function InvoiceViewPage({ params }: { params: { id: string } }) {
  return <InvoiceViewContent invoiceId={params.id} />;
}