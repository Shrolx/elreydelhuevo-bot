// firebase-config.js
import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    getDoc,
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy, 
    serverTimestamp,
    where 
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Funciones CRUD para productos
export const productosDB = {
    // Obtener todos los productos
    async getAll() {
        const q = query(collection(db, 'productos'), orderBy('fechaActualizacion', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    // Obtener producto por ID
    async getById(id) {
        const docRef = doc(db, 'productos', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    
    // Crear producto
    async create(productoData) {
        const data = {
            ...productoData,
            fechaCreacion: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'productos'), data);
        return { id: docRef.id, ...data };
    },
    
    // Actualizar producto
    async update(id, productoData) {
        const docRef = doc(db, 'productos', id);
        const data = {
            ...productoData,
            fechaActualizacion: serverTimestamp()
        };
        await updateDoc(docRef, data);
        return { id, ...data };
    },
    
    // Eliminar producto
    async delete(id) {
        await deleteDoc(doc(db, 'productos', id));
        return true;
    },
    
    // Buscar por categoría
    async getByCategoria(categoria) {
        const q = query(collection(db, 'productos'), where('categoria', '==', categoria));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// Funciones CRUD para categorías
export const categoriasDB = {
    async getAll() {
        const q = query(collection(db, 'categorias'), orderBy('fechaActualizacion', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    async create(categoriaData) {
        const data = {
            ...categoriaData,
            fechaCreacion: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'categorias'), data);
        return { id: docRef.id, ...data };
    },
    
    async update(id, categoriaData) {
        const docRef = doc(db, 'categorias', id);
        const data = {
            ...categoriaData,
            fechaActualizacion: serverTimestamp()
        };
        await updateDoc(docRef, data);
        return { id, ...data };
    },
    
    async delete(id) {
        await deleteDoc(doc(db, 'categorias', id));
        return true;
    }
};

// Funciones CRUD para publicaciones
export const publicacionesDB = {
    async getAll() {
        const q = query(collection(db, 'publicaciones'), orderBy('fechaActualizacion', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    async create(publicacionData) {
        const data = {
            ...publicacionData,
            fechaCreacion: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'publicaciones'), data);
        return { id: docRef.id, ...data };
    },
    
    async update(id, publicacionData) {
        const docRef = doc(db, 'publicaciones', id);
        const data = {
            ...publicacionData,
            fechaActualizacion: serverTimestamp()
        };
        await updateDoc(docRef, data);
        return { id, ...data };
    },
    
    async delete(id) {
        await deleteDoc(doc(db, 'publicaciones', id));
        return true;
    }
};

// Función para verificar credenciales admin
export async function verificarCredencialesAdmin() {
    try {
        const credencialesRef = doc(db, 'admin', 'credenciales');
        const credencialesDoc = await getDoc(credencialesRef);
        return credencialesDoc.exists() ? credencialesDoc.data() : null;
    } catch (error) {
        console.error('Error verificando credenciales:', error);
        return null;
    }
}

export { db };