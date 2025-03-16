import React from 'react';
import PageHeader from '@/components/layout/page-heading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const EditInvoicePage = () => {
  return (
    <div>
      <PageHeader heading="Add Stock" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
            <div className='flex justify-center items-center align-middle px-5'>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoicePage;

