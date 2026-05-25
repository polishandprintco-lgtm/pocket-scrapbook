import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { auth, db, storage } from "./firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  signOut
} from "firebase/auth";

import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./style.css";

const starterItems = [
  {
    id: "tape-1",
    type: "text",
    text: "pink tape",
    x: 120,
    y: 20,
    w: 150,
    h: 36,
    rotate: -6,
    className: "templateTape"
  },
  {
    id: "quote-1",
    type: "text",
    text: "Good times\n& tan lines ♡",
    x: 75,
    y: 70,
    w: 190,
    h: 95,
    rotate: -4,
    className: "templateQuote"
  },
  {
    id: "sticker-1",
    type: "sticker",
    text: "🌼",
    x: 295,
    y: 125,
    w: 54,
    h: 54,
    rotate: 0
  },
  {
    id: "sticker-2",
    type: "sticker",
    text: "♡",
    x: 50,
    y: 365,
    w: 48,
    h: 48,
    rotate: -8,
    className: "templateHeart"
  },
  {
    id: "note-1",
    type: "text",
    text: "collect\nbeautiful\nmoments ♡",
    x: 175,
    y: 345,
    w: 125,
    h: 90,
    rotate: -2,
    className: "templateNote"
  }
];

function newPage() {
  return {
    items: starterItems.map((item) => ({
      ...item,
      id: `${item.id}-${Date.now()}-${Math.random()}`
    }))
  };
}

function App() {
  const [page, setPage] = useState("welcome");
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);

  function flash(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setPage(u ? "home" : "welcome");
    });

    return () => unsub();
  }, []);

  return (
    <div className="appShell">
      {toast && <div className="toast">{toast}</div>}

      {page === "welcome" && <Welcome go={setPage} />}
      {page === "login" && <Login go={setPage} flash={flash} />}
      {page === "signup" && <Signup go={setPage} flash={flash} />}
      {page === "forgot" && <Forgot go={setPage} flash={flash} />}
      {page === "home" && <Home user={user} flash={flash} />}
    </div>
  );
}

function Welcome({ go }) {
  return (
    <div className="phone">
      <div className="screen paper auth-page">
        <div className="auth-logo">Pocket Scrapbook</div>
        <h1>Turn your memories into beautiful stories 💗</h1>

        <div className="hero">🌼 🖼️ 🦋</div>

        <div className="auth-card">
          <button onClick={() => go("signup")}>✨ Start Scrapbooking</button>
          <button className="secondary" onClick={() => go("login")}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

function Login({ go, flash }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      flash("Logged in 💖");
      go("home");
    } catch (e) {
      flash("Login error: " + e.message);
    }
  }

  return (
    <div className="phone">
      <div className="screen paper auth-page">
        <div className="auth-logo">Pocket Scrapbook</div>
        <h1>Welcome Back ✨</h1>

        <div className="auth-card">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={submit}>Login ✨</button>
        </div>

        <button className="text-btn" onClick={() => go("forgot")}>
          Forgot Password?
        </button>

        <button className="text-btn" onClick={() => go("signup")}>
          Need an account?
        </button>
      </div>
    </div>
  );
}

