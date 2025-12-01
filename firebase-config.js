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
    where,
    Timestamp 
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
        try {
            const q = query(collection(db, 'productos'), orderBy('fechaActualizacion', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date(),
                fechaActualizacion: doc.data().fechaActualizacion?.toDate?.() || new Date()
            }));
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            return [];
        }
    },
    
    // Obtener producto por ID
    async getById(id) {
        try {
            const docRef = doc(db, 'productos', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return { 
                    id: docSnap.id, 
                    ...data,
                    fechaCreacion: data.fechaCreacion?.toDate?.() || new Date(),
                    fechaActualizacion: data.fechaActualizacion?.toDate?.() || new Date()
                };
            }
            return null;
        } catch (error) {
            console.error('Error obteniendo producto por ID:', error);
            return null;
        }
    },
    
    // Crear producto
    async create(productoData) {
        try {
            const data = {
                ...productoData,
                fechaCreacion: serverTimestamp(),
                fechaActualizacion: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'productos'), data);
            return { 
                id: docRef.id, 
                ...productoData,
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
        } catch (error) {
            console.error('Error creando producto:', error);
            throw error;
        }
    },
    
    // Actualizar producto
    async update(id, productoData) {
        try {
            const docRef = doc(db, 'productos', id);
            const data = {
                ...productoData,
                fechaActualizacion: serverTimestamp()
            };
            await updateDoc(docRef, data);
            return { 
                id, 
                ...productoData,
                fechaActualizacion: new Date()
            };
        } catch (error) {
            console.error('Error actualizando producto:', error);
            throw error;
        }
    },
    
    // Eliminar producto
    async delete(id) {
        try {
            await deleteDoc(doc(db, 'productos', id));
            return true;
        } catch (error) {
            console.error('Error eliminando producto:', error);
            throw error;
        }
    },
    
    // Buscar por categoría
    async getByCategoria(categoria) {
        try {
            const q = query(collection(db, 'productos'), where('categoria', '==', categoria));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date(),
                fechaActualizacion: doc.data().fechaActualizacion?.toDate?.() || new Date()
            }));
        } catch (error) {
            console.error('Error obteniendo productos por categoría:', error);
            return [];
        }
    }
};

// Funciones CRUD para categorías
export const categoriasDB = {
    async getAll() {
        try {
            const q = query(collection(db, 'categorias'), orderBy('fechaActualizacion', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date(),
                fechaActualizacion: doc.data().fechaActualizacion?.toDate?.() || new Date()
            }));
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            return [];
        }
    },
    
    async getById(id) {
        try {
            const docRef = doc(db, 'categorias', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return { 
                    id: docSnap.id, 
                    ...data,
                    fechaCreacion: data.fechaCreacion?.toDate?.() || new Date(),
                    fechaActualizacion: data.fechaActualizacion?.toDate?.() || new Date()
                };
            }
            return null;
        } catch (error) {
            console.error('Error obteniendo categoría por ID:', error);
            return null;
        }
    },
    
    async create(categoriaData) {
        try {
            const data = {
                ...categoriaData,
                fechaCreacion: serverTimestamp(),
                fechaActualizacion: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'categorias'), data);
            return { 
                id: docRef.id, 
                ...categoriaData,
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
        } catch (error) {
            console.error('Error creando categoría:', error);
            throw error;
        }
    },
    
    async update(id, categoriaData) {
        try {
            const docRef = doc(db, 'categorias', id);
            const data = {
                ...categoriaData,
                fechaActualizacion: serverTimestamp()
            };
            await updateDoc(docRef, data);
            return { 
                id, 
                ...categoriaData,
                fechaActualizacion: new Date()
            };
        } catch (error) {
            console.error('Error actualizando categoría:', error);
            throw error;
        }
    },
    
    async delete(id) {
        try {
            await deleteDoc(doc(db, 'categorias', id));
            return true;
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            throw error;
        }
    }
};

// Funciones CRUD para publicaciones
export const publicacionesDB = {
    async getAll() {
        try {
            const q = query(collection(db, 'publicaciones'), orderBy('fechaActualizacion', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date(),
                fechaActualizacion: doc.data().fechaActualizacion?.toDate?.() || new Date()
            }));
        } catch (error) {
            console.error('Error obteniendo publicaciones:', error);
            return [];
        }
    },
    
    async getById(id) {
        try {
            const docRef = doc(db, 'publicaciones', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return { 
                    id: docSnap.id, 
                    ...data,
                    fechaCreacion: data.fechaCreacion?.toDate?.() || new Date(),
                    fechaActualizacion: data.fechaActualizacion?.toDate?.() || new Date()
                };
            }
            return null;
        } catch (error) {
            console.error('Error obteniendo publicación por ID:', error);
            return null;
        }
    },
    
    async create(publicacionData) {
        try {
            const data = {
                ...publicacionData,
                fechaCreacion: serverTimestamp(),
                fechaActualizacion: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'publicaciones'), data);
            return { 
                id: docRef.id, 
                ...publicacionData,
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
        } catch (error) {
            console.error('Error creando publicación:', error);
            throw error;
        }
    },
    
    async update(id, publicacionData) {
        try {
            const docRef = doc(db, 'publicaciones', id);
            const data = {
                ...publicacionData,
                fechaActualizacion: serverTimestamp()
            };
            await updateDoc(docRef, data);
            return { 
                id, 
                ...publicacionData,
                fechaActualizacion: new Date()
            };
        } catch (error) {
            console.error('Error actualizando publicación:', error);
            throw error;
        }
    },
    
    async delete(id) {
        try {
            await deleteDoc(doc(db, 'publicaciones', id));
            return true;
        } catch (error) {
            console.error('Error eliminando publicación:', error);
            throw error;
        }
    }
};

// Función para verificar credenciales admin
export async function verificarCredencialesAdmin() {
    try {
        const credencialesRef = doc(db, 'admin', 'credenciales');
        const credencialesDoc = await getDoc(credencialesRef);
        if (credencialesDoc.exists()) {
            const data = credencialesDoc.data();
            return {
                usuario: data.usuario || '',
                clave: data.clave || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Error verificando credenciales:', error);
        return null;
    }
}

export { db };
