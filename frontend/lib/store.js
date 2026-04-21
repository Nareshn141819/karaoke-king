// Safe localStorage helpers — all SSR-guarded
const isBrowser = () => typeof window !== 'undefined'
import { db, auth, googleProvider, storage } from './firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, updateDoc, query, orderBy, limit, where, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
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
export const logout = () => { store.del('kk_user'); store.del('kk_profile') }

// ── Firebase user profile (Firestore: users/{uid}) ──────────────
/**
 * Organised user document shape:
 * {
 *   uid:          string,
 *   name:         string,
 *   email:        string,
 *   photoUrl:     string | null,
 *   followers:    string[],        // uid list
 *   following:    string[],        // uid list
 *   songsCount:   number,          // songs uploaded
 *   performances: number,          // posts to community feed
 *   drafts:       number,          // saved drafts
 *   createdAt:    ISO string,
 *   updatedAt:    ISO string,
 * }
 */
export async function getProfile(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) return snap.data()
  } catch { }
  return null
}

export async function upsertProfile(uid, fields) {
  if (!uid) return
  try {
    const docRef = doc(db, 'users', uid)
    const snap = await getDoc(docRef)
    const now = new Date().toISOString()
    if (snap.exists()) {
      await updateDoc(docRef, { ...fields, updatedAt: now })
    } else {
      // Create clean initial document
      await setDoc(docRef, {
        uid,
        name: fields.name || '',
        email: fields.email || '',
        photoUrl: fields.photoUrl || null,
        followers: [],
        following: [],
        songsCount: 0,
        performances: 0,
        drafts: 0,
        createdAt: now,
        updatedAt: now,
        ...fields,
      })
    }
    // Update local cache
    const local = getUser()
    if (local && local.uid === uid) {
      setUser({ ...local, ...fields })
    }
  } catch (e) { console.warn('upsertProfile error', e) }
}

/**
 * Upload avatar to Firebase Storage using uploadBytesResumable.
 * Falls back to storing a compressed base64 Data URL in Firestore if Storage fails.
 */
export async function uploadAvatar(uid, file) {
  if (!uid || !file) return null
  try {
    // Use the file's actual MIME type, fallback to image/jpeg
    const contentType = file.type || 'image/jpeg'
    const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg'
    const storageRef = ref(storage, `avatars/${uid}/avatar.${ext}`)
    const metadata = { contentType }

    // Try Firebase Storage upload first
    try {
      const uploadTask = uploadBytesResumable(storageRef, file, metadata)

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => reject(error),
          () => resolve()
        )
      })

      const url = await getDownloadURL(uploadTask.snapshot.ref)
      await upsertProfile(uid, { photoUrl: url, updatedAt: new Date().toISOString() })
      return url
    } catch (storageErr) {
      // ── Fallback: compress image and store as Data URL in Firestore ──
      console.warn('Storage upload failed, falling back to base64:', storageErr?.code || storageErr?.message)
      const dataUrl = await compressImageToDataUrl(file, 200, 200, 0.7)
      if (dataUrl) {
        await upsertProfile(uid, { photoUrl: dataUrl, updatedAt: new Date().toISOString() })
        return dataUrl
      }
      return null
    }
  } catch (e) {
    console.warn('uploadAvatar error:', e?.code, e?.message)
    return null
  }
}

/** Compress an image File to a small Data URL (JPEG) */
function compressImageToDataUrl(file, maxW = 200, maxH = 200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxW) { height = Math.round(height * maxW / width); width = maxW }
      if (height > maxH) { width = Math.round(width * maxH / height); height = maxH }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

/** Increment a numeric counter on user profile (e.g. songsCount, performances, drafts) */
export async function incrementUserStat(uid, field) {
  if (!uid || !field) return
  try {
    const docRef = doc(db, 'users', uid)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      const current = snap.data()[field] || 0
      await updateDoc(docRef, { [field]: current + 1, updatedAt: new Date().toISOString() })
    }
    const local = getUser()
    if (local && local.uid === uid) {
      setUser({ ...local, [field]: (local[field] || 0) + 1 })
    }
  } catch (e) { console.warn('incrementUserStat error', e) }
}

export async function followUser(currentUid, targetUid) {
  if (!currentUid || !targetUid) return
  try {
    // Update target user's followers list
    const targetRef = doc(db, 'users', targetUid)
    const snap = await getDoc(targetRef)
    const data = snap.exists() ? snap.data() : {}
    const followers = data.followers || []
    const already = followers.includes(currentUid)
    await updateDoc(targetRef, {
      followers: already ? followers.filter(u => u !== currentUid) : [...followers, currentUid],
      updatedAt: new Date().toISOString()
    })

    // Update current user's following list
    const currentRef = doc(db, 'users', currentUid)
    const currentSnap = await getDoc(currentRef)
    if (currentSnap.exists()) {
      const following = currentSnap.data().following || []
      await updateDoc(currentRef, {
        following: already ? following.filter(u => u !== targetUid) : [...following, targetUid],
        updatedAt: new Date().toISOString()
      })
    }

    return !already // returns new follow state
  } catch { return false }
}

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
  const now = Date.now()
  const savedAt = Timestamp.fromMillis(now)
  const expiresAt = Timestamp.fromMillis(now + 30 * 24 * 60 * 60 * 1000) // 30 days TTL
  try {
    await addDoc(collection(db, "drafts"), { ...item, isDraft: true, savedAt, expiresAt });
  } catch (e) {
    // fallback to localStorage
    const d = store.get('kk_drafts') || []
    d.unshift({ ...item, isDraft: true, savedAt: now, expiresAt: now + 30 * 24 * 60 * 60 * 1000 })
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
    const userData = { uid: user.uid, email: user.email, name, token: await user.getIdToken() }
    // Create clean Firestore user document
    await upsertProfile(user.uid, { name, email: user.email, photoUrl: null })
    return userData
  } catch (e) { throw new Error(friendlyErr(e.code || e.message)) }
}

export async function fbSignIn(email, pass) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass)
    const user = res.user
    const name = user.displayName || user.email.split('@')[0]
    const userData = { uid: user.uid, email: user.email, name, token: await user.getIdToken() }
    // Ensure Firestore profile exists
    await upsertProfile(user.uid, { name, email: user.email })
    return userData
  } catch (e) { throw new Error(friendlyErr(e.code || e.message)) }
}

export async function fbGoogleSignIn() {
  try {
    const res = await signInWithPopup(auth, googleProvider)
    const user = res.user
    const name = user.displayName || user.email.split('@')[0]
    const userData = { uid: user.uid, email: user.email, name, token: await user.getIdToken() }
    // Ensure Firestore profile exists (don't overwrite photo if already set)
    const profile = await getProfile(user.uid)
    if (!profile) {
      await upsertProfile(user.uid, { name, email: user.email, photoUrl: user.photoURL || null })
    } else {
      await upsertProfile(user.uid, { name, email: user.email })
    }
    return userData
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
    await upsertProfile(user.uid, { name })
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
