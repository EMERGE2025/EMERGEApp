"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import {
  User,
  Camera,
  FloppyDisk,
  ArrowLeft,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

type AdminProfile = {
  uid: string;
  name: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  department?: string;
};

const compressAndConvertToBase64 = (
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const adminDocRef = doc(db, "ADMINISTRATORS", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists()) {
          const data = adminDoc.data();
          const profileData: AdminProfile = {
            uid: user.uid,
            name: data.name || user.displayName || "",
            email: data.email || user.email || "",
            role: data.role || "admin",
            profilePictureUrl: data.profilePictureUrl || user.photoURL || "",
            phoneNumber: data.phoneNumber || "",
            department: data.department || "",
          };

          setProfile(profileData);
          setEditedProfile(profileData);
        } else {
          const newProfile: AdminProfile = {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            role: "admin",
            profilePictureUrl: user.photoURL || "",
            phoneNumber: "",
            department: "",
          };

          await setDoc(adminDocRef, newProfile);
          setProfile(newProfile);
          setEditedProfile(newProfile);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin profile:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);

    try {
      const base64Image = await compressAndConvertToBase64(file, 400, 400, 0.8);

      setEditedProfile({
        ...editedProfile!,
        profilePictureUrl: base64Image,
      });

      setUploading(false);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try again.");
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile || !profile) return;

    setSaving(true);

    try {
      const adminDocRef = doc(db, "ADMINISTRATORS", profile.uid);

      await updateDoc(adminDocRef, {
        name: editedProfile.name,
        profilePictureUrl: editedProfile.profilePictureUrl,
        phoneNumber: editedProfile.phoneNumber,
        department: editedProfile.department,
      });

      // Update only displayName in Firebase Auth (not photoURL since it's too long for base64)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: editedProfile.name,
        });
      }

      setProfile(editedProfile);
      alert("Profile updated successfully!");
      setSaving(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <CircleNotch size={48} className="animate-spin text-red-600" />
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center bg-white text-red-600 rounded-full w-10 h-10 shadow border border-gray-200 hover:bg-red-50"
          >
            <ArrowLeft size={20} weight="bold" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Admin Profile
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              {editedProfile.profilePictureUrl ? (
                <img
                  src={editedProfile.profilePictureUrl}
                  alt={editedProfile.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-200">
                  <User size={64} className="text-gray-500" />
                </div>
              )}

              <label className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-2 cursor-pointer hover:bg-red-700 shadow-lg">
                {uploading ? (
                  <CircleNotch size={20} className="animate-spin" />
                ) : (
                  <Camera size={20} weight="bold" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Click camera to upload new photo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={editedProfile.name}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={editedProfile.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={editedProfile.phoneNumber || ""}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  phoneNumber: e.target.value,
                })
              }
              placeholder="e.g., +63 912 345 6789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              type="text"
              value={editedProfile.department || ""}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  department: e.target.value,
                })
              }
              placeholder="e.g., Emergency Response Team, DRRMO"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 font-semibold"
            >
              {saving ? (
                <>
                  <CircleNotch size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FloppyDisk size={20} weight="bold" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
