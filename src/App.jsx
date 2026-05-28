import React, { useEffect, useState } from "react";

const STICKERS = ["♡", "✿", "🎀", "⭐", "🧸", "🦋", "🌸", "☁️", "📷", "🌿"];
const BGS = ["pinkPlaid", "cream", "bluePlaid", "lavender", "grid", "dots"];

function uid() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function photo(x, y) {
  return { id: uid(), type: "photo", x, y, w: 170, h: 170, r: 0, src: "", fit: "cover" };
}

function text(value, x, y) {
  return { id: uid(), type: "text", x, y, w: 230, h: 70, r: 0, value, size: 26, color: "#35282d", font: "Georgia" };
}

function sticker(value, x, y) {
  return { id: uid(), type: "sticker", x, y, w: 65, h: 65, r: 0, value, size: 36 };
}

function myFirstScrapbook() {
  return {
    title: "My First Scrapbook",
    pages: [
      { bg: "cream", elements: [text("About Me ♡", 80, 35), photo(55, 120), text("My name:\nBirthday:\nFavorite color:", 45, 330), sticker("✿", 310, 300)] },
      { bg: "cream", elements: [text("My Family ♡", 80, 35), photo(55, 115), photo(225, 115), sticker("♡", 320, 315)] },
      { bg: "cream", elements: [text("My Best Friends ♡", 45, 35), photo(55, 120), photo(225, 120), text("Favorite memories:", 80, 340)] },
      { bg: "cream", elements: [text("Places I’ve Been ♡", 40, 35), photo(55, 115), photo(225, 115), sticker("📷", 315, 315)] },
      { bg: "cream", elements: [text("Special Memories ♡", 35, 35), photo(55, 105), photo(225, 105), photo(55, 285), photo(225, 285)] },
    ],
  };
}

function babyBook(girl) {
  return {
    title: girl ? "Baby Girl First Year" : "Baby Boy First Year",
    pages: Array.from({ length: 12 }, (_, i) => ({
      bg: girl ? "pinkPlaid" : "bluePlaid",
      elements: [
        text(`${i + 1}\nmonth${i === 0 ? "" : "s"}`, 35, 40),
        photo(145, 90),
        text(girl ? "sweet girl ♡" : "sweet boy ♡", 135, 315),
        sticker(girl ? "🎀" : "⭐", 45, 315),
      ],
    })),
  };
}

