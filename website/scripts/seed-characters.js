const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// New sort order definition
const charactersToSort = [
  { id: 'love-and-deepspace-xavier',  sortOrder: 1 },
  { id: 'love-and-deepspace-zayne',   sortOrder: 2 },
  { id: 'love-and-deepspace-rafayel', sortOrder: 3 },
  { id: 'love-and-deepspace-sylus',   sortOrder: 4 },
  { id: 'love-and-deepspace-caleb',   sortOrder: 5 },
];

async function updateCharacterSortOrder() {
  try {
    console.log('Starting to update character sort order...');
    
    const batch = db.batch();
    
    charactersToSort.forEach(character => {
      const docRef = db.collection('characters').doc(character.id);
      // Use .update() to only change the specified fields
      batch.update(docRef, { 
        sortOrder: character.sortOrder,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('✅ Successfully updated all character sort orders!');
    
  } catch (error) {
    console.error('❌ Error updating character sort orders:', error);
  } finally {
    process.exit(0);
  }
}

updateCharacterSortOrder();