// firebase-config.js - VERSIÓN OPTIMIZADA PARA RAILWAY
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración DIRECTA (sin variables de entorno para evitar problemas)
const firebaseConfig = {
    apiKey: "AIzaSyDu88eCjKRos6_jMEhGrTiuz4I1VJgXdaY",
    authDomain: "elreydelhuevo.firebaseapp.com",
    projectId: "elreydelhuevo",
    storageBucket: "elreydelhuevo.firebasestorage.app",
    messagingSenderId: "343713842422",
    appId: "1:343713842422:web:0637f94f7f4a45f13358d7",
    measurementId: "G-F9TPP7GZT8"
};

console.log('🔥 Inicializando Firebase...');

let app;
let db;
let firebaseInitialized = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseInitialized = true;
    console.log('✅ Firebase inicializado CORRECTAMENTE');
    console.log('📊 Proyecto: elreydelhuevo');
} catch (error) {
    console.error('❌ ERROR inicializando Firebase:', error.message);
    console.log('⚠️  El bot funcionará en modo offline');
}

// Función de retardo para evitar timeouts
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Funciones CRUD con manejo de errores mejorado
export const productosDB = {
    async getAll() {
        if (!firebaseInitialized) {
            console.log('⚠️  Firebase no disponible - modo offline');
            return [
                { id: '1', nombre: 'Huevos Blancos (Ejemplo)', precio: 1200, categoria: 'Alimentos' },
                { id: '2', nombre: 'Detergente Líquido (Ejemplo)', precio: 3500, categoria: 'Limpieza' },
                { id: '3', nombre: 'Arroz Grano Largo (Ejemplo)', precio: 2800, categoria: 'Abarrotes' }
            ];
        }

        try {
            console.log('🔄 Conectando a Firebase...');
            
            // Import dinámico para evitar problemas de carga
            const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
            
            // Timeout de conexión
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout de conexión a Firebase')), 10000)
            );
            
            const firebasePromise = (async () => {
                const q = query(collection(db, 'productos'), orderBy('nombre', 'asc'));
                const querySnapshot = await getDocs(q);
                const productos = querySnapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                }));
                return productos;
            })();
            
            const productos = await Promise.race([firebasePromise, timeoutPromise]);
            console.log(`✅ ${productos.length} productos obtenidos de Firebase`);
            return productos;
            
        } catch (error) {
            console.error('❌ Error Firebase:', error.message);
            console.log('🔄 Cambiando a modo offline...');
            
            // Datos de ejemplo
            return [
                { id: 'demo-1', nombre: 'Huevos Blancos', precio: 1200, categoria: 'Alimentos', descripcion: 'Producto de ejemplo' },
                { id: 'demo-2', nombre: 'Detergente', precio: 3500, categoria: 'Limpieza', descripcion: 'Producto de ejemplo' }
            ];
        }
    },
    
    async create(productoData) {
        if (!firebaseInitialized) {
            console.log('⚠️  Firebase offline - simulando creación');
            return { 
                id: 'temp-' + Date.now(), 
                ...productoData,
                fechaCreacion: new Date().toISOString()
            };
        }

        try {
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            
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
            console.log(`✅ Producto guardado en Firebase: ${docRef.id}`);
            
            return { 
                id: docRef.id, 
                ...data 
            };
            
        } catch (error) {
            console.error('❌ Error guardando en Firebase:', error.message);
            
            // Simular guardado local
            return { 
                id: 'local-' + Date.now(), 
                ...productoData,
                mensaje: '⚠️ Guardado localmente (Firebase offline)',
                fechaCreacion: new Date().toISOString()
            };
        }
    },
    
    async update(id, productoData) {
        if (!firebaseInitialized) {
            throw new Error('Firebase offline - no se puede actualizar');
        }
        
        try {
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const docRef = doc(db, 'productos', id);
            
            await updateDoc(docRef, {
                ...productoData,
                fechaActualizacion: serverTimestamp()
            });
            
            return { id, ...productoData };
            
        } catch (error) {
            console.error('Error actualizando producto:', error);
            throw error;
        }
    },
    
    async delete(id) {
        if (!firebaseInitialized) {
            throw new Error('Firebase offline - no se puede eliminar');
        }
        
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'productos', id));
            return true;
            
        } catch (error) {
            console.error('Error eliminando producto:', error);
            throw error;
        }
    }
};

// Funciones básicas para categorías
export const categoriasDB = {
    async getAll() {
        if (!firebaseInitialized) {
            return [
                { id: '1', nombre: 'Alimentos' },
                { id: '2', nombre: 'Limpieza' },
                { id: '3', nombre: 'Bebidas' },
                { id: '4', nombre: 'Abarrotes' }
            ];
        }
        
        try {
            const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
            const q = query(collection(db, 'categorias'), orderBy('nombre', 'asc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            return [
                { id: 'demo-1', nombre: 'Alimentos' },
                { id: 'demo-2', nombre: 'Limpieza' }
            ];
        }
    }
};

// Verificar estado de Firebase
export function getFirebaseStatus() {
    return {
        initialized: firebaseInitialized,
        projectId: firebaseConfig.projectId,
        timestamp: new Date().toISOString()
    };
}

export { db };
