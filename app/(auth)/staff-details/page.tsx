"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { db } from "@/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function StaffDetailsPage() {
  const searchParams = useSearchParams();
  const staffId = searchParams.get("id");
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        if (staffId) {
          const staffDoc = await getDoc(doc(db, "staff", staffId));
          if (staffDoc.exists()) {
            setStaff({ id: staffDoc.id, ...staffDoc.data() });
          } else {
            toast.error("Staff not found.");
          }
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error("Error fetching staff details.");
      }
    };
    fetchStaff();
  }, [staffId]);

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p className="text-gray-600">No staff details available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Staff Details</h1>
        <div className="mb-4">
          <span className="font-semibold">Staff ID:</span> {staff.id}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Name:</span> {staff.name}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Role:</span> {staff.role}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Email:</span> {staff.email}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Phone:</span> {staff.phone}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Address:</span> {staff.address}
        </div>
        {staff.profilePic ? (
          <div className="mb-4">
            <Image
              src={staff.profilePic}
              alt="Staff Profile"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
        ) : (
          <div className="mb-4">
            <Image
              src="/images/default-profile.png"
              alt="Default Profile"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
