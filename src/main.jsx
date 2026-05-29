import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./style.css";

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function newPage(bg = "cream") {
  return {
    id: makeId(),
    bg,
    elements: [
      {
        id: makeId(),
        type: "text",
        text: "tap to edit",
        x: 80,
        y: 70,
        size: 28,
        color: "#2f2528",
        font: "Georgia",
      },
    ],
  };
}

function makeBook(title, bg = "cream") {
  return {
    id: makeId(),
    title,
    bg,
    pages: [newPage(bg)],
  };
}

function babyTemplate(girl = true) {
  const bg = girl ? "pink" : "blue";
  return {
    id: makeId(),
    title: girl ? "Baby Girl First Year" : "Baby Boy First Year",
    bg,
    pages: Array.from({ length: 12 }, (_, i) => ({
      id: makeId(),
      bg,
      elements: [
        {
          id: makeId(),
          type: "text",
          text: `${i + 1}\nmonth${i === 0 ? "" : "s"}`,
          x: 35,
          y: 35,
          size: 26,
          color: "#2f2528",
          font: "Georgia",
        },
        {
          id: makeId(),
          type: "photo",
          x: 130,
          y: 130,
          w: 190,
          h: 190,
          src: "",
        },
        {
          id: makeId(),
          type: "text",
          text: girl ? "sweet girl ♡" : "sweet boy ♡",
          x: 150,
          y: 350,
          size: 22,
          color: "#2f2528",
          font: "Georgia",
        },
        {
          id: makeId(),
          type: "sticker",
          value: girl ? "🎀" : "🧸",
          x: 55,
          y: 315,
          size: 46,
        },
      ],
    })),
  };
}

function myLifeTemplate() {
  return {
    id: makeId(),
    title: "My First Scrapbook",
    bg: "cream",
    pages: [
      {
        id: makeId(),
        bg: "cream",
        elements: [
          { id: makeId(), type: "text", text: "About Me ♡", x: 90, y: 35, size: 32, color: "#2f2528", font: "Georgia" },
          { id: makeId(), type: "photo", x: 55, y: 130, w: 150, h: 150, src: "" },
          { id: makeId(), type: "text", text: "Name:\nBirthday:\nFavorite color:", x: 60, y: 330, size: 20, color: "#2f2528", font: "Georgia" },
          { id: makeId(), type: "sticker", value: "🌸", x: 295, y: 320, size: 42 },
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          { id: makeId(), type: "text", text: "My Family ♡", x: 95, y: 35, size: 32, color: "#2f2528", font: "Georgia" },
          { id: makeId(), type: "photo", x: 55, y: 120, w: 165, h: 140, src: "" },
          { id: makeId(), type: "text", text: "The people I love most:", x: 65, y: 300, size: 20, color: "#2f2528", font: "Georgia" },
        ],
      },
    ],
  };
}

