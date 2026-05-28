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
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { auth, db, storage } from "./firebase";

const BACKGROUNDS = [
  { id: "pinkPlaid", name: "Pink Plaid" },
  { id: "bluePlaid", name: "Blue Plaid" },
  { id: "cream", name: "Cream" },
  { id: "lavender", name: "Lavender" },
  { id: "grid", name: "Grid" },
  { id: "dots", name: "Dots" },
];

function makeId() {
  return crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function photoEl(x, y, w, h) {
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
    w: options.w || 200,
    h: options.h || 70,
    r: 0,
    size: options.size || 22,
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
    w: 60,
    h: 60,
    r: 0,
    size: 36,
  };
}

function makeBook(title, bg = "cream") {
  return {
    id: makeId(),
    title,
    bg,
    photoCount: 0,
    pages: [
      {
        id: makeId(),
        bg,
        elements: [
          textEl(title, 105, 40, { size: 26, w: 220 }),
          photoEl(95, 150, 210, 210),
          stickerEl("♡", 300, 390),
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
    photoCount: 0,
    pages: [
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("About Me ♡", 110, 28, { size: 30, w: 230, h: 55 }),
          photoEl(45, 120, 155, 155),
          textEl("Some of my favorite\nthings:\nColor:\nFood:\nBook:\nSong:", 230, 120, {
            size: 13,
            w: 150,
            h: 140,
          }),
          textEl("My name:\nBirthday:\nFavorite color:", 80, 335, {
            size: 20,
            w: 240,
            h: 95,
          }),
          stickerEl("✿", 300, 320),
          stickerEl("♡", 315, 405),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Family ♡", 115, 28, { size: 30, w: 220 }),
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
          stickerEl("♡", 330, 72),
        ],
      },
      {
        id: makeId(),
        bg: "cream",
        elements: [
          textEl("My Personality ♡", 78, 28, { size: 28, w: 280 }),
          textEl("I am...", 50, 120, { size: 17, w: 130 }),
          textEl("Words that describe me:\n○\n○\n○\n○", 220, 110, {
            size: 14,
            w: 150,
          }),
          textEl("I’m proud of:", 90, 330, { size: 16, w: 250 }),
          stickerEl("🌿", 42, 240),
        ],
      },
    ],
  };
}

function babyTemplate(girl = true) {
  const bg = girl ? "pinkPlaid" : "bluePlaid";
  const title = girl ? "Baby Girl First Year" : "Baby Boy First Year";
  const mainSticker = girl ? "🎀" : "★";
  const secondSticker = girl ? "🌸" : "🧸";
  const label = girl ? "sweet girl ♡" : "sweet boy ♡";

  return {
    id: makeId(),
    title,
    bg,
    photoCount: 0,
    premium: true,
    pages: Array.from({ length: 12 }, (_, i) => ({
      id: makeId(),
      bg,
      elements: [
        textEl(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 35, 35, {
          size: 24,
          w: 100,
          h: 85,
        }),
        photoEl(155, 95, 190, 185),
        textEl(label, 155, 320, {
          size: 16,
          w: 170,
          h: 45,
        }),
        stickerEl(mainSticker, 45, 315),
        stickerEl(secondSticker, 300, 290),
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

  const [newBookBg, setNewBookBg] = useState("pinkPlaid");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const [showElementMenu, setShowElementMenu] = useState(false);

  const [profileImage, setProfileImage] = useState("");

  const dragRef = useRef(null);
  const [cuteModal, setCuteModal] = useState(null);
const [darkMode, setDarkMode] = useState(false);
const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (u) => {

      setUser(u);

      if (!u) {
        setBooks([]);
        return;
      }

      try {

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
              ...data,
              firebaseId: docu.id,
            });

          }

        });

        setBooks(loaded);

        try {

          const profileRef = doc(db, "profiles", u.uid);

          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {

            const profileData = profileSnap.data();

            if (profileData.photoURL) {
              setProfileImage(profileData.photoURL);
            }

          }

        } catch (err) {
          console.log(err);
        }

      } catch (err) {
        console.log(err);
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

  }

  async function login() {

    if (!email || !password) return;

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  }

  async function logoutUser() {

    await signOut(auth);

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
      newBook,
      ...books,
    ];

    await saveBooks(updated);

    setSelectedBook(updated[0]);

    setSelectedPage(0);

    setScreen("editor");

    setShowCreateModal(false);

    setNewBookName("");

  }

  function openBook(book) {

    setSelectedBook(book);

    setSelectedPage(0);

    setScreen("editor");

  }

  async function deleteBook(book) {

    const bookKey =
      book.firebaseId || book.id;

    if (
      !window.confirm(
        `Delete ${book.title}?`
      )
    ) return;

    try {

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
        (b) => {

          const currentKey =
            b.firebaseId || b.id;

          return currentKey !== bookKey;

        }
      );

      setBooks(filtered);

      if (
        selectedBook &&
        (selectedBook.firebaseId ||
          selectedBook.id) === bookKey
      ) {

        setSelectedBook(null);

        setScreen("home");

      }

    } catch (err) {

      console.log(err);

    }

  }

  async function renameBook(book) {

    const renamed = prompt(
      "Rename scrapbook",
      book.title
    );

    if (!renamed) return;

    const updated = books.map((b) =>
      (b.firebaseId || b.id) ===
      (book.firebaseId || book.id)
        ? {
            ...b,
            title: renamed,
          }
        : b
    );

    await saveBooks(updated);

    setBooks(updated);

  }

  async function uploadProfilePicture(e) {

    try {

      const file = e.target.files[0];

      if (!file || !user) return;

      const storageRef = ref(
        storage,
        `profiles/${user.uid}/${Date.now()}-${file.name}`
      );

      await uploadBytes(
        storageRef,
        file
      );

      const url =
        await getDownloadURL(
          storageRef
        );

      setProfileImage(url);

      await setDoc(
        doc(db, "profiles", user.uid),
        {
          photoURL: url,
        },
        { merge: true }
      );

    } catch (err) {

      console.log(err);

      alert(
        "Upload failed. Check Firebase Storage rules."
      );

    }

  }
  function selectedPageData() {
    if (!selectedBook) return null;
    return selectedBook.pages[selectedPage];
  }

  function updateBook(updatedBook) {
    const updatedBooks = books.map((b) =>
      (b.firebaseId || b.id) ===
      (updatedBook.firebaseId || updatedBook.id)
        ? updatedBook
        : b
    );

    setBooks(updatedBooks);
    setSelectedBook(updatedBook);
    saveBooks(updatedBooks);
  }

  function updateElement(updatedEl) {
    if (!selectedBook) return;

    const updatedPages = selectedBook.pages.map((p, i) => {
      if (i !== selectedPage) return p;

      return {
        ...p,
        elements: p.elements.map((el) =>
          el.id === updatedEl.id ? updatedEl : el
        ),
      };
    });

    updateBook({
      ...selectedBook,
      pages: updatedPages,
    });
  }

  function addElementToPage(element) {
    if (!selectedBook) return;

    const updatedPages = selectedBook.pages.map((p, i) => {
      if (i !== selectedPage) return p;

      return {
        ...p,
        elements: [...p.elements, element],
      };
    });

    updateBook({
      ...selectedBook,
      pages: updatedPages,
    });

    setSelectedElement(element);
  }

  function deleteSelectedElement() {
    if (!selectedElement || !selectedBook) return;

    const updatedPages = selectedBook.pages.map((p, i) => {
      if (i !== selectedPage) return p;

      return {
        ...p,
        elements: p.elements.filter(
          (el) => el.id !== selectedElement.id
        ),
      };
    });

    updateBook({
      ...selectedBook,
      pages: updatedPages,
    });

    setSelectedElement(null);
    setShowElementMenu(false);
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
    if (!selectedBook) return;

    const updatedBook = {
      ...selectedBook,
      pages: [
        ...selectedBook.pages,
        {
          id: makeId(),
          bg: selectedBook.bg || "cream",
          elements: [],
        },
      ],
    };

    updateBook(updatedBook);
    setSelectedPage(updatedBook.pages.length - 1);
  }

  async function uploadPhotoToElement(el, file) {
    if (!file || !user) return;

    try {
      const storageRef = ref(
        storage,
        `scrapbooks/${user.uid}/${Date.now()}-${file.name}`
      );

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      updateElement({
        ...el,
        src: url,
      });
    } catch (err) {
      console.log(err);
      alert("Photo upload failed. Check Firebase Storage rules.");
    }
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
      startX: p.x,
      startY: p.y,
      original: { ...el },
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
        className={`scrapElement ${
          isSelected ? "selected" : ""
        }`}
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
                  objectFit:
                    el.fit || "cover",
                  objectPosition: `${
                    el.cropX || 50
                  }% ${el.cropY || 50}%`,
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
              fontWeight: el.bold
                ? "700"
                : "400",
              textDecoration:
                el.underline
                  ? "underline"
                  : "none",
            }}
          />
        )}

        {el.type === "sticker" && (
          <div
            className="stickerElement"
            style={{
              fontSize:
                el.size || 36,
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
                startDrag(
                  e,
                  el,
                  "rotate"
                )
              }
              onTouchStart={(e) =>
                startDrag(
                  e,
                  el,
                  "rotate"
                )
              }
            >
              ↻
            </button>

            <button
              className="handle resizeHandle"
              onMouseDown={(e) =>
                startDrag(
                  e,
                  el,
                  "resize"
                )
              }
              onTouchStart={(e) =>
                startDrag(
                  e,
                  el,
                  "resize"
                )
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
    <div className={`appBg ${darkMode ? "dark" : ""}`}>

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
                    setPassword(
                      e.target.value
                    )
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

        {user &&
          screen === "home" && (
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
                    setShowCreateModal(
                      true
                    )
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
                    key={
                      book.firebaseId ||
                      book.id
                    }
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

                      <h3>
                        {book.title}
                      </h3>

                      <p>
                        {
                          book.pages.length
                        }{" "}
                        pages
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
                    setScreen(
                      "templates"
                    )
                  }
                >
                  Templates
                </button>

                <button
                  onClick={() =>
                    setScreen(
                      "premium"
                    )
                  }
                >
                  Premium
                </button>

                <button
                  onClick={() =>
                    setScreen(
                      "profile"
                    )
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

              <h2>Templates</h2>

              <div
                className="templateCard"
                onClick={() => {

                  const book =
                    myFirstTemplate();

                  const updated = [
                    book,
                    ...books,
                  ];

                  saveBooks(updated);

                  setSelectedBook(
                    updated[0]
                  );

                  setSelectedPage(0);

                  setScreen("editor");

                }}
              >

                <div className="templatePreview bg-cream">

                  <div className="tinyTitle">
                    About Me ♡
                  </div>

                  <div className="tinyPhoto"></div>

                  <div className="tinyPaper"></div>

                  <div className="tinyFlower">
                    🌿
                  </div>

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

                  const updated = [
                    book,
                    ...books,
                  ];

                  saveBooks(updated);

                  setSelectedBook(
                    updated[0]
                  );

                  setSelectedPage(0);

                  setScreen("editor");

                }}
              >

                <div className="templatePreview bg-pinkPlaid">

                  <div className="tinyMonth">
                    1
                    <br />
                    month
                  </div>

                  <div className="tinyPhoto polaroid"></div>

                  <div className="tinyLabel">
                    sweet girl ♡
                  </div>

                  <div className="tinySticker">
                    🎀
                  </div>

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

                  const updated = [
                    book,
                    ...books,
                  ];

                  saveBooks(updated);

                  setSelectedBook(
                    updated[0]
                  );

                  setSelectedPage(0);

                  setScreen("editor");

                }}
              >

                <div className="templatePreview bg-bluePlaid">

                  <div className="tinyMonth">
                    1
                    <br />
                    month
                  </div>

                  <div className="tinyPhoto polaroid"></div>

                  <div className="tinyLabel blue">
                    sweet boy ♡
                  </div>

                  <div className="tinySticker">
                    ⭐
                  </div>

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

              <h2>Premium</h2>

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
                  <div>Templates</div>
                  <div>Limited</div>
                  <div>All</div>
                </div>

                <div className="premiumRow">
                  <div>Fonts</div>
                  <div>Basic</div>
                  <div>All</div>
                </div>

                <div className="premiumRow">
                  <div>Effects</div>
                  <div>—</div>
                  <div>✓</div>
                </div>

              </div>

              <div className="premiumPrice">

                <h3>
                  Pocket Scrapbook+
                </h3>

                <p>$4.99/month</p>

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
<div className="settingsRow">
  <div>
    <strong>Dark Theme</strong>
    <p>Easier on your eyes at night</p>
  </div>

  <button
    className={`toggle ${darkMode ? "on" : ""}`}
    onClick={() => setDarkMode(!darkMode)}
  >
    <span></span>
  </button>
</div>

<button
  className="settingsBtn premiumSettings"
  onClick={() => setScreen("premium")}
>
  👑 Premium
  <span>{isPremium ? "Active" : "Free Plan"}</span>
</button>
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={uploadProfilePicture}
                  />

                </label>

                <h2>Pocket Scrapbook</h2>

               <button
  className="settingsBtn"
  onClick={() =>
    setCuteModal({
      type: "notification",
      title: "Notification settings",
      text: "Coming soon! You’ll be able to choose email updates, new templates, offers, or none.",
      icon: "💌",
      button: "Got it! ♡",
    })
  }
>
  Notifications
</button>

                <button
  className="settingsBtn"
  onClick={() =>
    setCuteModal({
      type: "privacy",
      title: "Your privacy matters ♡",
      text: "Pocket Scrapbook does not sell your personal information. Your scrapbook data and photos are stored securely in your account.",
      icon: "🔒",
      button: "Thanks for trusting us!",
    })
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

                <h2>{selectedBook.title}</h2>

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
                  disabled={selectedPage === 0}
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
                  {selectedBook.pages.length}
                </span>

                <button
                  disabled={
                    selectedPage ===
                    selectedBook.pages.length - 1
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
                  setSelectedElement(null);
                  setShowElementMenu(false);
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
                      photoEl(100, 130, 150, 150)
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
                        90,
                        90
                      )
                    )
                  }
                >
                  Text
                </button>

                <button
                  onClick={() =>
                    addElementToPage(
                      stickerEl("♡", 160, 180)
                    )
                  }
                >
                  Sticker
                </button>

                <button onClick={addPage}>
                  Add Page
                </button>

                <button
                  onClick={() => {
                    if (
                      selectedElement?.type !==
                      "photo"
                    )
                      return;

                    updateElement({
                      ...selectedElement,
                      fit:
                        selectedElement.fit ===
                        "cover"
                          ? "contain"
                          : "cover",
                    });
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
                openBook(showTemplateMenu);
                setShowTemplateMenu(false);
              }}
            >
              Edit
            </button>

            <button
              onClick={() =>
                alert("Flipbook view coming next.")
              }
            >
              View Flipbook
            </button>

            <button
              onClick={() =>
                alert("Export coming soon.")
              }
            >
              Export
            </button>

            <button
              onClick={() => {
                renameBook(showTemplateMenu);
                setShowTemplateMenu(false);
              }}
            >
              Rename
            </button>

            <button
              className="danger"
              onClick={() => {
                deleteBook(showTemplateMenu);
                setShowTemplateMenu(false);
              }}
            >
              Delete
            </button>

            <button
              onClick={() =>
                setShowTemplateMenu(false)
              }
            >
              Cancel
            </button>

          </div>
        )}
        {showCreateModal && (
          <div className="bottomSheet">

            <h3>Create Scrapbook</h3>

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
                    setNewBookBg(bg.id)
                  }
                ></button>

              ))}

            </div>

            {cuteModal && (
  <div className="cuteOverlay">
    <div className={`cuteModal ${cuteModal.type}`}>
      <div className="modalTape"></div>

      <button
        className="modalX"
        onClick={() => setCuteModal(null)}
      >
        ×
      </button>

      <div className="modalIcon">{cuteModal.icon}</div>

      <h2>{cuteModal.title}</h2>

      <p>{cuteModal.text}</p>

      <button
        className="modalBtn"
        onClick={() => setCuteModal(null)}
      >
        {cuteModal.button}
      </button>
    </div>
  </div>
)}
            <button
              className="mainBtn"
              onClick={createBook}
            >
              Create
            </button>

            <button
              onClick={() =>
                setShowCreateModal(false)
              }
            >
              Cancel
            </button>

          </div>
        )}

      </div>

    </div>
  );

}
