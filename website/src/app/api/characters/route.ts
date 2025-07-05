import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin (same pattern as add-user route)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function GET() {
  try {
    console.log('Fetching characters...');
    const charactersRef = db.collection('characters');
    
    // Simplified query - just get all characters first
    const snapshot = await charactersRef.get();
    console.log('Found', snapshot.size, 'characters');

    const characters = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((char: any) => char.isActive === true)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    console.log('Returning', characters.length, 'active characters');
    return NextResponse.json(characters);
  } catch (error: any) {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ error: 'Failed to fetch characters', details: error.message }, { status: 500 });
  }
} 