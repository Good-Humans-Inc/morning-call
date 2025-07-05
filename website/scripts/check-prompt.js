const admin = require('firebase-admin');
require('dotenv').config({ path: '../.env.local' }); // Correct path from /scripts to root

async function checkPrompt() {
  console.log("Attempting to initialize Firebase...");
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize Firebase:", error.message);
      process.exit(1);
    }
  }

  const db = admin.firestore();
  const characterId = 'love-and-deepspace-rafayel';
  console.log(`Fetching character: ${characterId}`);

  try {
    const charRef = db.collection('characters').document(characterId);
    const doc = await charRef.get();

    if (!doc.exists) {
      console.log('Character not found!');
    } else {
      const description = doc.data().description;
      console.log('\\n--- RAW DESCRIPTION FROM DATABASE ---');
      console.log(description);
      console.log('\\n--- END OF RAW DESCRIPTION ---');
      
      console.log('\\n--- VERIFICATION: DOES IT CONTAIN NEWLINES? ---');
      if (description.includes('\\n')) {
        console.log("✅ Yes, the prompt contains newline characters ('\\n'). Formatting is preserved.");
      } else {
        console.log("❌ No, the prompt does NOT contain newline characters. We need to fix the seed script.");
      }
    }
  } catch (error) {
    console.error('Error fetching character:', error);
  } finally {
    process.exit(0);
  }
}

checkPrompt(); 