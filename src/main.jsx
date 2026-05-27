import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

import { auth, db, storage } from "./firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const COLORS = {
  pink: "#f8b8ca",
  blue: "#bcd8f4",
  lavender: "#d9c8f2",
  cream: "#fff8ef",
  tan: "#ead6bd",
};

const BACKGROUNDS = [
  { name: "Cream", value: "cream" },
  { name: "Baby Pink", value: "pink" },
  { name: "Baby Blue", value: "blue" },
  { name: "Lavender", value: "lavender" },
  { name: "Grid", value: "grid" },
  { name: "Dots", value: "dots" },
  { name: "Paper", value: "paper" },
];

const STICKERS = ["♡", "❤", "✿", "🌼", "🎀", "⭐", "🧸", "🍼", "👶", "🦋"];

function uid() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

const babyBoyTemplate = {
  premium: true,
  title: "Baby Boy First Year",
  background: "blue",
  pages: [
    {
      id: uid(),
      background: "blue",
      elements: [
        textEl("baby’s\nfirst year", 40, 60, 220, 90, 36),
        textEl("our little boy", 245, 170, 140, 34, 16),
        frameEl(45, 190, 170, 170),
        frameEl(240, 205, 115, 115),
        stickerEl("⭐", 25, 30),
        stickerEl("🧸", 30, 350),
      ],
    },
    ...Array.from({ length: 12 }, (_, i) => ({
      id: uid(),
      background: "blue",
      elements: [
        textEl(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 28, 35, 110, 90, 28),
        frameEl(150, 70, 220, 210),
        textEl(
          ["you are so loved", "growing so fast", "sweet boy", "so happy", "little blessing"][
            i % 5
          ],
          170,
          315,
          170,
          45,
          16
        ),
        stickerEl(i % 2 ? "🧸" : "⭐", 30, 300),
      ],
    })),
  ],
};

const babyGirlTemplate = {
  premium: true,
  title: "Baby Girl First Year",
  background: "pink",
  pages: [
    {
      id: uid(),
      background: "pink",
      elements: [
        textEl("baby’s\nfirst year", 40, 60, 220, 90, 36),
        textEl("our little girl", 245, 170, 140, 34, 16),
        frameEl(45, 190, 170, 170),
        frameEl(240, 205, 115, 115),
        stickerEl("🎀", 25, 30),
        stickerEl("♡", 30, 350),
      ],
    },
    ...Array.from({ length: 12 }, (_, i) => ({
      id: uid(),
      background: "pink",
      elements: [
        textEl(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 28, 35, 110, 90, 28),
        frameEl(150, 70, 220, 210),
        textEl(
          ["you are so loved", "growing so fast", "sweet girl", "so happy", "little blessing"][
            i % 5
          ],
          170,
          315,
          170,
          45,
          16
        ),
        stickerEl(i % 2 ? "🌼" : "🎀", 30, 300),
      ],
    })),
  ],
};

function textEl(text, x, y, w, h, size = 22) {
  return {
    id: uid(),
    type: "text",
    text,
    x,
    y,
    w,
    h,
    rotate: 0,
    fontSize: size,
  };
}

function stickerEl(text, x, y) {
  return {
    id: uid(),
    type: "sticker",
    text,
    x,
    y,
    w: 60,
    h: 60,
    rotate: 0,
    fontSize: 38,
  };
}

function frameEl(x, y, w, h) {
  return {
    id: uid(),
    type: "photo",
    src: "",
    x,
    y,
    w,
    h,
    rotate: 0,
  };
}

