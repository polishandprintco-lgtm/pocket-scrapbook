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
  { id: "cream", name: "Cream" },
  { id: "pinkPlaid", name: "Pink Plaid" },
  { id: "bluePlaid", name: "Blue Plaid" },
  { id: "lavender", name: "Lavender" },
  { id: "grid", name: "Grid" },
  { id: "dots", name: "Dots" },
];

const STICKERS = [
  "♡", "♥", "🎀", "✿", "🌸", "🌼", "🌿", "🦋",
  "🧸", "🐰", "🐶", "🐱", "🦊", "🐾",
  "📷", "🎞️", "📝", "📚", "✈️", "🌎", "📍",
  "☕", "🏠", "🎁", "🎈", "🎂", "★", "✦", "☾", "☁"
];

function makeId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function photoEl(x, y, w = 160, h = 160) {
  return { id: makeId(), type: "photo", x, y, w, h, r: 0, src: "", cropX: 50, cropY: 50 };
}

function textEl(value, x, y, size = 22) {
  return { id: makeId(), type: "text", value, x, y, w: 210, h: 80, r: 0, size, color: "#2f2528", font: "Georgia" };
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
          textEl(title, 90, 40, 28),
          photoEl(95, 150, 210, 210),
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
          textEl("About Me ♡", 105, 28, 30),
          photoEl(45, 115, 155, 155),
          textEl("Some of my favorite\nthings:\nColor:\nFood:\nBook:\nSong:", 230, 120, 13),
          textEl("My name:\nBirthday:\nFavorite color:", 80, 335, 20),
          stickerEl("✿", 300, 320),
          stickerEl("♡", 318, 405),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Family ♡", 112, 28, 30),
          photoEl(45, 110, 165, 140),
          textEl("About my family:", 230, 110, 15),
          textEl("The people I love most:", 92, 275, 16),
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
          textEl("My Best Friends ♡", 75, 28, 28),
          photoEl(55, 130, 130, 155),
          photoEl(230, 130, 130, 155),
          textEl("Name:\nWe met:", 60, 305, 13),
          textEl("Name:\nWe met:", 235, 305, 13),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Personality ♡", 78, 28, 28),
          textEl("I am...", 50, 120, 17),
          textEl("Words that describe me:\n○\n○\n○\n○", 220, 110, 14),
          textEl("I’m proud of:", 90, 330, 16),
        ],
      },
    ],
  };
}

