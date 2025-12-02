const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

// ===== CONFIGURACIÓN =====
console.log('🔄 Iniciando bot interactivo de Telegram...');

// Verificar variables de entorno
if (!process.env.TELEGRAM_TOKEN || !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas');
  process.exit(1);
}

// Inicializar Firebase
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase inicializado');
} catch (error) {
  console.error('❌ Error Firebase:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Configuración de Telegram
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://tu-app.onrender.com/webhook';

// Estados de usuario para flujos interactivos
const userStates = new Map();
const userData = new Map();

// ===== FUNCIONES DE TECLADO =====

// Menú principal
function mainMenuKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📦 Ver Productos' }, { text: '➕ Agregar Producto' }],
        [{ text: '✏️ Editar Producto' }, { text: '🗑️ Eliminar Producto' }],
        [{ text: '🔍 Buscar Producto' }, { text: '📊 Estadísticas' }],
        [{ text: '🆘 Ayuda' }, { text: '❌ Cancelar' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

// Teclado inline para acciones de producto
function productActionsKeyboard(productId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Editar', callback_data: `edit_${productId}` },
          { text: '🗑️ Eliminar', callback_data: `delete_${productId}` }
        ],
        [
          { text: '📋 Ver Detalles', callback_data: `details_${productId}` }
        ],
        [
          { text: '🏠 Menú Principal', callback_data: 'main_menu' }
        ]
      ]
    }
  };
}

// Teclado para categorías
function categoriesKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🥚 Alimentos' }, { text: '🧹 Aseo' }, { text: '🏠 Hogar' }],
        [{ text: '🥤 Bebidas' }, { text: '🐾 Mascotas' }, { text: '📦 Otros' }],
        [{ text: '↩️ Volver' }]
      ],
      resize_keyboard: true
    }
  };
}

// Teclado de confirmación
function confirmationKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '✅ Sí, confirmar' }, { text: '❌ No, cancelar' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

// ===== FUNCIONES UTILITARIAS =====

// Formatear precio
function formatPrice(price) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
}

// Generar ID corto
function generateShortId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Enviar mensaje a Telegram
async function sendMessage(chatId, text, options = {}) {
  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      ...options
    });
    return response.data;
  } catch (error) {
    console.error('Error enviando mensaje:', error.message);
  }
}

// Enviar mensaje con teclado
async function sendMessageWithKeyboard(chatId, text, keyboardFunction) {
  return sendMessage(chatId, text, keyboardFunction());
}

// ===== FLUJOS INTERACTIVOS =====

// Flujo: Agregar producto
async function startAddProductFlow(chatId) {
  userStates.set(chatId, 'awaiting_product_name');
  userData.set(chatId, { product: {} });
  
  await sendMessageWithKeyboard(chatId, 
    '➕ <b>AGREGAR NUEVO PRODUCTO</b>\n\n' +
    '📝 <b>Paso 1 de 5:</b> Escribe el nombre del producto:\n' +
    '<i>Ejemplo: Huevo AA Premium</i>',
    mainMenuKeyboard
  );
}

// Flujo: Editar producto
async function startEditProductFlow(chatId, productId) {
  try {
    const productRef = db.collection('productos').doc(productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      await sendMessage(chatId, '❌ Producto no encontrado.');
      return;
    }
    
    userStates.set(chatId, 'awaiting_edit_field');
    userData.set(chatId, { 
      editingProductId: productId,
      editingProduct: productDoc.data()
    });
    
    await sendMessageWithKeyboard(chatId,
      '✏️ <b>EDITAR PRODUCTO</b>\n\n' +
      `📦 <b>Producto actual:</b> ${productDoc.data().nombre}\n\n` +
      '¿Qué campo quieres editar?\n' +
      '1. <b>Nombre</b>\n' +
      '2. <b>Descripción</b>\n' +
      '3. <b>Precio</b>\n' +
      '4. <b>Categoría</b>\n' +
      '5. <b>Imagen URL</b>\n\n' +
      'Escribe el número del campo (1-5):',
      mainMenuKeyboard
    );
  } catch (error) {
    console.error('Error editando producto:', error);
    await sendMessage(chatId, '❌ Error al cargar el producto.');
  }
}