function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [books, setBooks] = useState([]);
  const [book, setBook] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const page = book?.pages?.[pageIndex];

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) loadBooks(u.uid);
    });
  }, []);

  useEffect(() => {
    function keyDown(e) {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && book) {
        e.preventDefault();
        deleteSelected();
      }
    }

    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [selectedId, book, pageIndex]);

  async function loadBooks(uidValue) {
    const q = query(collection(db, "users", uidValue, "books"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function saveBook(nextBook = book) {
    if (!user || !nextBook) return;

    if (nextBook.id) {
      await updateDoc(doc(db, "users", user.uid, "books", nextBook.id), {
        ...nextBook,
        updatedAt: serverTimestamp(),
      });
    } else {
      const added = await addDoc(collection(db, "users", user.uid, "books"), {
        ...nextBook,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      nextBook.id = added.id;
      setBook({ ...nextBook });
    }

    loadBooks(user.uid);
  }

  async function handleAuth() {
    if (!email || !password) return alert("Enter email and password.");

    if (authMode === "signup") {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  }

  async function resetPassword() {
    if (!email) return alert("Type your email first.");
    await sendPasswordResetEmail(auth, email);
    alert("Password reset sent.");
  }

  function createBlankBook() {
    const newBook = {
      title: "My Scrapbook",
      background: "cream",
      pages: [
        {
          id: uid(),
          background: "cream",
          elements: [
            textEl("My Scrapbook", 75, 55, 250, 60, 34),
            frameEl(80, 145, 250, 250),
            stickerEl("♡", 30, 340),
          ],
        },
      ],
    };

    setBook(newBook);
    setPageIndex(0);
    setScreen("editor");
  }

  function createFromTemplate(template) {
    if (template.premium && !isSubscribed) {
      const viewOnly = window.confirm(
        "This is a premium baby template. You can preview it now. Press OK to preview, or Cancel to unlock."
      );

      if (!viewOnly) {
        setScreen("subscribe");
        return;
      }
    }

    const copied = JSON.parse(JSON.stringify(template));
    copied.id = null;
    copied.title = template.title;
    setBook(copied);
    setPageIndex(0);
    setScreen("editor");
  }

  function unlockPremium() {
    setIsSubscribed(true);
    alert("Premium unlocked for testing.");
    setScreen("templates");
  }

  function updatePage(nextPage) {
    const pages = [...book.pages];
    pages[pageIndex] = nextPage;
    setBook({ ...book, pages });
  }

  function addPage() {
    setBook({
      ...book,
      pages: [
        ...book.pages,
        {
          id: uid(),
          background: book.background || "cream",
          elements: [],
        },
      ],
    });
    setPageIndex(book.pages.length);
  }

  function addText() {
    updatePage({
      ...page,
      elements: [...page.elements, textEl("tap to edit", 90, 110, 180, 70, 24)],
    });
  }

  function addSticker(s) {
    updatePage({
      ...page,
      elements: [...page.elements, stickerEl(s, 120, 150)],
    });
  }

  function addPhotoFrame() {
    updatePage({
      ...page,
      elements: [...page.elements, frameEl(80, 120, 220, 220)],
    });
  }

  async function uploadImage(elementId, file) {
    if (!file) return;

    const imageRef = ref(storage, `scrapbooks/${user.uid}/${uid()}-${file.name}`);
    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);

    updatePage({
      ...page,
      elements: page.elements.map((el) =>
        el.id === elementId ? { ...el, src: url } : el
      ),
    });
  }

  function changeBackground(bg) {
    updatePage({ ...page, background: bg });
  }

  function deleteSelected() {
    updatePage({
      ...page,
      elements: page.elements.filter((el) => el.id !== selectedId),
    });
    setSelectedId(null);
  }

  function updateElement(id, changes) {
    updatePage({
      ...page,
      elements: page.elements.map((el) => (el.id === id ? { ...el, ...changes } : el)),
    });
  }

  function startDrag(e, el, mode = "move") {
    e.stopPropagation();
    setSelectedId(el.id);

    const point = getPoint(e);
    setDrag({
      id: el.id,
      mode,
      startX: point.x,
      startY: point.y,
      startEl: { ...el },
    });
  }

  function onMove(e) {
    if (!drag) return;

    const point = getPoint(e);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const el = drag.startEl;

    if (drag.mode === "move") {
      updateElement(drag.id, {
        x: el.x + dx,
        y: el.y + dy,
      });
    }

    if (drag.mode === "resize") {
      updateElement(drag.id, {
        w: Math.max(40, el.w + dx),
        h: Math.max(40, el.h + dy),
      });
    }

    if (drag.mode === "rotate") {
      updateElement(drag.id, {
        rotate: el.rotate + dx,
      });
    }
  }

  function getPoint(e) {
    if (e.touches?.[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

 if (!user) {
  return (
    <div className="loginPage">
      <div className="loginHero">
        <div className="tape">● ● ●</div>
        <div className="paperTitle">
          <h1>
            pocket<br />
            <span>scrapbook</span>
          </h1>
          <p>♡ Cherish every moment</p>
        </div>

        <div className="bow">🎀</div>
        <div className="flower">🌼</div>
      </div>

      <div className="loginCard">
        <h2>♡ Welcome ♡</h2>
        <p>Capture, create and keep your memories close</p>

        <input
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAuth();
            }
          }}
        />

        <div className="passwordWrap">
  <input
    placeholder="Password"
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        handleAuth();
      }
    }}
  />

  <button
    type="button"
    className="showPasswordBtn"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? "Hide" : "Show"}
  </button>
</div>

        <button className="forgotBtn" onClick={resetPassword}>
          Forgot password?
        </button>

        <button className="loginBtn" onClick={handleAuth}>
          {authMode === "login" ? "Log In" : "Create Account"}
        </button>

        <div className="orLine">
          <span></span>
          or
          <span></span>
        </div>

        <button className="socialBtn">🌈 Continue with Google</button>
        <button className="socialBtn"> Continue with Apple</button>

        <button
          className="switchAuthBtn"
          onClick={() =>
            setAuthMode(authMode === "login" ? "signup" : "login")
          }
        >
          {authMode === "login"
            ? "New here? Create an account"
            : "Already have an account? Log in"}
        </button>
      </div>

      <div className="loginFeatures">
        <div>📖<br />Beautiful<br />Scrapbooks</div>
        <div>♡<br />Cherished<br />Memories</div>
        <div>🔒<br />Safe &<br />Private</div>
      </div>
    </div>
  );
}

  return (
    <div className="app">
      {screen === "home" && (
        <div className="home">
          <div className="topBar">
            <button>☰</button>
            <button onClick={() => signOut(auth)}>Logout</button>
          </div>

          <h1>Pocket Scrapbook💗</h1>
          <p>Turn your memories into beautiful stories</p>

          <button className="createCard" onClick={createBlankBook}>
            <span>＋</span>
            <div>
              <b>Create New Scrapbook</b>
              <small>Start a new scrapbook</small>
            </div>
          </button>

          <h2>My Scrapbooks</h2>

          {books.map((b) => (
            <div
              className="bookCard"
              key={b.id}
              onClick={() => {
                setBook(b);
                setPageIndex(0);
                setScreen("editor");
              }}
            >
              <div className={`bookThumb bg-${b.background || "cream"}`}></div>
              <div>
                <b>{b.title}</b>
                <small>{b.pages?.length || 1} Pages</small>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await deleteDoc(doc(db, "users", user.uid, "books", b.id));
                  loadBooks(user.uid);
                }}
              >
                ⋯
              </button>
            </div>
          ))}

          <nav>
            <button onClick={() => setScreen("home")}>🏠 Home</button>
            <button onClick={() => setScreen("templates")}>📖 Templates</button>
            <button onClick={createBlankBook}>＋</button>
            <button onClick={() => setScreen("stickers")}>♡ Stickers</button>
            <button onClick={() => setScreen("subscribe")}>👑 Premium</button>
            <button onClick={() => setScreen("profile")}>👤 Profile</button>
          </nav>
        </div>
      )}
{screen === "profile" && (
  <div className="panel">
    <button onClick={() => setScreen("home")}>← Back</button>

    <div className="profileHeader">
      <div className="profilePic">💗</div>

      <h2>{user.email}</h2>

      <p>Pocket Scrapbook Member</p>
    </div>

    <div className="settingsList">
      <button className="settingsItem">
        🎨 Theme Settings
      </button>

      <button className="settingsItem">
        🔔 Notifications
      </button>

      <button className="settingsItem">
        👑 Subscription
      </button>

      <button className="settingsItem">
        🔒 Privacy
      </button>

      <button className="settingsItem">
        ☁ Backup & Sync
      </button>

      <button
        className="settingsItem logoutBtn"
        onClick={() => signOut(auth)}
      >
        🚪 Log Out
      </button>
    </div>
  </div>
)}
      {screen === "templates" && (
        <div className="panel">
          <button onClick={() => setScreen("home")}>← Back</button>
          <h2>Templates</h2>

          <div className="templateGrid">
            <button onClick={() => createFromTemplate(babyGirlTemplate)}>
              <div className="templatePreview girl">Baby Girl First Year 🎀</div>
              <b>Premium</b>
            </button>

            <button onClick={() => createFromTemplate(babyBoyTemplate)}>
              <div className="templatePreview boy">Baby Boy First Year ⭐</div>
              <b>Premium</b>
            </button>
          </div>
        </div>
      )}

      {screen === "subscribe" && (
        <div className="panel">
          <button onClick={() => setScreen("home")}>← Back</button>
          <h2>Premium Baby Templates 👑</h2>
          <p>Baby boy and baby girl first-year templates are premium.</p>
          <button onClick={unlockPremium}>Unlock Premium for Testing</button>
          <small>Later you can replace this with Stripe, RevenueCat, or Firebase payments.</small>
        </div>
      )}

      {screen === "stickers" && (
        <div className="panel">
          <button onClick={() => setScreen("home")}>← Back</button>
          <h2>Stickers</h2>
          <div className="stickerGrid">
            {STICKERS.map((s) => (
              <button key={s}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {screen === "editor" && book && page && (
        <div className="editor">
          <header>
            <button onClick={() => setScreen("home")}>←</button>
            <button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}>‹</button>
            <span>
              Page {pageIndex + 1} / {book.pages.length}
            </span>
            <button onClick={() => setPageIndex(Math.min(book.pages.length - 1, pageIndex + 1))}>›</button>
            <button onClick={() => saveBook()}>Save</button>
          </header>

          <main
            className={`canvas bg-${page.background}`}
            onMouseMove={onMove}
            onMouseUp={() => setDrag(null)}
            onTouchMove={onMove}
            onTouchEnd={() => setDrag(null)}
            onClick={() => setSelectedId(null)}
          >
            {page.elements.map((el) => (
              <div
                key={el.id}
                className={`element ${selectedId === el.id ? "selected" : ""}`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.h,
                  transform: `rotate(${el.rotate || 0}deg)`,
                  fontSize: el.fontSize,
                }}
                onMouseDown={(e) => startDrag(e, el)}
                onTouchStart={(e) => startDrag(e, el)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
              >
                {el.type === "text" && (
                  <textarea
                    value={el.text}
                    onChange={(e) => updateElement(el.id, { text: e.target.value })}
                    style={{ fontSize: el.fontSize }}
                  />
                )}

                {el.type === "sticker" && <div className="sticker">{el.text}</div>}

                {el.type === "photo" && (
                  <label className="photoBox">
                    {el.src ? <img src={el.src} /> : <span>＋ Photo</span>}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => uploadImage(el.id, e.target.files[0])}
                    />
                  </label>
                )}

                {selectedId === el.id && (
                  <>
                    <button
                      className="resizeHandle"
                      onMouseDown={(e) => startDrag(e, el, "resize")}
                      onTouchStart={(e) => startDrag(e, el, "resize")}
                    >
                      ↘
                    </button>
                    <button
                      className="rotateHandle"
                      onMouseDown={(e) => startDrag(e, el, "rotate")}
                      onTouchStart={(e) => startDrag(e, el, "rotate")}
                    >
                      ⟳
                    </button>
                  </>
                )}
              </div>
            ))}
          </main>

          <section className="toolbar">
            <button onClick={addPhotoFrame}>Photo</button>
            <button onClick={addText}>Text</button>
            <button onClick={() => addSticker("♡")}>Sticker</button>
            <button onClick={addPage}>Add Page</button>
            <button onClick={deleteSelected}>Delete</button>
          </section>

          <section className="backgrounds">
            {BACKGROUNDS.map((b) => (
              <button key={b.value} onClick={() => changeBackground(b.value)}>
                {b.name}
              </button>
            ))}
          </section>

          <section className="stickerRow">
            {STICKERS.map((s) => (
              <button key={s} onClick={() => addSticker(s)}>
                {s}
              </button>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
