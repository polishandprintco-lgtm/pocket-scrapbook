   import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import "./style.css";

const BACKGROUNDS = [
  { id: "cream", name: "Cream Paper" },
  { id: "pinkPlaid", name: "Pink Plaid" },
  { id: "bluePlaid", name: "Blue Plaid" },
  { id: "lavender", name: "Lavender" },
  { id: "grid", name: "Grid Paper" },
  { id: "dots", name: "Tiny Dots" },
];

const FREE_STICKERS = [
  { name: "heart", value: "♡", cat: "love" },
  { name: "pink heart", value: "♥", cat: "love" },
  { name: "bow", value: "🎀", cat: "love" },
  { name: "flower", value: "✿", cat: "nature" },
  { name: "daisy", value: "🌼", cat: "nature" },
  { name: "leaf", value: "🌿", cat: "nature" },
  { name: "butterfly", value: "🦋", cat: "nature" },
  { name: "bear", value: "🧸", cat: "animals" },
  { name: "bunny", value: "🐰", cat: "animals" },
  { name: "dog", value: "🐶", cat: "animals" },
  { name: "cat", value: "🐱", cat: "animals" },
  { name: "fox", value: "🦊", cat: "animals" },
  { name: "paw", value: "🐾", cat: "animals" },
  { name: "camera", value: "📷", cat: "memories" },
  { name: "film", value: "🎞️", cat: "memories" },
  { name: "note", value: "📝", cat: "school" },
  { name: "books", value: "📚", cat: "school" },
  { name: "plane", value: "✈️", cat: "travel" },
  { name: "world", value: "🌎", cat: "travel" },
  { name: "pin", value: "📍", cat: "travel" },
  { name: "coffee", value: "☕", cat: "cozy" },
  { name: "house", value: "🏠", cat: "cozy" },
  { name: "gift", value: "🎁", cat: "celebrate" },
  { name: "balloons", value: "🎈", cat: "celebrate" },
  { name: "cake", value: "🎂", cat: "celebrate" },
  { name: "star", value: "★", cat: "doodles" },
  { name: "sparkle", value: "✦", cat: "doodles" },
  { name: "moon", value: "☾", cat: "doodles" },
  { name: "cloud", value: "☁", cat: "doodles" },
];

function makeId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function photoEl(x, y, w = 150, h = 150) {
  return { id: makeId(), type: "photo", x, y, w, h, r: 0, src: "", fit: "cover", cropX: 50, cropY: 50 };
}

function textEl(value, x, y, options = {}) {
  return {
    id: makeId(),
    type: "text",
    value,
    x,
    y,
    w: options.w || 200,
    h: options.h || 70,
    r: 0,
    size: options.size || 22,
    color: options.color || "#2f2528",
    font: options.font || "Georgia",
  };
}

function stickerEl(value, x, y) {
  return { id: makeId(), type: "sticker", value, x, y, w: 60, h: 60, r: 0, size: 36 };
}

function makeBook(title, bg = "cream") {
  return {
    id: makeId(),
    title,
    bg,
    pages: [
      {
        id: makeId(),
        bg,
        elements: [
          textEl(title, 95, 45, { size: 28, w: 240 }),
          photoEl(95, 155, 210, 210),
          stickerEl("♡", 285, 390),
        ],
      },
    ],
  };
}

function myFirstTemplate() {
  return {
    id: makeId(),
    title: "My First Scrapbook",
    bg: "cream",
    pages: [
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("About Me ♡", 105, 28, { size: 30, w: 230 }),
          photoEl(45, 115, 155, 155),
          textEl("Some of my favorite\nthings:\nColor:\nFood:\nBook:\nSong:", 230, 120, { size: 13, w: 150, h: 140 }),
          textEl("My name:\nBirthday:\nFavorite color:", 80, 335, { size: 20, w: 250 }),
          stickerEl("✿", 300, 320),
          stickerEl("♡", 318, 405),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Family ♡", 112, 28, { size: 30, w: 230 }),
          photoEl(45, 110, 165, 140),
          textEl("About my family:", 230, 110, { size: 15, w: 145 }),
          textEl("The people I love most:", 92, 275, { size: 16, w: 240 }),
          photoEl(55, 330, 85, 90),
          photoEl(165, 330, 85, 90),
          photoEl(275, 330, 85, 90),
          stickerEl("🌿", 320, 285),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Best Friends ♡", 75, 28, { size: 28, w: 280 }),
          photoEl(55, 130, 130, 155),
          photoEl(230, 130, 130, 155),
          textEl("Name:\nWe met:", 60, 305, { size: 13, w: 120 }),
          textEl("Name:\nWe met:", 235, 305, { size: 13, w: 120 }),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Personality ♡", 78, 28, { size: 28, w: 280 }),
          textEl("I am...", 50, 120, { size: 17, w: 130 }),
          textEl("Words that describe me:\n○\n○\n○\n○", 220, 110, { size: 14, w: 150 }),
          textEl("I’m proud of:", 90, 330, { size: 16, w: 250 }),
        ],
      },
    ],
  };
}

