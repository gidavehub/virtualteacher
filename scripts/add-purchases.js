const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const PROJECT_ID = "davelabs-tools";

// Initialize Firebase Admin using Application Default Credentials
const app = initializeApp({
  projectId: PROJECT_ID,
}, "add_purchases");

const db = getFirestore(app);

const EMAIL = "virtualteacherprojectgm@gmail.com";
const UID = "DeOD9jnsbsgxhOu8tJRNmUB7e5G3";

async function main() {
  console.log(`Starting purchase adding script for ${EMAIL} (UID: ${UID})...`);
  
  try {
    const userRef = db.collection("users").doc(UID);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      console.error(`User document for UID: ${UID} does not exist!`);
      process.exit(1);
    }
    
    const currentCredits = userSnap.data().credits || 0;
    console.log(`Current credits balance: ${currentCredits}`);
    
    // We are adding 5 x $100 packages (12,000 credits each) and 2 x $12 packages (1,000 credits each).
    // Total credits: 5 * 12,000 + 2 * 1,000 = 62,000 credits.
    const creditsToAdd = 62000;
    const newCredits = currentCredits + creditsToAdd;
    
    console.log(`Adding ${creditsToAdd} credits to account (New Balance: ${newCredits})...`);
    
    // 1. Update user balance
    await userRef.set({ credits: FieldValue.increment(creditsToAdd) }, { merge: true });
    console.log(`Updated user document.`);
    
    // 2. Add ledger entries (7 entries)
    const ledgerRef = userRef.collection("ledger");
    const transactionsRef = db.collection("transactions");
    
    const baseDateStr = "2026-07-09";
    
    // 5 x $100 purchases
    for (let i = 0; i < 5; i++) {
      const timestamp = `${baseDateStr}T14:${10 + i * 2}:00.000Z`;
      const invoiceId = `INV-8026-1${i}`;
      
      console.log(`Adding $100 purchase ledger and transaction (${invoiceId})...`);
      
      // Ledger
      await ledgerRef.add({
        delta: 12000,
        reason: `purchase pack-12000`,
        at: timestamp,
      });
      
      // Transaction
      await transactionsRef.doc(invoiceId).set({
        uid: UID,
        invoiceId: invoiceId,
        date: "Jul 9, 2026",
        description: "Credit Top-up — 12,000 Credits",
        method: "ModemPay (Visa *9011)",
        status: "Succeeded",
        amount: "$100.00",
        createdAt: timestamp,
      });
    }
    
    // 2 x $12 purchases
    for (let i = 0; i < 2; i++) {
      const timestamp = `${baseDateStr}T14:${30 + i * 2}:00.000Z`;
      const invoiceId = `INV-8026-2${i}`;
      
      console.log(`Adding $12 purchase ledger and transaction (${invoiceId})...`);
      
      // Ledger
      await ledgerRef.add({
        delta: 1000,
        reason: `purchase pack-1000`,
        at: timestamp,
      });
      
      // Transaction
      await transactionsRef.doc(invoiceId).set({
        uid: UID,
        invoiceId: invoiceId,
        date: "Jul 9, 2026",
        description: "Credit Top-up — 1,000 Credits",
        method: "ModemPay (Visa *9011)",
        status: "Succeeded",
        amount: "$12.00",
        createdAt: timestamp,
      });
    }
    
    console.log("\n[SUCCESS] Successfully added 5 x $100 purchases and 2 x $12 purchases on July 9, 2026.");
    console.log(`Added a total of ${creditsToAdd} credits.`);
    
  } catch (err) {
    console.error(`Error running script: ${err.message}`);
    process.exit(1);
  }
}

main();
