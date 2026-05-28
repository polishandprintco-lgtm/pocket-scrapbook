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