function babyTemplate(girl = true) {
  const bg = girl ? "pinkPlaid" : "bluePlaid";
  const title = girl ? "Baby Girl First Year" : "Baby Boy First Year";
  return {
    id: makeId(),
    title,
    bg,
    premium: true,
    pages: Array.from({ length: 12 }, (_, i) => ({
      id: makeId(),
      bg,
      elements: [
        textEl(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 35, 35, 24),
        photoEl(150, 95, 190, 185),
        textEl(girl ? "sweet girl ♡" : "sweet boy ♡", 155, 320, 16),
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

  const [profileImage, setProfileImage] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [subscription, setSubscription] = useState("Free Plan");

  const [modal, setModal] = useState(null);
  const [actionBook, setActionBook] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [stickerSearch, setStickerSearch] = useState("");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [flipBook, setFlipBook] = useState(null);
  const [flipPage, setFlipPage] = useState(0);

  const dragRef = useRef(null);

  const filteredStickers = useMemo(() => {
    const s = stickerSearch.trim().toLowerCase();
    if (!s) return STICKERS;
    return STICKERS.filter((x) => x.toLowerCase().includes(s));
  }, [stickerSearch]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) return setBooks([]);

      const snap = await getDocs(query(collection(db, "scrapbooks"), orderBy("createdAt", "desc")));
      const loaded = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.uid === u.uid) loaded.push({ ...data, id: data.id || d.id, firebaseId: d.id });
      });
      setBooks(loaded);

      const p = await getDoc(doc(db, "profiles", u.uid));
      if (p.exists()) {
        const data = p.data();
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

  async function saveProfile(data) {
    if (!user) return;
    await setDoc(doc(db, "profiles", user.uid), data, { merge: true });
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
      const fileRef = ref(storage, `profiles/${user.uid}/profile-${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setProfileImage(url);
      await saveProfile({ photoURL: url });
    } catch {
      setModal({
        icon: "⚠️",
        title: "Upload failed",
        text: "Firebase Storage rules are blocking this upload.",
        button: "Okay",
      });
    }
  }

  async function saveBooks(updated) {
    if (!user) return;
    setBooks(updated);

    for (const b of updated) {
      const clean = { ...b, id: b.id || makeId(), uid: user.uid };
      delete clean.firebaseId;

      if (b.firebaseId) {
        await updateDoc(doc(db, "scrapbooks", b.firebaseId), clean);
      } else {
        const added = await addDoc(collection(db, "scrapbooks"), {
          ...clean,
          createdAt: serverTimestamp(),
        });
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
    openBook(updated[0]);
    setNewBookName("");
    setShowCreate(false);
  }

  async function createFromTemplate(templateFn) {
    const book = templateFn();
    const updated = [book, ...books];
    await saveBooks(updated);
    openBook(updated[0]);
  }

  async function renameBook(book) {
    const name = prompt("Rename scrapbook:", book.title);
    if (!name?.trim()) return;

    const updated = books.map((b) =>
      (b.firebaseId || b.id) === (book.firebaseId || book.id)
        ? { ...b, title: name.trim() }
        : b
    );

    await saveBooks(updated);
    setBooks(updated);
    if (selectedBook && (selectedBook.firebaseId || selectedBook.id) === (book.firebaseId || book.id)) {
      setSelectedBook({ ...selectedBook, title: name.trim() });
    }
  }

  async function deleteBook(book) {
    const key = book.firebaseId || book.id;
    if (book.firebaseId) await deleteDoc(doc(db, "scrapbooks", book.firebaseId));
    setBooks(books.filter((b) => (b.firebaseId || b.id) !== key));
    setConfirmDelete(null);
    setActionBook(null);
    if (selectedBook && (selectedBook.firebaseId || selectedBook.id) === key) {
      setSelectedBook(null);
      setScreen("home");
    }
  }

  function page() {
    return selectedBook?.pages?.[selectedPage];
  }

  function updateBook(book) {
    const updated = books.map((b) =>
      (b.firebaseId || b.id) === (book.firebaseId || book.id) ? book : b
    );
    setBooks(updated);
    setSelectedBook(book);
    saveBooks(updated);
  }

  function updateElement(el) {
    const updatedPages = selectedBook.pages.map((p, i) =>
      i === selectedPage
        ? { ...p, elements: p.elements.map((x) => (x.id === el.id ? el : x)) }
        : p
    );
    const updatedBook = { ...selectedBook, pages: updatedPages };
    updateBook(updatedBook);
    setSelectedElement(el);
  }

  function addElement(el) {
    const updatedPages = selectedBook.pages.map((p, i) =>
      i === selectedPage ? { ...p, elements: [...p.elements, el] } : p
    );
    updateBook({ ...selectedBook, pages: updatedPages });
    setSelectedElement(el);
  }

  function deleteElement() {
    const updatedPages = selectedBook.pages.map((p, i) =>
      i === selectedPage
        ? { ...p, elements: p.elements.filter((x) => x.id !== selectedElement.id) }
        : p
    );
    updateBook({ ...selectedBook, pages: updatedPages });
    setSelectedElement(null);
  }

  function duplicateElement() {
    addElement({ ...selectedElement, id: makeId(), x: selectedElement.x + 20, y: selectedElement.y + 20 });
  }

  function addPage() {
    const book = {
      ...selectedBook,
      pages: [...selectedBook.pages, { id: makeId(), bg: selectedBook.bg, elements: [] }],
    };
    updateBook(book);
    setSelectedPage(book.pages.length - 1);
  }

  function changeBg(bg) {
    const pages = selectedBook.pages.map((p, i) => (i === selectedPage ? { ...p, bg } : p));
    updateBook({ ...selectedBook, pages });
    setShowBgPicker(false);
  }

  async function uploadPhoto(el, file) {
    if (!file || !user) return;

    try {
      const fileRef = ref(storage, `scrapbooks/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      updateElement({ ...el, src: url });
    } catch {
      setModal({
        icon: "⚠️",
        title: "Photo failed",
        text: "Firebase Storage blocked this photo upload.",
        button: "Okay",
      });
    }
  }

  function point(e) {
    return e.touches?.[0]
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };
  }

  function startDrag(e, el, mode) {
    e.stopPropagation();
    setSelectedElement(el);
    const p = point(e);
    dragRef.current = { mode, x: p.x, y: p.y, original: { ...el } };
  }

  function moveDrag(e) {
    if (!dragRef.current) return;
    const p = point(e);
    const dx = p.x - dragRef.current.x;
    const dy = p.y - dragRef.current.y;
    const o = dragRef.current.original;

    if (dragRef.current.mode === "move") updateElement({ ...o, x: o.x + dx, y: o.y + dy });
    if (dragRef.current.mode === "resize") updateElement({ ...o, w: Math.max(40, o.w + dx), h: Math.max(40, o.h + dy) });
    if (dragRef.current.mode === "rotate") updateElement({ ...o, r: o.r + dx });
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

  function nudgeCrop(dir) {
    if (!selectedElement || selectedElement.type !== "photo") return;
    const el = { ...selectedElement };
    if (dir === "left") el.cropX = Math.max(0, el.cropX - 5);
    if (dir === "right") el.cropX = Math.min(100, el.cropX + 5);
    if (dir === "up") el.cropY = Math.max(0, el.cropY - 5);
    if (dir === "down") el.cropY = Math.min(100, el.cropY + 5);
    updateElement(el);
  }

  function renderElement(el) {
    const selected = selectedElement?.id === el.id;

    return (
      <div
        key={el.id}
        className={`scrapElement ${selected ? "selected" : ""}`}
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
              <img src={el.src} alt="" style={{ objectPosition: `${el.cropX}% ${el.cropY}%` }} />
            ) : (
              <label className="emptyPhoto">
                + Photo
                <input hidden type="file" accept="image/*" onChange={(e) => uploadPhoto(el, e.target.files[0])} />
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

        {el.type === "sticker" && <div className="stickerElement" style={{ fontSize: el.size }}>{el.value}</div>}

        {selected && (
          <>
            <button className="handle rotateHandle" onMouseDown={(e) => startDrag(e, el, "rotate")}>↻</button>
            <button className="handle resizeHandle" onMouseDown={(e) => startDrag(e, el, "resize")}>↘</button>
            <div className="elementBubble">
              <button onClick={duplicateElement}>Duplicate</button>
              <button onClick={deleteElement}>Delete</button>
            </div>
          </>
        )}
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
              <button className="mainBtn" onClick={() => setShowCreate(true)}>Create Scrapbook</button>
            </div>

            <div className="sectionTitle">My Scrapbooks</div>

            <div className="booksList">
              {books.map((book) => (
                <div key={book.firebaseId || book.id} className="bookCard">
                  <div className={`bookPreview bg-${book.bg}`} onClick={() => openBook(book)}></div>
                  <div className="bookInfo" onClick={() => openBook(book)}>
                    <h3>{book.title}</h3>
                    <p>{book.pages?.length || 0} pages</p>
                  </div>
                  <button className="dotsBtn" onClick={() => setActionBook(book)}>⋮</button>
                </div>
              ))}
            </div>

            <div className="bottomNav">
              <button onClick={() => setScreen("home")}>Home</button>
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
            <button className="templateCard" onClick={() => createFromTemplate(myFirstTemplate)}>My First Scrapbook — Free</button>
            <button className="templateCard" onClick={() => createFromTemplate(() => babyTemplate(true))}>Baby Girl First Year — $1.99</button>
            <button className="templateCard" onClick={() => createFromTemplate(() => babyTemplate(false))}>Baby Boy First Year — $1.99</button>
          </div>
        )}

        {user && screen === "premium" && (
          <div className="screen">
            <button className="backBtn" onClick={() => setScreen("home")}>← Back</button>
            <h2>Premium</h2>
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
              <button className="settingsBtn" onClick={() => setModal({ icon: "🔔", title: "Notifications", text: "Choose email updates, new templates, promotions, or none.", button: "Got it" })}>Notifications</button>
              <button className="settingsBtn" onClick={() => setModal({ icon: "🔒", title: "Privacy", text: "Pocket Scrapbook does not sell your personal information.", button: "Okay" })}>Privacy</button>
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

            <div className={`scrapPage bg-${page()?.bg}`} onClick={() => setSelectedElement(null)}>
              {page()?.elements.map(renderElement)}
            </div>

            <div className="toolBar">
              <button onClick={() => addElement(photoEl(100, 130))}>Photo</button>
              <button onClick={() => addElement(textEl("tap to edit", 80, 80))}>Text</button>
              <button onClick={() => setShowStickers(true)}>Stickers</button>
              <button onClick={addPage}>Add Page</button>
              <button onClick={() => setShowBgPicker(true)}>Background</button>
            </div>

            {selectedElement?.type === "photo" && (
              <div className="cropControls">
                <button onClick={() => nudgeCrop("left")}>←</button>
                <button onClick={() => nudgeCrop("up")}>↑</button>
                <button onClick={() => nudgeCrop("down")}>↓</button>
                <button onClick={() => nudgeCrop("right")}>→</button>
              </div>
            )}
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

        {flipBook && (
          <div className="flipbookScreen">
            <button className="backBtn" onClick={() => setFlipBook(null)}>← Back</button>
            <h2>{flipBook.title}</h2>
            <div className="bookFlipWrap">
              <button disabled={flipPage === 0} onClick={() => setFlipPage(flipPage - 1)}>‹</button>
              <div className={`flipPage bg-${flipBook.pages[flipPage]?.bg}`}>
                {flipBook.pages[flipPage]?.elements.map((el) => (
                  <div key={el.id} className="flipElement" style={{ left: el.x * 0.75, top: el.y * 0.75, width: el.w * 0.75, height: el.h * 0.75 }}>
                    {el.type === "photo" && el.src && <img src={el.src} alt="" />}
                    {el.type === "text" && <span style={{ fontSize: el.size * 0.75 }}>{el.value}</span>}
                    {el.type === "sticker" && <span style={{ fontSize: el.size * 0.75 }}>{el.value}</span>}
                  </div>
                ))}
              </div>
              <button disabled={flipPage === flipBook.pages.length - 1} onClick={() => setFlipPage(flipPage + 1)}>›</button>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="bottomSheet">
            <h3>Create Scrapbook</h3>
            <input placeholder="Scrapbook name" value={newBookName} onChange={(e) => setNewBookName(e.target.value)} />
            <div className="bgPicker">
              {BACKGROUNDS.map((bg) => (
                <button key={bg.id} className={`bgChoice bg-${bg.id}`} onClick={() => setNewBookBg(bg.id)}><span>{bg.name}</span></button>
              ))}
            </div>
            <button className="mainBtn" onClick={createBook}>Create</button>
            <button onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        )}

        {showBgPicker && (
          <div className="bottomSheet">
            <h3>Change Background</h3>
            <div className="bgPicker">
              {BACKGROUNDS.map((bg) => (
                <button key={bg.id} className={`bgChoice bg-${bg.id}`} onClick={() => changeBg(bg.id)}><span>{bg.name}</span></button>
              ))}
            </div>
          </div>
        )}

        {showStickers && (
          <div className="bottomSheet stickerSheet">
            <h3>Choose Sticker</h3>
            <input placeholder="Search stickers..." value={stickerSearch} onChange={(e) => setStickerSearch(e.target.value)} />
            <div className="stickerGrid">
              {filteredStickers.map((s) => (
                <button key={s} onClick={() => { addElement(stickerEl(s, 150, 180)); setShowStickers(false); }}>
                  <span>{s}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowStickers(false)}>Cancel</button>
          </div>
        )}

        {confirmDelete && (
          <div className="cuteOverlay">
            <div className="cuteModal">
              <div className="modalTape"></div>
              <div className="modalIcon">🗑️</div>
              <h2>Delete scrapbook?</h2>
              <p>Delete <strong>{confirmDelete.title}</strong>? This cannot be undone.</p>
              <button className="modalBtn dangerBtn" onClick={() => deleteBook(confirmDelete)}>Yes, delete</button>
              <button className="modalBtn lightBtn" onClick={() => setConfirmDelete(null)}>Keep it</button>
            </div>
          </div>
        )}

        {modal && (
          <div className="cuteOverlay">
            <div className="cuteModal">
              <div className="modalTape"></div>
              <button className="modalX" onClick={() => setModal(null)}>×</button>
              <div className="modalIcon">{modal.icon}</div>
              <h2>{modal.title}</h2>
              <p>{modal.text}</p>
              <button className="modalBtn" onClick={() => setModal(null)}>{modal.button}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