function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [books, setBooks] = useState([]);
  const [book, setBook] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [selected, setSelected] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newBg, setNewBg] = useState("cream");
  const [showCreate, setShowCreate] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showBg, setShowBg] = useState(false);
  const [flipbook, setFlipbook] = useState(null);
  const [flipPage, setFlipPage] = useState(0);

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [subscription, setSubscription] = useState("Free Plan");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) return setBooks([]);

      const snap = await getDocs(query(collection(db, "scrapbooks"), orderBy("createdAt", "desc")));
      const loaded = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.uid === u.uid) loaded.push({ ...data, firebaseId: d.id });
      });
      setBooks(loaded);
    });

    return () => unsub();
  }, []);

  async function saveBooks(updated) {
    setBooks(updated);
    if (!user) return;

    for (const b of updated) {
      const data = { ...b, uid: user.uid };
      delete data.firebaseId;

      if (b.firebaseId) {
        await updateDoc(doc(db, "scrapbooks", b.firebaseId), data);
      } else {
        const added = await addDoc(collection(db, "scrapbooks"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        b.firebaseId = added.id;
      }
    }
  }

  async function login() {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup() {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  async function createBook() {
    const b = makeBook(newTitle || "Untitled Scrapbook", newBg);
    const updated = [b, ...books];
    await saveBooks(updated);
    openBook(updated[0]);
    setShowCreate(false);
    setNewTitle("");
  }

  function openBook(b) {
    setBook(b);
    setPageIndex(0);
    setSelected(null);
    setScreen("editor");
  }

  async function deleteBook(b) {
    if (!confirm(`Delete ${b.title}?`)) return;
    if (b.firebaseId) await deleteDoc(doc(db, "scrapbooks", b.firebaseId));
    setBooks(books.filter((x) => x.id !== b.id));
    setScreen("home");
  }

  function updateCurrentBook(updatedBook) {
    setBook(updatedBook);
    saveBooks(books.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
  }

  function addElement(el) {
    const pages = book.pages.map((p, i) =>
      i === pageIndex ? { ...p, elements: [...p.elements, el] } : p
    );
    updateCurrentBook({ ...book, pages });
  }

  function updateElement(updatedEl) {
    const pages = book.pages.map((p, i) =>
      i === pageIndex
        ? { ...p, elements: p.elements.map((el) => (el.id === updatedEl.id ? updatedEl : el)) }
        : p
    );
    updateCurrentBook({ ...book, pages });
    setSelected(updatedEl);
  }

  function deleteElement() {
    if (!selected) return;
    const pages = book.pages.map((p, i) =>
      i === pageIndex
        ? { ...p, elements: p.elements.filter((el) => el.id !== selected.id) }
        : p
    );
    updateCurrentBook({ ...book, pages });
    setSelected(null);
  }

  function addPage() {
    const updated = { ...book, pages: [...book.pages, newPage(book.bg)] };
    updateCurrentBook(updated);
    setPageIndex(updated.pages.length - 1);
  }

  function changePageBg(bg) {
    const pages = book.pages.map((p, i) => (i === pageIndex ? { ...p, bg } : p));
    updateCurrentBook({ ...book, pages });
    setShowBg(false);
  }

  function renderElement(el) {
    return (
      <div
        key={el.id}
        className={`scrapEl ${selected?.id === el.id ? "selected" : ""}`}
        style={{ left: el.x, top: el.y }}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(el);
        }}
      >
        {el.type === "text" && (
          <textarea
            value={el.text}
            style={{
              fontSize: el.size,
              color: el.color,
              fontFamily: el.font,
            }}
            onChange={(e) => updateElement({ ...el, text: e.target.value })}
          />
        )}

        {el.type === "photo" && (
          <label className="photoBox" style={{ width: el.w, height: el.h }}>
            {el.src ? <img src={el.src} /> : "+ Photo"}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                updateElement({ ...el, src: url });
              }}
            />
          </label>
        )}

        {el.type === "sticker" && (
          <div className="sticker" style={{ fontSize: el.size }}>
            {el.value}
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`app ${darkMode ? "dark" : ""}`}>
        <div className="card loginCard">
         <h1>
  pocket
  <br />
  scrapbook ♡
</h1>
          <p>cherish every moment ♡</p>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={login}>Login</button>
          <button className="lightBtn" onClick={signup}>Create Account</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      {screen === "home" && (
        <>
          <div className="card hero">
            <h1>pocket<br />scrapbook</h1>
            <p>cherish every moment ♡</p>
            <button onClick={() => setShowCreate(true)}>Create Scrapbook</button>
          </div>

          <h2>My Scrapbooks</h2>

          {books.map((b) => (
            <div className="bookCard" key={b.id}>
              <div className={`bookThumb bg-${b.bg}`} onClick={() => openBook(b)}></div>
              <div onClick={() => openBook(b)}>
                <h3>{b.title}</h3>
                <p>{b.pages?.length || 0} pages</p>
              </div>
              <button onClick={() => deleteBook(b)}>🗑</button>
            </div>
          ))}

          <nav>
            <button onClick={() => setScreen("home")}>Home</button>
            <button onClick={() => setScreen("templates")}>Templates</button>
            <button onClick={() => setScreen("settings")}>Settings</button>
          </nav>
        </>
      )}

      {screen === "templates" && (
        <>
          <button className="back" onClick={() => setScreen("home")}>← Back</button>
          <h2>Templates</h2>
          <button className="template" onClick={() => saveBooks([myLifeTemplate(), ...books])}>My First Scrapbook</button>
          <button className="template" onClick={() => saveBooks([babyTemplate(true), ...books])}>Baby Girl First Year</button>
          <button className="template" onClick={() => saveBooks([babyTemplate(false), ...books])}>Baby Boy First Year</button>
        </>
      )}

      {screen === "settings" && (
        <>
          <button className="back" onClick={() => setScreen("home")}>← Back</button>
          <div className="card">
            <h2>Settings</h2>

            <div className="settingRow">
              <span>Notifications</span>
              <button onClick={() => setNotifications(!notifications)}>
                {notifications ? "On" : "Off"}
              </button>
            </div>

            <div className="settingRow">
              <span>Dark Mode</span>
              <button onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? "On" : "Off"}
              </button>
            </div>

            <div className="settingRow">
              <span>Subscription</span>
              <button onClick={() => setSubscription(subscription === "Free Plan" ? "Premium Monthly" : "Free Plan")}>
                {subscription}
              </button>
            </div>

            <button onClick={logout}>Logout</button>
          </div>
        </>
      )}

      {screen === "editor" && book && (
        <>
          <div className="editorHeader">
            <button onClick={() => setScreen("home")}>←</button>
            <h2>{book.title}</h2>
            <button onClick={() => setFlipbook(book)}>View</button>
          </div>

          <div className="pageNav">
            <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>‹</button>
            <strong>Page {pageIndex + 1}/{book.pages.length}</strong>
            <button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>›</button>
          </div>

          <div className={`scrapPage bg-${book.pages[pageIndex].bg}`} onClick={() => setSelected(null)}>
            {book.pages[pageIndex].elements.map(renderElement)}
          </div>

          {selected?.type === "text" && (
            <div className="textTools">
              <input type="color" value={selected.color} onChange={(e) => updateElement({ ...selected, color: e.target.value })} />
              <input type="range" min="12" max="60" value={selected.size} onChange={(e) => updateElement({ ...selected, size: Number(e.target.value) })} />
              <select value={selected.font} onChange={(e) => updateElement({ ...selected, font: e.target.value })}>
                <option>Georgia</option>
                <option>Arial</option>
                <option>Courier New</option>
                <option>Trebuchet MS</option>
              </select>
            </div>
          )}

          <nav>
            <button onClick={() => addElement({ id: makeId(), type: "photo", x: 105, y: 140, w: 180, h: 180, src: "" })}>Photo</button>
            <button onClick={() => addElement({ id: makeId(), type: "text", text: "tap to edit", x: 80, y: 90, size: 24, color: "#2f2528", font: "Georgia" })}>Text</button>
            <button onClick={() => setShowStickers(true)}>Sticker</button>
            <button onClick={addPage}>Page</button>
            <button onClick={() => setShowBg(true)}>BG</button>
          </nav>
        </>
      )}

      {showCreate && (
        <div className="sheet">
          <h3>Create Scrapbook</h3>
          <input placeholder="Scrapbook name" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <div className="bgGrid">
            {["cream", "pink", "blue", "lavender"].map((bg) => (
              <button key={bg} className={`bgPick bg-${bg}`} onClick={() => setNewBg(bg)}>
                {bg}
              </button>
            ))}
          </div>
          <button onClick={createBook}>Create</button>
          <button className="lightBtn" onClick={() => setShowCreate(false)}>Cancel</button>
        </div>
      )}

      {showBg && (
        <div className="sheet">
          <h3>Change Background</h3>
          {["cream", "pink", "blue", "lavender"].map((bg) => (
            <button key={bg} onClick={() => changePageBg(bg)}>{bg}</button>
          ))}
          <button className="lightBtn" onClick={() => setShowBg(false)}>Cancel</button>
        </div>
      )}

      {showStickers && (
        <div className="sheet">
          <h3>Choose Sticker</h3>
          <div className="stickerGrid">
            {["♡", "♥", "🎀", "🌸", "🌿", "🧸", "🐰", "🐶", "📷", "✈️", "★", "☁"].map((s) => (
              <button key={s} onClick={() => {
                addElement({ id: makeId(), type: "sticker", value: s, x: 160, y: 180, size: 42 });
                setShowStickers(false);
              }}>
                {s}
              </button>
            ))}
          </div>
          <button className="lightBtn" onClick={() => setShowStickers(false)}>Cancel</button>
        </div>
      )}

      {flipbook && (
        <div className="flipbook">
          <button onClick={() => setFlipbook(null)}>← Back</button>
          <h2>{flipbook.title}</h2>
          <div className={`scrapPage bg-${flipbook.pages[flipPage].bg}`}>
            {flipbook.pages[flipPage].elements.map(renderElement)}
          </div>
          <div className="pageNav">
            <button disabled={flipPage === 0} onClick={() => setFlipPage(flipPage - 1)}>‹</button>
            <button onClick={() => window.print()}>Export / Print</button>
            <button disabled={flipPage === flipbook.pages.length - 1} onClick={() => setFlipPage(flipPage + 1)}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