// Flujo: Eliminar producto
async function startDeleteProductFlow(chatId, productId) {
  try {
    const productRef = db.collection('productos').doc(productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      await sendMessage(chatId, '❌ Producto no encontrado.');
      return;
    }
    
    userStates.set(chatId, 'awaiting_delete_confirmation');
    userData.set(chatId, { deletingProductId: productId });
    
    const product = productDoc.data();
    await sendMessageWithKeyboard(chatId,
      '🗑️ <b>CONFIRMAR ELIMINACIÓN</b>\n\n' +
      `📦 <b>Producto:</b> ${product.nombre}\n` +
      `💰 <b>Precio:</b> ${formatPrice(product.precio)}\n` +
      `🏷️ <b>Categoría:</b> ${product.categoria}\n\n` +
      '⚠️ <b>¿Estás seguro de eliminar este producto?</b>\n' +
      'Esta acción no se puede deshacer.',
      confirmationKeyboard
    );
  } catch (error) {
    console.error('Error eliminando producto:', error);
    await sendMessage(chatId, '❌ Error al cargar el producto.');
  }
}

// ===== MANEJADOR DE MENSAJES =====
async function handleMessage(chatId, text, message) {
  const state = userStates.get(chatId);
  const data = userData.get(chatId) || {};
  
  console.log(`📨 [${chatId}] Estado: ${state || 'ninguno'}, Mensaje: ${text}`);

  // Comandos rápidos
  if (text === '/start' || text === '🏠 Menú Principal' || text === '↩️ Volver') {
    userStates.delete(chatId);
    userData.delete(chatId);
    await sendWelcomeMessage(chatId);
    return;
  }
  
  if (text === '🆘 Ayuda' || text === '/help') {
    await sendHelpMessage(chatId);
    return;
  }
  
  if (text === '📦 Ver Productos' || text === '/listar') {
    await listProducts(chatId);
    return;
  }
  
  if (text === '➕ Agregar Producto' || text === '/agregar') {
    await startAddProductFlow(chatId);
    return;
  }
  
  if (text === '✏️ Editar Producto' || text === '/editar') {
    userStates.set(chatId, 'awaiting_edit_product_id');
    await sendMessageWithKeyboard(chatId,
      '✏️ <b>EDITAR PRODUCTO</b>\n\n' +
      'Escribe el <b>ID</b> del producto que quieres editar:\n' +
      '(Usa /listar para ver los IDs disponibles)',
      mainMenuKeyboard
    );
    return;
  }
  
  if (text === '🗑️ Eliminar Producto' || text === '/eliminar') {
    userStates.set(chatId, 'awaiting_delete_product_id');
    await sendMessageWithKeyboard(chatId,
      '🗑️ <b>ELIMINAR PRODUCTO</b>\n\n' +
      'Escribe el <b>ID</b> del producto que quieres eliminar:\n' +
      '(Usa /listar para ver los IDs disponibles)',
      mainMenuKeyboard
    );
    return;
  }
  
  if (text === '🔍 Buscar Producto' || text === '/buscar') {
    userStates.set(chatId, 'awaiting_search_term');
    await sendMessageWithKeyboard(chatId,
      '🔍 <b>BUSCAR PRODUCTO</b>\n\n' +
      'Escribe el nombre o parte del nombre del producto:',
      mainMenuKeyboard
    );
    return;
  }
  
  if (text === '📊 Estadísticas' || text === '/stats') {
    await showStatistics(chatId);
    return;
  }
  
  if (text === '❌ Cancelar') {
    userStates.delete(chatId);
    userData.delete(chatId);
    await sendMessage(chatId, '✅ Operación cancelada.', mainMenuKeyboard());
    await sendWelcomeMessage(chatId);
    return;
  }

  // Manejar estados de flujo
  switch (state) {
    case 'awaiting_product_name':
      data.product.nombre = text;
      userData.set(chatId, data);
      userStates.set(chatId, 'awaiting_product_description');
      await sendMessageWithKeyboard(chatId,
        '📝 <b>Paso 2 de 5:</b> Escribe la descripción del producto:\n' +
        '<i>Ejemplo: Huevo fresco de gallina, tamaño AA</i>',
        mainMenuKeyboard
      );
      break;
      
    case 'awaiting_product_description':
      data.product.descripcion = text;
      userData.set(chatId, data);
      userStates.set(chatId, 'awaiting_product_price');
      await sendMessageWithKeyboard(chatId,
        '💰 <b>Paso 3 de 5:</b> Escribe el precio del producto (solo números):\n' +
        '<i>Ejemplo: 1200</i>',
        mainMenuKeyboard
      );
      break;
      
    case 'awaiting_product_price':
      const price = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (isNaN(price) || price <= 0) {
        await sendMessage(chatId, '❌ Precio inválido. Por favor, ingresa un número válido mayor a 0.');
        return;
      }
      data.product.precio = price;
      userData.set(chatId, data);
      userStates.set(chatId, 'awaiting_product_category');
      await sendMessageWithKeyboard(chatId,
        '🏷️ <b>Paso 4 de 5:</b> Selecciona la categoría del producto:',
        categoriesKeyboard
      );
      break;
      
    case 'awaiting_product_category':
      if (text === '↩️ Volver') {
        userStates.set(chatId, 'awaiting_product_price');
        await sendMessageWithKeyboard(chatId,
          '💰 <b>Paso 3 de 5:</b> Escribe el precio del producto:',
          mainMenuKeyboard
        );
        return;
      }
      data.product.categoria = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      userData.set(chatId, data);
      userStates.set(chatId, 'awaiting_product_image');
      await sendMessageWithKeyboard(chatId,
        '🖼️ <b>Paso 5 de 5:</b> Envía la URL de la imagen del producto (opcional):\n' +
        'Envía "skip" para omitir o una URL válida.\n' +
        '<i>Ejemplo: https://ejemplo.com/imagen.jpg</i>',
        mainMenuKeyboard
      );
      break;
      
    case 'awaiting_product_image':
      let imageUrl = text.toLowerCase() === 'skip' 
        ? 'https://via.placeholder.com/300x200?text=Sin+imagen'
        : text;
      
      // Validar URL
      if (!imageUrl.startsWith('http') && text.toLowerCase() !== 'skip') {
        await sendMessage(chatId, '❌ URL inválida. Usa "skip" para omitir.');
        return;
      }
      
      data.product.imagenUrl = imageUrl;
      userData.set(chatId, data);
      await confirmAndSaveProduct(chatId, data.product);
      break;
      
    case 'awaiting_edit_product_id':
      await startEditProductFlow(chatId, text);
      break;
      
    case 'awaiting_edit_field':
      const fieldMap = {
        '1': 'nombre',
        '2': 'descripcion',
        '3': 'precio',
        '4': 'categoria',
        '5': 'imagenUrl'
      };
      
      const field = fieldMap[text];
      if (!field) {
        await sendMessage(chatId, '❌ Opción inválida. Escribe un número del 1 al 5.');
        return;
      }
      
      data.editingField = field;
      userData.set(chatId, data);
      userStates.set(chatId, `awaiting_edit_${field}_value`);
      
      const fieldLabels = {
        'nombre': 'nuevo nombre',
        'descripcion': 'nueva descripción',
        'precio': 'nuevo precio (solo números)',
        'categoria': 'nueva categoría',
        'imagenUrl': 'nueva URL de imagen'
      };
      
      await sendMessageWithKeyboard(chatId,
        `✏️ <b>EDITAR ${field.toUpperCase()}</b>\n\n` +
        `Escribe el ${fieldLabels[field]}:\n` +
        `<i>Actual: ${data.editingProduct[field] || 'No definido'}</i>`,
        mainMenuKeyboard
      );
      break;
      
    case 'awaiting_edit_nombre_value':
    case 'awaiting_edit_descripcion_value':
    case 'awaiting_edit_precio_value':
    case 'awaiting_edit_categoria_value':
    case 'awaiting_edit_imagenUrl_value':
      const fieldName = state.replace('awaiting_edit_', '').replace('_value', '');
      const productId = data.editingProductId;
      
      let newValue = text;
      if (fieldName === 'precio') {
        newValue = parseFloat(text.replace(/[^0-9.]/g, ''));
        if (isNaN(newValue) || newValue <= 0) {
          await sendMessage(chatId, '❌ Precio inválido. Usa solo números.');
          return;
        }
      }
      
      try {
        await db.collection('productos').doc(productId).update({
          [fieldName]: newValue,
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await sendMessage(chatId,
          `✅ <b>Campo actualizado correctamente!</b>\n\n` +
          `📦 <b>Producto ID:</b> <code>${productId}</code>\n` +
          `🔄 <b>Campo:</b> ${fieldName}\n` +
          `📝 <b>Nuevo valor:</b> ${newValue}`,
          mainMenuKeyboard()
        );
        
        userStates.delete(chatId);
        userData.delete(chatId);
      } catch (error) {
        console.error('Error actualizando producto:', error);
        await sendMessage(chatId, '❌ Error al actualizar el producto.');
      }
      break;
      
    case 'awaiting_delete_product_id':
      await startDeleteProductFlow(chatId, text);
      break;
      
    case 'awaiting_delete_confirmation':
      if (text === '✅ Sí, confirmar') {
        const productId = data.deletingProductId;
        try {
          await db.collection('productos').doc(productId).delete();
          await sendMessage(chatId,
            `✅ <b>Producto eliminado correctamente!</b>\n` +
            `🗑️ ID eliminado: <code>${productId}</code>`,
            mainMenuKeyboard()
          );
        } catch (error) {
          console.error('Error eliminando producto:', error);
          await sendMessage(chatId, '❌ Error al eliminar el producto.');
        }
      } else {
        await sendMessage(chatId, '✅ Eliminación cancelada.', mainMenuKeyboard());
      }
      userStates.delete(chatId);
      userData.delete(chatId);
      break;
      
    case 'awaiting_search_term':
      await searchProducts(chatId, text);
      userStates.delete(chatId);
      break;
      
    default:
      // Si no hay estado, mostrar menú
      await sendWelcomeMessage(chatId);
  }
}

// ===== FUNCIONES CRUD =====

// Mensaje de bienvenida
async function sendWelcomeMessage(chatId) {
  await sendMessageWithKeyboard(chatId,
    '🥚 <b>¡Bienvenido al Bot de El Rey del Huevo!</b>\n\n' +
    '<i>Gestión completa de productos desde Telegram</i>\n\n' +
    '📋 <b>Comandos disponibles:</b>\n' +
    '• /start - Mostrar este mensaje\n' +
    '• /listar - Ver todos los productos\n' +
    '• /agregar - Agregar nuevo producto\n' +
    '• /editar - Editar producto existente\n' +
    '• /eliminar - Eliminar producto\n' +
    '• /buscar - Buscar productos\n' +
    '• /stats - Ver estadísticas\n' +
    '• /help - Mostrar ayuda\n\n' +
    '👇 <b>O usa los botones del menú:</b>',
    mainMenuKeyboard
  );
}

// Mostrar ayuda
async function sendHelpMessage(chatId) {
  await sendMessageWithKeyboard(chatId,
    '🆘 <b>AYUDA - MANUAL DE USO</b>\n\n' +
    '<b>📌 CÓMO USAR EL BOT:</b>\n' +
    '1. Usa los botones del menú para navegar\n' +
    '2. Sigue los pasos que te indica el bot\n' +
    '3. Puedes cancelar en cualquier momento\n\n' +
    '<b>📝 FORMATOS ACEPTADOS:</b>\n' +
    '• <b>Nombre:</b> Texto libre\n' +
    '• <b>Descripción:</b> Texto libre\n' +
    '• <b>Precio:</b> Solo números (ej: 1200)\n' +
    '• <b>Categoría:</b> Selecciona de la lista\n' +
    '• <b>Imagen:</b> URL válida o "skip"\n\n' +
    '<b>🔧 COMANDOS RÁPIDOS:</b>\n' +
    '• /listar - Ver productos con paginación\n' +
    '• /agregar - Flujo guiado para agregar\n' +
    '• /editar [id] - Editar producto específico\n' +
    '• /eliminar [id] - Eliminar producto\n' +
    '• /buscar [texto] - Buscar por nombre\n\n' +
    '💡 <i>Los IDs se muestran en /listar</i>',
    mainMenuKeyboard
  );
}

// Listar productos con paginación
async function listProducts(chatId, page = 1) {
  try {
    const pageSize = 5;
    const offset = (page - 1) * pageSize;
    
    const productsRef = db.collection('productos');
    const countSnapshot = await productsRef.count().get();
    const totalCount = countSnapshot.data().count;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const snapshot = await productsRef
      .orderBy('fechaActualizacion', 'desc')
      .offset(offset)
      .limit(pageSize)
      .get();
    
    if (snapshot.empty) {
      await sendMessageWithKeyboard(chatId,
        '📭 <b>No hay productos registrados</b>\n\n' +
        'Usa "➕ Agregar Producto" para comenzar.',
        mainMenuKeyboard
      );
      return;
    }
    
    let message = `📦 <b>PRODUCTOS (Página ${page}/${totalPages})</b>\n\n`;
    let productList = '';
    
    snapshot.forEach((doc, index) => {
      const product = doc.data();
      const number = offset + index + 1;
      productList += `${number}. <b>${product.nombre}</b>\n`;
      productList += `   💰 ${formatPrice(product.precio)}\n`;
      productList += `   🏷️ ${product.categoria}\n`;
      productList += `   🔑 ID: <code>${doc.id}</code>\n`;
      productList += `   ──────────────\n`;
    });
    
    message += productList;
    message += `\n📊 <b>Total:</b> ${totalCount} productos\n`;
    message += `<i>Usa /editar [ID] o /eliminar [ID] para acciones específicas</i>`;
    
    // Crear teclado de paginación
    const paginationKeyboard = {
      reply_markup: {
        inline_keyboard: []
      }
    };
    
    if (totalPages > 1) {
      const row = [];
      if (page > 1) {
        row.push({ text: '◀️ Anterior', callback_data: `page_${page - 1}` });
      }
      row.push({ text: `📄 ${page}/${totalPages}`, callback_data: 'current' });
      if (page < totalPages) {
        row.push({ text: 'Siguiente ▶️', callback_data: `page_${page + 1}` });
      }
      paginationKeyboard.reply_markup.inline_keyboard.push(row);
    }
    
    await sendMessage(chatId, message, paginationKeyboard);
    
  } catch (error) {
    console.error('Error listando productos:', error);
    await sendMessage(chatId, '❌ Error al cargar los productos.');
  }
}

// Buscar productos
async function searchProducts(chatId, searchTerm) {
  try {
    const productsRef = db.collection('productos');
    const snapshot = await productsRef
      .where('nombre', '>=', searchTerm)
      .where('nombre', '<=', searchTerm + '\uf8ff')
      .limit(10)
      .get();
    
    if (snapshot.empty) {
      await sendMessageWithKeyboard(chatId,
        `🔍 <b>No se encontraron productos para:</b> "${searchTerm}"`,
        mainMenuKeyboard
      );
      return;
    }
    
    let message = `🔍 <b>RESULTADOS DE BÚSQUEDA:</b> "${searchTerm}"\n\n`;
    
    snapshot.forEach((doc) => {
      const product = doc.data();
      message += `• <b>${product.nombre}</b>\n`;
      message += `  💰 ${formatPrice(product.precio)}\n`;
      message += `  🏷️ ${product.categoria}\n`;
      message += `  🔑 ID: <code>${doc.id}</code>\n`;
      message += `  ──────────────\n`;
    });
    
    message += `\n📊 <b>Encontrados:</b> ${snapshot.size} productos`;
    
    await sendMessageWithKeyboard(chatId, message, mainMenuKeyboard);
    
  } catch (error) {
    console.error('Error buscando productos:', error);
    await sendMessage(chatId, '❌ Error al buscar productos.');
  }
}

// Mostrar estadísticas
async function showStatis
