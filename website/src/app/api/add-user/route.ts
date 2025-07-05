import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      phoneNumber, 
      city, 
      localCallTime, 
      timezone, 
      character, 
      description 
    } = body;

    // Basic validation - all fields are required
    if (!name || !phoneNumber || !city || !localCallTime || !timezone || !character || !description) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Additional validation for non-empty strings after trimming
    if (!name.trim() || !phoneNumber.trim() || !city.trim() || !character.trim() || !description.trim()) {
      return NextResponse.json({ error: 'All fields must contain valid content' }, { status: 400 });
    }

    // TODO: Add robust timezone conversion logic here.
    // For now, we'll just store the local time provided.
    const callTime = localCallTime; // Placeholder

    const userRef = db.collection('users').doc();
    await userRef.set({
      name,
      phoneNumber,
      city,
      localCallTime,
      timezone,
      callTime, // This will be the UTC time
      character,
      characterDescription: description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: userRef.id, message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
