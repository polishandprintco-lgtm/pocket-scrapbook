import React, { useEffect, useRef, useState } from "react";

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
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { auth, db, storage } from "./firebase";

const BACKGROUNDS = [
  { id: "pinkPlaid", name: "Pink Plaid" },
  { id: "cream", name: "Cream Paper" },
  { id: "bluePlaid", name: "Blue Plaid" },
  { id: "lavender", name: "Lavender" },
  { id: "grid", name: "Grid" },
  { id: "dots", name: "Dots" },
];

const STICKERS = [
  "♡", "♥", "✿", "❀", "★", "✦", "☁", "☾",
  "🎀", "🧸", "📷", "✈️", "🌸", "🌿", "💌", "🦋",
  "🐻", "🐰", "🐶", "🐱", "🦊", "🐾", "🎂", "🎈",
  "🍂", "🌼", "📝", "☕", "📚", "🎞️", "🌎", "🧡",
];

const FONTS = [
  "Georgia",
  "Arial",
  "Courier New",
  "Trebuchet MS",
  "Times New Roman",
  "Comic Sans MS",
];

const COLORS = [
  "#2f2528",
  "#d96f94",
  "#7fa6ce",
  "#8e78b8",
  "#b58b62",
  "#ffffff",
];

function makeId() {
  return crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function photoEl(x, y, w = 150, h = 150) {
  return {
    id: makeId(),
    type: "photo",
    x,
    y,
    w,
    h,
    r: 0,
    src: "",
    fit: "cover",
    cropX: 50,
    cropY: 50,
  };
}

function textEl(value, x, y, options = {}) {
  return {
    id: makeId(),
    type: "text",
    value,
    x,
    y,
    w: options.w || 210,
    h: options.h || 70,
    r: 0,
    size: options.size || 24,
    color: options.color || "#2f2528",
    font: options.font || "Georgia",
    bold: false,
    underline: false,
  };
}

function stickerEl(value, x, y) {
  return {
    id: makeId(),
    type: "sticker",
    value,
    x,
    y,
    w: 65,
    h: 65,
    r: 0,
    size: 36,
  };
}

function makeBook(title, bg = "cream") {
  return {
    title,
    bg,
    photoCount: 0,
    pages: [
      {
        id: makeId(),
        bg,
        elements: [
          textEl(title, 70, 40, { size: 26 }),
          photoEl(85, 140, 190, 190),
          stickerEl("♡", 260, 340),
        ],
      },
    ],
  };
}

function myFirstTemplate() {
  return {
    title: "My First Scrapbook",
    bg: "cream",
    photoCount: 0,
    pages: [
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("About Me ♡", 80, 30, { size: 28 }),
          photoEl(45, 110, 145, 145),
          textEl("My name:\nBirthday:\nFavorite color:", 40, 310, { size: 19 }),
          textEl("Some of my favorite things:\nColor:\nFood:\nBook:\nSong:", 210, 110, { size: 13, w: 145 }),
          stickerEl("✿", 290, 295),
          stickerEl("♡", 300, 365),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Family ♡", 80, 30, { size: 28 }),
          photoEl(45, 110, 165, 140),
          textEl("About my family:", 220, 115, { size: 15, w: 140 }),
          textEl("The people I love most:", 78, 285, { size: 16, w: 240 }),
          photoEl(55, 330, 82, 90),
          photoEl(150, 330, 82, 90),
          photoEl(245, 330, 82, 90),
          stickerEl("🌿", 300, 285),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Best Friends ♡", 48, 30, { size: 27 }),
          textEl("friends are the family we choose ♡", 62, 78, { size: 13, w: 250 }),
          photoEl(55, 130, 125, 155),
          photoEl(210, 130, 125, 155),
          textEl("Name:\nWe met:", 60, 305, { size: 13, w: 120 }),
          textEl("Name:\nWe met:", 215, 305, { size: 13, w: 120 }),
          stickerEl("♡", 300, 72),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Personality ♡", 50, 30, { size: 27 }),
          textEl("I am...", 50, 120, { size: 17, w: 130 }),
          textEl("Words that describe me:\n○\n○\n○\n○", 195, 110, { size: 14, w: 160 }),
          textEl("I’m proud of:", 80, 330, { size: 16, w: 230 }),
          stickerEl("🌿", 35, 240),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Hobbies ♡", 60, 30, { size: 28 }),
          textEl("Things I love to do:", 45, 125, { size: 16, w: 150 }),
          stickerEl("📷", 210, 135),
          stickerEl("🎨", 275, 135),
          stickerEl("📚", 210, 205),
          stickerEl("✈️", 275, 205),
          textEl("Notes:", 60, 340, { size: 18 }),
          stickerEl("🌿", 40, 260),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("Places I’ve Been ♡", 45, 30, { size: 27 }),
          stickerEl("🌎", 135, 130),
          textEl("Favorite place\nand why:", 55, 320, { size: 15, w: 160 }),
          photoEl(250, 315, 95, 110),
          stickerEl("♡", 45, 205),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("Special Memories ♡", 40, 30, { size: 27 }),
          photoEl(42, 105, 115, 120),
          photoEl(190, 105, 115, 120),
          photoEl(42, 260, 115, 120),
          photoEl(190, 260, 115, 120),
          textEl("Some moments I never want to forget:", 275, 165, { size: 13, w: 80 }),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("Goals & Dreams ♡", 45, 30, { size: 27 }),
          textEl("Things I want to do:\n○\n○\n○", 45, 130, { size: 15, w: 140 }),
          textEl("My dreams:", 195, 130, { size: 15, w: 145 }),
          textEl("Notes to my future self:", 55, 350, { size: 14, w: 240 }),
          stickerEl("★", 310, 100),
        ],
      },
    ],
  };
}

