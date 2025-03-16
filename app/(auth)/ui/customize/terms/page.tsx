'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseClient';
import { toast } from "react-hot-toast";
import TiptapEditor from '@/components/TiptapEditor';

type PolicyType = 'terms' | 'privacy' | 'cookies';

interface PolicyDocument {
  id: string;
  type: PolicyType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function TermsCustomization() {
  const [policyType, setPolicyType] = useState<PolicyType>('terms');
  const [content, setContent] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);

  // Fetch existing content
  const fetchContent = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'policies'));
      const policyDoc = snapshot.docs.find(doc => doc.data().type === policyType);
      
      if (policyDoc) {
        setContent(policyDoc.data().content);
        setDocumentId(policyDoc.id);
      } else {
        setContent('');
        setDocumentId(null);
      }
    } catch (error) {
      toast.error("Failed to fetch policy content");
    }
  };

  // Handle policy type change
  const handlePolicyTypeChange = (value: PolicyType) => {
    setPolicyType(value);
    fetchContent();
  };

  // Save policy content
  const handleSave = async () => {
    try {
      if (documentId) {
        await updateDoc(doc(db, 'policies', documentId), {
          type: policyType,
          content: content,
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'policies'), {
          type: policyType,
          content: content,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      toast.success("Policy content saved successfully");
    } catch (error) {
      toast.error("Failed to save policy content");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-none">
        <CardHeader className="p-5">
          <CardTitle>Policy Content Customization</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Policy Type</label>
              <Select value={policyType} onValueChange={handlePolicyTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terms">Terms of Service</SelectItem>
                  <SelectItem value="privacy">Privacy Policy</SelectItem>
                  <SelectItem value="cookies">Cookie Policy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <div className="border rounded-lg">
                <TiptapEditor
                  content={content}
                  onChange={setContent}
                  className="min-h-[400px] p-4"
                />
              </div>
            </div>

            <Button onClick={handleSave}>Save Policy Content</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
