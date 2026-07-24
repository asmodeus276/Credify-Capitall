const admin = require('firebase-admin');

// Ensure the credential environment variable is set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.");
  console.error("Please export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json");
  process.exit(1);
}

// Get UID from command line arguments
const uid = process.argv[2];
if (!uid) {
  console.error("Error: No UID provided.");
  console.error("Usage: node set-admin-claim.js <UID>");
  process.exit(1);
}

// Initialize Firebase Admin (it automatically uses GOOGLE_APPLICATION_CREDENTIALS)
admin.initializeApp();

async function setAdminClaim() {
  try {
    console.log(`Setting admin custom claim for user: ${uid}`);
    
    // Set custom claim
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    // Fetch user to verify and print custom claims
    const userRecord = await admin.auth().getUser(uid);
    console.log("Success! Custom claims for user:");
    console.log(JSON.stringify(userRecord.customClaims, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error setting custom claim:", error);
    process.exit(1);
  }
}

setAdminClaim();
