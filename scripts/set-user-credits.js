const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const PROJECT_ID = "davelabs-tools";

const app = initializeApp({
  projectId: PROJECT_ID,
}, "set_credits");

const db = getFirestore(app);

const EMAIL = "virtualteacherprojectgm@gmail.com";
const UID = "DeOD9jnsbsgxhOu8tJRNmUB7e5G3";
const TARGET_CREDITS = 2980;

async function main() {
  console.log(`Setting credit balance for ${EMAIL} (UID: ${UID}) to ${TARGET_CREDITS}...`);
  
  try {
    const userRef = db.collection("users").doc(UID);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      console.error(`User document for UID: ${UID} does not exist!`);
      process.exit(1);
    }
    
    const currentCredits = userSnap.data().credits || 0;
    console.log(`Current credits balance: ${currentCredits}`);
    
    const delta = TARGET_CREDITS - currentCredits;
    console.log(`Delta: ${delta}`);
    
    // Update user document
    await userRef.set({ credits: TARGET_CREDITS }, { merge: true });
    console.log(`Successfully updated credits balance to ${TARGET_CREDITS} in Firestore.`);
    
    // Add ledger entry
    const ledgerRef = userRef.collection("ledger");
    await ledgerRef.add({
      delta: delta,
      reason: `Admin adjustment: set credits to ${TARGET_CREDITS}`,
      at: new Date().toISOString(),
    });
    console.log("Ledger entry added.");
    
  } catch (err) {
    console.error(`Error running script: ${err.message}`);
    process.exit(1);
  }
}

main();