export default function App() {
  const saved = localStorage.getItem("pocketBook");
  const [book, setBook] = useState(saved ? JSON.parse(saved) : myFirstScrapbook());
  const [screen, setScreen] = useState("home");
  const [pageIndex, setPageIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [dark, setDark] = useState(false);
  const [premium, setPremium] = useState(false);
  const [drag, setDrag] = useState(null);

  const page = book.pages[pageIndex];
  const selectedEl = page.elements.find((e) => e.id === selected);

  useEffect(() => {
    document.body.classList.toggle("darkTheme", dark);
  }, [dark]);

  useEffect(() => {
    function move(e) {
      if (!drag) return;
      const p = e.touches ? e.touches[0] : e;
      updateEl(drag.id, {
        x: drag.start.x + (p.clientX - drag.mouse.x),
        y: drag.start.y + (p.clientY - drag.mouse.y),
      });
    }

    function up() {
      setDrag(null);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [drag, book]);

  function updatePage(next) {
    const pages = [...book.pages];
    pages[pageIndex] = next;
    setBook({ ...book, pages });
  }

  function updateEl(id, changes) {
    updatePage({
      ...page,
      elements: page.elements.map((el) => (el.id === id ? { ...el, ...changes } : el)),
    });
  }

  function addEl(el) {
    updatePage({ ...page, elements: [...page.elements, el] });
    setSelected(el.id);
  }

  function upload(id, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateEl(id, { src: reader.result });
    reader.readAsDataURL(file);
  }

  function saveBook() {
    localStorage.setItem("pocketBook", JSON.stringify(book));
    alert("Scrapbook saved!");
  }

  function startMove(e, el) {
    e.stopPropagation();
    const p = e.touches ? e.touches[0] : e;
    setSelected(el.id);
    setDrag({ id: el.id, mouse: { x: p.clientX, y: p.clientY }, start: { x: el.x, y: el.y } });
  }

  function renderEl(el) {
    return (
      <div
        key={el.id}
        className={`item ${selected === el.id ? "selected" : ""}`}
        style={{ left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.r}deg)` }}
        onMouseDown={(e) => startMove(e, el)}
        onTouchStart={(e) => startMove(e, el)}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(el.id);
        }}
      >
        {el.type === "photo" && (
          <label className="photoFrame">
            {el.src ? <img src={el.src} style={{ objectFit: el.fit }} /> : <span>+ Photo</span>}
            <input hidden type="file" accept="image/*" onChange={(e) => upload(el.id, e.target.files[0])} />
          </label>
        )}

        {el.type === "text" && (
          <textarea
            value={el.value}
            onChange={(e) => updateEl(el.id, { value: e.target.value })}
            style={{ fontSize: el.size, color: el.color, fontFamily: el.font }}
          />
        )}

        {el.type === "sticker" && <div className="stickerArt" style={{ fontSize: el.size }}>{el.value}</div>}

        {selected === el.id && (
          <>
            <button className="handle rotate" onClick={() => updateEl(el.id, { r: el.r + 15 })}>↻</button>
            <button className="handle resize" onClick={() => updateEl(el.id, { w: el.w + 20, h: el.h + 20 })}>↘</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="phone">
      {screen === "home" && (
        <div className="screen home">
          <div className="hero">
            <div className="paper">
              <div className="tape"></div>
              <h1>pocket<br />scrapbook</h1>
              <p>♡ cherish every moment</p>
            </div>
            <button className="pinkBtn" onClick={() => setScreen("templates")}>Create Scrapbook</button>
          </div>

          <h2>My Scrapbooks</h2>

          <div className="bookCard" onClick={() => setScreen("editor")}>
            <div className={`mini bg-${book.pages[0].bg}`}></div>
            <div>
              <b>{book.title}</b>
              <small>{book.pages.length} pages</small>
            </div>
          </div>

          <nav>
            <button onClick={() => setScreen("home")}>Home</button>
            <button onClick={() => setScreen("templates")}>Templates</button>
            <button onClick={() => setScreen("editor")}>Create</button>
            <button onClick={() => setScreen("premium")}>Premium</button>
            <button onClick={() => setScreen("profile")}>Profile</button>
          </nav>
        </div>
      )}

      {screen === "templates" && (
        <div className="screen">
          <button className="back" onClick={() => setScreen("home")}>← Back</button>
          <h2>Templates</h2>
          <button className="template" onClick={() => { setBook(myFirstScrapbook()); setPageIndex(0); setScreen("editor"); }}>My First Scrapbook <span>Free</span></button>
          <button className="template premium" onClick={() => premium ? (setBook(babyBook(true)), setPageIndex(0), setScreen("editor")) : setScreen("premium")}>Baby Girl First Year <span>$4.99</span></button>
          <button className="template premium" onClick={() => premium ? (setBook(babyBook(false)), setPageIndex(0), setScreen("editor")) : setScreen("premium")}>Baby Boy First Year <span>$4.99</span></button>
        </div>
      )}

      {screen === "premium" && (
        <div className="screen">
          <button className="back" onClick={() => setScreen("home")}>← Back</button>
          <h2>Premium</h2>
          <div className="price"><h3>Baby First Year Pack</h3><b>$4.99</b><p>Unlock baby templates.</p><button onClick={() => setPremium(true)}>Unlock for testing</button></div>
        </div>
      )}

      {screen === "profile" && (
        <div className="screen">
          <button className="back" onClick={() => setScreen("home")}>← Back</button>
          <div className="profile">
            <div className="avatar">♡</div>
            <h2>Pocket Scrapbook</h2>
            <div className="setting"><span>Dark Mode</span><button onClick={() => setDark(!dark)}>{dark ? "ON" : "OFF"}</button></div>
            <div className="setting">Notifications</div>
            <div className="setting">Privacy</div>
            <div className="setting">Backup & Sync</div>
            <button className="logout" onClick={() => setScreen("home")}>Log Out</button>
          </div>
        </div>
      )}

      {screen === "editor" && (
        <div className="screen editor">
          <header>
            <button onClick={() => setScreen("home")}>←</button>
            <button onClick={() => {
              const n = prompt("Rename scrapbook", book.title);
              if (n) setBook({ ...book, title: n });
            }}>Rename</button>
            <button onClick={saveBook}>Save</button>
          </header>

          <div className="pageCount">
            <button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>‹</button>
            Page {pageIndex + 1}/{book.pages.length}
            <button disabled={pageIndex === book.pages.length - 1} onClick={() => setPageIndex(pageIndex + 1)}>›</button>
          </div>

          <main className={`scrapPage bg-${page.bg}`} onClick={() => setSelected(null)}>
            {page.elements.map(renderEl)}
          </main>

          <div className="tools">
            <button onClick={() => addEl(photo(95, 145))}>Photo</button>
            <button onClick={() => addEl(text("tap to edit", 95, 100))}>Text</button>
            <button onClick={() => setModal("stickers")}>Stickers</button>
            <button onClick={() => setModal("backgrounds")}>Background</button>
            <button onClick={() => setModal("text")}>Text Tools</button>
            <button onClick={() => selectedEl?.type === "photo" && updateEl(selected, { fit: selectedEl.fit === "cover" ? "contain" : "cover" })}>Crop</button>
            <button onClick={() => { setBook({ ...book, pages: [...book.pages, { bg: "cream", elements: [] }] }); setPageIndex(book.pages.length); }}>Page</button>
            <button onClick={() => selected && updatePage({ ...page, elements: page.elements.filter((el) => el.id !== selected) })}>Delete</button>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal" onClick={() => setModal(null)}>
          <div className="box" onClick={(e) => e.stopPropagation()}>
            <button className="x" onClick={() => setModal(null)}>×</button>

            {modal === "stickers" && (
              <>
                <h2>Stickers</h2>
                <div className="grid">{STICKERS.map((s) => <button key={s} onClick={() => { addEl(sticker(s, 145, 180)); setModal(null); }}>{s}</button>)}</div>
              </>
            )}

            {modal === "backgrounds" && (
              <>
                <h2>Backgrounds</h2>
                <div className="grid">{BGS.map((b) => <button key={b} className={`bgPick bg-${b}`} onClick={() => { updatePage({ ...page, bg: b }); setModal(null); }}>{b}</button>)}</div>
              </>
            )}

            {modal === "text" && (
              <>
                <h2>Text Tools</h2>
                <div className="grid">
                  {["Georgia", "Arial", "Courier New", "Trebuchet MS"].map((f) => (
                    <button key={f} style={{ fontFamily: f }} onClick={() => selectedEl?.type === "text" && updateEl(selected, { font: f })}>{f}</button>
                  ))}
                  <button onClick={() => selectedEl?.type === "text" && updateEl(selected, { size: selectedEl.size + 2 })}>Bigger</button>
                  <button onClick={() => selectedEl?.type === "text" && updateEl(selected, { size: selectedEl.size - 2 })}>Smaller</button>
                  <button onClick={() => selectedEl?.type === "text" && updateEl(selected, { color: "#d96f94" })}>Pink</button>
                  <button onClick={() => selectedEl?.type === "text" && updateEl(selected, { color: "#2f2528" })}>Black</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
