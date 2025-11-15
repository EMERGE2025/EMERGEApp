"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  User,
  Camera,
  FloppyDisk,
  ArrowLeft,
  CircleNotch,
  Plus,
  X,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

type ResponderProfile = {
  uid: string;
  name: string;
  email: string;
  role: string;
  locationID: string;
  profilePictureUrl?: string;
  personality?: string;
  skills?: {
    hard: string[];
    soft: string[];
  };
};

// Utility function to compress and convert image to base64
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
        // Create canvas
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
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

        // Draw and compress
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function ResponderProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ResponderProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<ResponderProfile | null>(
    null
  );
  const [newHardSkill, setNewHardSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");

  // Fetch user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      console.log("🔍 Fetching profile for user:", user.uid);

      try {
        // Hardcoded locationID for now - you can make this dynamic later
        const locationID = "PH063043000";

        console.log(`📡 Fetching from ${locationID}/responders`);

        // Fetch from the responders document
        const respondersDocRef = doc(db, locationID, "responders");
        const respondersDoc = await getDoc(respondersDocRef);

        if (!respondersDoc.exists()) {
          console.error(`⚠️ Document not found: ${locationID}/responders`);
          setLoading(false);
          return;
        }

        const data = respondersDoc.data();
        console.log("📦 Responders document data:", data);

        const responderList = data?.responderList || [];
        console.log(`👥 Found ${responderList.length} responders in list`);

        // Find the current user in the list
        const currentResponder = responderList.find(
          (r: any) => r.uid === user.uid
        );

        console.log("🔍 Looking for UID:", user.uid);
        console.log("✅ Found responder:", currentResponder);

        if (currentResponder) {
          const profileData: ResponderProfile = {
            uid: currentResponder.uid,
            name: currentResponder.name,
            email: currentResponder.email,
            role: currentResponder.role,
            locationID: currentResponder.locationID || locationID,
            profilePictureUrl: currentResponder.profilePictureUrl,
            personality: currentResponder.personality || "",
            skills: currentResponder.skills || { hard: [], soft: [] },
          };

          console.log("✅ Profile loaded successfully:", profileData);
          setProfile(profileData);
          setEditedProfile(profileData);
        } else {
          console.error("❌ Current user not found in responderList");
          console.log("Available UIDs:", responderList.map((r: any) => r.uid));
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching profile:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Handle profile picture upload and convert to base64
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Validate file size (limit to 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);

    try {
      // Compress and convert to base64
      const base64Image = await compressAndConvertToBase64(file, 400, 400, 0.8);

      console.log(
        `Original size: ${(file.size / 1024).toFixed(2)}KB, Compressed size: ${(
          base64Image.length / 1024
        ).toFixed(2)}KB`
      );

      // Update local state with base64 string
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

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!editedProfile || !profile) return;

    setSaving(true);

    try {
      const respondersDocRef = doc(db, profile.locationID, "responders");
      const respondersDoc = await getDoc(respondersDocRef);

      if (respondersDoc.exists()) {
        const data = respondersDoc.data();
        const responderList = data?.responderList || [];

        // Update the responder in the list
        const updatedList = responderList.map((r: any) =>
          r.uid === profile.uid
            ? {
                ...r,
                name: editedProfile.name,
                profilePictureUrl: editedProfile.profilePictureUrl,
                personality: editedProfile.personality,
                skills: editedProfile.skills,
              }
            : r
        );

        // Save back to Firestore
        await updateDoc(respondersDocRef, {
          responderList: updatedList,
        });

        setProfile(editedProfile);
        alert("Profile updated successfully!");
      }

      setSaving(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  // Add skill handlers
  const handleAddHardSkill = () => {
    if (!newHardSkill.trim() || !editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      skills: {
        ...editedProfile.skills!,
        hard: [...(editedProfile.skills?.hard || []), newHardSkill.trim()],
      },
    });
    setNewHardSkill("");
  };

  const handleAddSoftSkill = () => {
    if (!newSoftSkill.trim() || !editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      skills: {
        ...editedProfile.skills!,
        soft: [...(editedProfile.skills?.soft || []), newSoftSkill.trim()],
      },
    });
    setNewSoftSkill("");
  };

  const handleRemoveHardSkill = (index: number) => {
    if (!editedProfile) return;
    const newHard = [...(editedProfile.skills?.hard || [])];
    newHard.splice(index, 1);
    setEditedProfile({
      ...editedProfile,
      skills: {
        ...editedProfile.skills!,
        hard: newHard,
      },
    });
  };

  const handleRemoveSoftSkill = (index: number) => {
    if (!editedProfile) return;
    const newSoft = [...(editedProfile.skills?.soft || [])];
    newSoft.splice(index, 1);
    setEditedProfile({
      ...editedProfile,
      skills: {
        ...editedProfile.skills!,
        soft: newSoft,
      },
    });
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
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-white text-red-600 rounded-full w-10 h-10 shadow border border-gray-200 hover:bg-red-50"
          >
            <ArrowLeft size={20} weight="bold" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Profile Picture Section */}
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

              {/* Upload button */}
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

          {/* Name Section */}
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

          {/* Email (Read-only) */}
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

          {/* Personality Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personality
            </label>
            <textarea
              value={editedProfile.personality || ""}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  personality: e.target.value,
                })
              }
              rows={4}
              placeholder="Describe your personality, work style, strengths..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Hard Skills Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hard Skills
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newHardSkill}
                onChange={(e) => setNewHardSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddHardSkill()}
                placeholder="e.g., First Aid, CPR, Fire Fighting"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleAddHardSkill}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Plus size={20} weight="bold" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedProfile.skills?.hard?.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveHardSkill(index)}
                    className="hover:bg-red-200 rounded-full p-0.5"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Soft Skills Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soft Skills
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSoftSkill()}
                placeholder="e.g., Leadership, Communication, Teamwork"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleAddSoftSkill}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Plus size={20} weight="bold" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedProfile.skills?.soft?.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSoftSkill(index)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Save Button */}
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