function babyTemplate(girl = true) {
  const bg = girl ? "pinkPlaid" : "bluePlaid";
  const title = girl ? "Baby Girl First Year" : "Baby Boy First Year";
  const label = girl ? "sweet girl ♡" : "sweet boy ♡";

  return {
    id: makeId(),
    title,
    bg,
    premium: true,
    pages: Array.from({ length: 12 }, (_, i) => ({
      id: makeId(),
      bg,
      elements: [
        textEl(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 35, 35, { size: 24, w: 100, h: 85 }),
        photoEl(150, 95, 190, 185),
        textEl(label, 155, 320, { size: 16, w: 170, h: 45 }),
        stickerEl(girl ? "🎀" : "★", 45, 315),
        stickerEl(girl ? "🌸" : "🧸", 300, 290),
        stickerEl("♡", 320, 365),
        stickerEl("🌿", 55, 220),
      ],
    })),
  };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedPage, setSelectedPage] = useState(0);
  const [selectedElement, setSelectedElement] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [newBookName, setNewBookName] = useState("");
  const [newBookBg, setNewBookBg] = useState("cream");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [profileImage, setProfileImage] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [subscription, setSubscription] = useState("Free Plan");

  const [actionBook, setActionBook] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [cuteModal, setCuteModal] = useState(null);

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerSearch, setStickerSearch] = useState("");
  const [showBgPicker, setShowBgPicker] = useState(false);

  const [flipBook, setFlipBook] = useState(null);
  const [flipPage, setFlipPage] = useState(0);

  const dragRef = useRef(null);

  const filteredStickers = useMemo(() => {
    const q = stickerSearch.toLowerCase().trim();
    if (!q) return FREE_STICKERS;
    return FREE_STICKERS.filter((s) => s.name.includes(q) || s.cat.includes(q));
  }, [stickerSearch]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setBooks([]);
        setProfileImage("");
        return;
      }

      const q = query(collection(db, "scrapbooks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const loaded = [];

      snap.forEach((docu) => {
        const data = docu.data();
        if (data.uid === u.uid) loaded.push({ ...data, id: data.id || docu.id, firebaseId: docu.id });
      });

      setBooks(loaded);

      const profileSnap = await getDoc(doc(db, "profiles", u.uid));
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setProfileImage(data.photoURL || "");
        setDarkMode(data.darkMode || false);
        setSubscription(data.subscription || "Free Plan");
      }
    });

    return () => unsub();
  }, []);

  async function signup() {
    if (!email || !password) return;
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function login() {
    if (!email || !password) return;
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logoutUser() {
    await signOut(auth);
    setScreen("home");
  }

  async function saveProfile(changes) {
    if (!user) return;
    await setDoc(doc(db, "profiles", user.uid), changes, { merge: true });
  }

  async function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    await saveProfile({ darkMode: next });
  }

  async function uploadProfilePicture(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const storageRef = ref(storage, `profiles/${user.uid}/profile-${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProfileImage(url);
      await saveProfile({ photoURL: url });
    } catch {
      setCuteModal({
        icon: "⚠️",
        title: "Upload failed",
        text: "Firebase Storage rules are blocking profile photo uploads.",
        button: "Okay",
      });
    }
  }

  async function saveBooks(updatedBooks) {
    if (!user) return;
    setBooks(updatedBooks);

    for (const b of updatedBooks) {
      const clean = { ...b, id: b.id || makeId(), uid: user.uid };
      delete clean.firebaseId;

      if (b.firebaseId) {
        await updateDoc(doc(db, "scrapbooks", b.firebaseId), clean);
      } else {
        const added = await addDoc(collection(db, "scrapbooks"), { ...clean, createdAt: serverTimestamp() });
        b.firebaseId = added.id;
      }
    }
  }

  function openBook(book) {
    setSelectedBook(book);
    setSelectedPage(0);
    setSelectedElement(null);
    setScreen("editor");
  }

  async function createBook() {
    if (!newBookName.trim()) return;
    const book = makeBook(newBookName.trim(), newBookBg);
    const updated = [book, ...books];
    await saveBooks(updated);
    setSelectedBook(updated[0]);
    setSelectedPage(0);
    setShowCreateModal(false);
    setNewBookName("");
    setScreen("editor");
  }

  async function createFromTemplate(templateFn) {
    const book = templateFn();
    const updated = [book, ...books];
    await saveBooks(updated);
    setSelectedBook(updated[0]);
    setSelectedPage(0);
    setScreen("editor");
  }

  async function renameBook(book) {
    const name = prompt("Rename scrapbook:", book.title);
    if (!name?.trim()) return;

    const updated = books.map((b) =>
      (b.firebaseId || b.id) === (book.firebaseId || book.id) ? { ...b, title: name.trim() } : b
    );

    await saveBooks(updated);
    if (selectedBook && (selectedBook.firebaseId || selectedBook.id) === (book.firebaseId || book.id)) {
      setSelectedBook({ ...selectedBook, title: name.trim() });
    }
  }

  async function deleteBook(book) {
    const key = book.firebaseId || book.id;
    if (book.firebaseId) await deleteDoc(doc(db, "scrapbooks", book.firebaseId));
    setBooks(books.filter((b) => (b.firebaseId || b.id) !== key));
    if (selectedBook && (selectedBook.firebaseId || selectedBook.id) === key) {
      setSelectedBook(null);
      setScreen("home");
    }
    setConfirmDelete(null);
    setActionBook(null);
  }

  function selectedPageData() {
    return selectedBook?.pages?.[selectedPage] || null;
  }

  function updateBook(updatedBook) {
    const updated = books.map((b) =>
      (b.firebaseId || b.id) === (updatedBook.firebaseId || updatedBook.id) ? updatedBook : b
    );
    setBooks(updated);
    setSelectedBook(updatedBook);
    saveBooks(updated);
  }

  function updateElement(updatedEl) {
    if (!selectedBook) return;
    const updatedPages = selectedBook.pages.map((p, i) =>
      i === selectedPage ? { ...p, elements: p.elements.map((el) => (el.id === updatedEl.id ? updatedEl : el)) } : p
    );
    updateBook({ ...selectedBook, pages: updatedPages });
    setSelectedElement(updatedEl);
  }

  function addElementToPage(element) {
    if (!selectedBook) return;
    const updatedPages = selectedBook.pages.map((p, i) =>
      i === selectedPage ? { ...p, elements: [...p.elements, element] } : p
    );
    updateBook({ ...selectedBook, pages: updatedPages });
    setSelectedElement(element);
  }

  function deleteSelectedElement() {
    if (!selectedElement || !selectedBook) return;
    const updatedPages = selectedBook.pages.map((p, i) =>
      i === selectedPage ? { ...p, elements: p.elements.filter((el) => el.id !== selectedElement.id) } : p
    );
    updateBook({ ...selectedBook, pages: updatedPages });
    setSelectedElement(null);
  }

  function duplicateSelectedElement() {
    if (!selectedElement) return;
    addElementToPage({ ...selectedElement, id: makeId(), x: selectedElement.x + 20, y: selectedElement.y + 20 });
  }

  function addPage() {
    const updatedBook = {
      ...selectedBook,
      pages: [...selectedBook.pages, { id: makeId(), bg: selectedBook.bg || "cream", elements: [] }],
    };
    updateBook(updatedBook);
    setSelectedPage(updatedBook.pages.length - 1);
  }

  function changePageBackground(bg) {
    const updatedPages = selectedBook.pages.map((p, i) => (i === selectedPage ? { ...p, bg } : p));
    updateBook({ ...selectedBook, pages: updatedPages });
    setShowBgPicker(false);
  }

  async function uploadPhotoToElement(el, file) {
    if (!file || !user) return;

    try {
      const storageRef = ref(storage, `scrapbooks/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      updateElement({ ...el, src: url, fit: "cover", cropX: 50, cropY: 50 });
    } catch {
      setCuteModal({
        icon: "⚠️",
        title: "Photo upload failed",
        text: "Firebase Storage blocked the upload. Check your Storage rules.",
        button: "Okay",
      });
    }
  }

  function pointer(e) {
    return e.touches?.[0] ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
  }

  function startDrag(e, el, mode = "move") {
    e.stopPropagation();
    setSelectedElement(el);
    const p = pointer(e);
    dragRef.current = { mode, startX: p.x, startY: p.y, original: { ...el } };
  }

  function moveDrag(e) {
    if (!dragRef.current) return;

    const p = pointer(e);
    const dx = p.x - dragRef.current.startX;
    const dy = p.y - dragRef.current.startY;
    const original = dragRef.current.original;

    if (dragRef.current.mode === "move") updateElement({ ...original, x: original.x + dx, y: original.y + dy });
    if (dragRef.current.mode === "resize") updateElement({ ...original, w: Math.max(40, original.w + dx), h: Math.max(40, original.h + dy) });
    if (dragRef.current.mode === "rotate") updateElement({ ...original, r: original.r + dx });
  }

  function stopDrag() {
    dragRef.current = null;
  }

  useEffect(() => {
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", moveDrag);
    window.addEventListener("touchend", stopDrag);
    return () => {
      window.removeEventListener("mousemove", moveDrag);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", moveDrag);
      window.removeEventListener("touchend", stopDrag);
    };
  });

  function nudgePhotoCrop(direction) {
    if (!selectedElement || selectedElement.type !== "photo") return;
    const amount = 5;
    if (direction === "left") updateElement({ ...selectedElement, cropX: Math.max(0, (selectedElement.cropX || 50) - amount) });
    if (direction === "right") updateElement({ ...selectedElement, cropX: Math.min(100, (selectedElement.cropX || 50) + amount) });
    if (direction === "up") updateElement({ ...selectedElement, cropY: Math.max(0, (selectedElement.cropY || 50) - amount) });
    if (direction === "down") updateElement({ ...selectedElement, cropY: Math.min(100, (selectedElement.cropY || 50) + amount) });
  }

  function renderElement(el) {
    const isSelected = selectedElement?.id === el.id;

    return (
      <div
        key={el.id}
        className={`scrapElement ${isSelected ? "selected" : ""}`}
        style={{ left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.r || 0}deg)` }}
        onMouseDown={(e) => startDrag(e, el, "move")}
        onTouchStart={(e) => startDrag(e, el, "move")}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(el);
        }}
      >
        {el.type === "photo" && (
          <div className="photoFrame">
            {el.src ? (
              <img src={el.src} alt="" style={{ objectFit: el.fit || "cover", objectPosition: `${el.cropX || 50}% ${el.cropY || 50}%` }} />
            ) : (
              <label className="emptyPhoto">
                + Photo
                <input hidden type="file" accept="image/*" onChange={(e) => uploadPhotoToElement(el, e.target.files[0])} />
              </label>
            )}
          </div>
        )}

        {el.type === "text" && (
          <textarea
            value={el.value}
            onChange={(e) => updateElement({ ...el, value: e.target.value })}
            style={{ fontSize: el.size, color: el.color, fontFamily: el.font }}
          />
        )}

        {el.type === "sticker" && <div className="stickerElement" style={{ fontSize: el.size || 36 }}>{el.value}</div>}

        {isSelected && (
          <>
            <button className="handle rotateHandle" onMouseDown={(e) => startDrag(e, el, "rotate")} onTouchStart={(e) => startDrag(e, el, "rotate")}>↻</button>
            <button className="handle resizeHandle" onMouseDown={(e) => startDrag(e, el, "resize")} onTouchStart={(e) => startDrag(e, el, "resize")}>↘</button>
            <div className="elementBubble">
              <button onClick={duplicateSelectedElement}>Duplicate</button>
              <button onClick={deleteSelectedElement}>Delete</button>
            </div>
          </>
        )}
      </div>
    );
  }

  function TemplatePreview({ type }) {
    if (type === "first") {
      return (
        <div className="templatePreview bg-cream">
          <div className="tinyTitle">About Me ♡</div>
          <div className="tinyPhoto"></div>
          <div className="tinyPaper"></div>
          <div className="tinyFlower">🌿</div>
        </div>
      );
    }

    if (type === "girl") {
      return (
        <div className="templatePreview bg-pinkPlaid">
          <div className="tinyMonth">1<br />month</div>
          <div className="tinyPhoto polaroid"></div>
          <div className="tinyLabel">sweet girl ♡</div>
          <div className="tinySticker">🎀</div>
        </div>
      );
    }

    return (
      <div className="templatePreview bg-bluePlaid">
        <div className="tinyMonth">1<br />month</div>
        <div className="tinyPhoto polaroid"></div>
        <div className="tinyLabel blue">sweet boy ♡</div>
        <div className="tinySticker">⭐</div>
      </div>
    );
  }

  return (
    <div className={`appBg ${darkMode ? "dark" : ""}`}>
      <div className="phoneShell">
        {!user && (
          <div className="authScreen">
            <div className="heroCard">
              <div className="logoTape"></div>
              <h1>pocket<br />scrapbook</h1>
              <p>cherish every moment ♡</p>
              <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="passwordWrap">
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
              <button className="mainBtn" onClick={login}>Login</button>
              <button className="secondaryBtn" onClick={signup}>Create Account</button>
            </div>
          </div>
        )}

        {user && screen === "home" && (
          <div className="homeScreen">
            <div className="heroCard">
              <div className="logoTape"></div>
              <h1>pocket<br />scrapbook</h1>
              <p>cherish every moment ♡</p>
              <button className="mainBtn" onClick={() => setShowCreateModal(true)}>Create Scrapbook</button>
            </div>

            <div className="sectionTitle">My Scrapbooks</div>

            <div className="booksList">
              {books.map((book) => (
                <div key={book.firebaseId || book.id} className="bookCard">
                  <div className={`bookPreview bg-${book.bg}`} onClick={() => openBook(book)}></div>
                  <div className="bookInfo" onClick={() => openBook(book)}>
                    <h3>{book.title}</h3>
                    <p>{book.pages.length} pages</p>
                  </div>
                  <button className="dotsBtn" onClick={() => setActionBook(book)}>⋮</button>
                </div>
              ))}
            </div>

            <div className="bottomNav">
              <button className="active" onClick={() => setScreen("home")}>Home</button>
              <button onClick={() => setScreen("templates")}>Templates</button>
              <button onClick={() => setScreen("premium")}>Premium</button>
              <button onClick={() => setScreen("profile")}>Profile</button>
            </div>
          </div>
        )}

        {user && screen === "templates" && (
          <div className="screen">
            <button className="backBtn" onClick={() => setScreen("home")}>← Back</button>
            <h2>Templates</h2>

            <div className="templateCard" onClick={() => createFromTemplate(myFirstTemplate)}>
              <TemplatePreview type="first" />
              <div><h3>My First Scrapbook</h3><p>Free</p></div>
            </div>

            <div className="templateCard premiumCard" onClick={() => createFromTemplate(() => babyTemplate(true))}>
              <TemplatePreview type="girl" />
              <div><h3>Baby Girl First Year</h3><p>$1.99</p></div>
            </div>

            <div className="templateCard premiumCard" onClick={() => createFromTemplate(() => babyTemplate(false))}>
              <TemplatePreview type="boy" />
              <div><h3>Baby Boy First Year</h3><p>$1.99</p></div>
            </div>
          </div>
        )}

        {user && screen === "premium" && (
          <div className="screen">
            <button className="backBtn" onClick={() => setScreen("home")}>← Back</button>
            <h2>Premium</h2>

            <div className="premiumTable">
              <div className="premiumRow header"><div>Feature</div><div>Free</div><div>Premium</div></div>
              <div className="premiumRow"><div>Photos</div><div>15</div><div>Unlimited</div></div>
              <div className="premiumRow"><div>Fonts</div><div>Basic</div><div>All</div></div>
              <div className="premiumRow"><div>Templates</div><div>Free</div><div>All</div></div>
              <div className="premiumRow"><div>Stickers</div><div>Free pack</div><div>All packs</div></div>
            </div>

            <div className="premiumPrice">
              <h3>Your Subscription</h3>
              <p>{subscription}</p>
              <button className="mainBtn" onClick={() => { setSubscription("Premium Monthly"); saveProfile({ subscription: "Premium Monthly" }); }}>Upgrade $4.99/month</button>
              <button className="secondaryBtn" onClick={() => { setSubscription("Free Plan"); saveProfile({ subscription: "Free Plan" }); }}>Cancel / Free Plan</button>
            </div>
          </div>
        )}

        {user && screen === "profile" && (
          <div className="screen">
            <button className="backBtn" onClick={() => setScreen("home")}>← Back</button>
            <div className="profileCard">
              <label className="profileImageWrap">
                {profileImage ? <img src={profileImage} alt="" className="profileImage" /> : <div className="profilePlaceholder">♡</div>}
                <input hidden type="file" accept="image/*" onChange={uploadProfilePicture} />
              </label>

              <h2>Pocket Scrapbook</h2>

              <button className="settingsBtn" onClick={() => setCuteModal({ icon: "🔔", title: "Notifications", text: "Choose email updates, new templates, promotions, or none. These options will be saved to your account soon.", button: "Got it" })}>Notifications</button>
              <button className="settingsBtn" onClick={() => setCuteModal({ icon: "🔒", title: "Privacy", text: "Pocket Scrapbook does not sell your personal information. Your scrapbook data and photos remain attached to your account.", button: "Okay" })}>Privacy</button>
              <button className="settingsBtn" onClick={() => setScreen("premium")}>Subscription: {subscription}</button>

              <div className="settingsRow">
                <div><strong>Dark Theme</strong><p>Easier on your eyes at night</p></div>
                <button className={`toggle ${darkMode ? "on" : ""}`} onClick={toggleDarkMode}><span></span></button>
              </div>

              <button className="logoutBtn" onClick={logoutUser}>Logout</button>
            </div>
          </div>
        )}

        {user && screen === "editor" && selectedBook && (
          <div className="editorScreen">
            <div className="editorHeader">
              <button onClick={() => setScreen("home")}>←</button>
              <h2>{selectedBook.title}</h2>
              <button onClick={() => setActionBook(selectedBook)}>⋮</button>
            </div>

            <div className="pageNav">
              <button disabled={selectedPage === 0} onClick={() => setSelectedPage(selectedPage - 1)}>‹</button>
              <span>Page {selectedPage + 1}/{selectedBook.pages.length}</span>
              <button disabled={selectedPage === selectedBook.pages.length - 1} onClick={() => setSelectedPage(selectedPage + 1)}>›</button>
            </div>

            <div className={`scrapPage bg-${selectedPageData()?.bg}`} onClick={() => setSelectedElement(null)}>
              {selectedPageData()?.elements.map(renderElement)}
            </div>

            <div className="toolBar">
              <button onClick={() => addElementToPage(photoEl(100, 130, 150, 150))}>Photo</button>
              <button onClick={() => addElementToPage(textEl("tap to edit", 80, 80))}>Text</button>
              <button onClick={() => setShowStickerPicker(true)}>Stickers</button>
              <button onClick={addPage}>Add Page</button>
              <button onClick={() => setShowBgPicker(true)}>Background</button>
            </div>

            {selectedElement?.type === "photo" && (
              <div className="cropControls">
                <button onClick={() => nudgePhotoCrop("left")}>←</button>
                <button onClick={() => nudgePhotoCrop("up")}>↑</button>
                <button onClick={() => nudgePhotoCrop("down")}>↓</button>
                <button onClick={() => nudgePhotoCrop("right")}>→</button>
              </div>
            )}
          </div>
        )}

        {flipBook && (
          <div className="flipbookScreen">
            <button className="backBtn" onClick={() => { setFlipBook(null); setFlipPage(0); }}>← Back</button>
            <h2>{flipBook.title}</h2>
            <div className="bookFlipWrap">
              <button disabled={flipPage === 0} onClick={() => setFlipPage(flipPage - 1)}>‹</button>
              <div className={`flipPage bg-${flipBook.pages[flipPage]?.bg}`}>
                {flipBook.pages[flipPage]?.elements.map((el) => (
                  <div key={el.id} className="flipElement" style={{ left: el.x * 0.75, top: el.y * 0.75, width: el.w * 0.75, height: el.h * 0.75, transform: `rotate(${el.r || 0}deg)` }}>
                    {el.type === "photo" && el.src && <img src={el.src} alt="" />}
                    {el.type === "text" && <span style={{ fontSize: el.size * 0.75, fontFamily: el.font, color: el.color }}>{el.value}</span>}
                    {el.type === "sticker" && <span style={{ fontSize: el.size * 0.75 }}>{el.value}</span>}
                  </div>
                ))}
              </div>
              <button disabled={flipPage === flipBook.pages.length - 1} onClick={() => setFlipPage(flipPage + 1)}>›</button>
            </div>
            <p className="flipCount">Page {flipPage + 1} / {flipBook.pages.length}</p>
          </div>
        )}

        {actionBook && (
          <div className="bottomSheet">
            <h3>{actionBook.title}</h3>
            <button onClick={() => { openBook(actionBook); setActionBook(null); }}>Edit</button>
            <button onClick={() => { setFlipBook(actionBook); setFlipPage(0); setActionBook(null); }}>View Flipbook</button>
            <button onClick={() => { window.print(); setActionBook(null); }}>Export / Print</button>
            <button onClick={() => { renameBook(actionBook); setActionBook(null); }}>Rename</button>
            <button className="danger" onClick={() => { setConfirmDelete(actionBook); setActionBook(null); }}>Delete</button>
            <button onClick={() => setActionBook(null)}>Cancel</button>
          </div>
        )}

        {confirmDelete && (
          <div className="cuteOverlay">
            <div className="cuteModal">
              <div className="modalTape"></div>
              <div className="modalIcon">🗑️</div>
              <h2>Delete scrapbook?</h2>
              <p>Are you sure you want to delete <strong>{confirmDelete.title}</strong>? This cannot be undone.</p>
              <button className="modalBtn dangerBtn" onClick={() => deleteBook(confirmDelete)}>Yes, delete</button>
              <button className="modalBtn lightBtn" onClick={() => setConfirmDelete(null)}>Keep it</button>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="bottomSheet">
            <h3>Create Scrapbook</h3>
            <input placeholder="Scrapbook name" value={newBookName} onChange={(e) => setNewBookName(e.target.value)} />
            <div className="bgPicker">
              {BACKGROUNDS.map((bg) => (
                <button key={bg.id} className={`bgChoice bg-${bg.id}`} onClick={() => setNewBookBg(bg.id)}>
                  <span>{bg.name}</span>
                </button>
              ))}
            </div>
            <button className="mainBtn" onClick={createBook}>Create</button>
            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
          </div>
        )}

        {showBgPicker && (
          <div className="bottomSheet">
            <h3>Change Background</h3>
            <div className="bgPicker">
              {BACKGROUNDS.map((bg) => (
                <button key={bg.id} className={`bgChoice bg-${bg.id}`} onClick={() => changePageBackground(bg.id)}>
                  <span>{bg.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowBgPicker(false)}>Cancel</button>
          </div>
        )}

        {showStickerPicker && (
          <div className="bottomSheet stickerSheet">
            <h3>Choose Sticker</h3>
            <input placeholder="Search stickers..." value={stickerSearch} onChange={(e) => setStickerSearch(e.target.value)} />
            <div className="stickerGrid">
              {filteredStickers.map((s) => (
                <button key={s.name} onClick={() => { addElementToPage(stickerEl(s.value, 150, 180)); setShowStickerPicker(false); setStickerSearch(""); }}>
                  <span>{s.value}</span>
                  <small>{s.name}</small>
                </button>
              ))}
            </div>
            <button onClick={() => setShowStickerPicker(false)}>Cancel</button>
          </div>
        )}

        {cuteModal && (
          <div className="cuteOverlay">
            <div className="cuteModal">
              <div className="modalTape"></div>
              <button className="modalX" onClick={() => setCuteModal(null)}>×</button>
              <div className="modalIcon">{cuteModal.icon}</div>
              <h2>{cuteModal.title}</h2>
              <p>{cuteModal.text}</p>
              <button className="modalBtn" onClick={() => setCuteModal(null)}>{cuteModal.button}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
