import React, { useEffect, useState } from "react";
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

function makeId() {
  return crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

const BACKGROUNDS = [
  { name: "Cream Paper", value: "cream" },
  { name: "Pink Gingham", value: "pinkGingham" },
  { name: "Blue Gingham", value: "blueGingham" },
  { name: "Lavender", value: "lavender" },
  { name: "Notebook Paper", value: "paper" },
  { name: "Dots", value: "dots" },
  { name: "Grid", value: "grid" },
];

const BASIC_STICKERS = [
  { name: "Pink Heart", icon: "♡", className: "sticker-heart-pink" },
  { name: "Love Heart", icon: "♥", className: "sticker-heart-red" },
  { name: "Bow", icon: "🎀", className: "sticker-soft" },
  { name: "Daisy", icon: "✿", className: "sticker-soft" },
  { name: "Star", icon: "⭐", className: "sticker-soft" },
  { name: "Bear", icon: "🧸", className: "sticker-soft" },
  { name: "Butterfly", icon: "🦋", className: "sticker-soft" },
  { name: "Flower Stem", icon: "⌇✿", className: "sticker-doodle" },
  { name: "Tape", icon: "▰", className: "sticker-tape" },
  { name: "Label", icon: "memo", className: "sticker-label" },
  { name: "Polaroid Frame", icon: "▢", className: "sticker-frame" },
  { name: "Leaf", icon: "❧", className: "sticker-doodle" },
  { name: "Camera", icon: "📷", className: "sticker-soft" },
  { name: "Plane", icon: "✈", className: "sticker-soft" },
  { name: "Paw", icon: "🐾", className: "sticker-soft" },
];

const PREMIUM_STICKERS = [
  { name: "Baby Bottle", icon: "🍼", className: "sticker-soft", premium: true },
  { name: "Baby", icon: "👶", className: "sticker-soft", premium: true },
  { name: "Blue Bow", icon: "🎀", className: "sticker-blue", premium: true },
  { name: "Pink Rattle", icon: "🧸", className: "sticker-pink", premium: true },
];

const FONT_OPTIONS = [
  "Georgia",
  "Arial",
  "Courier New",
  "Times New Roman",
  "Trebuchet MS",
  "Comic Sans MS",
  "Brush Script MT",
];

const COLOR_OPTIONS = [
  "#2d2525",
  "#d96f94",
  "#7e9fc4",
  "#8d78b8",
  "#b58c62",
  "#ffffff",
];

const PREMIUM_PACKS = [
  {
    title: "Baby First Year Pack",
    price: "$4.99",
    description: "Baby boy and baby girl first-year scrapbook templates.",
  },
  {
    title: "Premium Sticker Pack",
    price: "$2.99",
    description: "Extra baby, travel, love, labels, frames, and cozy stickers.",
  },
  {
    title: "All Access",
    price: "$9.99",
    description: "All templates, all stickers, and advanced text effects.",
  },
];

function createText(text, x, y, options = {}) {
  return {
    id: makeId(),
    type: "text",
    text,
    x,
    y,
    w: options.w || 210,
    h: options.h || 70,
    rotate: options.rotate || 0,
    fontSize: options.fontSize || 26,
    fontFamily: options.fontFamily || "Georgia",
    color: options.color || "#2d2525",
    bold: options.bold || false,
    underline: options.underline || false,
    curve: options.curve || false,
  };
}

function createSticker(sticker, x, y) {
  return {
    id: makeId(),
    type: "sticker",
    stickerName: sticker.name,
    stickerClass: sticker.className,
    text: sticker.icon,
    x,
    y,
    w: 64,
    h: 64,
    rotate: 0,
    fontSize: 36,
  };
}

function createPhoto(x, y, options = {}) {
  return {
    id: makeId(),
    type: "photo",
    src: options.src || "",
    x,
    y,
    w: options.w || 210,
    h: options.h || 210,
    rotate: options.rotate || 0,
    crop: "cover",
    cropX: 50,
    cropY: 50,
  };
}

function createNote(text, x, y, color = "pink") {
  return {
    id: makeId(),
    type: "note",
    text,
    noteColor: color,
    x,
    y,
    w: 160,
    h: 70,
    rotate: -2,
    fontSize: 16,
  };
}

function makeMyFirstScrapbookTemplate() {
  return {
    title: "My First Scrapbook",
    background: "cream",
    freeTemplate: true,
    pages: [
      {
        id: makeId(),
        title: "About Me",
        background: "cream",
        elements: [
          createText("About Me ♡", 95, 24, {
            w: 230,
            h: 55,
            fontSize: 34,
            fontFamily: "Brush Script MT",
          }),
          createPhoto(44, 105, { w: 155, h: 155 }),
          createNote("Some of my favorite things:\nColor:\nFood:\nBook:\nSong:", 220, 110, "cream"),
          createText("My name:\nBirthday:\nWhere I was born:\nCurrently I live in:", 42, 285, {
            w: 300,
            h: 140,
            fontSize: 15,
            fontFamily: "Courier New",
          }),
          createSticker(BASIC_STICKERS[7], 300, 305),
          createSticker(BASIC_STICKERS[8], 240, 420),
        ],
      },
      {
        id: makeId(),
        title: "My Family",
        background: "cream",
        elements: [
          createText("My Family ♡", 95, 24, {
            w: 230,
            h: 55,
            fontSize: 34,
            fontFamily: "Brush Script MT",
          }),
          createPhoto(44, 100, { w: 170, h: 150 }),
          createNote("About my family:\n\n\n\n", 225, 105, "cream"),
          createText("The people I love most:", 98, 280, {
            w: 250,
            h: 40,
            fontSize: 17,
            fontFamily: "Courier New",
          }),
          createPhoto(65, 330, { w: 90, h: 95 }),
          createPhoto(170, 330, { w: 90, h: 95 }),
          createPhoto(275, 330, { w: 90, h: 95 }),
        ],
      },
      {
        id: makeId(),
        title: "My Best Friends",
        background: "cream",
        elements: [
          createText("My Best Friends ♡", 70, 24, {
            w: 280,
            h: 55,
            fontSize: 33,
            fontFamily: "Brush Script MT",
          }),
          createText("Friends are the family we choose ♡", 95, 78, {
            w: 250,
            h: 40,
            fontSize: 16,
            fontFamily: "Courier New",
          }),
          createPhoto(70, 140, { w: 130, h: 170 }),
          createPhoto(225, 140, { w: 130, h: 170 }),
          createText("Name:\nWe met:", 80, 320, {
            w: 120,
            h: 70,
            fontSize: 14,
            fontFamily: "Courier New",
          }),
          createText("Name:\nWe met:", 235, 320, {
            w: 120,
            h: 70,
            fontSize: 14,
            fontFamily: "Courier New",
          }),
          createSticker(BASIC_STICKERS[7], 320, 75),
        ],
      },
      {
        id: makeId(),
        title: "Places I’ve Been",
        background: "cream",
        elements: [
          createText("Places I’ve Been ♡", 70, 24, {
            w: 300,
            h: 55,
            fontSize: 33,
            fontFamily: "Brush Script MT",
          }),
          createText("♡", 45, 170, { w: 50, h: 50, fontSize: 36 }),
          createNote("Favorite place\nand why:\n\n\n", 70, 315, "cream"),
          createPhoto(270, 320, { w: 110, h: 125 }),
          createSticker(BASIC_STICKERS[13], 230, 145),
        ],
      },
      {
        id: makeId(),
        title: "Special Memories",
        background: "cream",
        elements: [
          createText("Special Memories ♡", 65, 24, {
            w: 300,
            h: 55,
            fontSize: 33,
            fontFamily: "Brush Script MT",
          }),
          createPhoto(45, 95, { w: 120, h: 130 }),
          createPhoto(175, 95, { w: 120, h: 130 }),
          createPhoto(45, 245, { w: 120, h: 130 }),
          createPhoto(175, 245, { w: 120, h: 130 }),
          createNote("Some moments I never want to forget:\n\n\n", 305, 130, "cream"),
          createSticker(BASIC_STICKERS[7], 320, 280),
        ],
      },
    ],
  };
}

function makeBabyTemplate(gender) {
  const isGirl = gender === "girl";
  const bg = isGirl ? "pinkGingham" : "blueGingham";
  const title = isGirl ? "Baby Girl First Year" : "Baby Boy First Year";
  const label = isGirl ? "our little girl" : "our little boy";
  const sticker = isGirl ? PREMIUM_STICKERS[3] : PREMIUM_STICKERS[2];

  return {
    title,
    background: bg,
    premiumTemplate: true,
    pages: [
      {
        id: makeId(),
        title: "Cover",
        background: bg,
        elements: [
          createText("baby’s\nfirst year", 55, 52, {
            w: 230,
            h: 110,
            fontSize: 34,
            fontFamily: "Brush Script MT",
          }),
          createNote(label, 250, 150, isGirl ? "pink" : "blue"),
          createPhoto(45, 190, { w: 170, h: 170 }),
          createPhoto(245, 210, { w: 105, h: 105, rotate: 6 }),
          createSticker(sticker, 25, 38),
          createSticker(BASIC_STICKERS[0], 45, 360),
        ],
      },
      ...Array.from({ length: 12 }, (_, i) => ({
        id: makeId(),
        title: `${i + 1} Month${i === 0 ? "" : "s"}`,
        background: bg,
        elements: [
          createNote(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 32, 35, "cream"),
          createPhoto(145, 80, { w: 215, h: 215 }),
          createNote(
            isGirl ? "sweet girl ♡" : "sweet boy ♡",
            165,
            325,
            isGirl ? "pink" : "blue"
          ),
          createSticker(i % 2 ? sticker : BASIC_STICKERS[4], 45, 310),
          createSticker(BASIC_STICKERS[7], 330, 280),
        ],
      })),
    ],
  };
}

function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [books, setBooks] = useState([]);
  const [book, setBook] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedBookMenu, setSelectedBookMenu] = useState(null);
  const [drag, setDrag] = useState(null);

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);

  const [darkMode, setDarkMode] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const page = book?.pages?.[pageIndex];
  const selectedElement = page?.elements?.find((el) => el.id === selectedId);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadBooks(u.uid);
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle("darkTheme", darkMode);
  }, [darkMode]);

  useEffect(() => {
    function handleKey(e) {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && book) {
        e.preventDefault();
        deleteSelected();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, book, pageIndex]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 1800);
  }

  async function loadBooks(uid) {
    const q = query(collection(db, "users", uid, "books"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
    showToast("Password reset email sent.");
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

    await loadBooks(user.uid);
    showToast("Scrapbook saved!");
  }

  function pushHistory(current = book) {
    if (!current) return;
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(current))]);
    setFuture([]);
  }

  function openTemplate(template) {
    const copied = JSON.parse(JSON.stringify(template));
    copied.id = null;
    setBook(copied);
    setPageIndex(0);
    setHistory([]);
    setFuture([]);
    setSelectedId(null);
    setScreen("editor");
  }

  function createBlankBook() {
    openTemplate(makeMyFirstScrapbookTemplate());
  }

  function updatePage(nextPage) {
    if (!book) return;
    pushHistory(book);

    const pages = [...book.pages];
    pages[pageIndex] = nextPage;

    setBook({ ...book, pages });
  }

  function updateElement(id, changes) {
    if (!page) return;

    updatePage({
      ...page,
      elements: page.elements.map((el) =>
        el.id === id ? { ...el, ...changes } : el
      ),
    });
  }
  function addText() {
    if (!page) return;

    updatePage({
      ...page,
      elements: [...page.elements, createText("tap to edit", 100, 110)],
    });
  }

  function addSticker(sticker) {
    if (!page) return;

    updatePage({
      ...page,
      elements: [...page.elements, createSticker(sticker, 130, 170)],
    });

    setModal(null);
  }

  function addPhoto() {
    if (!page) return;

    updatePage({
      ...page,
      elements: [...page.elements, createPhoto(90, 140)],
    });
  }

  function addPage() {
    if (!book) return;

    pushHistory(book);

    setBook({
      ...book,
      pages: [
        ...book.pages,
        {
          id: makeId(),
          title: `Page ${book.pages.length + 1}`,
          background: book.background || "cream",
          elements: [],
        },
      ],
    });

    setPageIndex(book.pages.length);
  }

  function deleteSelected() {
    if (!page || !selectedId) return;

    updatePage({
      ...page,
      elements: page.elements.filter((el) => el.id !== selectedId),
    });

    setSelectedId(null);
  }

  function undo() {
    if (history.length === 0) return;

    const previous = history[history.length - 1];

    setFuture((prev) => [JSON.parse(JSON.stringify(book)), ...prev]);
    setHistory((prev) => prev.slice(0, -1));
    setBook(previous);
  }

  function redo() {
    if (future.length === 0) return;

    const next = future[0];

    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(book))]);
    setFuture((prev) => prev.slice(1));
    setBook(next);
  }

  async function renameBook(bookToRename = book) {
    if (!bookToRename) return;

    const newTitle = window.prompt(
      "Rename scrapbook:",
      bookToRename.title || "My Scrapbook"
    );

    if (!newTitle || !newTitle.trim()) return;

    const updated = {
      ...bookToRename,
      title: newTitle.trim(),
    };

    setBook(updated);

    if (updated.id && user) {
      await updateDoc(doc(db, "users", user.uid, "books", updated.id), {
        title: updated.title,
        updatedAt: serverTimestamp(),
      });

      await loadBooks(user.uid);
    }

    showToast("Scrapbook renamed!");
  }

  async function uploadImage(elementId, file) {
    if (!file || !user || !page) return;

    const imageRef = ref(
      storage,
      `scrapbooks/${user.uid}/${makeId()}-${file.name}`
    );

    await uploadBytes(imageRef, file);

    const url = await getDownloadURL(imageRef);

    updatePage({
      ...page,
      elements: page.elements.map((el) =>
        el.id === elementId
          ? {
              ...el,
              src: url,
              crop: "cover",
              cropX: 50,
              cropY: 50,
            }
          : el
      ),
    });
  }

  function getPoint(e) {
    if (e.touches?.[0]) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }

    return {
      x: e.clientX,
      y: e.clientY,
    };
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
    if (!drag || !page) return;

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
        rotate: (el.rotate || 0) + dx,
      });
    }
  }

  function selectedPhotoOnly() {
    if (!selectedElement || selectedElement.type !== "photo") {
      showToast("Tap a photo first.");
      return null;
    }

    return selectedElement;
  }

  function toggleCrop() {
    const photo = selectedPhotoOnly();
    if (!photo) return;

    updateElement(photo.id, {
      crop: photo.crop === "contain" ? "cover" : "contain",
    });
  }

  function moveCrop(direction) {
    const photo = selectedPhotoOnly();
    if (!photo) return;

    if (direction === "left") {
      updateElement(photo.id, { cropX: (photo.cropX || 50) - 5 });
    }

    if (direction === "right") {
      updateElement(photo.id, { cropX: (photo.cropX || 50) + 5 });
    }

    if (direction === "up") {
      updateElement(photo.id, { cropY: (photo.cropY || 50) - 5 });
    }

    if (direction === "down") {
      updateElement(photo.id, { cropY: (photo.cropY || 50) + 5 });
    }
  }

  function updateTextStyle(changes) {
    if (!selectedElement || selectedElement.type !== "text") {
      showToast("Tap text first.");
      return;
    }

    updateElement(selectedElement.id, changes);
  }

  function applyBackground(bg) {
    if (!page) return;

    updatePage({
      ...page,
      background: bg.value,
    });

    setModal(null);
  }

  function openPremiumTemplate(type) {
    if (!isSubscribed) {
      setScreen("premium");
      showToast("Unlock premium to use this template.");
      return;
    }

    openTemplate(makeBabyTemplate(type));
  }

  function renderElement(el) {
    const isSelected = selectedId === el.id;

    return (
      <div
        key={el.id}
        className={`scrapElement ${isSelected ? "selected" : ""}`}
        style={{
          left: el.x,
          top: el.y,
          width: el.w,
          height: el.h,
          transform: `rotate(${el.rotate || 0}deg)`,
          fontSize: el.fontSize,
          color: el.color,
          fontFamily: el.fontFamily,
          fontWeight: el.bold ? "700" : "400",
          textDecoration: el.underline ? "underline" : "none",
        }}
        onMouseDown={(e) => startDrag(e, el, "move")}
        onTouchStart={(e) => startDrag(e, el, "move")}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(el.id);
        }}
      >
        {el.type === "text" && (
          <textarea
            value={el.text}
            onChange={(e) => updateElement(el.id, { text: e.target.value })}
            style={{
              fontSize: el.fontSize,
              color: el.color,
              fontFamily: el.fontFamily,
              fontWeight: el.bold ? "700" : "400",
              textDecoration: el.underline ? "underline" : "none",
            }}
          />
        )}

        {el.type === "sticker" && (
          <div className={`stickerArt ${el.stickerClass || ""}`}>
            {el.text}
          </div>
        )}

        {el.type === "note" && (
          <div className={`noteSticker note-${el.noteColor || "cream"}`}>
            {el.text}
          </div>
        )}

        {el.type === "photo" && (
          <label className="photoFrame">
            {el.src ? (
              <img
                src={el.src}
                alt=""
                style={{
                  objectFit: el.crop || "cover",
                  objectPosition: `${el.cropX || 50}% ${el.cropY || 50}%`,
                }}
              />
            ) : (
              <span>＋ Photo</span>
            )}

            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => uploadImage(el.id, e.target.files[0])}
            />
          </label>
        )}

        {isSelected && (
          <>
            <button
              className="handle rotateHandle"
              onMouseDown={(e) => startDrag(e, el, "rotate")}
              onTouchStart={(e) => startDrag(e, el, "rotate")}
            >
              ⟳
            </button>

            <button
              className="handle resizeHandle"
              onMouseDown={(e) => startDrag(e, el, "resize")}
              onTouchStart={(e) => startDrag(e, el, "resize")}
            >
              ↘
            </button>
          </>
        )}
      </div>
    );
  }
  if (!user) {
    return (
      <div className="loginPage">
        <div className="loginBackdrop"></div>

        <div className="loginCard">
          <div className="loginTopDecor">♡ ✿ 🎀</div>

          <h1>
            pocket
            <br />
            scrapbook
          </h1>

          <p className="loginSubtitle">
            cherish every little memory
          </p>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAuth();
            }}
          />

          <div className="passwordWrap">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAuth();
              }}
            />

            <button
              className="showPasswordBtn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button className="mainPinkBtn" onClick={handleAuth}>
            {authMode === "login" ? "Log In" : "Create Account"}
          </button>

          <button className="textBtn" onClick={resetPassword}>
            Forgot password?
          </button>

          <button
            className="textBtn"
            onClick={() =>
              setAuthMode(authMode === "login" ? "signup" : "login")
            }
          >
            {authMode === "login"
              ? "Create account"
              : "Already have an account?"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {toast && (
        <div className="toastCard">
          <div className="toastTitle">Pocket Scrapbook</div>
          <div className="toastMessage">{toast}</div>
        </div>
      )}

      {screen === "home" && (
        <div className="homeScreen">
          <div className="heroCard">
            <div className="heroDecor heroLeft">✿</div>

            <div className="heroContent">
              <div className="heroLabel">Pocket Scrapbook</div>

              <h1>
                your
                <br />
                memories
                <br />
                belong here ♡
              </h1>

              <button
                className="mainPinkBtn"
                onClick={createBlankBook}
              >
                Create Scrapbook
              </button>
            </div>

            <div className="heroDecor heroRight">🎀</div>
          </div>

          <div className="homeActions">
            <button onClick={() => setScreen("templates")}>
              Templates
            </button>

            <button onClick={() => setScreen("premium")}>
              Premium
            </button>

            <button onClick={() => setScreen("profile")}>
              Profile
            </button>
          </div>

          <h2 className="sectionTitle">My Scrapbooks</h2>

          <div className="booksGrid">
            {books.map((b) => (
              <div
                key={b.id}
                className="bookCard"
                onClick={() => {
                  setBook(b);
                  setPageIndex(0);
                  setScreen("editor");
                }}
              >
                <div
                  className={`bookPreview bg-${
                    b.pages?.[0]?.background || "cream"
                  }`}
                >
                  {b.pages?.[0]?.elements?.map((el) => (
                    <div
                      key={el.id}
                      className="miniPreviewElement"
                      style={{
                        left: `${el.x / 4}px`,
                        top: `${el.y / 4}px`,
                        width: `${el.w / 4}px`,
                        height: `${el.h / 4}px`,
                        transform: `rotate(${el.rotate || 0}deg)`,
                        fontSize: `${(el.fontSize || 18) / 4}px`,
                      }}
                    >
                      {el.type === "text" && (
                        <span>{el.text}</span>
                      )}

                      {el.type === "sticker" && (
                        <span>{el.text}</span>
                      )}

                      {el.type === "note" && (
                        <div className="miniNote"></div>
                      )}

                      {el.type === "photo" && el.src && (
                        <img src={el.src} alt="" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="bookInfo">
                  <div className="bookTitle">{b.title}</div>

                  <div className="bookPages">
                    {b.pages?.length || 1} pages
                  </div>
                </div>

                <button
                  className="menuButton"
                  onClick={(e) => {
                    e.stopPropagation();

                    setSelectedBookMenu(
                      selectedBookMenu === b.id ? null : b.id
                    );
                  }}
                >
                  ⋯
                </button>

                {selectedBookMenu === b.id && (
                  <div
                    className="bookMenu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setBook(b);
                        setPageIndex(0);
                        setScreen("flipbook");
                        setSelectedBookMenu(null);
                      }}
                    >
                      📖 View Flipbook
                    </button>

                    <button
                      onClick={() => {
                        renameBook(b);
                        setSelectedBookMenu(null);
                      }}
                    >
                      ✏️ Rename
                    </button>

                    <button
                      onClick={() => {
                        showToast("Export coming soon.");
                        setSelectedBookMenu(null);
                      }}
                    >
                      ⬇️ Export
                    </button>

                    <button
                      onClick={async () => {
                        const sure = window.confirm(
                          "Delete scrapbook?"
                        );

                        if (sure) {
                          await deleteDoc(
                            doc(
                              db,
                              "users",
                              user.uid,
                              "books",
                              b.id
                            )
                          );

                          loadBooks(user.uid);
                        }

                        setSelectedBookMenu(null);
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === "templates" && (
        <div className="panelScreen">
          <button className="backBtn" onClick={() => setScreen("home")}>
            ← Back
          </button>

          <h1 className="pageTitle">Templates</h1>

          <div className="templateGrid">
            <button
              className="templateCard"
              onClick={() => openTemplate(makeMyFirstScrapbookTemplate())}
            >
              <div className="templatePreview freePreview">
                my first scrapbook ♡
              </div>

              <div className="templateInfo">
                <b>My First Scrapbook</b>
                <span>Free</span>
              </div>
            </button>

            <button
              className="templateCard premiumTemplate"
              onClick={() => openPremiumTemplate("girl")}
            >
              <div className="templatePreview pinkBabyPreview">
                baby girl first year 🎀
              </div>

              <div className="templateInfo">
                <b>Baby Girl First Year</b>
                <span>Premium</span>
              </div>
            </button>

            <button
              className="templateCard premiumTemplate"
              onClick={() => openPremiumTemplate("boy")}
            >
              <div className="templatePreview blueBabyPreview">
                baby boy first year ⭐
              </div>

              <div className="templateInfo">
                <b>Baby Boy First Year</b>
                <span>Premium</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {screen === "premium" && (
        <div className="panelScreen">
          <button className="backBtn" onClick={() => setScreen("home")}>
            ← Back
          </button>

          <h1 className="pageTitle">Premium ♡</h1>

          <div className="premiumGrid">
            {PREMIUM_PACKS.map((pack) => (
              <div key={pack.title} className="premiumCard">
                <h3>{pack.title}</h3>

                <div className="premiumPrice">{pack.price}</div>

                <p>{pack.description}</p>

                <button
                  className="mainPinkBtn"
                  onClick={() => {
                    setIsSubscribed(true);
                    showToast("Premium unlocked for testing.");
                  }}
                >
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === "profile" && (
        <div className="panelScreen">
          <button className="backBtn" onClick={() => setScreen("home")}>
            ← Back
          </button>

          <div className="profileCard">
            <div className="profileAvatar">♡</div>

            <h2>{user.email}</h2>

            <div className="settingsList">
              <div className="settingRow">
                <span>Dark Mode</span>

                <label className="toggleSwitch">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                  />

                  <span className="toggleSlider"></span>
                </label>
              </div>

              <button
                className="settingsButton"
                onClick={() =>
                  showToast("Notifications coming soon.")
                }
              >
                🔔 Notifications
              </button>

              <button
                className="settingsButton"
                onClick={() =>
                  showToast("Backup synced.")
                }
              >
                ☁ Backup & Sync
              </button>

              <button
                className="settingsButton"
                onClick={() =>
                  showToast("Your scrapbooks are private.")
                }
              >
                🔒 Privacy
              </button>

              <button
                className="logoutButton"
                onClick={() => signOut(auth)}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      {screen === "flipbook" && book && page && (
        <div className="flipbookScreen">
          <button className="backBtn" onClick={() => setScreen("home")}>
            ← Back
          </button>

          <h1 className="pageTitle">{book.title}</h1>

          <div className={`scrapbookPage bg-${page.background}`}>
            {page.elements.map((el) => renderElement(el))}
          </div>

          <div className="pageControls">
            <button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}>
              ← Previous
            </button>

            <span>
              {pageIndex + 1} / {book.pages.length}
            </span>

            <button
              onClick={() =>
                setPageIndex(Math.min(book.pages.length - 1, pageIndex + 1))
              }
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {screen === "editor" && book && page && (
        <div className="editorScreen">
          <header className="editorHeader">
            <button onClick={() => setScreen("home")}>←</button>

            <button onClick={undo}>Undo</button>

            <button onClick={redo}>Redo</button>

            <button
              onClick={async () => {
                await saveBook();
              }}
            >
              Save
            </button>
          </header>

          <div className="pageTabs">
            <button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}>
              ‹
            </button>

            <span>
              Page {pageIndex + 1} / {book.pages.length}
            </span>

            <button
              onClick={() =>
                setPageIndex(Math.min(book.pages.length - 1, pageIndex + 1))
              }
            >
              ›
            </button>
          </div>

          <main
            className={`scrapbookPage bg-${page.background}`}
            onMouseMove={onMove}
            onMouseUp={() => setDrag(null)}
            onTouchMove={onMove}
            onTouchEnd={() => setDrag(null)}
            onClick={() => setSelectedId(null)}
          >
            {page.elements.map((el) => renderElement(el))}
          </main>

          <section className="editorToolbar">
            <button onClick={addPhoto}>Photo</button>
            <button onClick={addText}>Text</button>
            <button onClick={() => setModal("stickers")}>Stickers</button>
            <button onClick={() => setModal("backgrounds")}>Backgrounds</button>
            <button onClick={() => setModal("text")}>Text Tools</button>
            <button onClick={() => setModal("crop")}>Crop</button>
            <button onClick={addPage}>Add Page</button>
            <button onClick={deleteSelected}>Delete</button>
          </section>
        </div>
      )}

      {modal === "stickers" && (
        <div className="modalOverlay" onClick={() => setModal(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Choose a Sticker</h2>
              <button onClick={() => setModal(null)}>×</button>
            </div>

            <h3 className="modalSubhead">Free Stickers</h3>

            <div className="stickerPickerGrid">
              {BASIC_STICKERS.map((sticker) => (
                <button
                  key={sticker.name}
                  className={`stickerPickerItem ${sticker.className}`}
                  onClick={() => addSticker(sticker)}
                >
                  {sticker.icon}
                  <span>{sticker.name}</span>
                </button>
              ))}
            </div>

            <h3 className="modalSubhead">Premium Stickers</h3>

            <div className="stickerPickerGrid">
              {PREMIUM_STICKERS.map((sticker) => (
                <button
                  key={sticker.name}
                  className={`stickerPickerItem ${sticker.className}`}
                  onClick={() => {
                    if (!isSubscribed) {
                      setScreen("premium");
                      setModal(null);
                      showToast("Unlock premium stickers.");
                      return;
                    }

                    addSticker(sticker);
                  }}
                >
                  {sticker.icon}
                  <span>{sticker.name}</span>
                  {!isSubscribed && <small>Premium</small>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal === "backgrounds" && (
        <div className="modalOverlay" onClick={() => setModal(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Choose Background</h2>
              <button onClick={() => setModal(null)}>×</button>
            </div>

            <div className="backgroundPickerGrid">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.value}
                  className={`backgroundPickerItem bg-${bg.value}`}
                  onClick={() => applyBackground(bg)}
                >
                  <span>{bg.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal === "crop" && (
        <div className="modalOverlay" onClick={() => setModal(null)}>
          <div className="modalCard smallModal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Photo Tools</h2>
              <button onClick={() => setModal(null)}>×</button>
            </div>

            <p className="toolHint">Tap a photo first, then use these tools.</p>

            <div className="toolGrid">
              <button onClick={toggleCrop}>Fit / Fill</button>
              <button
                onClick={() => {
                  if (!selectedElement) return showToast("Tap a photo first.");
                  updateElement(selectedElement.id, {
                    rotate: (selectedElement.rotate || 0) + 15,
                  });
                }}
              >
                Rotate
              </button>
              <button onClick={() => moveCrop("left")}>Move Left</button>
              <button onClick={() => moveCrop("right")}>Move Right</button>
              <button onClick={() => moveCrop("up")}>Move Up</button>
              <button onClick={() => moveCrop("down")}>Move Down</button>
            </div>
          </div>
        </div>
      )}

      {modal === "text" && (
        <div className="modalOverlay" onClick={() => setModal(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Text Tools</h2>
              <button onClick={() => setModal(null)}>×</button>
            </div>

            <p className="toolHint">Tap text first, then choose a style.</p>

            <div className="fontPicker">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font}
                  style={{ fontFamily: font }}
                  onClick={() => updateTextStyle({ fontFamily: font })}
                >
                  {font}
                </button>
              ))}
            </div>

            <div className="toolGrid">
              <button
                onClick={() =>
                  updateTextStyle({
                    fontSize: Math.max(
                      10,
                      (selectedElement?.fontSize || 22) - 2
                    ),
                  })
                }
              >
                Smaller
              </button>

              <button
                onClick={() =>
                  updateTextStyle({
                    fontSize: (selectedElement?.fontSize || 22) + 2,
                  })
                }
              >
                Bigger
              </button>

              <button
                onClick={() =>
                  updateTextStyle({
                    bold: !selectedElement?.bold,
                  })
                }
              >
                Bold
              </button>

              <button
                onClick={() =>
                  updateTextStyle({
                    underline: !selectedElement?.underline,
                  })
                }
              >
                Underline
              </button>

              <button
                onClick={() => {
                  if (!isSubscribed) {
                    setScreen("premium");
                    setModal(null);
                    showToast("Advanced text is premium.");
                    return;
                  }

                  updateTextStyle({
                    curve: !selectedElement?.curve,
                  });
                }}
              >
                Curve Text 👑
              </button>
            </div>

            <div className="colorPicker">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  style={{ background: color }}
                  onClick={() => updateTextStyle({ color })}
                ></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