function babyTemplate(girl = true) {
  const bg = girl ? "pinkPlaid" : "bluePlaid";
  const title = girl ? "Baby Girl First Year" : "Baby Boy First Year";
  const accent = girl ? "#d96f94" : "#6f9dcc";
  const mainSticker = girl ? "🎀" : "★";
  const softSticker = girl ? "🌸" : "🧸";
  const label = girl ? "sweet girl ♡" : "sweet boy ♡";

  return {
    title,
    bg,
    photoCount: 0,
    premium: true,
    pages: Array.from({ length: 12 }, (_, i) => ({
      id: makeId(),
      bg,
      elements: [
        textEl(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 28, 32, {
          size: 23,
          w: 95,
          h: 80,
          color: "#2f2528",
        }),

        photoEl(125, 88, 190, 190),

        textEl(label, 120, 315, {
          size: 15,
          w: 185,
          h: 45,
          color: "#2f2528",
        }),

        stickerEl(mainSticker, 36, 310),
        stickerEl(softSticker, 285, 292),
        stickerEl("♡", 300, 365),
        stickerEl("🌿", 40, 230),
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

  const [showLogin, setShowLogin] = useState(false);

  const [showSignup, setShowSignup] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [newBookName, setNewBookName] = useState("");

  const [newBookBg, setNewBookBg] = useState("pinkPlaid");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);

  const [showPrivacy, setShowPrivacy] = useState(false);

  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const [showElementMenu, setShowElementMenu] = useState(false);

  const [profileImage, setProfileImage] = useState("");

  const dragRef = useRef(null);

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (u) => {

      setUser(u);

      if (u) {

        const q = query(
          collection(db, "scrapbooks"),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        const loaded = [];

        snap.forEach((docu) => {

          const data = docu.data();

          if (data.uid === u.uid) {
            loaded.push({
              id: docu.id,
              ...data,
            });
          }

        });

        setBooks(loaded);

        setScreen("home");

      } else {

        setBooks([]);

      }

    });

    return () => unsub();

  }, []);

  async function signup() {

    if (!email || !password) return;

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    setShowSignup(false);

    setScreen("home");
  }

  async function login() {

    if (!email || !password) return;

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    setShowLogin(false);

    setScreen("home");
  }

  async function logoutUser() {

    await signOut(auth);

    setScreen("home");
  }

  async function saveBooks(updatedBooks) {

    setBooks(updatedBooks);

    for (const b of updatedBooks) {

      if (!b.firebaseId) {

        const added = await addDoc(
          collection(db, "scrapbooks"),
          {
            ...b,
            uid: user.uid,
            createdAt: serverTimestamp(),
          }
        );

        b.firebaseId = added.id;

      } else {

        await updateDoc(
          doc(db, "scrapbooks", b.firebaseId),
          {
            ...b,
          }
        );

      }

    }

  }

  async function createBook() {

    if (!newBookName) return;

    const newBook = makeBook(
      newBookName,
      newBookBg
    );

    const updated = [
      {
        ...newBook,
        firebaseId: null,
      },
      ...books,
    ];

    await saveBooks(updated);

    setSelectedBook(updated[0]);

    setSelectedPage(0);

    setShowCreateModal(false);

    setScreen("editor");

    setNewBookName("");
  }

  function openBook(book) {

    setSelectedBook(book);

    setSelectedPage(0);

    setScreen("editor");
  }

  async function deleteBook(book) {

    if (
      !window.confirm(
        `Delete ${book.title}?`
      )
    ) return;

    if (book.firebaseId) {

      await deleteDoc(
        doc(
          db,
          "scrapbooks",
          book.firebaseId
        )
      );

    }

    const filtered = books.filter(
      (b) => b.id !== book.id
    );

    setBooks(filtered);

    setScreen("home");
  }

  async function renameBook(book) {

    const renamed = prompt(
      "Rename scrapbook",
      book.title
    );

    if (!renamed) return;

    const updated = books.map((b) =>
      b.id === book.id
        ? {
            ...b,
            title: renamed,
          }
        : b
    );

    await saveBooks(updated);

    if (selectedBook?.id === book.id) {
      setSelectedBook({
        ...book,
        title: renamed,
      });
    }

  }

  async function uploadProfilePicture(e) {

    const file = e.target.files[0];

    if (!file) return;

    const storageRef = ref(
      storage,
      `profiles/${user.uid}/${file.name}`
    );

    await uploadBytes(
      storageRef,
      file
    );

    const url = await getDownloadURL(
      storageRef
    );

    setProfileImage(url);
  }

  function updateElement(updatedEl) {

    const updatedBooks = books.map((b) => {

      if (b.id !== selectedBook.id) return b;

      const updatedPages = b.pages.map(
        (p, i) => {

          if (i !== selectedPage) return p;

          return {
            ...p,
            elements: p.elements.map((el) =>
              el.id === updatedEl.id
                ? updatedEl
                : el
            ),
          };

        }
      );

      return {
        ...b,
        pages: updatedPages,
      };

    });

    setBooks(updatedBooks);

    const updatedBook = updatedBooks.find(
      (b) => b.id === selectedBook.id
    );

    setSelectedBook(updatedBook);

    saveBooks(updatedBooks);
  }
  function updateSelectedElement(changes) {

    if (!selectedElement) return;

    updateElement({
      ...selectedElement,
      ...changes,
    });

  }

  function selectedPageData() {

    if (!selectedBook) return null;

    return selectedBook.pages[selectedPage];

  }

  function addElementToPage(element) {

    if (!selectedBook) return;

    const updatedBooks = books.map((b) => {

      if (b.id !== selectedBook.id) return b;

      const updatedPages = b.pages.map((p, i) => {

        if (i !== selectedPage) return p;

        return {
          ...p,
          elements: [
            ...p.elements,
            element,
          ],
        };

      });

      return {
        ...b,
        pages: updatedPages,
      };

    });

    setBooks(updatedBooks);

    const updatedBook = updatedBooks.find(
      (b) => b.id === selectedBook.id
    );

    setSelectedBook(updatedBook);

    setSelectedElement(element);

    saveBooks(updatedBooks);

  }

  function deleteSelectedElement() {

    if (!selectedElement) return;

    const updatedBooks = books.map((b) => {

      if (b.id !== selectedBook.id) return b;

      const updatedPages = b.pages.map((p, i) => {

        if (i !== selectedPage) return p;

        return {
          ...p,
          elements: p.elements.filter(
            (el) => el.id !== selectedElement.id
          ),
        };

      });

      return {
        ...b,
        pages: updatedPages,
      };

    });

    setBooks(updatedBooks);

    const updatedBook = updatedBooks.find(
      (b) => b.id === selectedBook.id
    );

    setSelectedBook(updatedBook);

    setSelectedElement(null);

    setShowElementMenu(false);

    saveBooks(updatedBooks);

  }

  function duplicateSelectedElement() {

    if (!selectedElement) return;

    const copy = {
      ...selectedElement,
      id: makeId(),
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
    };

    addElementToPage(copy);

    setShowElementMenu(false);

  }

  function addPage() {

    const updatedBooks = books.map((b) => {

      if (b.id !== selectedBook.id) return b;

      return {
        ...b,
        pages: [
          ...b.pages,
          {
            id: makeId(),
            bg: b.bg || "cream",
            elements: [],
          },
        ],
      };

    });

    setBooks(updatedBooks);

    const updatedBook = updatedBooks.find(
      (b) => b.id === selectedBook.id
    );

    setSelectedBook(updatedBook);

    setSelectedPage(updatedBook.pages.length - 1);

    saveBooks(updatedBooks);

  }

  async function uploadPhotoToElement(el, file) {

    if (!file || !user) return;

    const storageRef = ref(
      storage,
      `scrapbooks/${user.uid}/${Date.now()}-${file.name}`
    );

    await uploadBytes(storageRef, file);

    const url = await getDownloadURL(storageRef);

    updateElement({
      ...el,
      src: url,
      fit: "cover",
    });

  }

  function pointer(e) {

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

    setSelectedElement(el);

    const p = pointer(e);

    dragRef.current = {
      mode,
      id: el.id,
      startX: p.x,
      startY: p.y,
      original: {
        ...el,
      },
    };

  }

  function moveDrag(e) {

    if (!dragRef.current) return;

    const p = pointer(e);

    const dx = p.x - dragRef.current.startX;
    const dy = p.y - dragRef.current.startY;

    const original = dragRef.current.original;

    if (dragRef.current.mode === "move") {

      updateElement({
        ...original,
        x: original.x + dx,
        y: original.y + dy,
      });

    }

    if (dragRef.current.mode === "resize") {

      updateElement({
        ...original,
        w: Math.max(40, original.w + dx),
        h: Math.max(40, original.h + dy),
      });

    }

    if (dragRef.current.mode === "rotate") {

      updateElement({
        ...original,
        r: original.r + dx,
      });

    }

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

  function renderElement(el) {

    const isSelected =
      selectedElement?.id === el.id;

    return (
      <div
        key={el.id}
        className={`scrapElement ${isSelected ? "selected" : ""}`}
        style={{
          left: el.x,
          top: el.y,
          width: el.w,
          height: el.h,
          transform: `rotate(${el.r || 0}deg)`,
        }}
        onMouseDown={(e) =>
          startDrag(e, el, "move")
        }
        onTouchStart={(e) =>
          startDrag(e, el, "move")
        }
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(el);
          setShowElementMenu(true);
        }}
      >
        {el.type === "photo" && (
          <label className="photoFrame">
            {el.src ? (
              <img
                src={el.src}
                alt=""
                style={{
                  objectFit: el.fit || "cover",
                  objectPosition: `${el.cropX || 50}% ${el.cropY || 50}%`,
                }}
              />
            ) : (
              <span>+ Photo</span>
            )}

            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) =>
                uploadPhotoToElement(
                  el,
                  e.target.files[0]
                )
              }
            />
          </label>
        )}

        {el.type === "text" && (
          <textarea
            value={el.value}
            onChange={(e) =>
              updateElement({
                ...el,
                value: e.target.value,
              })
            }
            style={{
              fontSize: el.size,
              color: el.color,
              fontFamily: el.font,
              fontWeight: el.bold ? "700" : "400",
              textDecoration: el.underline ? "underline" : "none",
            }}
          />
        )}

        {el.type === "sticker" && (
          <div
            className="stickerElement"
            style={{
              fontSize: el.size || 36,
            }}
          >
            {el.value}
          </div>
        )}

        {isSelected && (
          <>
            <button
              className="handle rotateHandle"
              onMouseDown={(e) =>
                startDrag(e, el, "rotate")
              }
              onTouchStart={(e) =>
                startDrag(e, el, "rotate")
              }
            >
              ↻
            </button>

            <button
              className="handle resizeHandle"
              onMouseDown={(e) =>
                startDrag(e, el, "resize")
              }
              onTouchStart={(e) =>
                startDrag(e, el, "resize")
              }
            >
              ↘
            </button>
          </>
        )}
      </div>
    );

  }
   return (
    <div className="appBg">

      <div className="phoneShell">

        {!user && (
          <div className="authScreen">

            <div className="heroCard">

              <div className="logoTape"></div>

              <h1>
                pocket
                <br />
                scrapbook
              </h1>

              <p>
                cherish every moment ♡
              </p>

              <input
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <div className="passwordWrap">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

              <button
                className="mainBtn"
                onClick={login}
              >
                Login
              </button>

              <button
                className="secondaryBtn"
                onClick={signup}
              >
                Create Account
              </button>

            </div>

          </div>
        )}

        {user && screen === "home" && (
          <div className="homeScreen">

            <div className="heroCard">

              <div className="logoTape"></div>

              <h1>
                pocket
                <br />
                scrapbook
              </h1>

              <p>
                cherish every moment ♡
              </p>

              <button
                className="mainBtn"
                onClick={() =>
                  setShowCreateModal(true)
                }
              >
                Create Scrapbook
              </button>

            </div>

            <div className="sectionTitle">
              My Scrapbooks
            </div>

            <div className="booksList">

              {books.map((book) => (

                <div
                  key={book.id}
                  className="bookCard"
                >

                  <div
                    className={`bookPreview bg-${book.bg}`}
                    onClick={() =>
                      openBook(book)
                    }
                  ></div>

                  <div
                    className="bookInfo"
                    onClick={() =>
                      openBook(book)
                    }
                  >
                    <h3>{book.title}</h3>

                    <p>
                      {book.pages.length} pages
                    </p>
                  </div>

                  <button
                    className="dotsBtn"
                    onClick={() =>
                      setShowTemplateMenu(
                        book
                      )
                    }
                  >
                    ⋮
                  </button>

                </div>

              ))}

            </div>

            <div className="bottomNav">

              <button
                className="active"
                onClick={() =>
                  setScreen("home")
                }
              >
                Home
              </button>

              <button
                onClick={() =>
                  setScreen("templates")
                }
              >
                Templates
              </button>

              <button
                onClick={() =>
                  setScreen("premium")
                }
              >
                Premium
              </button>

              <button
                onClick={() =>
                  setScreen("profile")
                }
              >
                Profile
              </button>

            </div>

          </div>
        )}

        {user &&
          screen === "templates" && (
            <div className="screen">

              <button
                className="backBtn"
                onClick={() =>
                  setScreen("home")
                }
              >
                ← Back
              </button>

              <h2>
                Templates
              </h2>

              <div
                className="templateCard"
                onClick={() => {

                  const book =
                    myFirstTemplate();

                  setBooks([
                    {
                      ...book,
                      firebaseId: null,
                    },
                    ...books,
                  ]);

                  setSelectedBook(book);

                  setSelectedPage(0);

                  setScreen("editor");

                }}
              >
                <div className="templatePreview bg-cream">
  <div className="tinyTitle">About Me ♡</div>
  <div className="tinyPhoto"></div>
  <div className="tinyPaper"></div>
  <div className="tinyFlower">🌿</div>
</div>

                <div>
                  <h3>
                    My First Scrapbook
                  </h3>

                  <p>Free</p>
                </div>

              </div>

              <div
                className="templateCard premiumCard"
                onClick={() => {

                  const book =
                    babyTemplate(true);

                  setBooks([
                    {
                      ...book,
                      firebaseId: null,
                    },
                    ...books,
                  ]);

                  setSelectedBook(book);

                  setSelectedPage(0);

                  setScreen("editor");

                }}
              >
                <div className="templatePreview bg-pinkPlaid">
  <div className="tinyMonth">1<br />month</div>
  <div className="tinyPhoto polaroid"></div>
  <div className="tinyLabel">sweet girl ♡</div>
  <div className="tinySticker">🎀</div>
</div>

                <div>
                  <h3>
                    Baby Girl First Year
                  </h3>

                  <p>$1.99</p>
                </div>

              </div>

              <div
                className="templateCard premiumCard"
                onClick={() => {

                  const book =
                    babyTemplate(false);

                  setBooks([
                    {
                      ...book,
                      firebaseId: null,
                    },
                    ...books,
                  ]);

                  setSelectedBook(book);

                  setSelectedPage(0);

                  setScreen("editor");

                }}
              >
                <div className="templatePreview bg-bluePlaid">
  <div className="tinyMonth">1<br />month</div>
  <div className="tinyPhoto polaroid"></div>
  <div className="tinyLabel blue">sweet boy ♡</div>
  <div className="tinySticker">⭐</div>
</div>

                <div>
                  <h3>
                    Baby Boy First Year
                  </h3>

                  <p>$1.99</p>
                </div>

              </div>

            </div>
          )}
        {user &&
          screen === "premium" && (
            <div className="screen">

              <button
                className="backBtn"
                onClick={() =>
                  setScreen("home")
                }
              >
                ← Back
              </button>

              <h2>
                Premium
              </h2>

              <div className="premiumTable">

                <div className="premiumRow header">
                  <div>Feature</div>
                  <div>Free</div>
                  <div>Premium</div>
                </div>

                <div className="premiumRow">
                  <div>Photos</div>
                  <div>15</div>
                  <div>Unlimited</div>
                </div>

                <div className="premiumRow">
                  <div>Fonts</div>
                  <div>Basic</div>
                  <div>All Fonts</div>
                </div>

                <div className="premiumRow">
                  <div>Text Effects</div>
                  <div>—</div>
                  <div>✓</div>
                </div>

                <div className="premiumRow">
                  <div>Templates</div>
                  <div>Limited</div>
                  <div>All</div>
                </div>

              </div>

              <div className="premiumPrice">

                <h3>
                  Pocket Scrapbook+
                </h3>

                <p>
                  $4.99/month
                </p>

              </div>

            </div>
          )}

        {user &&
          screen === "profile" && (
            <div className="screen">

              <button
                className="backBtn"
                onClick={() =>
                  setScreen("home")
                }
              >
                ← Back
              </button>

              <div className="profileCard">

                <label className="profileImageWrap">

                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt=""
                      className="profileImage"
                    />
                  ) : (
                    <div className="profilePlaceholder">
                      ♡
                    </div>
                  )}

                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={
                      uploadProfilePicture
                    }
                  />

                </label>

                <h2>
                  Pocket Scrapbook
                </h2>

                <button
                  className="settingsBtn"
                  onClick={() =>
                    setShowNotifications(
                      true
                    )
                  }
                >
                  Notifications
                </button>

                <button
                  className="settingsBtn"
                  onClick={() =>
                    setShowPrivacy(true)
                  }
                >
                  Privacy
                </button>

                <button
                  className="logoutBtn"
                  onClick={logoutUser}
                >
                  Logout
                </button>

              </div>

            </div>
          )}

        {user &&
          screen === "editor" &&
          selectedBook && (
            <div className="editorScreen">

              <div className="editorHeader">

                <button
                  onClick={() =>
                    setScreen("home")
                  }
                >
                  ←
                </button>

                <h2>
                  {selectedBook.title}
                </h2>

                <button
                  onClick={() =>
                    setShowTemplateMenu(
                      selectedBook
                    )
                  }
                >
                  ⋮
                </button>

              </div>

              <div className="pageNav">

                <button
                  disabled={
                    selectedPage === 0
                  }
                  onClick={() =>
                    setSelectedPage(
                      selectedPage - 1
                    )
                  }
                >
                  ‹
                </button>

                <span>
                  Page {selectedPage + 1}/
                  {
                    selectedBook.pages
                      .length
                  }
                </span>

                <button
                  disabled={
                    selectedPage ===
                    selectedBook.pages
                      .length -
                      1
                  }
                  onClick={() =>
                    setSelectedPage(
                      selectedPage + 1
                    )
                  }
                >
                  ›
                </button>

              </div>

              <div
                className={`scrapPage bg-${
                  selectedPageData()?.bg
                }`}
                onClick={() => {
                  setSelectedElement(
                    null
                  );
                  setShowElementMenu(
                    false
                  );
                }}
              >

                {selectedPageData()?.elements.map(
                  renderElement
                )}

              </div>

              <div className="toolBar">

                <button
                  onClick={() =>
                    addElementToPage(
                      photoEl(
                        100,
                        130
                      )
                    )
                  }
                >
                  Photo
                </button>

                <button
                  onClick={() =>
                    addElementToPage(
                      textEl(
                        "tap to edit",
                        80,
                        80
                      )
                    )
                  }
                >
                  Text
                </button>

                <button
                  onClick={() =>
                    addElementToPage(
                      stickerEl(
                        "♡",
                        150,
                        180
                      )
                    )
                  }
                >
                  Sticker
                </button>

                <button
                  onClick={addPage}
                >
                  Add Page
                </button>

                <button
                  onClick={() => {

                    if (
                      selectedElement?.type !==
                      "photo"
                    )
                      return;

                    updateSelectedElement(
                      {
                        fit:
                          selectedElement.fit ===
                          "cover"
                            ? "contain"
                            : "cover",
                      }
                    );

                  }}
                >
                  Crop
                </button>

              </div>

              {showElementMenu &&
                selectedElement && (
                  <div className="bubbleMenu">

                    <button
                      onClick={
                        duplicateSelectedElement
                      }
                    >
                      Duplicate
                    </button>

                    <button
                      onClick={
                        deleteSelectedElement
                      }
                    >
                      Delete
                    </button>

                  </div>
                )}

            </div>
          )}

        {showTemplateMenu && (
          <div className="bottomSheet">

            <button
              onClick={() => {

                openBook(
                  showTemplateMenu
                );

                setShowTemplateMenu(
                  false
                );

              }}
            >
              Edit
            </button>

            <button>
              View Flipbook
            </button>

            <button>
              Export
            </button>

            <button
              onClick={() => {

                renameBook(
                  showTemplateMenu
                );

                setShowTemplateMenu(
                  false
                );

              }}
            >
              Rename
            </button>

            <button
              className="danger"
              onClick={() => {

                deleteBook(
                  showTemplateMenu
                );

                setShowTemplateMenu(
                  false
                );

              }}
            >
              Delete
            </button>

            <button
              onClick={() =>
                setShowTemplateMenu(
                  false
                )
              }
            >
              Cancel
            </button>

          </div>
        )}

        {showCreateModal && (
          <div className="bottomSheet">

            <h3>
              Create Scrapbook
            </h3>

            <input
              placeholder="Scrapbook name"
              value={newBookName}
              onChange={(e) =>
                setNewBookName(
                  e.target.value
                )
              }
            />

            <div className="bgPicker">

              {BACKGROUNDS.map((bg) => (

                <button
                  key={bg.id}
                  className={`bgChoice bg-${bg.id}`}
                  onClick={() =>
                    setNewBookBg(
                      bg.id
                    )
                  }
                ></button>

              ))}

            </div>

            <button
              className="mainBtn"
              onClick={createBook}
            >
              Create
            </button>

            <button
              onClick={() =>
                setShowCreateModal(
                  false
                )
              }
            >
              Cancel
            </button>

          </div>
        )}

        {showNotifications && (
          <div className="bottomSheet">

            <h3>
              Notification Settings
            </h3>

            <button>
              Email Notifications
            </button>

            <button>
              Text Notifications
            </button>

            <button>
              New Templates
            </button>

            <button>
              Offers & Discounts
            </button>

            <button>
              None
            </button>

            <button
              onClick={() =>
                setShowNotifications(
                  false
                )
              }
            >
              Close
            </button>

          </div>
        )}

        {showPrivacy && (
          <div className="bottomSheet">

            <h3>
              Privacy
            </h3>

            <p>
              Pocket Scrapbook
              values your privacy.
              We never sell your
              personal information.
              Your scrapbook data
              and uploaded photos
              stay securely stored
              within your account.
            </p>

            <button
              onClick={() =>
                setShowPrivacy(false)
              }
            >
              Close
            </button>

          </div>
        )}

      </div>

    </div>
  );

}
