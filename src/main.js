// -----------------------------
// IMPORTS CORREGIDOS
// -----------------------------
import { onAuthReady } from "./authentication.js";
import { db } from "./firebaseConfig.js";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

// -----------------------------
// SHOW DASHBOARD
// -----------------------------
function showDashboard() {
  const nameElement = document.getElementById("name-goes-here");

  onAuthReady(async (user) => {
    if (!user) {
      location.href = "index.html";
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    const userData = userDoc.exists() ? userDoc.data() : {};
    const name = userData.name || user.displayName || user.email;

    if (nameElement) {
      nameElement.textContent = `${name}!`;
    }

    const bookmarks = userData.bookmarks || [];

    // FIX: Pass user.uid, not doc
    await displayCardsDynamically(user.uid, bookmarks);
  });
}

// -----------------------------
// QUOTE OF THE DAY
// -----------------------------
function readQuote(day) {
  const quoteDocRef = doc(db, "quotes", day);

  onSnapshot(
    quoteDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        document.getElementById("quote-goes-here").innerHTML =
          docSnap.data().quote;
      } else {
        console.log("No such document!");
      }
    },
    (error) => {
      console.error("Error listening to document: ", error);
    }
  );
}

// -----------------------------
// SEED HIKES DATA (only if empty)
// -----------------------------
function addHikeData() {
  const hikesRef = collection(db, "hikes");

  console.log("Adding sample hike data...");
  addDoc(hikesRef, {
    code: "BBY01",
    name: "Burnaby Lake Park Trail",
    city: "Burnaby",
    level: "easy",
    details: "A lovely place for a lunch walk.",
    length: 10,
    hike_time: 60,
    lat: 49.2467,
    lng: -122.9187,
    last_updated: serverTimestamp(),
  });

  addDoc(hikesRef, {
    code: "AM01",
    name: "Buntzen Lake Trail",
    city: "Anmore",
    level: "moderate",
    details: "Close to town, and relaxing.",
    length: 10.5,
    hike_time: 80,
    lat: 49.3399,
    lng: -122.859,
    last_updated: serverTimestamp(),
  });

  addDoc(hikesRef, {
    code: "NV01",
    name: "Mount Seymour Trail",
    city: "North Vancouver",
    level: "hard",
    details: "Amazing ski slope views.",
    length: 8.2,
    hike_time: 120,
    lat: 49.3884,
    lng: -122.9409,
    last_updated: serverTimestamp(),
  });
}

async function seedHikes() {
  const hikesRef = collection(db, "hikes");
  const querySnapshot = await getDocs(hikesRef);

  if (querySnapshot.empty) {
    console.log("Hikes collection is empty. Seeding...");
    addHikeData();
  } else {
    console.log("Hikes already exist. Skipping.");
  }
}

// -----------------------------
// DISPLAY CARDS DYNAMICALLY
// -----------------------------
async function displayCardsDynamically(userId, bookmarks) {
  let cardTemplate = document.getElementById("hikeCardTemplate");
  const hikesRef = collection(db, "hikes");

  try {
    const querySnapshot = await getDocs(hikesRef);

    querySnapshot.forEach((docSnap) => {
      const hike = docSnap.data();
      const hikeDocID = docSnap.id;

      let newcard = cardTemplate.content.cloneNode(true);

      newcard.querySelector(".card-title").textContent = hike.name;
      newcard.querySelector(".card-text").textContent =
        hike.details || `Located in ${hike.city}.`;
      newcard.querySelector(".card-length").textContent = hike.length;

      // Image source
      newcard.querySelector(".card-image").src = `./images/${hike.code}.jpg`;

      // FIX: docSnap.id (NOT doc.id)
      newcard.querySelector(
        ".read-more"
      ).href = `eachHike.html?docID=${hikeDocID}`;

      // Bookmark icon
      const icon = newcard.querySelector("i.material-icons");
      icon.id = "save-" + hikeDocID;

      const isBookmarked = bookmarks.includes(hikeDocID);
      icon.innerText = isBookmarked ? "bookmark" : "bookmark_border";

      icon.onclick = () => toggleBookmark(userId, hikeDocID);

      document.getElementById("hikes-go-here").appendChild(newcard);
    });
  } catch (error) {
    console.error("Error getting documents: ", error);
  }
}

// -----------------------------
// TOGGLE BOOKMARK
// -----------------------------
async function toggleBookmark(userId, hikeDocID) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  const userData = userSnap.data() || {};
  const bookmarks = userData.bookmarks || [];

  const icon = document.getElementById("save-" + hikeDocID);
  const isBookmarked = bookmarks.includes(hikeDocID);

  try {
    if (isBookmarked) {
      await updateDoc(userRef, { bookmarks: arrayRemove(hikeDocID) });
      icon.innerText = "bookmark_border";
    } else {
      await updateDoc(userRef, { bookmarks: arrayUnion(hikeDocID) });
      icon.innerText = "bookmark";
    }
  } catch (err) {
    console.error("Error toggling bookmark:", err);
  }
}

// -----------------------------
// EXECUTION
// -----------------------------
seedHikes();
showDashboard();
readQuote("tuesday");
