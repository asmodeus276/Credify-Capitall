// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
// Replace these placeholders with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCKb4PvwUcJSjx_HkJNGKRei8qrAilvTG4",
  authDomain: "credify-capital.firebaseapp.com",
  projectId: "credify-capital",
  storageBucket: "credify-capital.firebasestorage.app",
  messagingSenderId: "170267004901",
  appId: "1:170267004901:web:2353a1b59df1820092290c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

/**
 * Submits a new loan lead to the Firestore 'leads' collection.
 * 
 * @param {Object} leadData - The data of the lead (e.g., name, amount, income, tenure).
 * @returns {Promise<string>} The ID of the newly created document.
 */
export async function submitLoanLead(leadData) {
  try {
    const leadsCollectionRef = collection(db, "leads");

    // Add a new document with a generated id.
    const docRef = await addDoc(leadsCollectionRef, {
      ...leadData,
      createdAt: serverTimestamp()
    });

    console.log("Lead successfully submitted with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting loan lead: ", error);
    throw error;
  }
}

/**
 * Submits a new message to the Firestore 'contactMessages' collection.
 *
 * @param {Object} messageData - The data of the message (e.g., name, email, subject, message).
 * @returns {Promise<string>} The ID of the newly created document.
 */
export async function submitContactMessage(messageData) {
  try {
    const messagesCollectionRef = collection(db, "contactMessages");

    const docRef = await addDoc(messagesCollectionRef, {
      ...messageData,
      createdAt: serverTimestamp()
    });

    console.log("Contact message successfully submitted with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting contact message: ", error);
    throw error;
  }
}

/**
 * Submits a new partner application to the Firestore 'partnerApplications' collection.
 * 
 * @param {Object} partnerData - The data of the partner.
 * @returns {Promise<string>} The ID of the newly created document.
 */
export async function submitPartnerApplication(partnerData) {
  try {
    const partnerCollectionRef = collection(db, "partnerApplications");

    const docRef = await addDoc(partnerCollectionRef, {
      ...partnerData,
      createdAt: serverTimestamp()
    });

    console.log("Partner application successfully submitted with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting partner application: ", error);
    throw error;
  }
}

export { db, auth };