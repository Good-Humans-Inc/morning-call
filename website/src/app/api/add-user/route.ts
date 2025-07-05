import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import parsePhoneNumberFromString from 'libphonenumber-js';

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    // We shouldn't continue if Firebase Admin fails to initialize
  }
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

    // --- Validation ---
    if (!name || !phoneNumber || !city || !localCallTime || !timezone || !character || !description) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Phone number validation
    const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber);
    if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
      return NextResponse.json({ error: 'Invalid phone number. Please include the country code (e.g., +1).' }, { status: 400 });
    }
    const e164PhoneNumber = parsedPhoneNumber.format('E.164');

    // Additional validation for non-empty strings after trimming
    if (!name.trim() || !city.trim() || !character.trim() || !description.trim()) {
      return NextResponse.json({ error: 'All fields must contain valid content' }, { status: 400 });
    }

    // --- Timezone Conversion ---
    let callTime;
    try {
      const [hour, minute] = localCallTime.split(':').map(Number);
      
      // Create a date object in the user's timezone
      // We can't just use new Date() because the server's timezone might be different.
      // We construct a string and parse it to ensure the timezone is respected.
      const nowInUserTz = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
      
      // Set the time from the form
      nowInUserTz.setHours(hour, minute, 0, 0);

      // Format to UTC HH:MM
      const utcHour = nowInUserTz.getUTCHours().toString().padStart(2, '0');
      const utcMinute = nowInUserTz.getUTCMinutes().toString().padStart(2, '0');
      callTime = `${utcHour}:${utcMinute}`;

    } catch (error) {
      console.error("Timezone conversion error:", error);
      return NextResponse.json({ error: 'Invalid time or timezone format.' }, { status: 400 });
    }

    const userRef = db.collection('users').doc();
    await userRef.set({
      name,
      phoneNumber: e164PhoneNumber, // Save the clean E.164 number
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
