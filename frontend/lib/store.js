// Safe localStorage helpers — all SSR-guarded
const isBrowser = () => typeof window !== 'undefined'
import { db, auth, googleProvider } from './firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit, where } from 'firebase/firestore'
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, updatePassword as fbUpdatePasswordInternal } from 'firebase/auth'

export const store = {
  get: (key) => {
    if (!isBrowser()) return null
    try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
  },
  set: (key, val) => {
    if (!isBrowser()) return
    localStorage.setItem(key, JSON.stringify(val))
  },
  del: (key) => { if (isBrowser()) localStorage.removeItem(key) }
}

// Session
export const getUser = () => store.get('kk_user')
export const setUser = (u) => store.set('kk_user', u)
export const logout = () => store.del('kk_user')

// Local private feed (legacy / personal)
export const getFeed = () => store.get('kk_feed') || []
export const addFeed = (item) => {
  const f = getFeed()
  f.unshift(item)
  store.set('kk_feed', f.slice(0, 60))
}
export const delFeed = (id) => store.set('kk_feed', getFeed().filter(x => x.id !== id))

// Community performance feed (shared, with audio)
// Item shape: { id, user, uid, song, rank, avgScore, pitchScore, timingScore, emotionScore, audioDataUrl, date }
export const getCommunityFeed = async () => {
  try {
    const q = query(collection(db, "community_feed"), orderBy("id", "desc"), limit(40));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), docId: d.id }));
  } catch (e) {
    return store.get('kk_community_feed') || [];
  }
}
export const addCommunityFeed = async (item) => {
  try {
    await addDoc(collection(db, "community_feed"), item);
  } catch (e) {
    // fallback
    const f = store.get('kk_community_feed') || []
    f.unshift(item)
    store.set('kk_community_feed', f.slice(0, 40))
  }
}
export const delCommunityFeed = async (id, docId) => {
  try {
    if (docId) { await deleteDoc(doc(db, "community_feed", docId)); }
    else {
      // Find doc locally by id (slow fallback)
      const q = query(collection(db, "community_feed"), where("id", "==", id));
      const snap = await getDocs(q);
      snap.forEach(d => deleteDoc(d.ref));
    }
  } catch (e) {
    store.set('kk_community_feed', (store.get('kk_community_feed') || []).filter(x => x.id !== id))
  }
}

// Drafts (private, not posted)
export const getDrafts = async (uid) => {
  try {
    if (!uid) return []
    const q = query(collection(db, "drafts"), where("uid", "==", uid), orderBy("id", "desc"), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), docId: d.id }));
  } catch (e) {
    return (store.get('kk_drafts') || []).filter(x => x.uid === uid)
  }
}
export const addDraft = async (item) => {
  try {
    await addDoc(collection(db, "drafts"), { ...item, isDraft: true });
  } catch (e) {
    const d = store.get('kk_drafts') || []
    d.unshift({ ...item, isDraft: true })
    store.set('kk_drafts', d.slice(0, 20))
  }
}
export const delDraft = async (id, docId) => {
  try {
    if (docId) { await deleteDoc(doc(db, "drafts", docId)); }
    else {
      const q = query(collection(db, "drafts"), where("id", "==", id));
      const snap = await getDocs(q);
      snap.forEach(d => deleteDoc(d.ref));
    }
  } catch (e) {
    store.set('kk_drafts', (store.get('kk_drafts') || []).filter(x => x.id !== id))
  }
}

export async function fbSignUp(email, pass, name) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass)
    const user = res.user
    await updateProfile(user, { displayName: name })
    return { uid: user.uid, email: user.email, name, token: await user.getIdToken() }
  } catch (e) { throw new Error(friendlyErr(e.code || e.message)) }
}

export async function fbSignIn(email, pass) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass)
    const user = res.user
    const name = user.displayName || user.email.split('@')[0]
    return { uid: user.uid, email: user.email, name, token: await user.getIdToken() }
  } catch (e) { throw new Error(friendlyErr(e.code || e.message)) }
}

export async function fbGoogleSignIn() {
  try {
    const res = await signInWithPopup(auth, googleProvider)
    const user = res.user
    const name = user.displayName || user.email.split('@')[0]
    return { uid: user.uid, email: user.email, name, token: await user.getIdToken() }
  } catch (e) {
    if (e.code === 'auth/popup-closed-by-user') throw new Error('Sign-in cancelled')
    throw new Error(friendlyErr(e.code || e.message))
  }
}

export async function fbUpdateName(name) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  try {
    await updateProfile(user, { displayName: name })
    const local = getUser()
    if (local) { local.name = name; setUser(local) }
    return name
  } catch (e) { throw new Error(friendlyErr(e.code || e.message)) }
}

export async function fbUpdatePassword(newPass) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  try {
    await fbUpdatePasswordInternal(user, newPass)
  } catch (e) {
    if (e.code === 'auth/requires-recent-login') throw new Error('For security reasons, please log out and log back in to change your password.')
    throw new Error(friendlyErr(e.code || e.message))
  }
}

function friendlyErr(msg = '') {
  msg = msg.toUpperCase()
  if (msg.includes('EMAIL_EXISTS') || msg.includes('EMAIL-ALREADY')) return 'Email already registered'
  if (msg.includes('INVALID_LOGIN') || msg.includes('WRONG-PASSWORD') || msg.includes('USER-NOT-FOUND')) return 'Invalid email or password'
  if (msg.includes('INVALID_PASSWORD')) return 'Invalid email or password'
  if (msg.includes('TOO_MANY_ATTEMPTS')) return 'Too many attempts – try later'
  if (msg.includes('WEAK_PASSWORD') || msg.includes('WEAK-PASSWORD')) return 'Password needs 6+ characters'
  if (msg.includes('INVALID_EMAIL') || msg.includes('INVALID-EMAIL')) return 'Invalid email address'
  if (msg.includes('USER_NOT_FOUND')) return 'No account found with that email'
  return 'Something went wrong. Please try again.'
}
