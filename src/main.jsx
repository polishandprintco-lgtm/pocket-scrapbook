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

function blankPage(bg = "bgGrid") {
  return { background: bg, items: [] };
}

function babyGirlPage(title, caption, photoCount = 1) {
  const base = [
    { id: crypto.randomUUID(), type: "text", text: title, x: 22, y: 24, w: 120, h: 75, fontSize: 24, fontFamily: "Georgia", color: "#4d392f" },
    { id: crypto.randomUUID(), type: "sticker", text: "🎀", x: 18, y: 5, w: 45, h: 45, fontSize: 34 },
    { id: crypto.randomUUID(), type: "sticker", text: "💗", x: 45, y: 340, w: 48, h: 48, fontSize: 36 },
    { id: crypto.randomUUID(), type: "sticker", text: "🌸", x: 285, y: 285, w: 48, h: 48, fontSize: 38 },
    { id: crypto.randomUUID(), type: "text", text: caption, x: 185, y: 340, w: 140, h: 55, fontSize: 16, fontFamily: "Georgia", color: "#6b4f43" }
  ];

  for (let i = 0; i < photoCount; i++) {
    base.push({
      id: crypto.randomUUID(),
      type: "placeholder",
      text: "Add Photo",
      x: i === 0 ? 125 : 225,
      y: i === 0 ? 120 : 165,
      w: 145,
      h: 155,
      fontSize: 18,
      rotate: i === 0 ? -3 : 4
    });
  }

  return { background: "bgBabyPinkPlaid", items: base };
}

