import InvoiceViewContent from './invoice-view-content';

// Make the component async to match Next.js App Router typing requirements
export default async function InvoiceViewPage({ params }: { params: { id: string } }) {
  return <InvoiceViewContent invoiceId={params.id} />;
}