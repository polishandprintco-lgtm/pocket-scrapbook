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
          <button className="secondary" onClick={() => go("login")}>Login</button>
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
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={submit}>Login ✨</button>
        </div>

        <button className="text-btn" onClick={() => go("forgot")}>Forgot Password?</button>
        <button className="text-btn" onClick={() => go("signup")}>Need an account?</button>
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
      if (!name || !username || !email || !password) throw new Error("Fill in every field.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
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
          <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={submit}>💖 Create Account</button>
        </div>

        <button className="text-btn" onClick={() => go("login")}>Already have an account?</button>
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
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={reset}>Send Reset Link</button>
        </div>
        <button className="text-btn" onClick={() => go("login")}>Back to Login</button>
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

  async function loadBooks() {
    if (!user) return;

    try {
      setLoading(true);
      const q = query(collection(db, "scrapbooks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const userBooks = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
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
        pagesData: [{ items: [] }]
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
      pagesData: book.pagesData?.length ? book.pagesData : [{ items: [] }]
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
    setBooks((old) => old.map((b) => (b.id === nextBook.id ? nextBook : b)));
  }

  function updateCurrentPageItems(nextItems) {
    const pagesData = [...(activeBook.pagesData || [{ items: [] }])];
    pagesData[currentPage] = { ...(pagesData[currentPage] || {}), items: nextItems };

    updateActiveBook({
      ...activeBook,
      pagesData,
      pages: pagesData.length,
      updated: "just now"
    });
  }

  function currentItems() {
    return activeBook?.pagesData?.[currentPage]?.items || [];
  }

  async function saveBook() {
    if (!activeBook?.id) return;

    try {
      await updateDoc(doc(db, "scrapbooks", activeBook.id), {
        pagesData: activeBook.pagesData || [{ items: [] }],
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
        y: 205,
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

  function selectItem(id) {
    setSelectedItemId(id);
  }

  function selectedItem() {
    return currentItems().find((item) => item.id === selectedItemId);
  }

  function moveSelected(dx, dy) {
    if (!selectedItemId) return;

    const nextItems = currentItems().map((item) =>
      item.id === selectedItemId
        ? { ...item, x: item.x + dx, y: item.y + dy }
        : item
    );

    updateCurrentPageItems(nextItems);
  }

  function resizeSelected(amount) {
    if (!selectedItemId) return;

    const nextItems = currentItems().map((item) =>
      item.id === selectedItemId
        ? {
            ...item,
            w: Math.max(60, item.w + amount),
            h: Math.max(80, item.h + amount)
          }
        : item
    );

    updateCurrentPageItems(nextItems);
  }

  function deleteSelected() {
    if (!selectedItemId) {
      flash("Tap a photo first.");
      return;
    }

    updateCurrentPageItems(currentItems().filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
    flash("Photo deleted 🗑️");
  }

  function addPage() {
    const pagesData = [...(activeBook.pagesData || [{ items: [] }]), { items: [] }];

    updateActiveBook({
      ...activeBook,
      pagesData,
      pages: pagesData.length,
      updated: "just now"
    });

    setCurrentPage(pagesData.length - 1);
    setSelectedItemId(null);
  }

  function handlePointerDown(e, item) {
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    setSelectedItemId(item.id);
    setDragging({
      id: item.id,
      offsetX: e.clientX - rect.left - item.x,
      offsetY: e.clientY - rect.top - item.y
    });
  }

  function handlePointerMove(e) {
    if (!dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - dragging.offsetX;
    const y = e.clientY - rect.top - dragging.offsetY;

    const nextItems = currentItems().map((item) =>
      item.id === dragging.id ? { ...item, x, y } : item
    );

    updateCurrentPageItems(nextItems);
  }

  function handlePointerUp() {
    setDragging(null);
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
            <button className="plainIcon" onClick={() => setSection("home")}>‹</button>
            <button className="plainIcon">↶</button>
            <button className="plainIcon faded">↷</button>
            <button className="savePill" onClick={saveBook}>Save</button>
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

            <div className="pinkTape">pink tape</div>

            <div className="quoteCard">
              <div className="scriptText">Good times</div>
              <div className="pinkStrip">&amp; tan lines</div>
              <div className="tinyHeart">♡</div>
            </div>

            {currentItems().map((item) => (
              <div
                key={item.id}
                className={
                  selectedItemId === item.id
                    ? "draggablePhoto selectedDragPhoto"
                    : "draggablePhoto"
                }
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.w,
                  height: item.h,
                  transform: `rotate(${item.rotate || 0}deg)`
                }}
                onPointerDown={(e) => handlePointerDown(e, item)}
                onClick={() => selectItem(item.id)}
              >
                <img src={item.url} alt="" />
                {selectedItemId === item.id && (
                  <>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </>
                )}
              </div>
            ))}

            <div className="photoFrame beachPhoto">
              <div className="fakePhoto">🌴🌅</div>
            </div>

            <div className="daisy">🌼</div>
            <div className="heartPatch">♡</div>
            <div className="sideLeaf">🌿</div>

            <div className="captionPaper">
              collect<br />beautiful<br />moments ♡
            </div>
          </div>

          <div className="toolPanel">
            <label>
              🖼️
              <span>Photo</span>
              <input type="file" accept="image/*" hidden onChange={uploadPhoto} />
            </label>

            <button onClick={() => flash("Sticker menu coming soon ✨")}>💬<span>Sticker</span></button>
            <button onClick={() => flash("Text tool coming soon 𝑇")}>𝑇<span>Text</span></button>
            <button onClick={() => flash("Backgrounds coming soon 🎨")}>🌄<span>Background</span></button>
            <button onClick={() => flash("Doodle coming soon ✎")}>✎<span>Doodle</span></button>
          </div>

          <div className="editControls">
            <button onClick={() => moveSelected(0, -10)}>↑</button>
            <button onClick={() => moveSelected(-10, 0)}>←</button>
            <button onClick={() => moveSelected(10, 0)}>→</button>
            <button onClick={() => moveSelected(0, 10)}>↓</button>
            <button onClick={() => resizeSelected(15)}>Bigger</button>
            <button onClick={() => resizeSelected(-15)}>Smaller</button>
            <button onClick={deleteSelected}>Delete</button>
          </div>

          <div className="pageStrip">
            {(activeBook?.pagesData || [{ items: [] }]).map((page, index) => (
              <div
                key={index}
                className={index === currentPage ? "pageThumb activePageThumb" : "pageThumb"}
                onClick={() => {
                  setCurrentPage(index);
                  setSelectedItemId(null);
                }}
              >
                <div>📔</div>
                <small>{index + 1}</small>
              </div>
            ))}

            <button className="addPageBtn" onClick={addPage}>＋</button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "profile") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
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

  const templates = ["Baby Book 🎀", "Travel ✈️", "Summer Book ☀️", "Family Memories 💗"];

  if (section === "templates") {
    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Templates</h1>

          {templates.map((t) => (
            <div className="bookCard scrapBookRow" key={t}>
              <div className="bookCover">📖</div>

              <div>
                <h3>{t}</h3>
                <p className="muted">Ready-made scrapbook layout</p>
              </div>

              <button onClick={() => { setTitle(t); setSection("create"); }}>
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
          <button className="circleBtn">☰</button>

          <div className="headerIcons">
            <button className="circleBtn">👑</button>
            <button className="circleBtn" onClick={() => flash("No notifications 🔔")}>🔔</button>
          </div>
        </div>

        <div className="brandLogo">
          Pocket<span>Scrapbook</span>
        </div>

        <p className="homeTagline">
          Turn your memories into<br />beautiful stories 💗
        </p>

        <div className="decorPolaroid">
          <span className="flower">🌼</span>
          <div className="miniPhoto">🌅</div>
          <span className="butterfly">🦋</span>
          <span className="heart">💗</span>
        </div>

        <button className="bigCreateCard" onClick={() => setSection("create")}>
          <div className="bigPlus">＋</div>
          <div>
            <h2>Create New Scrapbook</h2>
            <p>Start a new scrapbook</p>
          </div>
          <div className="bookArt">📔</div>
        </button>

        <div className="row">
          <h2>My Scrapbooks</h2>
          <button className="seeAll" onClick={() => flash("Showing all scrapbooks")}>See All ›</button>
        </div>

        {loading ? (
          <p className="muted">Loading scrapbooks...</p>
        ) : books.length === 0 ? (
          <p className="muted">No scrapbooks yet. Create your first one 💕</p>
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

        <div className="shortcutTray">
          <button onClick={() => setSection("templates")}>📖<br />Templates</button>
          <button onClick={() => flash("Stickers coming soon ✨")}>🫧<br />Stickers</button>
          <button onClick={() => flash("Fonts coming soon Aa")}>Aa<br />Fonts</button>
          <button onClick={() => flash("Backgrounds coming soon 🖼️")}>🖼️<br />Backgrounds</button>
        </div>
      </div>

      <div className="bottom">
        <button onClick={() => setSection("home")}>🏠<br />Home</button>
        <button onClick={() => flash("My Books")}>📖<br />My Books</button>
        <button className="plus" onClick={() => setSection("create")}>＋</button>
        <button onClick={() => setSection("templates")}>▦<br />Templates</button>
        <button onClick={() => setSection("profile")}>♡<br />Profile</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