function App() {
  const [page, setPage] = useState("welcome");
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
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
  const [showPass, setShowPass] = useState(false);

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

          <div className="passwordWrap">
            <input placeholder="Password" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="showBtn" onClick={() => setShowPass(!showPass)}>{showPass ? "🙈" : "👁️"}</button>
          </div>

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
  const [showPass, setShowPass] = useState(false);

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

          <div className="passwordWrap">
            <input placeholder="Password" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="showBtn" onClick={() => setShowPass(!showPass)}>{showPass ? "🙈" : "👁️"}</button>
          </div>

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
  const [resizing, setResizing] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [mode, setMode] = useState("select");

  async function loadBooks() {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(collection(db, "scrapbooks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((b) => b.uid === user.uid));
    } catch (e) {
      flash("Could not load scrapbooks: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, [user]);

  function getPages() {
    return activeBook?.pagesData?.length ? activeBook.pagesData : [blankPage()];
  }

  function currentPageData() {
    return getPages()[currentPage] || blankPage();
  }

  function currentItems() {
    return currentPageData().items || [];
  }

  function updateActiveBook(nextBook) {
    setActiveBook(nextBook);
    setBooks((old) => old.map((b) => (b.id === nextBook.id ? nextBook : b)));
  }

  function updateCurrentPage(nextPage) {
    const pagesData = [...getPages()];
    pagesData[currentPage] = nextPage;
    updateActiveBook({ ...activeBook, pagesData, pages: pagesData.length, updated: "just now" });
  }

  function updateCurrentItems(nextItems) {
    updateCurrentPage({ ...currentPageData(), items: nextItems });
  }

  function changeBackground(backgroundClass) {
    updateCurrentPage({ ...currentPageData(), background: backgroundClass });
    flash("Background changed 🎨");
  }

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
        pagesData: [blankPage()]
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

  async function createBabyFirstYearTemplate() {
    try {
      const pagesData = [
        babyGirlPage("baby's\nfirst year ♡", "our little girl", 2),
        babyGirlPage("hello\nworld ♡", "the day you were born", 1),
        babyGirlPage("tiny hands\nbig love ♡", "so much love", 1),
        babyGirlPage("1\nmonth", "you are so loved", 1),
        babyGirlPage("2\nmonths", "growing so fast ♡", 2),
        babyGirlPage("3\nmonths", "sweet girl ♡", 1),
        babyGirlPage("4\nmonths", "so happy ♡", 1),
        babyGirlPage("5\nmonths", "little beauty ♡", 2),
        babyGirlPage("6\nmonths", "little blessing ♡", 1),
        babyGirlPage("7\nmonths", "cutest smile ♡", 2),
        babyGirlPage("8\nmonths", "learning & growing ♡", 1),
        babyGirlPage("9\nmonths", "so curious ♡", 2),
        babyGirlPage("10\nmonths", "so much joy ♡", 2),
        babyGirlPage("11\nmonths", "almost one! ♡", 2),
        babyGirlPage("12\nmonths", "what a year ♡", 2),
        babyGirlPage("one year\nof you ♡", "our greatest blessing ♡", 1)
      ];

      const data = {
        uid: user.uid,
        title: "Baby’s First Year (Girl)",
        pages: pagesData.length,
        cover: "🎀",
        updated: "just now",
        createdAt: serverTimestamp(),
        pagesData
      };

      const docRef = await addDoc(collection(db, "scrapbooks"), data);
      const newBook = { id: docRef.id, ...data };

      setBooks([newBook, ...books]);
      setActiveBook(newBook);
      setCurrentPage(0);
      setSelectedItemId(null);
      setSection("editor");
      flash("Baby’s First Year template created 🎀");
    } catch (e) {
      flash("Template error: " + e.message);
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
    setActiveBook({ ...book, pagesData: book.pagesData?.length ? book.pagesData : [blankPage()] });
    setCurrentPage(0);
    setSelectedItemId(null);
    setOpenMenuId(null);
    setSection("editor");
  }

  async function saveBook() {
    if (!activeBook?.id) return;
    try {
      await updateDoc(doc(db, "scrapbooks", activeBook.id), {
        pagesData: getPages(),
        pages: getPages().length,
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
      const storageRef = ref(storage, `users/${user.uid}/scrapbooks/${activeBook.id}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newItem = { id: crypto.randomUUID(), type: "photo", url, x: 55, y: 175, w: 140, h: 170, rotate: 0 };
      updateCurrentItems([...currentItems(), newItem]);
      setSelectedItemId(newItem.id);
      setMode("select");
      flash("Photo added 📷");
    } catch (e) {
      flash("Photo upload failed: " + e.message);
    }
  }

  function addText() {
    const text = prompt("Enter your text:");
    if (!text) return;
    const newItem = { id: crypto.randomUUID(), type: "text", text, x: 90, y: 120, w: 180, h: 70, fontSize: 24, fontFamily: "Georgia", color: "#5A463A", rotate: 0 };
    updateCurrentItems([...currentItems(), newItem]);
    setSelectedItemId(newItem.id);
    setMode("select");
  }

  function addSticker() {
    const emoji = prompt("Enter an emoji sticker:", "💗");
    if (!emoji) return;
    const newItem = { id: crypto.randomUUID(), type: "sticker", text: emoji, x: 135, y: 180, w: 55, h: 55, fontSize: 42, rotate: 0 };
    updateCurrentItems([...currentItems(), newItem]);
    setSelectedItemId(newItem.id);
  }

  function deleteSelected() {
    if (!selectedItemId) {
      flash("Tap something first.");
      return;
    }
    updateCurrentItems(currentItems().filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
    flash("Deleted 🗑️");
  }

  function changeSelectedFontSize(amount) {
    if (!selectedItemId) {
      flash("Tap text or a sticker first 💕");
      return;
    }
    updateCurrentItems(currentItems().map((item) =>
      item.id === selectedItemId && (item.type === "text" || item.type === "sticker" || item.type === "placeholder")
        ? { ...item, fontSize: Math.max(12, (item.fontSize || 24) + amount) }
        : item
    ));
  }

  function addPage() {
    const pagesData = [...getPages(), blankPage()];
    updateActiveBook({ ...activeBook, pagesData, pages: pagesData.length, updated: "just now" });
    setCurrentPage(pagesData.length - 1);
    setSelectedItemId(null);
  }

  function deletePage() {
    const pagesData = [...getPages()];
    if (pagesData.length <= 1) {
      flash("You need at least one page.");
      return;
    }
    pagesData.splice(currentPage, 1);
    updateActiveBook({ ...activeBook, pagesData, pages: pagesData.length, updated: "just now" });
    setCurrentPage(Math.max(0, currentPage - 1));
    setSelectedItemId(null);
    flash("Page deleted 🗑️");
  }

  function handlePointerDown(e, item) {
    if (e.target.classList.contains("resizeHandle")) return;
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    setSelectedItemId(item.id);
    setDragging({ id: item.id, offsetX: e.clientX - rect.left - item.x, offsetY: e.clientY - rect.top - item.y });
  }

  function startResize(e, item, corner) {
    e.stopPropagation();
    setSelectedItemId(item.id);
    setResizing({ id: item.id, corner, startX: e.clientX, startY: e.clientY, item: { ...item } });
  }

  function startDoodle(e) {
    if (mode !== "doodle") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newItem = { id: crypto.randomUUID(), type: "doodle", points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top }], color: "#5A463A" };
    updateCurrentItems([...currentItems(), newItem]);
    setSelectedItemId(newItem.id);
    setDrawing(true);
  }

  function handleCanvasMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();

    if (dragging) {
      const x = e.clientX - rect.left - dragging.offsetX;
      const y = e.clientY - rect.top - dragging.offsetY;
      updateCurrentItems(currentItems().map((item) => item.id === dragging.id ? { ...item, x, y } : item));
    }

    if (resizing) {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;

      updateCurrentItems(currentItems().map((item) => {
        if (item.id !== resizing.id) return item;
        let next = { ...resizing.item };
        if (resizing.corner.includes("r")) next.w = Math.max(30, resizing.item.w + dx);
        if (resizing.corner.includes("l")) { next.w = Math.max(30, resizing.item.w - dx); next.x = resizing.item.x + dx; }
        if (resizing.corner.includes("b")) next.h = Math.max(30, resizing.item.h + dy);
        if (resizing.corner.includes("t")) { next.h = Math.max(30, resizing.item.h - dy); next.y = resizing.item.y + dy; }
        if (next.type === "text" || next.type === "sticker" || next.type === "placeholder") next.fontSize = Math.max(12, Math.round(next.h * 0.35));
        return next;
      }));
    }

    if (drawing && selectedItemId) {
      updateCurrentItems(currentItems().map((item) =>
        item.id === selectedItemId && item.type === "doodle"
          ? { ...item, points: [...(item.points || []), { x: e.clientX - rect.left, y: e.clientY - rect.top }] }
          : item
      ));
    }
  }

  function stopActions() {
    setDragging(null);
    setResizing(null);
    setDrawing(false);
  }

  function renderItem(item) {
    const selected = selectedItemId === item.id;

    if (item.type === "doodle") {
      const d = (item.points || []).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return (
        <svg key={item.id} className="doodleSvg" onClick={() => setSelectedItemId(item.id)}>
          <path d={d} stroke={item.color || "#5A463A"} strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <div
        key={item.id}
        className={`editableItem ${selected ? "selectedEditableItem" : ""} ${item.type === "placeholder" ? "photoPlaceholder" : ""}`}
        style={{ left: item.x, top: item.y, width: item.w, height: item.h, transform: `rotate(${item.rotate || 0}deg)` }}
        onPointerDown={(e) => handlePointerDown(e, item)}
        onClick={() => setSelectedItemId(item.id)}
      >
        {item.type === "photo" && <img src={item.url} alt="" />}
        {item.type === "sticker" && <div className="editableSticker" style={{ fontSize: item.fontSize || 42 }}>{item.text}</div>}
        {(item.type === "text" || item.type === "placeholder") && (
          <div className="editableText" style={{ fontSize: item.fontSize || 24, fontFamily: item.fontFamily || "Georgia", color: item.color || "#5A463A" }}>
            {item.text}
          </div>
        )}

        {selected && (
          <>
            <button className="resizeHandle tl" onPointerDown={(e) => startResize(e, item, "tl")}></button>
            <button className="resizeHandle tr" onPointerDown={(e) => startResize(e, item, "tr")}></button>
            <button className="resizeHandle bl" onPointerDown={(e) => startResize(e, item, "bl")}></button>
            <button className="resizeHandle br" onPointerDown={(e) => startResize(e, item, "br")}></button>
          </>
        )}
      </div>
    );
  }

  async function logout() {
    await signOut(auth);
    flash("Logged out ✨");
  }

  if (section === "create") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Create New Scrapbook</h1>
          <div className="auth-card">
            <input placeholder="Scrapbook title" value={title} onChange={(e) => setTitle(e.target.value)} />
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

          <div className="pageCounter">Page {currentPage + 1} / {getPages().length}</div>

          <div className={`scrapCanvas ${currentPageData().background || "bgGrid"}`} onPointerDown={startDoodle} onPointerMove={handleCanvasMove} onPointerUp={stopActions} onPointerLeave={stopActions}>
            {currentItems().map((item) => renderItem(item))}
          </div>

          <div className="toolPanel fixedTools">
            <label>🖼️<span>Photo</span><input type="file" accept="image/*" hidden onChange={uploadPhoto} /></label>
            <button onClick={addSticker}>💬<span>Sticker</span></button>
            <button onClick={addText}>𝑇<span>Text</span></button>
            <button onClick={() => setMode(mode === "doodle" ? "select" : "doodle")}>✎<span>Doodle</span></button>
            <button onClick={deleteSelected}>🗑️<span>Delete</span></button>
          </div>

          <div className="fontControls">
            <button onClick={() => changeSelectedFontSize(-4)}>A-</button>
            <button onClick={() => changeSelectedFontSize(4)}>A+</button>
            <button onClick={() => changeBackground("bgGrid")}>Grid</button>
            <button onClick={() => changeBackground("bgDots")}>Dots</button>
            <button onClick={() => changeBackground("bgPaper")}>Paper</button>
            <button onClick={() => changeBackground("bgLavender")}>Lavender</button>
            <button onClick={() => changeBackground("bgFloral")}>Floral</button>
          </div>

          <div className="pageStrip">
            {getPages().map((page, index) => (
              <div key={index} className={index === currentPage ? "pageThumb activePageThumb" : "pageThumb"} onClick={() => { setCurrentPage(index); setSelectedItemId(null); }}>
                <div>📔</div><small>{index + 1}</small>
              </div>
            ))}
            <button className="addPageBtn" onClick={addPage}>＋</button>
            <button className="deletePageBtn" onClick={deletePage}>Delete Page</button>
          </div>
        </div>
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="phone">
        <div className="screen paper auth-page">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Settings ⚙️</h1>
          <div className="settings-card">
            <div className="setting-row"><div><h3>Profile 👤</h3><p>View account info.</p></div><button onClick={() => setSection("profile")}>Open</button></div>
            <div className="setting-row"><div><h3>Templates 📚</h3><p>Browse templates.</p></div><button onClick={() => setSection("templates")}>Open</button></div>
            <div className="setting-row"><div><h3>Logout 🚪</h3><p>Sign out.</p></div><button onClick={logout}>Logout</button></div>
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

  if (section === "templates") {
    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>← Back</button>
          <h1>Templates</h1>
          <button className="templateHomeCard" onClick={createBabyFirstYearTemplate}>
            <div className="templateIcon">🎀</div>
            <div><h2>Baby’s First Year Girl</h2><p>Create all 16 editable pages</p></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="phone">
      <div className="screen paper homeLikeScreenshot">
        <div className="homeHeader">
          <button className="circleBtn" onClick={() => setSection("settings")}>⚙️</button>
          <div className="headerIcons"><button className="circleBtn">👑</button><button className="circleBtn" onClick={() => flash("No notifications 🔔")}>🔔</button></div>
        </div>

        <div className="brandLogo">Pocket<span>Scrapbook</span></div>
        <p className="homeTagline">Turn your memories into<br />beautiful stories 💗</p>

        <div className="decorPolaroid"><span className="flower">🌼</span><div className="miniPhoto">🌅</div><span className="butterfly">🦋</span><span className="heart">💗</span></div>

        <button className="bigCreateCard" onClick={() => setSection("create")}>
          <div className="bigPlus">＋</div><div><h2>Create New Scrapbook</h2><p>Start a new scrapbook</p></div><div className="bookArt">📔</div>
        </button>

        <button className="templateHomeCard" onClick={createBabyFirstYearTemplate}>
          <div className="templateIcon">🎀</div><div><h2>Baby’s First Year Girl</h2><p>Create all 16 editable pages</p></div>
        </button>

        <div className="row"><h2>My Scrapbooks</h2><button className="seeAll" onClick={() => flash("Showing all scrapbooks")}>See All ›</button></div>

        {loading ? <p className="muted">Loading scrapbooks...</p> : books.length === 0 ? <p className="muted">No scrapbooks yet. Create your first one 💕</p> : books.map((book) => (
          <div className="scrapBookRow" key={book.id}>
            <div className="bookCover">{book.cover || "📔"}</div>
            <div className="bookInfo" onClick={() => openBook(book)}><h3>{book.title}</h3><p>{book.updated || "Updated just now"}</p></div>
            <div className="bookMeta">
              <button className="dots" onClick={() => setOpenMenuId(openMenuId === book.id ? null : book.id)}>⋯</button>
              <span>{book.pages || 1} Pages</span>
              {openMenuId === book.id && <div className="miniMenu"><button onClick={() => openBook(book)}>Edit</button><button onClick={() => exportBook(book)}>Export</button><button onClick={() => deleteBook(book)}>Delete</button></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="bottom">
        <button onClick={() => setSection("home")}>🏠<br />Home</button>
        <button onClick={() => setSection("templates")}>📖<br />Templates</button>
        <button className="plus" onClick={() => setSection("create")}>＋</button>
        <button onClick={() => setSection("profile")}>♡<br />Profile</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
