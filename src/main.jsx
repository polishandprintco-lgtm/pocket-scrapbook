import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { auth, db } from "./firebase";
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
  doc
} from "firebase/firestore";
