import React, { useEffect, useState } from "react";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "templates", label: "Templates" },
  { id: "create", label: "Create" },
  { id: "premium", label: "Premium" },
  { id: "profile", label: "Profile" },
];

const FREE_STICKERS = [
  "♡",
  "✿",
  "🎀",
  "⭐",
  "🧸",
  "🦋",
  "☁",
  "✈",
];

const BACKGROUNDS = [
  "cream",
  "pink",
  "blue",
  "paper",
  "grid",
];

function makeId() {
  return crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function createPhoto(x, y) {
  return {
    id: makeId(),
    type: "photo",
    src: "",
    x,
    y,
    w: 180,
    h: 180,
    rotate: 0,
    crop: "cover",
    cropX: 50,
    cropY: 50,
  };
}

function createText(text, x, y) {
  return {
    id: makeId(),
    type: "text",
    text,
    x,
    y,
    w: 220,
    h: 60,
    rotate: 0,
    fontSize: 28,
    color: "#3d2d34",
    fontFamily: "Georgia",
    bold: false,
  };
}

function createSticker(sticker, x, y) {
  return {
    id: makeId(),
    type: "sticker",
    text: sticker,
    x,
    y,
    w: 60,
    h: 60,
    rotate: 0,
    fontSize: 34,
  };
}

function makeStarterBook() {
  return {
    title: "My First Scrapbook",
    pages: [
      {
        id: makeId(),
        background: "cream",
        elements: [
          createText("my first scrapbook ♡", 60, 35),
          createPhoto(70, 120),
          createSticker("✿", 300, 90),
          createSticker("🎀", 40, 340),
        ],
      },
    ],
  };
}

export default function App() {
  const [screen, setScreen] = useState("home");

  const [books, setBooks] = useState([]);

  const [book, setBook] = useState(null);

  const [pageIndex, setPageIndex] = useState(0);

  const [selectedId, setSelectedId] = useState(null);

  const [modal, setModal] = useState(null);

  const [darkMode, setDarkMode] = useState(false);

  const [drag, setDrag] = useState(null);

  const page = book?.pages?.[pageIndex];

  useEffect(() => {
    document.body.classList.toggle(
      "darkTheme",
      darkMode
    );
  }, [darkMode]);

  function createBook() {
    const newBook = makeStarterBook();

    setBook(newBook);

    setPageIndex(0);

    setScreen("editor");
  }

  function updatePage(nextPage) {
    const pages = [...book.pages];

    pages[pageIndex] = nextPage;

    setBook({
      ...book,
      pages,
    });
  }

  function updateElement(id, changes) {
    updatePage({
      ...page,
      elements: page.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              ...changes,
            }
          : el
      ),
    });
  }

  function addPhoto() {
    updatePage({
      ...page,
      elements: [
        ...page.elements,
        createPhoto(90, 140),
      ],
    });
  }

  function addText() {
    updatePage({
      ...page,
      elements: [
        ...page.elements,
        createText("tap to edit", 80, 90),
      ],
    });
  }

  function addSticker(sticker) {
    updatePage({
      ...page,
      elements: [
        ...page.elements,
        createSticker(sticker, 120, 160),
      ],
    });

    setModal(null);
  }

  function uploadImage(id, file) {
    const reader = new FileReader();

    reader.onload = () => {
      updateElement(id, {
        src: reader.result,
      });
    };

    reader.readAsDataURL(file);
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
  useEffect(() => {
    function move(e) {
      if (!drag || !book) return;

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
          w: Math.max(60, el.w + dx),
          h: Math.max(60, el.h + dy),
        });
      }

      if (drag.mode === "rotate") {
        updateElement(drag.id, {
          rotate: el.rotate + dx,
        });
      }
    }

    function stop() {
      setDrag(null);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);

    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);

      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", stop);
    };
  }, [drag, book]);

  function renderElement(el) {
    return (
      <div
        key={el.id}
        className={`scrapElement ${
          selectedId === el.id ? "selected" : ""
        }`}
        style={{
          left: el.x,
          top: el.y,
          width: el.w,
          height: el.h,
          transform: `rotate(${el.rotate}deg)`,
        }}
        onMouseDown={(e) => startDrag(e, el)}
        onTouchStart={(e) => startDrag(e, el)}
        onClick={() => setSelectedId(el.id)}
      >
        {el.type === "photo" && (
          <label className="photoFrame">
            {el.src ? (
              <img
                src={el.src}
                style={{
                  objectFit: el.crop,
                  objectPosition:
                    `${el.cropX}% ${el.cropY}%`,
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
                uploadImage(
                  el.id,
                  e.target.files[0]
                )
              }
            />
          </label>
        )}

        {el.type === "text" && (
          <textarea
            value={el.text}
            onChange={(e) =>
              updateElement(el.id, {
                text: e.target.value,
              })
            }
            style={{
              fontSize: el.fontSize,
              color: el.color,
              fontFamily: el.fontFamily,
              fontWeight: el.bold
                ? "700"
                : "400",
            }}
          />
        )}

        {el.type === "sticker" && (
          <div
            className="stickerArt"
            style={{
              fontSize: el.fontSize,
            }}
          >
            {el.text}
          </div>
        )}

        {selectedId === el.id && (
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
    <div className="app">

      {screen === "home" && (
        <div className="homeScreen">

          <div className="heroCard">
            <div className="heroDecor heroLeft">
              🎀
            </div>

            <div className="heroDecor heroRight">
              ♡
            </div>

            <div className="heroContent">
              <div className="heroLabel">
                cherish every moment
              </div>

              <h1>
                pocket
                <br />
                scrapbook
              </h1>

              <button
                className="mainPinkBtn"
                onClick={createBook}
              >
                Create Scrapbook
              </button>
     
      </div>
    );
}

export default App;
