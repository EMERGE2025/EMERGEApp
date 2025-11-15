import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// --- Initialize Firebase Admin SDK ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error: any) {
    console.error("Firebase Admin initialization error", error.stack);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export async function POST(request: Request) {
  try {
    // 1. Get and verify the admin's token
    const authorizationHeader = request.headers.get("Authorization");
    if (!authorizationHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authorizationHeader.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(token);
    if (decodedToken.admin !== true) {
      return NextResponse.json(
        { error: "Permission denied. User is not an admin." },
        { status: 403 }
      );
    }

    // 2. Get the Admin's LocationID from their user document
    const adminUid = decodedToken.uid;
    const adminDocRef = db.collection("ADMINISTRATORS").doc(adminUid);
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: "Admin user document not found." },
        { status: 404 }
      );
    }

    const locationID = adminDoc.data()?.locationID;
    if (!locationID) {
      return NextResponse.json(
        { error: "Admin is not assigned a locationID." },
        { status: 400 }
      );
    }

    // 3. Get the new responder's email
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // 4. --- THIS IS THE KEY CHANGE ---
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        return NextResponse.json(
          { error: "Account not found. Please ensure the user has an existing account." },
          { status: 404 }
        );
      }
      throw error; // Re-throw other errors
    }
    
    const uid = userRecord.uid;

    // 5. Set the 'responder' custom claim
    await auth.setCustomUserClaims(uid, { 
      role: "responder",
      locationID: locationID // Stamp the locationID in the token
    });

    // 6. Create the new responder's profile object
    const newResponderProfile = {
      uid: uid,
      email: email,
      role: "responder",
      locationID: locationID,
      name: userRecord.displayName || "New Responder (Pending)", // Use existing name if available
      skills: { hard: [], soft: [] },
      personality: "",
      profilePictureUrl: userRecord.photoURL || "", // Use existing photo if available
    };

    // 7. Get the reference to the location-specific 'responders' document
    const locationRespondersDocRef = db
      .collection(locationID)
      .doc("responders");

    // 8. Atomically add the new profile to the 'responderList' array
    // arrayUnion will automatically prevent duplicates
    await locationRespondersDocRef.set(
      {
        responderList: admin.firestore.FieldValue.arrayUnion(newResponderProfile),
      },
      { merge: true } // Use merge:true to create or update the document
    );

    return NextResponse.json({
      status: "success",
      message: `Successfully promoted ${email} to responder for location ${locationID}.`,
    });
  } catch (error: any) {
    console.error("Error in registerResponder API:", error);
    return NextResponse.json(
      { error: error.message || "An internal server error occurred." },
      { status: 500 }
    );
  }
}