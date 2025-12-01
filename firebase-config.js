// firebase-config.js - CON TUS CREDENCIALES REALES
import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy, 
    serverTimestamp,
    where 
} from "firebase/firestore";

// TUS CREDENCIALES REALES
const firebaseConfig = {
    apiKey: "AIzaSyDu88eCjKRos6_jMEhGrTiuz4I1VJgXdaY",
    authDomain: "elreydelhuevo.firebaseapp.com",
    projectId: "elreydelhuevo",
    storageBucket: "elreydelhuevo.firebasestorage.app",
    messagingSenderId: "343713842422",
    appId: "1:343713842422:web:0637f94f7f4a45f13358d7",
    measurementId: "G-F9TPP7GZT8"
};

// Inicializar Firebase
let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firebase inicializado CORRECTAMENTE');
    console.log('📊 Proyecto: elreydelhuevo');
} catch (error) {
    console.error('❌ ERROR Firebase:', error.message);
}

// Funciones CRUD para productos
export const productosDB = {
    // Obtener todos los productos
    async getAll() {
        try {
            if (!db) {
                console.log('❌ Firebase no inicializado');
                return [];
            }
            
            console.log('🔄 Obteniendo productos de Firebase...');
            const q = query(collection(db, 'productos'), orderBy('nombre', 'asc'));
            const querySnapshot = await getDocs(q);
            const productos = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
            console.log(`✅ ${productos.length} productos obtenidos`);
            return productos;
            
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error.message);
            return [];
        }
    },
    
    // Crear producto
    async create(productoData) {
        try {
            if (!db) {
                throw new Error('Firebase no inicializado');
            }
            
            console.log('🔄 Creando producto en Firebase...');
            const data = {
                nombre: productoData.nombre || 'Sin nombre',
                descripcion: productoData.descripcion || '',
                precio: productoData.precio || 0,
                categoria: productoData.categoria || 'General',
                imagenUrl: productoData.imagenUrl || 'https://via.placeholder.com/300x200?text=Producto',
                fechaCreacion: serverTimestamp(),
                fechaActualizacion: serverTimestamp()
            };
            
            const docRef = await addDoc(collection(db, 'productos'), data);
            console.log(`✅ Producto creado con ID: ${docRef.id}`);
            
            return { 
                id: docRef.id, 
                ...data 
            };
            
        } catch (error) {
            console.error('❌ Error creando producto:', error.message);
            throw error;
        }
    },
    
    // Actualizar producto
    async update(id, productoData) {
        try {
            if (!db) throw new Error('Firebase no inicializado');
            
            const docRef = doc(db, 'productos', id);
            const data = {
                ...productoData,
                fechaActualizacion: serverTimestamp()
            };
            
            await updateDoc(docRef, data);
            return { id, ...data };
            
        } catch (error) {
            console.error('Error actualizando producto:', error);
            throw error;
        }
    },
    
    // Eliminar producto
    async delete(id) {
        try {
            if (!db) throw new Error('Firebase no inicializado');
            
            await deleteDoc(doc(db, 'productos', id));
            return true;
            
        } catch (error) {
            console.error('Error eliminando producto:', error);
            throw error;
        }
    }
};

// Funciones para categorías
export const categoriasDB = {
    async getAll() {
        try {
            if (!db) return [];
            
            const q = query(collection(db, 'categorias'), orderBy('nombre', 'asc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            return [];
        }
    },
    
    async create(categoriaData) {
        try {
            if (!db) throw new Error('Firebase no inicializado');
            
            const data = {
                ...categoriaData,
                fechaCreacion: serverTimestamp(),
                fechaActualizacion: serverTimestamp()
            };
            
            const docRef = await addDoc(collection(db, 'categorias'), data);
            return { id: docRef.id, ...data };
            
        } catch (error) {
            console.error('Error creando categoría:', error);
            throw error;
        }
    }
};

// Verificar credenciales admin
export async function verificarCredencialesAdmin() {
    try {
        if (!db) return null;
        
        const { getDoc, doc: getDocRef } = await import('firebase/firestore');
        const credencialesRef = getDocRef(db, 'admin', 'credenciales');
        const credencialesDoc = await getDoc(credencialesRef);
        
        if (credencialesDoc.exists()) {
            return credencialesDoc.data();
        }
        return null;
        
    } catch (error) {
        console.error('Error verificando credenciales:', error);
        return null;
    }
}

export { db };