function Signup({ go, flash }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    try {
      if (!name || !username || !email || !password) {
        throw new Error("Fill in every field.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(cred.user, { displayName: name });

      await addDoc(collection(db, "profiles"), {
        uid: cred.user.uid,
        name,
        username,
        email: email.trim(),
        createdAt: serverTimestamp()
      });

      flash("Account created 💖");
      go("home");
    } catch (e) {
      flash("Signup error: " + e.message);
    }
  }

  return (
    <div className="phone">
      <div className="screen paper auth-page">
        <div className="auth-logo">Pocket Scrapbook</div>
        <h1>Create Your Account ✨</h1>

        <div className="auth-card">
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={submit}>💖 Create Account</button>
        </div>

        <button className="text-btn" onClick={() => go("login")}>
          Already have an account?
        </button>
      </div>
    </div>
  );
}

function Forgot({ go, flash }) {
  const [email, setEmail] = useState("");

  async function reset() {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      flash("Reset email sent 💌");
      go("login");
    } catch (e) {
      flash("Reset error: " + e.message);
    }
  }

  return (
    <div className="phone">
      <div className="screen paper auth-page">
        <h1>Forgot Password?</h1>

        <div className="auth-card">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={reset}>Send Reset Link</button>
        </div>

        <button className="text-btn" onClick={() => go("login")}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

function Home({ user, flash }) {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("home");
  const [activeBook, setActiveBook] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  async function loadBooks() {
    if (!user) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, "scrapbooks"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const userBooks = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data()
        }))
        .filter((b) => b.uid === user.uid);

      setBooks(userBooks);
    } catch (e) {
      flash("Could not load scrapbooks: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, [user]);

  async function createBook() {
    if (!title.trim()) {
      flash("Add a scrapbook title 💕");
      return;
    }

    try {
      const data = {
        uid: user.uid,
        title: title.trim(),
        pages: 1,
        cover: "📔",
        updated: "just now",
        createdAt: serverTimestamp(),
        pagesData: [newPage()]
      };

      const docRef = await addDoc(collection(db, "scrapbooks"), data);
      const newBook = { id: docRef.id, ...data };

      setBooks([newBook, ...books]);
      setTitle("");
      setActiveBook(newBook);
      setCurrentPage(0);
      setSelectedItemId(null);
      setSection("editor");
      flash("Scrapbook created 💖");
    } catch (e) {
      flash("Create error: " + e.message);
    }
  }

  async function deleteBook(book) {
    try {
      await deleteDoc(doc(db, "scrapbooks", book.id));
      setBooks(books.filter((b) => b.id !== book.id));
      setOpenMenuId(null);
      flash("Scrapbook deleted 🗑️");
    } catch (e) {
      flash("Delete failed: " + e.message);
    }
  }

  function exportBook(book) {
    setOpenMenuId(null);
    flash(`Exporting ${book.title} soon 💌`);
  }

  function openBook(book) {
    const cleanBook = {
      ...book,
      pagesData: book.pagesData?.length ? book.pagesData : [newPage()]
    };

    setActiveBook(cleanBook);
    setCurrentPage(0);
    setSelectedItemId(null);
    setOpenMenuId(null);
    setSection("editor");
  }

  async function logout() {
    await signOut(auth);
    flash("Logged out ✨");
  }

  function updateActiveBook(nextBook) {
    setActiveBook(nextBook);
    setBooks((old) =>
      old.map((b) => (b.id === nextBook.id ? nextBook : b))
    );
  }

  function currentItems() {
    return activeBook?.pagesData?.[currentPage]?.items || [];
  }

  function updateCurrentPageItems(nextItems) {
    const pagesData = [...(activeBook.pagesData || [newPage()])];
    pagesData[currentPage] = {
      ...(pagesData[currentPage] || {}),
      items: nextItems
    };

    updateActiveBook({
      ...activeBook,
      pagesData,
      pages: pagesData.length,
      updated: "just now"
    });
  }

  async function saveBook() {
    if (!activeBook?.id) return;

    try {
      await updateDoc(doc(db, "scrapbooks", activeBook.id), {
        pagesData: activeBook.pagesData || [newPage()],
        pages: activeBook.pagesData?.length || 1,
        updated: "just now"
      });

      flash("Saved 💖");
    } catch (e) {
      flash("Save failed: " + e.message);
    }
  }

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];

    if (!file || !activeBook?.id || !user) return;

    try {
      const storageRef = ref(
        storage,
        `users/${user.uid}/scrapbooks/${activeBook.id}/${Date.now()}-${file.name}`
      );

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newItem = {
        id: Date.now().toString(),
        type: "photo",
        url,
        x: 45,
        y: 210,
        w: 130,
        h: 160,
        rotate: -3
      };

      updateCurrentPageItems([...currentItems(), newItem]);
      setSelectedItemId(newItem.id);
      flash("Photo added 📷");
    } catch (e) {
      flash("Photo upload failed: " + e.message);
    }
  }

  function deleteSelected() {
    if (!selectedItemId) {
      flash("Tap something first.");
      return;
    }

    updateCurrentPageItems(
      currentItems().filter((item) => item.id !== selectedItemId)
    );

    setSelectedItemId(null);
    flash("Deleted 🗑️");
  }

  function addSticker() {
    const newItem = {
      id: Date.now().toString(),
      type: "sticker",
      text: "💗",
      x: 140,
      y: 220,
      w: 50,
      h: 50,
      rotate: 0
    };

    updateCurrentPageItems([...currentItems(), newItem]);
    setSelectedItemId(newItem.id);
  }

  function addPage() {
    const pagesData = [...(activeBook.pagesData || [newPage()]), newPage()];

    updateActiveBook({
      ...activeBook,
      pagesData,
      pages: pagesData.length,
      updated: "just now"
    });

    setCurrentPage(pagesData.length - 1);
    setSelectedItemId(null);
  }

  function deletePage() {
    const pagesData = [...(activeBook.pagesData || [newPage()])];

    if (pagesData.length <= 1) {
      flash("You need at least one page.");
      return;
    }

    pagesData.splice(currentPage, 1);

    updateActiveBook({
      ...activeBook,
      pagesData,
      pages: pagesData.length,
      updated: "just now"
    });

    setCurrentPage(Math.max(0, currentPage - 1));
    setSelectedItemId(null);
    flash("Page deleted 🗑️");
  }

  function handlePointerDown(e, item) {
    if (e.target.classList.contains("resizeHandle")) return;

    const rect = e.currentTarget.parentElement.getBoundingClientRect();

    setSelectedItemId(item.id);
    setDragging({
      id: item.id,
      offsetX: e.clientX - rect.left - item.x,
      offsetY: e.clientY - rect.top - item.y
    });
  }

  function startResize(e, item, corner) {
    e.stopPropagation();

    setSelectedItemId(item.id);
    setResizing({
      id: item.id,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      item: { ...item }
    });
  }

  function handlePointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();

    if (dragging) {
      const x = e.clientX - rect.left - dragging.offsetX;
      const y = e.clientY - rect.top - dragging.offsetY;

      updateCurrentPageItems(
        currentItems().map((item) =>
          item.id === dragging.id ? { ...item, x, y } : item
        )
      );
    }

    if (resizing) {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;

      updateCurrentPageItems(
        currentItems().map((item) => {
          if (item.id !== resizing.id) return item;

          let next = { ...resizing.item };

          if (resizing.corner.includes("r")) {
            next.w = Math.max(35, resizing.item.w + dx);
          }

          if (resizing.corner.includes("l")) {
            next.w = Math.max(35, resizing.item.w - dx);
            next.x = resizing.item.x + dx;
          }

          if (resizing.corner.includes("b")) {
            next.h = Math.max(35, resizing.item.h + dy);
          }

          if (resizing.corner.includes("t")) {
            next.h = Math.max(35, resizing.item.h - dy);
            next.y = resizing.item.y + dy;
          }

          return next;
        })
      );
    }
  }

  function handlePointerUp() {
    setDragging(null);
    setResizing(null);
  }

  function renderItem(item) {
    const selected = selectedItemId === item.id;

    return (
      <div
        key={item.id}
        className={`editableItem ${selected ? "selectedEditableItem" : ""} ${
          item.className || ""
        }`}
        style={{
          left: item.x,
          top: item.y,
          width: item.w,
          height: item.h,
          transform: `rotate(${item.rotate || 0}deg)`
        }}
        onPointerDown={(e) => handlePointerDown(e, item)}
        onClick={() => setSelectedItemId(item.id)}
      >
        {item.type === "photo" && <img src={item.url} alt="" />}

        {item.type === "sticker" && (
          <div className="editableSticker">{item.text}</div>
        )}

        {item.type === "text" && (
          <div className="editableText">
            {item.text.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        )}

        {selected && (
          <>
            <button
              className="resizeHandle tl"
              onPointerDown={(e) => startResize(e, item, "tl")}
            ></button>
            <button
              className="resizeHandle tr"
              onPointerDown={(e) => startResize(e, item, "tr")}
            ></button>
            <button
              className="resizeHandle bl"
              onPointerDown={(e) => startResize(e, item, "bl")}
            ></button>
            <button
              className="resizeHandle br"
              onPointerDown={(e) => startResize(e, item, "br")}
            ></button>
          </>
        )}
      </div>
    );
  }

  if (section === "create") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <h1>Create New Scrapbook</h1>

          <div className="auth-card">
            <input
              placeholder="Scrapbook title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <button onClick={createBook}>Create & Start Editing 💖</button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "editor") {
    return (
      <div className="phone">
        <div className="screen paper editorScreenPretty">
          <div className="editorHeaderPretty">
            <button className="plainIcon" onClick={() => setSection("home")}>
              ‹
            </button>

            <button className="plainIcon">↶</button>
            <button className="plainIcon faded">↷</button>

            <button className="savePill" onClick={saveBook}>
              Save
            </button>

            <button className="plainIcon">⋯</button>
          </div>

          <div className="pageCounter">
            Page {currentPage + 1} / {activeBook?.pagesData?.length || 1}
          </div>

          <div
            className="scrapCanvas"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div className="paperLayer layerOne"></div>
            <div className="paperLayer layerTwo"></div>

            {currentItems().map((item) => renderItem(item))}
          </div>

          <div className="toolPanel">
            <label>
              🖼️
              <span>Photo</span>
              <input type="file" accept="image/*" hidden onChange={uploadPhoto} />
            </label>

            <button onClick={addSticker}>
              💬
              <span>Sticker</span>
            </button>

            <button onClick={() => flash("Text editing coming next 𝑇")}>
              𝑇
              <span>Text</span>
            </button>

            <button onClick={() => flash("Backgrounds coming soon 🎨")}>
              🌄
              <span>Background</span>
            </button>

            <button onClick={() => flash("Doodle coming soon ✎")}>
              ✎
              <span>Doodle</span>
            </button>
          </div>

          <div className="toolPanel secondTools">
            <button onClick={() => flash("Layers coming soon")}>
              ▧
              <span>Layers</span>
            </button>

            <button onClick={deleteSelected}>
              🗑️
              <span>Delete Item</span>
            </button>

            <button onClick={() => flash("Duplicate coming next")}>
              ⧉
              <span>Duplicate</span>
            </button>

            <button onClick={() => flash("Forward coming next")}>
              ⇧
              <span>Forward</span>
            </button>

            <button onClick={() => flash("Backward coming next")}>
              ⇩
              <span>Backward</span>
            </button>
          </div>

          <div className="pageStrip">
            {(activeBook?.pagesData || [newPage()]).map((page, index) => (
              <div
                key={index}
                className={
                  index === currentPage
                    ? "pageThumb activePageThumb"
                    : "pageThumb"
                }
                onClick={() => {
                  setCurrentPage(index);
                  setSelectedItemId(null);
                }}
              >
                <div>📔</div>
                <small>{index + 1}</small>
              </div>
            ))}

            <button className="addPageBtn" onClick={addPage}>
              ＋
            </button>

            <button className="deletePageBtn" onClick={deletePage}>
              Delete Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <h1>Settings ⚙️</h1>

          <div className="settings-card">
            <div className="setting-row">
              <div>
                <h3>Notifications 🔔</h3>
                <p>Turn scrapbook reminders on or off.</p>
              </div>

              <button
                onClick={() => {
                  setNotifications(!notifications);
                  flash(!notifications ? "Notifications on" : "Notifications off");
                }}
              >
                {notifications ? "ON" : "OFF"}
              </button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Auto Save 💾</h3>
                <p>Save edits while creating.</p>
              </div>

              <button
                onClick={() => {
                  setAutoSave(!autoSave);
                  flash(!autoSave ? "Auto save on" : "Auto save off");
                }}
              >
                {autoSave ? "ON" : "OFF"}
              </button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Profile 👤</h3>
                <p>View account info.</p>
              </div>

              <button onClick={() => setSection("profile")}>Open</button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Templates 📚</h3>
                <p>Browse templates.</p>
              </div>

              <button onClick={() => setSection("templates")}>Open</button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Logout 🚪</h3>
                <p>Sign out of your account.</p>
              </div>

              <button onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === "profile") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <h1>Profile</h1>

          <div className="auth-card">
            <p>{user?.displayName}</p>
            <p>{user?.email}</p>
            <p>Scrapbooks: {books.length}</p>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

  const templates = [
    "Baby Book 🎀",
    "Travel ✈️",
    "Summer Book ☀️",
    "Family Memories 💗"
  ];

  if (section === "templates") {
    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <h1>Templates</h1>

          {templates.map((t) => (
            <div className="bookCard scrapBookRow" key={t}>
              <div className="bookCover">📖</div>

              <div>
                <h3>{t}</h3>
                <p className="muted">Ready-made scrapbook layout</p>
              </div>

              <button
                onClick={() => {
                  setTitle(t);
                  setSection("create");
                }}
              >
                Use
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="phone">
      <div className="screen paper homeLikeScreenshot">
        <div className="homeHeader">
          <button className="circleBtn" onClick={() => setSection("settings")}>
            ⚙️
          </button>

          <div className="headerIcons">
            <button className="circleBtn">👑</button>

            <button
              className="circleBtn"
              onClick={() => flash("No notifications 🔔")}
            >
              🔔
            </button>
          </div>
        </div>

        <div className="brandLogo">
          Pocket<span>Scrapbook</span>
        </div>

        <p className="homeTagline">
          Turn your memories into
          <br />
          beautiful stories 💗
        </p>

        <div className="decorPolaroid">
          <span className="flower">🌼</span>
          <div className="miniPhoto">🌅</div>
          <span className="butterfly">🦋</span>
          <span className="heart">💗</span>
        </div>

        <button
          className="bigCreateCard"
          onClick={() => setSection("create")}
        >
          <div className="bigPlus">＋</div>

          <div>
            <h2>Create New Scrapbook</h2>
            <p>Start a new scrapbook</p>
          </div>

          <div className="bookArt">📔</div>
        </button>

        <div className="row">
          <h2>My Scrapbooks</h2>

          <button
            className="seeAll"
            onClick={() => flash("Showing all scrapbooks")}
          >
            See All ›
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading scrapbooks...</p>
        ) : books.length === 0 ? (
          <p className="muted">
            No scrapbooks yet. Create your first one 💕
          </p>
        ) : (
          books.map((book) => (
            <div className="scrapBookRow" key={book.id}>
              <div className="bookCover">{book.cover || "📔"}</div>

              <div className="bookInfo" onClick={() => openBook(book)}>
                <h3>{book.title}</h3>
                <p>{book.updated || "Updated just now"}</p>

                <div className="avatarRow">
                  👩🏻 👱🏻‍♀️ <span>+2</span>
                </div>
              </div>

              <div className="bookMeta">
                <button
                  className="dots"
                  onClick={() =>
                    setOpenMenuId(openMenuId === book.id ? null : book.id)
                  }
                >
                  ⋯
                </button>

                <span>{book.pages || 1} Pages</span>

                {openMenuId === book.id && (
                  <div className="miniMenu">
                    <button onClick={() => openBook(book)}>Edit</button>
                    <button onClick={() => exportBook(book)}>Export</button>
                    <button onClick={() => deleteBook(book)}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bottom">
        <button onClick={() => setSection("home")}>
          🏠
          <br />
          Home
        </button>

        <button onClick={() => flash("My Books")}>
          📖
          <br />
          My Books
        </button>

        <button className="plus" onClick={() => setSection("create")}>
          ＋
        </button>

        <button onClick={() => setSection("templates")}>
          ▦
          <br />
          Templates
        </button>

        <button onClick={() => setSection("profile")}>
          ♡
          <br />
          Profile
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
