const project = "virtual-teacher-project-501606";

async function inspect() {
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:listCollectionIds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log("Root collection IDs:", data);
  } catch (err) {
    console.error("Error listing collection IDs:", err);
  }
}

inspect();
