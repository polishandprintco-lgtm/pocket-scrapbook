import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "./firebase";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&family=Archivo+Black&family=Caveat:wght@500;700&family=Dancing+Script:wght@600&family=Georgia&family=Great+Vibes&family=Montserrat:wght@500;700&family=Pacifico&family=Playfair+Display:wght@600;700&family=Poppins:wght@400;600;800&display=swap');

*{box-sizing:border-box}
body{margin:0;background:#f3edf0;font-family:Poppins,Arial,sans-serif}
button,input,textarea,select{font-family:inherit}
button{border:0;cursor:pointer}
.appBg{min-height:100vh;display:flex;justify-content:center;background:#f3edf0}
.phoneShell{width:100%;max-width:430px;min-height:100vh;position:relative;overflow-x:hidden;background:linear-gradient(#ffffffaa,#ffffffaa),repeating-linear-gradient(45deg,#ffdce9 0 18px,#fff1f6 18px 36px);box-shadow:0 0 40px #0002}
.authScreen,.homeScreen,.screen{min-height:100vh;padding:18px 18px 110px}
.heroCard,.profileCard,.premiumBox{background:#fffaf4;border-radius:32px;padding:28px 22px;text-align:center;box-shadow:0 14px 35px #0002;position:relative;margin-bottom:18px}
.logoTape{position:absolute;top:14px;left:50%;transform:translateX(-50%) rotate(-2deg);width:115px;height:28px;background:#eaa8bdcc;border-radius:4px}
h1{font-family:Georgia,serif;font-size:44px;line-height:.9;margin:18px 0;color:#34262b}
h2{font-family:Georgia,serif;font-size:30px;margin:12px 0}
p{color:#7c6870}
input,textarea,select{outline:0}
input,select{width:100%;padding:14px;border:1px solid #ecd7df;border-radius:18px;margin:7px 0;background:white}
.passwordWrap{position:relative}
.passwordWrap button{position:absolute;right:8px;top:13px;background:#fff0f6;color:#d96f94;border-radius:12px;padding:8px 10px;font-weight:800}
.mainBtn,.secondaryBtn,.backBtn,.settingsBtn,.logoutBtn,.bottomSheet button,.toolBar button,.bottomNav button{border-radius:18px;padding:12px 14px;font-weight:800}
.mainBtn{width:100%;background:linear-gradient(135deg,#ff9cc2,#e96e9f);color:white;box-shadow:0 10px 22px #e96e9f55}
.secondaryBtn{width:100%;margin-top:10px;background:#fff0f6;color:#d96f94}
.backBtn{background:white;margin-bottom:14px;box-shadow:0 7px 18px #0001}
.sectionTitle{font-family:Georgia,serif;font-size:30px;font-weight:900;margin:18px 4px 12px}
.booksList{display:flex;flex-direction:column;gap:14px}
.bookCard{background:white;border-radius:26px;padding:14px;display:grid;grid-template-columns:78px 1fr 42px;gap:12px;align-items:center;box-shadow:0 10px 26px #0001}
.bookPreview{width:78px;height:78px;border-radius:18px;box-shadow:inset 0 0 0 5px white}
.bookInfo h3{margin:0 0 5px;font-size:17px}
.bookInfo p{margin:0;font-size:13px}
.dotsBtn{width:40px;height:40px;border-radius:14px;background:#fff0f6;font-size:22px}
.bottomNav,.toolBar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:#ffffffe8;backdrop-filter:blur(10px);display:flex;gap:8px;padding:12px;z-index:100;box-shadow:0 -8px 25px #0001}
.bottomNav button,.toolBar button{flex:1;background:#fff0f6;color:#4a333b;font-size:12px}
.templateCard{width:100%;background:white;border-radius:26px;padding:16px;margin:12px 0;text-align:left;box-shadow:0 10px 26px #0001;font-weight:900;color:#3b2c32}
.profileImageWrap{display:block;width:98px;height:98px;border-radius:50%;overflow:hidden;background:#ffd6e6;margin:0 auto 14px;cursor:pointer}
.profileImage{width:100%;height:100%;object-fit:cover}
.profilePlaceholder{width:100%;height:100%;display:grid;place-items:center;font-size:44px;color:#d96f94}
.settingsBtn,.logoutBtn{width:100%;display:block;margin:10px 0;text-align:left;background:#fff0f6}
.logoutBtn{text-align:center;background:linear-gradient(135deg,#ff9cc2,#e96e9f);color:white}
.settingsRow{background:#fff0f6;border-radius:22px;padding:14px;margin:10px 0;display:flex;justify-content:space-between;align-items:center;text-align:left}
.settingsRow p{margin:3px 0 0;font-size:12px}
.toggle{width:58px;height:32px;border-radius:999px;background:#ead8df;padding:4px}
.toggle span{display:block;width:24px;height:24px;background:white;border-radius:50%;transition:.2s}
.toggle.on{background:#e66fa1}
.toggle.on span{transform:translateX(26px)}
.editorScreen{min-height:100vh;padding-bottom:160px}
.editorHeader{background:white;padding:14px;display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:8px;box-shadow:0 4px 14px #0001}
.editorHeader button{height:40px;border-radius:14px;background:#fff0f6;font-weight:900}
.editorHeader h2{font-size:16px;text-align:center;margin:0}
.pageNav{display:flex;justify-content:center;align-items:center;gap:14px;padding:12px;font-weight:900}
.pageNav button{background:white;border-radius:14px;padding:8px 14px}
.scrapPage{position:relative;width:100%;height:560px;margin:0 auto 16px;border-radius:0 0 34px 34px;overflow:hidden;box-shadow:0 14px 35px #0003}
.scrapElement{position:absolute;touch-action:none}
.scrapElement.selected{outline:3px dashed #e96e9f}
.photoFrame{width:100%;height:100%;background:white;border:8px solid white;border-radius:15px;box-shadow:0 8px 18px #0003;display:grid;place-items:center;overflow:hidden;color:#a85e7a;font-weight:900}
.photoFrame img{width:100%;height:100%;object-fit:cover}
.emptyPhoto{width:100%;height:100%;display:grid;place-items:center}
.scrapElement textarea{width:100%;height:100%;border:0;resize:none;background:transparent;text-align:center}
.stickerElement{width:100%;height:100%;display:grid;place-items:center;filter:drop-shadow(0 5px 7px #0002)}
.handle{position:absolute;width:32px;height:32px;border-radius:50%;background:#e96e9f;color:white;z-index:20}
.rotateHandle{top:-16px;right:-16px}
.resizeHandle{bottom:-16px;right:-16px}
.elementBubble{position:absolute;left:50%;bottom:-54px;transform:translateX(-50%);background:white;border-radius:18px;padding:6px;display:flex;gap:6px;box-shadow:0 8px 20px #0003;z-index:25}
.elementBubble button{background:#fff0f6;border-radius:12px;padding:8px 10px;font-weight:800}
.cropControls{position:fixed;bottom:74px;left:50%;transform:translateX(-50%);background:white;padding:8px;border-radius:22px;display:flex;gap:8px;z-index:110;box-shadow:0 8px 22px #0002}
.cropControls button{width:42px;height:38px;border-radius:14px;background:#fff0f6;font-weight:900}
.textToolbar{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);width:100%;max-width:430px;background:white;border-radius:24px 24px 0 0;padding:12px;z-index:130;box-shadow:0 -10px 25px #0002}
.textToolbarGrid{display:grid;grid-template-columns:48px 1fr;gap:8px;align-items:center}
.textToolbar input[type=color]{height:44px;padding:2px}
.textToolbar input[type=range]{width:100%}
.textToolbar select{margin:0}
.textButtons{display:flex;gap:6px;margin-top:8px}
.textButtons button{flex:1;background:#fff0f6;border-radius:14px;padding:9px;font-weight:900}
.bottomSheet{position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:100%;max-width:430px;max-height:82vh;overflow:auto;background:white;border-radius:30px 30px 0 0;padding:20px;box-shadow:0 -12px 35px #0003;z-index:500}
.bottomSheet button{width:100%;margin:7px 0;background:#fff0f6}
.danger{background:#ffe4e9!important;color:#c73558}
.bgPicker{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:12px 0}
.bgChoice{height:66px;border-radius:16px;border:3px solid white;box-shadow:0 4px 12px #0002;overflow:hidden}
.bgChoice span{display:block;background:#ffffffcc;font-size:11px;padding:4px;border-radius:10px}
.stickerGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.stickerGrid button{min-height:72px}
.stickerGrid span{font-size:28px}
.cuteOverlay{position:fixed;inset:0;background:#1e141c88;backdrop-filter:blur(8px);z-index:999;display:grid;place-items:center;padding:20px}
.cuteModal{width:100%;max-width:360px;background:#fff8f2;border:4px solid #ffd3e1;border-radius:30px;padding:34px 24px 24px;text-align:center;position:relative;box-shadow:0 20px 45px #0004}
.modalTape{position:absolute;top:-18px;left:50%;transform:translateX(-50%) rotate(-3deg);width:120px;height:32px;background:repeating-linear-gradient(45deg,#ff9fc2 0 10px,#ffd1df 10px 20px);border-radius:5px}
.modalX{position:absolute;top:12px;right:12px;width:38px;height:38px;border-radius:50%;background:#ff91b7;font-size:24px}
.modalIcon{font-size:54px;margin-bottom:10px}
.modalBtn{margin-top:12px;background:linear-gradient(135deg,#ff9cc2,#df5d91);color:white;border-radius:18px;padding:14px 28px;font-weight:900}
.lightBtn{background:#fff0f6;color:#4a333b}
.dangerBtn{background:#ff6f8f}
.bg-pinkPlaid{background:linear-gradient(#ffffff66,#ffffff66),repeating-linear-gradient(45deg,#ffd5e6 0 18px,#fff0f6 18px 36px)}
.bg-bluePlaid{background:linear-gradient(#ffffff66,#ffffff66),repeating-linear-gradient(45deg,#cfe6ff 0 18px,#f2f8ff 18px 36px)}
.bg-cream{background:#fff8ee}
.bg-lavender{background:#eee4ff}
.bg-grid{background-color:white;background-image:linear-gradient(#eee 1px,transparent 1px),linear-gradient(90deg,#eee 1px,transparent 1px);background-size:24px 24px}
.bg-dots{background-color:white;background-image:radial-gradient(#ddd 1px,transparent 1px);background-size:18px 18px}
.appBg.dark{background:#111}
.appBg.dark .phoneShell{background:#151518;color:white}
.appBg.dark .heroCard,.appBg.dark .bookCard,.appBg.dark .templateCard,.appBg.dark .premiumBox,.appBg.dark .profileCard,.appBg.dark .bottomSheet,.appBg.dark .editorHeader,.appBg.dark .bottomNav,.appBg.dark .toolBar,.appBg.dark .cropControls,.appBg.dark .textToolbar{background:#1f2024;color:white}
.appBg.dark button,.appBg.dark .settingsRow{background:#2b2c31;color:white}
`;

const BACKGROUNDS = [
  { id: "cream", name: "Cream" },
  { id: "pinkPlaid", name: "Pink Plaid" },
  { id: "bluePlaid", name: "Blue Plaid" },
  { id: "lavender", name: "Lavender" },
  { id: "grid", name: "Grid" },
  { id: "dots", name: "Dots" },
];

const STICKERS = ["♡","♥","🎀","✿","🌸","🌼","🌿","🦋","🧸","🐰","🐶","🐱","🦊","🐾","📷","🎞️","📝","📚","✈️","🌎","📍","☕","🏠","🎁","🎈","🎂","★","✦","☾","☁"];

const FREE_FONTS = ["Poppins", "Montserrat", "Caveat", "Dancing Script", "Georgia", "Playfair Display"];
const PREMIUM_FONTS = ["Great Vibes", "Pacifico", "Amatic SC", "Archivo Black"];

function makeId(){return crypto?.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`}
function photoEl(x,y,w=160,h=160){return{id:makeId(),type:"photo",x,y,w,h,r:0,src:"",cropX:50,cropY:50}}
function textEl(value,x,y,size=22){return{id:makeId(),type:"text",value,x,y,w:210,h:80,r:0,size,color:"#2f2528",font:"Georgia",bold:false,italic:false,underline:false,align:"center"}}
function stickerEl(value,x,y){return{id:makeId(),type:"sticker",value,x,y,w:60,h:60,r:0,size:36}}

function makeBook(title,bg="cream"){
  return{id:makeId(),title,bg,pages:[{id:makeId(),bg,elements:[textEl(title,90,40,28),photoEl(95,150,210,210),stickerEl("♡",285,390)]}]}
}

function myFirstTemplate(){
  return{id:makeId(),title:"My First Scrapbook",bg:"cream",pages:[
    {id:makeId(),bg:"cream",elements:[textEl("About Me ♡",105,28,30),photoEl(45,115,155,155),textEl("Some of my favorite\\nthings:\\nColor:\\nFood:\\nBook:\\nSong:",230,120,13),textEl("My name:\\nBirthday:\\nFavorite color:",80,335,20),stickerEl("✿",300,320),stickerEl("♡",318,405)]},
    {id:makeId(),bg:"cream",elements:[textEl("My Family ♡",112,28,30),photoEl(45,110,165,140),textEl("About my family:",230,110,15),textEl("The people I love most:",92,275,16),photoEl(55,330,85,90),photoEl(165,330,85,90),photoEl(275,330,85,90),stickerEl("🌿",320,285)]},
    {id:makeId(),bg:"cream",elements:[textEl("My Best Friends ♡",75,28,28),photoEl(55,130,130,155),photoEl(230,130,130,155),textEl("Name:\\nWe met:",60,305,13),textEl("Name:\\nWe met:",235,305,13)]},
    {id:makeId(),bg:"cream",elements:[textEl("My Personality ♡",78,28,28),textEl("I am...",50,120,17),textEl("Words that describe me:\\n○\\n○\\n○\\n○",220,110,14),textEl("I’m proud of:",90,330,16)]},
  ]}
}

function babyTemplate(girl=true){
  const bg=girl?"pinkPlaid":"bluePlaid";
  const title=girl?"Baby Girl First Year":"Baby Boy First Year";
  return{id:makeId(),title,bg,premium:true,pages:Array.from({length:12},(_,i)=>({id:makeId(),bg,elements:[
    textEl(`${i + 1}
month${i === 0 ? "" : "s"}`,35,35,24),
    photoEl(150,95,190,185),
    textEl(girl?"sweet girl ♡":"sweet boy ♡",155,320,16),
    stickerEl(girl?"🎀":"★",45,315),
    stickerEl(girl?"🌸":"🧸",300,290),
    stickerEl("♡",320,365),
    stickerEl("🌿",55,220),
  ]}))}
}

function App(){
  const [user,setUser]=useState(null);
  const [screen,setScreen]=useState("home");
  const [books,setBooks]=useState([]);
  const [selectedBook,setSelectedBook]=useState(null);
  const [selectedPage,setSelectedPage]=useState(0);
  const [selectedElement,setSelectedElement]=useState(null);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [newBookName,setNewBookName]=useState("");
  const [newBookBg,setNewBookBg]=useState("cream");
  const [profileImage,setProfileImage]=useState("");
  const [darkMode,setDarkMode]=useState(false);
  const [subscription,setSubscription]=useState("Free Plan");
  const [modal,setModal]=useState(null);
  const [actionBook,setActionBook]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [showCreate,setShowCreate]=useState(false);
  const [showStickers,setShowStickers]=useState(false);
  const [stickerSearch,setStickerSearch]=useState("");
  const [showBgPicker,setShowBgPicker]=useState(false);
  const [flipBook,setFlipBook]=useState(null);
  const [flipPage,setFlipPage]=useState(0);
  const dragRef=useRef(null);

  const isPremium = subscription === "Premium Monthly";

  const filteredStickers=useMemo(()=>{
    const s=stickerSearch.trim().toLowerCase();
    if(!s)return STICKERS;
    return STICKERS.filter(x=>x.toLowerCase().includes(s));
  },[stickerSearch]);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async(u)=>{
      setUser(u);
      if(!u){setBooks([]);return}
      const snap=await getDocs(query(collection(db,"scrapbooks"),orderBy("createdAt","desc")));
      const loaded=[];
      snap.forEach(d=>{const data=d.data();if(data.uid===u.uid)loaded.push({...data,id:data.id||d.id,firebaseId:d.id})});
      setBooks(loaded);
      const p=await getDoc(doc(db,"profiles",u.uid));
      if(p.exists()){const data=p.data();setProfileImage(data.photoURL||"");setDarkMode(data.darkMode||false);setSubscription(data.subscription||"Free Plan")}
    });
    return()=>unsub();
  },[]);

  async function signup(){if(email&&password)await createUserWithEmailAndPassword(auth,email,password)}
  async function login(){if(email&&password)await signInWithEmailAndPassword(auth,email,password)}
  async function logoutUser(){await signOut(auth);setScreen("home")}
  async function saveProfile(data){if(user)await setDoc(doc(db,"profiles",user.uid),data,{merge:true})}
  async function toggleDarkMode(){const next=!darkMode;setDarkMode(next);await saveProfile({darkMode:next})}

  async function uploadProfilePicture(e){
    const file=e.target.files?.[0]; if(!file||!user)return;
    try{const fileRef=ref(storage,`profiles/${user.uid}/profile-${Date.now()}-${file.name}`);await uploadBytes(fileRef,file);const url=await getDownloadURL(fileRef);setProfileImage(url);await saveProfile({photoURL:url})}
    catch{setModal({icon:"⚠️",title:"Upload failed",text:"Firebase Storage rules are blocking this upload.",button:"Okay"})}
  }

  async function saveBooks(updated){
    if(!user)return;
    setBooks(updated);
    for(const b of updated){
      const clean={...b,id:b.id||makeId(),uid:user.uid}; delete clean.firebaseId;
      if(b.firebaseId) await updateDoc(doc(db,"scrapbooks",b.firebaseId),clean);
      else{const added=await addDoc(collection(db,"scrapbooks"),{...clean,createdAt:serverTimestamp()});b.firebaseId=added.id}
    }
  }

  function openBook(book){setSelectedBook(book);setSelectedPage(0);setSelectedElement(null);setScreen("editor")}
  async function createBook(){if(!newBookName.trim())return;const book=makeBook(newBookName.trim(),newBookBg);const updated=[book,...books];await saveBooks(updated);openBook(updated[0]);setNewBookName("");setShowCreate(false)}
  async function createFromTemplate(fn){const book=fn();const updated=[book,...books];await saveBooks(updated);openBook(updated[0])}
  async function renameBook(book){const name=prompt("Rename scrapbook:",book.title);if(!name?.trim())return;const updated=books.map(b=>(b.firebaseId||b.id)===(book.firebaseId||book.id)?{...b,title:name.trim()}:b);await saveBooks(updated);if(selectedBook&&(selectedBook.firebaseId||selectedBook.id)===(book.firebaseId||book.id))setSelectedBook({...selectedBook,title:name.trim()})}
  async function deleteBook(book){const key=book.firebaseId||book.id;if(book.firebaseId)await deleteDoc(doc(db,"scrapbooks",book.firebaseId));setBooks(books.filter(b=>(b.firebaseId||b.id)!==key));setConfirmDelete(null);setActionBook(null);if(selectedBook&&(selectedBook.firebaseId||selectedBook.id)===key){setSelectedBook(null);setScreen("home")}}
  function page(){return selectedBook?.pages?.[selectedPage]}

  function updateBook(book){const updated=books.map(b=>(b.firebaseId||b.id)===(book.firebaseId||book.id)?book:b);setBooks(updated);setSelectedBook(book);saveBooks(updated)}
  function updateElement(el){const pages=selectedBook.pages.map((p,i)=>i===selectedPage?{...p,elements:p.elements.map(x=>x.id===el.id?el:x)}:p);updateBook({...selectedBook,pages});setSelectedElement(el)}
  function addElement(el){const pages=selectedBook.pages.map((p,i)=>i===selectedPage?{...p,elements:[...p.elements,el]}:p);updateBook({...selectedBook,pages});setSelectedElement(el)}
  function deleteElement(){const pages=selectedBook.pages.map((p,i)=>i===selectedPage?{...p,elements:p.elements.filter(x=>x.id!==selectedElement.id)}:p);updateBook({...selectedBook,pages});setSelectedElement(null)}
  function duplicateElement(){addElement({...selectedElement,id:makeId(),x:selectedElement.x+20,y:selectedElement.y+20})}
  function addPage(){const book={...selectedBook,pages:[...selectedBook.pages,{id:makeId(),bg:selectedBook.bg,elements:[]}]};updateBook(book);setSelectedPage(book.pages.length-1)}
  function changeBg(bg){const pages=selectedBook.pages.map((p,i)=>i===selectedPage?{...p,bg}:p);updateBook({...selectedBook,pages});setShowBgPicker(false)}

  async function uploadPhoto(el,file){
    if(!file||!user)return;
    try{const fileRef=ref(storage,`scrapbooks/${user.uid}/${Date.now()}-${file.name}`);await uploadBytes(fileRef,file);const url=await getDownloadURL(fileRef);updateElement({...el,src:url})}
    catch{setModal({icon:"⚠️",title:"Photo failed",text:"Firebase Storage blocked this photo upload.",button:"Okay"})}
  }

  function point(e){return e.touches?.[0]?{x:e.touches[0].clientX,y:e.touches[0].clientY}:{x:e.clientX,y:e.clientY}}
  function startDrag(e,el,mode){e.stopPropagation();setSelectedElement(el);const p=point(e);dragRef.current={mode,x:p.x,y:p.y,original:{...el}}}
  function moveDrag(e){if(!dragRef.current)return;const p=point(e);const dx=p.x-dragRef.current.x;const dy=p.y-dragRef.current.y;const o=dragRef.current.original;if(dragRef.current.mode==="move")updateElement({...o,x:o.x+dx,y:o.y+dy});if(dragRef.current.mode==="resize")updateElement({...o,w:Math.max(40,o.w+dx),h:Math.max(40,o.h+dy)});if(dragRef.current.mode==="rotate")updateElement({...o,r:o.r+dx})}
  function stopDrag(){dragRef.current=null}
  useEffect(()=>{window.addEventListener("mousemove",moveDrag);window.addEventListener("mouseup",stopDrag);window.addEventListener("touchmove",moveDrag);window.addEventListener("touchend",stopDrag);return()=>{window.removeEventListener("mousemove",moveDrag);window.removeEventListener("mouseup",stopDrag);window.removeEventListener("touchmove",moveDrag);window.removeEventListener("touchend",stopDrag)}});

  function nudgeCrop(dir){if(!selectedElement||selectedElement.type!=="photo")return;const el={...selectedElement};if(dir==="left")el.cropX=Math.max(0,el.cropX-5);if(dir==="right")el.cropX=Math.min(100,el.cropX+5);if(dir==="up")el.cropY=Math.max(0,el.cropY-5);if(dir==="down")el.cropY=Math.min(100,el.cropY+5);updateElement(el)}

  function renderElement(el){
    const selected=selectedElement?.id===el.id;
    return <div key={el.id} className={`scrapElement ${selected?"selected":""}`} style={{left:el.x,top:el.y,width:el.w,height:el.h,transform:`rotate(${el.r||0}deg)`}} onMouseDown={e=>startDrag(e,el,"move")} onTouchStart={e=>startDrag(e,el,"move")} onClick={e=>{e.stopPropagation();setSelectedElement(el)}}>
      {el.type==="photo"&&<div className="photoFrame">{el.src?<img src={el.src} alt="" style={{objectPosition:`${el.cropX}% ${el.cropY}%`}}/>:<label className="emptyPhoto">+ Photo<input hidden type="file" accept="image/*" onChange={e=>uploadPhoto(el,e.target.files[0])}/></label>}</div>}
      {el.type==="text"&&<textarea value={el.value} onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setSelectedElement(el)}} onChange={e=>updateElement({...el,value:e.target.value})} style={{fontSize:el.size,color:el.color,fontFamily:el.font,fontWeight:el.bold?"800":"400",fontStyle:el.italic?"italic":"normal",textDecoration:el.underline?"underline":"none",textAlign:el.align}}/>}
      {el.type==="sticker"&&<div className="stickerElement" style={{fontSize:el.size}}>{el.value}</div>}
      {selected&&<><button className="handle rotateHandle" onMouseDown={e=>startDrag(e,el,"rotate")}>↻</button><button className="handle resizeHandle" onMouseDown={e=>startDrag(e,el,"resize")}>↘</button><div className="elementBubble"><button onClick={duplicateElement}>Duplicate</button><button onClick={deleteElement}>Delete</button></div></>}
    </div>
  }

  function TextToolbar(){
    if(!selectedElement || selectedElement.type !== "text") return null;
    const fonts = isPremium ? [...FREE_FONTS, ...PREMIUM_FONTS] : FREE_FONTS;
    return <div className="textToolbar">
      <div className="textToolbarGrid">
        <input type="color" value={selectedElement.color} onChange={e=>updateElement({...selectedElement,color:e.target.value})}/>
        <input type="range" min="10" max="72" value={selectedElement.size} onChange={e=>updateElement({...selectedElement,size:Number(e.target.value)})}/>
      </div>
      <select value={selectedElement.font} onChange={e=>updateElement({...selectedElement,font:e.target.value})}>
        {fonts.map(font=><option key={font} value={font}>{font}{PREMIUM_FONTS.includes(font) ? " 👑" : ""}</option>)}
      </select>
      {!isPremium && <p style={{fontSize:12,margin:"4px 0"}}>Premium unlocks more fonts.</p>}
      <div className="textButtons">
        <button onClick={()=>updateElement({...selectedElement,bold:!selectedElement.bold})}>B</button>
        <button onClick={()=>updateElement({...selectedElement,italic:!selectedElement.italic})}>I</button>
        <button onClick={()=>updateElement({...selectedElement,underline:!selectedElement.underline})}>U</button>
        <button onClick={()=>updateElement({...selectedElement,align:selectedElement.align==="left"?"center":selectedElement.align==="center"?"right":"left"})}>Align</button>
      </div>
    </div>
  }

  return <div className={`appBg ${darkMode?"dark":""}`}><style>{css}</style><div className="phoneShell">
    {!user&&<div className="authScreen"><div className="heroCard"><div className="logoTape"></div><h1>pocket<br/>scrapbook</h1><p>cherish every moment ♡</p><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><div className="passwordWrap"><input type={showPassword?"text":"password"} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Hide":"Show"}</button></div><button className="mainBtn" onClick={login}>Login</button><button className="secondaryBtn" onClick={signup}>Create Account</button></div></div>}

    {user&&screen==="home"&&<div className="homeScreen"><div className="heroCard"><div className="logoTape"></div><h1>pocket<br/>scrapbook</h1><p>cherish every moment ♡</p><button className="mainBtn" onClick={()=>setShowCreate(true)}>Create Scrapbook</button></div><div className="sectionTitle">My Scrapbooks</div><div className="booksList">{books.map(book=><div key={book.firebaseId||book.id} className="bookCard"><div className={`bookPreview bg-${book.bg}`} onClick={()=>openBook(book)}></div><div className="bookInfo" onClick={()=>openBook(book)}><h3>{book.title}</h3><p>{book.pages?.length||0} pages</p></div><button className="dotsBtn" onClick={()=>setActionBook(book)}>⋮</button></div>)}</div><div className="bottomNav"><button onClick={()=>setScreen("home")}>Home</button><button onClick={()=>setScreen("templates")}>Templates</button><button onClick={()=>setScreen("premium")}>Premium</button><button onClick={()=>setScreen("profile")}>Profile</button></div></div>}

    {user&&screen==="templates"&&<div className="screen"><button className="backBtn" onClick={()=>setScreen("home")}>← Back</button><h2>Templates</h2><button className="templateCard" onClick={()=>createFromTemplate(myFirstTemplate)}>My First Scrapbook — Free</button><button className="templateCard" onClick={()=>createFromTemplate(()=>babyTemplate(true))}>Baby Girl First Year — $1.99</button><button className="templateCard" onClick={()=>createFromTemplate(()=>babyTemplate(false))}>Baby Boy First Year — $1.99</button></div>}

    {user&&screen==="premium"&&<div className="screen"><button className="backBtn" onClick={()=>setScreen("home")}>← Back</button><h2>Premium</h2><div className="premiumBox"><h3>Your Subscription</h3><p>{subscription}</p><button className="mainBtn" onClick={()=>{setSubscription("Premium Monthly");saveProfile({subscription:"Premium Monthly"})}}>Upgrade $4.99/month</button><button className="secondaryBtn" onClick={()=>{setSubscription("Free Plan");saveProfile({subscription:"Free Plan"})}}>Cancel / Free Plan</button></div></div>}

    {user&&screen==="profile"&&<div className="screen"><button className="backBtn" onClick={()=>setScreen("home")}>← Back</button><div className="profileCard"><label className="profileImageWrap">{profileImage?<img src={profileImage} alt="" className="profileImage"/>:<div className="profilePlaceholder">♡</div>}<input hidden type="file" accept="image/*" onChange={uploadProfilePicture}/></label><h2>Pocket Scrapbook</h2><button className="settingsBtn" onClick={()=>setModal({icon:"🔔",title:"Notifications",text:"Choose email updates, new templates, promotions, or none.",button:"Got it"})}>Notifications</button><button className="settingsBtn" onClick={()=>setModal({icon:"🔒",title:"Privacy",text:"Pocket Scrapbook does not sell your personal information.",button:"Okay"})}>Privacy</button><button className="settingsBtn" onClick={()=>setScreen("premium")}>Subscription: {subscription}</button><div className="settingsRow"><div><strong>Dark Theme</strong><p>Easier on your eyes at night</p></div><button className={`toggle ${darkMode?"on":""}`} onClick={toggleDarkMode}><span></span></button></div><button className="logoutBtn" onClick={logoutUser}>Logout</button></div></div>}

    {user&&screen==="editor"&&selectedBook&&<div className="editorScreen"><div className="editorHeader"><button onClick={()=>setScreen("home")}>←</button><h2>{selectedBook.title}</h2><button onClick={()=>setActionBook(selectedBook)}>⋮</button></div><div className="pageNav"><button disabled={selectedPage===0} onClick={()=>setSelectedPage(selectedPage-1)}>‹</button><span>Page {selectedPage+1}/{selectedBook.pages.length}</span><button disabled={selectedPage===selectedBook.pages.length-1} onClick={()=>setSelectedPage(selectedPage+1)}>›</button></div><div className={`scrapPage bg-${page()?.bg}`} onClick={()=>setSelectedElement(null)}>{page()?.elements.map(renderElement)}</div><div className="toolBar"><button onClick={()=>addElement(photoEl(100,130))}>Photo</button><button onClick={()=>addElement(textEl("tap to edit",80,80))}>Text</button><button onClick={()=>setShowStickers(true)}>Stickers</button><button onClick={addPage}>Add Page</button><button onClick={()=>setShowBgPicker(true)}>Background</button></div><TextToolbar />{selectedElement?.type==="photo"&&<div className="cropControls"><button onClick={()=>nudgeCrop("left")}>←</button><button onClick={()=>nudgeCrop("up")}>↑</button><button onClick={()=>nudgeCrop("down")}>↓</button><button onClick={()=>nudgeCrop("right")}>→</button></div>}</div>}

    {actionBook&&<div className="bottomSheet"><h3>{actionBook.title}</h3><button onClick={()=>{openBook(actionBook);setActionBook(null)}}>Edit</button><button onClick={()=>{setFlipBook(actionBook);setFlipPage(0);setActionBook(null)}}>View Flipbook</button><button onClick={()=>{window.print();setActionBook(null)}}>Export / Print</button><button onClick={()=>{renameBook(actionBook);setActionBook(null)}}>Rename</button><button className="danger" onClick={()=>{setConfirmDelete(actionBook);setActionBook(null)}}>Delete</button><button onClick={()=>setActionBook(null)}>Cancel</button></div>}

    {showCreate&&<div className="bottomSheet"><h3>Create Scrapbook</h3><input placeholder="Scrapbook name" value={newBookName} onChange={e=>setNewBookName(e.target.value)}/><div className="bgPicker">{BACKGROUNDS.map(bg=><button key={bg.id} className={`bgChoice bg-${bg.id}`} onClick={()=>setNewBookBg(bg.id)}><span>{bg.name}</span></button>)}</div><button className="mainBtn" onClick={createBook}>Create</button><button onClick={()=>setShowCreate(false)}>Cancel</button></div>}

    {showBgPicker&&<div className="bottomSheet"><h3>Change Background</h3><div className="bgPicker">{BACKGROUNDS.map(bg=><button key={bg.id} className={`bgChoice bg-${bg.id}`} onClick={()=>changeBg(bg.id)}><span>{bg.name}</span></button>)}</div><button onClick={()=>setShowBgPicker(false)}>Cancel</button></div>}

    {showStickers&&<div className="bottomSheet stickerSheet"><h3>Choose Sticker</h3><input placeholder="Search stickers..." value={stickerSearch} onChange={e=>setStickerSearch(e.target.value)}/><div className="stickerGrid">{filteredStickers.map(s=><button key={s} onClick={()=>{addElement(stickerEl(s,150,180));setShowStickers(false)}}><span>{s}</span></button>)}</div><button onClick={()=>setShowStickers(false)}>Cancel</button></div>}

    {confirmDelete&&<div className="cuteOverlay"><div className="cuteModal"><div className="modalTape"></div><div className="modalIcon">🗑️</div><h2>Delete scrapbook?</h2><p>Delete <strong>{confirmDelete.title}</strong>? This cannot be undone.</p><button className="modalBtn dangerBtn" onClick={()=>deleteBook(confirmDelete)}>Yes, delete</button><button className="modalBtn lightBtn" onClick={()=>setConfirmDelete(null)}>Keep it</button></div></div>}

    {modal&&<div className="cuteOverlay"><div className="cuteModal"><div className="modalTape"></div><button className="modalX" onClick={()=>setModal(null)}>×</button><div className="modalIcon">{modal.icon}</div><h2>{modal.title}</h2><p>{modal.text}</p><button className="modalBtn" onClick={()=>setModal(null)}>{modal.button}</button></div></div>}
  </div></div>
}

createRoot(document.getElementById("root")).render(<App />);
