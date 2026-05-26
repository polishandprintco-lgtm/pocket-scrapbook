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

function makeId() {
  return crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function blankPage(bg = "bgGrid") {
  return {
    background: bg,
    items: []
  };
}

function cloneBook(book) {
  return JSON.parse(JSON.stringify(book));
}

function App() {
  const [page, setPage] = useState("welcome");
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);

  function flash(message) {
    setToast(message);
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
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="passwordWrap">
            <input
              placeholder="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />

            <button className="showBtn" onClick={() => setShowPass(!showPass)}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>

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
  const [showPass, setShowPass] = useState(false);

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

          <div className="passwordWrap">
            <input
              placeholder="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />

            <button className="showBtn" onClick={() => setShowPass(!showPass)}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>

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
  const [editorMenuOpen, setEditorMenuOpen] = useState(false);
  const [backgroundMenuOpen, setBackgroundMenuOpen] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  
  const STICKERS = [
    { id: "bow", text: "🎀" },
    { id: "bear", text: "🧸" },
    { id: "bottle", text: "🍼" },
    { id: "moon", text: "🌙" },
    { id: "star", text: "⭐" },
    { id: "heart", text: "💗" },
    { id: "flower", text: "🌸" },
    { id: "butterfly", text: "🦋" },
    { id: "baby", text: "👶" },
    { id: "bunny", text: "🐰" },
    { id: "duck", text: "🦆" },
    { id: "cloud", text: "☁️" },
    { id: "sparkle", text: "✨" },
    { id: "gift", text: "🎁" }
  ];

  const BACKGROUNDS = [
    { id: "pinkPlaid", className: "bgBabyPinkPlaid", label: "Pink Plaid" },
    { id: "bluePlaid", className: "bgBabyBluePlaid", label: "Blue Plaid" },
    { id: "grid", className: "bgGrid", label: "Grid" },
    { id: "dots", className: "bgDots", label: "Dots" },
    { id: "paper", className: "bgPaper", label: "Paper" },
    { id: "lavender", className: "bgLavender", label: "Lavender" },
    { id: "floral", className: "bgFloral", label: "Floral" },
    { id: "softPink", className: "bgSoftPink", label: "Soft Pink" }
  ];

  async function loadBooks() {
    if (!user) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, "scrapbooks"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      setBooks(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((b) => b.uid === user.uid)
      );
    } catch (e) {
      flash("Could not load scrapbooks: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, [user]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedItemId &&
        section === "editor"
      ) {
        e.preventDefault();
        updateCurrentItems(
          currentItems().filter((item) => item.id !== selectedItemId)
        );
        setSelectedItemId(null);
        flash("Deleted 🗑️");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItemId, activeBook, currentPage, section]);

  function getPages() {
    return activeBook?.pagesData?.length
      ? activeBook.pagesData
      : [blankPage()];
  }

  function currentPageData() {
    return getPages()[currentPage] || blankPage();
  }

  function currentItems() {
    return currentPageData().items || [];
  }

  function applyBook(nextBook) {
    setActiveBook(nextBook);
    setBooks((old) =>
      old.map((b) => (b.id === nextBook.id ? nextBook : b))
    );
  }

  function rememberUndo() {
    if (!activeBook) return;
    setUndoStack((old) => [cloneBook(activeBook), ...old].slice(0, 30));
    setRedoStack([]);
  }

  function updateCurrentPage(nextPage, remember = true) {
    if (remember) rememberUndo();

    const pagesData = [...getPages()];
    pagesData[currentPage] = nextPage;

    applyBook({
      ...activeBook,
      pagesData,
      pages: pagesData.length,
      updated: "just now"
    });
  }

  function updateCurrentItems(nextItems, remember = true) {
    updateCurrentPage(
      {
        ...currentPageData(),
        items: nextItems
      },
      remember
    );
  }

  function undo() {
    if (!undoStack.length || !activeBook) {
      flash("Nothing to undo");
      return;
    }

    const previous = undoStack[0];
    setRedoStack((old) => [cloneBook(activeBook), ...old].slice(0, 30));
    setUndoStack((old) => old.slice(1));
    applyBook(previous);
    setCurrentPage(Math.min(currentPage, previous.pagesData.length - 1));
    setSelectedItemId(null);
  }

  function redo() {
    if (!redoStack.length || !activeBook) {
      flash("Nothing to redo");
      return;
    }

    const next = redoStack[0];
    setUndoStack((old) => [cloneBook(activeBook), ...old].slice(0, 30));
    setRedoStack((old) => old.slice(1));
    applyBook(next);
    setCurrentPage(Math.min(currentPage, next.pagesData.length - 1));
    setSelectedItemId(null);
  }

  function changeBackground(backgroundClass) {
    updateCurrentPage({
      ...currentPageData(),
      background: backgroundClass
    });

    setBackgroundMenuOpen(false);
    flash("Background changed 🎨");
  }

  function templateDefaultBg() {
    if (activeBook?.templateType === "babyBoy") return "bgBabyBluePlaid";
    if (activeBook?.templateType === "babyGirl") return "bgBabyPinkPlaid";
    return currentPageData().background || "bgGrid";
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
        templateType: "blank",
        pagesData: [blankPage()]
      };

      const docRef = await addDoc(collection(db, "scrapbooks"), data);
      const newBook = { id: docRef.id, ...data };

      setBooks([newBook, ...books]);
      setTitle("");
      setActiveBook(newBook);
      setUndoStack([]);
      setRedoStack([]);
      setCurrentPage(0);
      setSelectedItemId(null);
      setSection("editor");
      flash("Scrapbook created 💖");
    } catch (e) {
      flash("Create error: " + e.message);
    }
  }

  async function createBabyTemplate(gender) {
    try {
      const isBoy = gender === "boy";
      const bg = isBoy ? "bgBabyBluePlaid" : "bgBabyPinkPlaid";
      const accent = isBoy ? "#7ba7d9" : "#e96d9b";
      const bow = isBoy ? "🧸" : "🎀";

      const t = (text, x, y, w = 120, h = 40, fontSize = 20, rotate = 0) => ({
        id: makeId(),
        type: "text",
        text,
        x,
        y,
        w,
        h,
        fontSize,
        fontFamily: "Georgia",
        color: "#4d392f",
        rotate
      });

      const s = (text, x, y, size = 34, rotate = 0) => ({
        id: makeId(),
        type: "sticker",
        text,
        x,
        y,
        w: size + 14,
        h: size + 14,
        fontSize: size,
        rotate
      });

      const p = (x, y, w = 130, h = 150, rotate = 0) => ({
        id: makeId(),
        type: "placeholder",
        text: "Add Photo",
        x,
        y,
        w,
        h,
        fontSize: 18,
        color: accent,
        rotate
      });

      const note = (text, x, y, w = 120, h = 50, rotate = 0) => ({
        id: makeId(),
        type: "text",
        text,
        x,
        y,
        w,
        h,
        fontSize: 15,
        fontFamily: "Georgia",
        color: "#7a5a4f",
        rotate
      });

      const page = (items) => ({
        background: bg,
        items
      });

      const pagesData = [
        page([
          s(bow, 10, 10, 42, -10),
          t("baby's\nfirst year\n♡", 55, 40, 150, 100, 26),
          note(isBoy ? "our little boy" : "our little girl", 245, 95, 120, 40, -2),
          p(35, 170, 135, 155, -2),
          p(210, 170, 95, 110, 5),
          note("so much\nlove\n♡", 230, 290, 100, 65, -2),
          s("♡", 45, 330, 34),
          s("🌸", 345, 250, 34),
          s("🌿", 350, 320, 32)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("hello\nworld\n♡", 45, 50, 130, 90, 24),
          note("the day\nyou were born ♡", 185, 160, 140, 55),
          t("date: __________", 45, 235, 180, 24, 13),
          t("time: __________", 45, 260, 180, 24, 13),
          t("weight: ________", 45, 285, 180, 24, 13),
          t("length: ________", 45, 310, 180, 24, 13),
          p(215, 45, 155, 185, 3),
          s("🌿", 300, 280, 34),
          s("♡", 345, 320, 32)
        ]),
        page([
          s(bow, 12, 12, 42, -10),
          t("tiny\nhands\nbig\nlove\n♡", 45, 85, 110, 140, 22),
          p(190, 55, 165, 210, -3),
          s("♡", 325, 265, 38),
          s("🌸", 70, 260, 32),
          s("🌿", 65, 300, 36)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("1\nmonth", 50, 50, 90, 75, 25),
          p(225, 45, 145, 150, 0),
          note("you are\nso loved\n♡", 140, 205, 110, 70),
          t("______________", 230, 265, 130, 30, 14),
          t("______________", 230, 295, 130, 30, 14),
          s("🌸", 35, 250, 34),
          s("🌿", 35, 305, 34),
          s("♡", 315, 320, 28)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("2\nmonths", 45, 55, 100, 75, 25),
          p(160, 95, 115, 135, -3),
          p(245, 80, 115, 135, 4),
          note("growing\nso fast ♡", 165, 285, 150, 50),
          s("♡", 40, 260, 36),
          s("🌿", 340, 260, 34)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("3\nmonths", 45, 55, 100, 75, 25),
          p(220, 70, 145, 150, 0),
          note(isBoy ? "sweet boy ♡" : "sweet girl ♡", 230, 290, 130, 45),
          s("🧸", 100, 215, 45),
          s("♡", 330, 65, 32),
          s("🌿", 330, 255, 34)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("4\nmonths", 45, 55, 100, 75, 25),
          p(185, 80, 145, 150, 0),
          note("so happy ♡", 195, 290, 140, 45),
          s("♡", 50, 260, 38),
          s("🍼", 330, 90, 36),
          s("🌿", 340, 250, 34)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("5\nmonths", 45, 55, 100, 75, 25),
          p(120, 200, 120, 140, -4),
          p(255, 105, 125, 145, 2),
          s("♡", 235, 290, 40),
          s("🌸", 350, 90, 36),
          s("🌿", 340, 220, 34)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("6\nmonths", 45, 55, 100, 75, 25),
          p(125, 120, 175, 150, 0),
          note("little\nblessing\n♡", 45, 290, 110, 70),
          s("🐰", 315, 170, 52),
          s("🌸", 45, 345, 34)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("7\nmonths", 45, 55, 100, 75, 25),
          p(155, 90, 115, 145, 0),
          p(285, 90, 115, 145, 0),
          note("cutest\nsmile ♡", 300, 290, 100, 55),
          s("♡", 90, 295, 36),
          s("♡", 160, 310, 36),
          s("🌿", 335, 235, 34)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("8\nmonths", 45, 55, 100, 75, 25),
          p(160, 90, 120, 155, -4),
          t("______________", 285, 90, 120, 25, 14),
          t("______________", 285, 120, 120, 25, 14),
          t("______________", 285, 150, 120, 25, 14),
          note("learning\n& growing ♡", 290, 285, 110, 55),
          s("🌸", 55, 280, 38),
          s("♡", 55, 340, 32)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("9\nmonths", 45, 55, 100, 75, 25),
          p(180, 105, 140, 150, 0),
          p(325, 115, 105, 115, 3),
          note("so\ncurious\n♡", 340, 285, 95, 60),
          s("♡", 115, 300, 38),
          s("🌿", 75, 235, 34)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("10\nmonths", 45, 55, 110, 75, 25),
          p(155, 115, 125, 165, 4),
          t("______________", 300, 105, 120, 25, 14),
          t("______________", 300, 140, 120, 25, 14),
          t("______________", 300, 175, 120, 25, 14),
          note("so much\njoy ♡", 65, 310, 105, 55),
          s("🌸", 35, 330, 34),
          s("♡", 300, 70, 32)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("11\nmonths", 45, 55, 110, 75, 25),
          p(155, 105, 145, 180, -4),
          p(310, 115, 120, 145, 4),
          note("almost\none! ♡", 330, 310, 95, 55),
          s("♡", 290, 330, 32)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("12\nmonths", 45, 55, 110, 75, 25),
          p(170, 105, 120, 160, 0),
          t("______________", 305, 90, 120, 25, 14),
          t("______________", 305, 125, 120, 25, 14),
          t("______________", 305, 160, 120, 25, 14),
          note("what a\nyear ♡", 310, 310, 95, 55),
          s("🌸", 50, 330, 34),
          s("♡", 300, 70, 32)
        ]),
        page([
          s(bow, 15, 15, 42, -10),
          t("one\nyear\nof you\n♡", 60, 80, 120, 140, 24),
          p(235, 105, 160, 190, -3),
          note("our greatest\nblessing ♡", 295, 320, 130, 50),
          s("♡", 80, 300, 42),
          s("🌿", 205, 260, 34),
          s("♡", 350, 70, 30)
        ])
      ];

      const data = {
        uid: user.uid,
        title: isBoy ? "Baby’s First Year (Boy)" : "Baby’s First Year (Girl)",
        pages: pagesData.length,
        cover: isBoy ? "🧸" : "🎀",
        updated: "just now",
        createdAt: serverTimestamp(),
        templateType: isBoy ? "babyBoy" : "babyGirl",
        pagesData
      };

      const docRef = await addDoc(collection(db, "scrapbooks"), data);
      const newBook = { id: docRef.id, ...data };

      setBooks([newBook, ...books]);
      setActiveBook(newBook);
      setUndoStack([]);
      setRedoStack([]);
      setCurrentPage(0);
      setSelectedItemId(null);
      setSection("editor");
      flash(`${data.title} created 💖`);
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

  function exportBook(book = activeBook) {
    if (!book) return;

    const data = JSON.stringify(book, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${book.title || "scrapbook"}.json`;
    a.click();

    URL.revokeObjectURL(url);
    setEditorMenuOpen(false);
    flash("Export downloaded 💌");
  }

  function openBook(book) {
    setActiveBook({
      ...book,
      pagesData: book.pagesData?.length ? book.pagesData : [blankPage()],
      templateType: book.templateType || "blank"
    });

    setUndoStack([]);
    setRedoStack([]);
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
        updated: "just now",
        templateType: activeBook.templateType || "blank"
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
      rememberUndo();

      const storageRef = ref(
        storage,
        `users/${user.uid}/scrapbooks/${activeBook.id}/${Date.now()}-${file.name}`
      );

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newItem = {
        id: makeId(),
        type: "photo",
        url,
        x: 55,
        y: 175,
        w: 140,
        h: 170,
        rotate: 0
      };

      updateCurrentItems([...currentItems(), newItem], false);
      setSelectedItemId(newItem.id);
      flash("Photo added 📷");
    } catch (e) {
      flash("Photo upload failed: " + e.message);
    }
  }

  async function uploadPhotoToPlaceholder(e, placeholderId) {
    const file = e.target.files?.[0];

    if (!file || !activeBook?.id || !user) return;

    try {
      rememberUndo();

      const storageRef = ref(
        storage,
        `users/${user.uid}/scrapbooks/${activeBook.id}/${Date.now()}-${file.name}`
      );

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      updateCurrentItems(
        currentItems().map((item) =>
          item.id === placeholderId
            ? {
                ...item,
                type: "photo",
                url,
                text: "",
                rotate: item.rotate || 0
              }
            : item
        ),
        false
      );

      setSelectedItemId(placeholderId);
      flash("Photo added 💖");
    } catch (e) {
      flash("Photo upload failed: " + e.message);
    }
  }

  function addText() {
    const text = prompt("Enter your text:");
    if (!text) return;

    const newItem = {
      id: makeId(),
      type: "text",
      text,
      x: 90,
      y: 120,
      w: 180,
      h: 70,
      fontSize: 24,
      fontFamily: "Georgia",
      color: "#5A463A",
      rotate: 0
    };

    updateCurrentItems([...currentItems(), newItem]);
    setSelectedItemId(newItem.id);
  }

  function addSticker(sticker) {
    const newSticker = {
      id: makeId(),
      type: "sticker",
      text: sticker.text,
      x: 120,
      y: 120,
      w: 80,
      h: 80,
      fontSize: 52,
      rotate: 0
    };

    updateCurrentItems([...currentItems(), newSticker]);
    setSelectedItemId(newSticker.id);
  }

  function StickerPicker() {
    return (
      <div className="stickerGrid">
        {STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            className="stickerButton"
            onClick={() => addSticker(sticker)}
          >
            <span style={{ fontSize: 38 }}>{sticker.text}</span>
          </button>
        ))}
      </div>
    );
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

  function rotateSelected(amount) {
    if (!selectedItemId) {
      flash("Tap something first.");
      return;
    }

    updateCurrentItems(
      currentItems().map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              rotate: (item.rotate || 0) + amount
            }
          : item
      )
    );
  }

  function changeSelectedFontSize(amount) {
    if (!selectedItemId) {
      flash("Tap text or a sticker first 💕");
      return;
    }

    updateCurrentItems(
      currentItems().map((item) =>
        item.id === selectedItemId &&
        (item.type === "text" || item.type === "sticker" || item.type === "placeholder")
          ? { ...item, fontSize: Math.max(12, (item.fontSize || 24) + amount) }
          : item
      )
    );
  }

  function addPage() {
    const pagesData = [...getPages(), blankPage(templateDefaultBg())];

    rememberUndo();

    applyBook({
      ...activeBook,
      pagesData,
      pages: pagesData.length,
      updated: "just now"
    });

    setCurrentPage(pagesData.length - 1);
    setSelectedItemId(null);
  }

  function deletePage() {
    const pagesData = [...getPages()];

    if (pagesData.length <= 1) {
      flash("You need at least one page.");
      return;
    }

    rememberUndo();
    pagesData.splice(currentPage, 1);

    applyBook({
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

    rememberUndo();

    setSelectedItemId(item.id);
    setDragging({
      id: item.id,
      offsetX: e.clientX - rect.left - item.x,
      offsetY: e.clientY - rect.top - item.y
    });
  }

  function startResize(e, item, corner) {
    e.stopPropagation();

    rememberUndo();

    setSelectedItemId(item.id);
    setResizing({
      id: item.id,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      item: { ...item }
    });
  }

  function handleCanvasMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();

    if (dragging) {
      const x = e.clientX - rect.left - dragging.offsetX;
      const y = e.clientY - rect.top - dragging.offsetY;

      updateCurrentItems(
        currentItems().map((item) =>
          item.id === dragging.id ? { ...item, x, y } : item
        ),
        false
      );
    }

    if (resizing) {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;

      updateCurrentItems(
        currentItems().map((item) => {
          if (item.id !== resizing.id) return item;

          let next = { ...resizing.item };

          if (resizing.corner.includes("r")) next.w = Math.max(30, resizing.item.w + dx);
          if (resizing.corner.includes("l")) {
            next.w = Math.max(30, resizing.item.w - dx);
            next.x = resizing.item.x + dx;
          }
          if (resizing.corner.includes("b")) next.h = Math.max(30, resizing.item.h + dy);
          if (resizing.corner.includes("t")) {
            next.h = Math.max(30, resizing.item.h - dy);
            next.y = resizing.item.y + dy;
          }

          if (next.type === "text" || next.type === "sticker" || next.type === "placeholder") {
            next.fontSize = Math.max(12, Math.round(next.h * 0.35));
          }

          return next;
        }),
        false
      );
    }
  }

  function stopActions() {
    setDragging(null);
    setResizing(null);
  }

  function renderItem(item, preview = false) {
    const selected = !preview && selectedItemId === item.id;

    return (
      <div
        key={item.id}
        className={`editableItem ${selected ? "selectedEditableItem" : ""} ${
          item.type === "placeholder" ? "photoPlaceholder" : ""
        } ${preview ? "flipItem" : ""}`}
        style={{
          left: item.x,
          top: item.y,
          width: item.w,
          height: item.h,
          transform: `rotate(${item.rotate || 0}deg)`
        }}
        onPointerDown={(e) => !preview && item.type !== "placeholder" && handlePointerDown(e, item)}
        onClick={() => !preview && setSelectedItemId(item.id)}
      >
        {item.type === "photo" && <img src={item.url} alt="" />}

        {item.type === "sticker" && (
          <div
            className="editableSticker"
            style={{ fontSize: item.fontSize || 42 }}
          >
            {item.text}
          </div>
        )}

        {item.type === "placeholder" && !preview && (
          <label className="clickablePhotoBox">
            <span>Add Photo</span>

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => uploadPhotoToPlaceholder(e, item.id)}
            />
          </label>
        )}

        {item.type === "placeholder" && preview && (
          <div
            className="editableText"
            style={{
              fontSize: item.fontSize || 18,
              fontFamily: item.fontFamily || "Georgia",
              color: item.color || "#e96d9b"
            }}
          >
            Add Photo
          </div>
        )}

        {item.type === "text" && (
          <div
            className="editableText"
            style={{
              fontSize: item.fontSize || 24,
              fontFamily: item.fontFamily || "Georgia",
              color: item.color || "#5A463A"
            }}
          >
            {item.text}
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

  async function logout() {
    await signOut(auth);
    flash("Logged out ✨");
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

  if (section === "flipbook") {
    return (
      <div className="phone">
        <div className="screen paper flipbookScreen">
          <div className="flipbookTop">
            <button className="plainIcon" onClick={() => setSection("editor")}>
              ‹
            </button>

            <div>
              <h2>{activeBook?.title || "Flipbook"}</h2>
              <p>{getPages().length} pages</p>
            </div>

            <button className="plainIcon" onClick={() => exportBook(activeBook)}>
              ⋯
            </button>
          </div>

          <div className={`flipbookCanvas ${currentPageData().background || "bgGrid"}`}>
            {currentItems().map((item) => renderItem(item, true))}
          </div>

          <div className="flipPageCount">
            {currentPage + 1} / {getPages().length}
          </div>

          <div className="flipControls">
            <button onClick={() => setCurrentPage(0)}>▦<br />First</button>

            <button
              className="flipArrow"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            >
              ←
            </button>

            <button
              className="flipArrow"
              onClick={() =>
                setCurrentPage(Math.min(getPages().length - 1, currentPage + 1))
              }
            >
              →
            </button>

            <button onClick={() => flash("Autoplay coming soon ▶")}>
              ▶<br />Autoplay
            </button>
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

            <button className="plainIcon" onClick={undo}>↶</button>
            <button className="plainIcon" onClick={redo}>↷</button>

            <button className="savePill" onClick={saveBook}>
              Save
            </button>

            <div className="editorMenuWrap">
              <button
                className="plainIcon"
                onClick={() => setEditorMenuOpen(!editorMenuOpen)}
              >
                ⋯
              </button>

              {editorMenuOpen && (
                <div className="miniMenu editorMenu">
                  <button
                    onClick={() => {
                      setEditorMenuOpen(false);
                      setSection("flipbook");
                    }}
                  >
                    View Flipbook
                  </button>

                  <button onClick={() => exportBook(activeBook)}>
                    Export
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pageCounter">
            Page {currentPage + 1} / {getPages().length}
          </div>

          <div
            className={`scrapCanvas ${currentPageData().background || "bgGrid"}`}
            onPointerMove={handleCanvasMove}
            onPointerUp={stopActions}
            onPointerLeave={stopActions}
          >
            {currentItems().map((item) => renderItem(item))}
          </div>

          <div className="toolPanel fixedTools">
            <label>
              🖼️
              <span>Photo</span>
              <input type="file" accept="image/*" hidden onChange={uploadPhoto} />
            </label>

            <button onClick={() => setShowStickerPicker(!showStickerPicker)}>
              💬
              <span>Sticker</span>
            </button>

            <button onClick={addText}>
              𝑇
              <span>Text</span>
            </button>

            <div className="backgroundPickerWrap">
              <button onClick={() => setBackgroundMenuOpen(!backgroundMenuOpen)}>
                🎨
                <span>Background</span>
              </button>

              {backgroundMenuOpen && (
                <div className="backgroundPicker">
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      className={`backgroundOption ${bg.className}`}
                      onClick={() => changeBackground(bg.className)}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={deleteSelected}>
              🗑️
              <span>Delete</span>
            </button>
          </div>

          {showStickerPicker && <StickerPicker />}

          <div className="fontControls">
            <button onClick={() => changeSelectedFontSize(-4)}>A-</button>
            <button onClick={() => changeSelectedFontSize(4)}>A+</button>
            <button onClick={() => rotateSelected(-10)}>⟲ Rotate</button>
            <button onClick={() => rotateSelected(10)}>⟳ Rotate</button>
          </div>

          <div className="pageStrip">
            {getPages().map((page, index) => (
              <div
                key={index}
                className={
                  index === currentPage ? "pageThumb activePageThumb" : "pageThumb"
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
                <p>Sign out.</p>
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

  if (section === "templates") {
    return (
      <div className="phone">
        <div className="screen paper">
          <button className="text-btn" onClick={() => setSection("home")}>
            ← Back
          </button>

          <h1>Templates</h1>

          <button
  className="templateHomeCard"
  onClick={() => {
    if (!hasSubscription) {
      setSection("subscription");
      return;
    }

    createBabyTemplate("girl");
  }}
>
  <div className="templateIcon">🎀</div>
  <div>
    <h2>Baby’s First Year Girl</h2>
    <p>Premium template</p>
  </div>
</button>

<button
  className="templateHomeCard"
  onClick={() => {
    if (!hasSubscription) {
      setSection("subscription");
      return;
    }

    createBabyTemplate("boy");
  }}
>
  <div className="templateIcon">🧸</div>
  <div>
    <h2>Baby’s First Year Boy</h2>
    <p>Premium template</p>
  </div>
</button>

 <button
  className="templateHomeCard"
  onClick={() => {
    if (!hasSubscription) {
      setSection("subscription");
      return;
    }

    createBabyTemplate("girl");
  }}
>
  <div className="templateIcon">🎀</div>
  <div>
    <h2>Baby’s First Year Girl</h2>
    <p>Premium template</p>
  </div>
</button>

<button
  className="templateHomeCard"
  onClick={() => {
    if (!hasSubscription) {
      setSection("subscription");
      return;
    }

    createBabyTemplate("boy");
  }}
>
  <div className="templateIcon">🧸</div>
  <div>
    <h2>Baby’s First Year Boy</h2>
    <p>Premium template</p>
  </div>
</button>         
  return (
    <div className="phone">
      <div className="screen paper homeLikeScreenshot">
        <div className="homeHeader">
          <button className="circleBtn" onClick={() => setSection("settings")}>
            ⚙️
          </button>

          <div className="headerIcons">
            <button className="circleBtn">👑</button>
            <button className="circleBtn" onClick={() => flash("No notifications 🔔")}>
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

        <button className="bigCreateCard" onClick={() => setSection("create")}>
          <div className="bigPlus">＋</div>
          <div>
            <h2>Create New Scrapbook</h2>
            <p>Start a new scrapbook</p>
          </div>
          <div className="bookArt">📔</div>
        </button>

        <button className="templateHomeCard" onClick={() => createBabyTemplate("girl")}>
          <div className="templateIcon">🎀</div>
          <div>
            <h2>Baby’s First Year Girl</h2>
            <p>Create 16 editable pages</p>
          </div>
        </button>

        <button className="templateHomeCard" onClick={() => createBabyTemplate("boy")}>
          <div className="templateIcon">🧸</div>
          <div>
            <h2>Baby’s First Year Boy</h2>
            <p>Create 16 editable pages</p>
          </div>
        </button>

        <div className="row">
          <h2>My Scrapbooks</h2>
          <button className="seeAll" onClick={() => flash("Showing all scrapbooks")}>
            See All ›
          </button>
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
              </div>

              <div className="bookMeta">
                <button
                  className="dots"
                  onClick={() => setOpenMenuId(openMenuId === book.id ? null : book.id)}
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

        <button onClick={() => setSection("templates")}>
          📖
          <br />
          Templates
        </button>

        <button className="plus" onClick={() => setSection("create")}>
          ＋
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
