const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const admin = require('firebase-admin');

const app = express();
app.use(bodyParser.json());

// Configurar Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Configuración del bot de Telegram
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Verificar que las variables de entorno estén configuradas
if (!TELEGRAM_TOKEN || !WEBHOOK_URL) {
  console.error('❌ Error: TELEGRAM_TOKEN o WEBHOOK_URL no están configuradas');
  process.exit(1);
}

// Configurar webhook en Telegram
async function setTelegramWebhook() {
  try {
    const response = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    console.log('✅ Webhook configurado en Telegram:', response.data);
  } catch (error) {
    console.error('❌ Error configurando webhook:', error.message);
  }
}

// Endpoint para configurar el webhook manualmente
app.get('/set-webhook', async (req, res) => {
  try {
    const response = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    res.json({
      success: true,
      message: 'Webhook configurado correctamente',
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para verificar que el bot está funcionando
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'El Rey del Huevo - Telegram Bot',
    timestamp: new Date().toISOString()
  });
});

// Endpoint principal para recibir mensajes de Telegram
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    // Verificar que sea un mensaje válido
    if (!update.message) {
      return res.sendStatus(200);
    }
    
    const chatId = update.message.chat.id;
    const text = update.message.text || '';
    
    console.log(`📨 Mensaje recibido de ${chatId}: ${text}`);
    
    // Procesar el comando
    await handleCommand(chatId, text);
    
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.sendStatus(200); // Siempre devolver 200 a Telegram
  }
});

// Función para manejar comandos
async function handleCommand(chatId, text) {
  const command = text.split(' ')[0].toLowerCase();
  
  switch (command) {
    case '/start':
      await sendMessage(chatId, 
        '¡Hola! 👋 Soy el bot de administración de *El Rey del Huevo* 🥚\n\n' +
        '*Comandos disponibles:*\n' +
        '/listar - Ver todos los productos\n' +
        '/buscar <id> - Buscar producto por ID\n' +
        '/agregar <nombre>|<precio>|<categoria>|<descripción> - Agregar nuevo producto\n' +
        '/actualizar <id> <nombre>|<precio>|<categoria>|<descripción> - Actualizar producto\n' +
        '/eliminar <id> - Eliminar producto\n' +
        '/categorias - Ver todas las categorías\n' +
        '/ayuda - Mostrar esta ayuda\n\n' +
        '📌 *Ejemplos:*\n' +
        '`/agregar Huevo AA|1200|alimentos|Huevo fresco de gallina`\n' +
        '`/actualizar abc123 Huevo AAA|1500|alimentos|Huevo premium`'
      );
      break;
      
    case '/ayuda':
    case '/help':
      await sendMessage(chatId,
        '*📋 Manual de Comandos*\n\n' +
        '*Gestión de Productos:*\n' +
        '• `/listar` - Lista todos los productos\n' +
        '• `/buscar <id>` - Busca un producto específico\n' +
        '• `/agregar <datos>` - Agrega nuevo producto\n' +
        '• `/actualizar <id> <datos>` - Actualiza producto\n' +
        '• `/eliminar <id>` - Elimina producto\n\n' +
        '*Formato de datos:*\n' +
        '`nombre|precio|categoria|descripción`\n\n' +
        '*Otros comandos:*\n' +
        '• `/categorias` - Lista categorías\n' +
        '• `/start` - Reiniciar bot\n' +
        '• `/ayuda` - Mostrar ayuda'
      );
      break;
      
    case '/listar':
      await listarProductos(chatId);
      break;
      
    case '/buscar':
      const buscarId = text.split(' ')[1];
      if (!buscarId) {
        await sendMessage(chatId, '⚠️ Debes proporcionar un ID. Ejemplo: `/buscar abc123`');
      } else {
        await buscarProducto(chatId, buscarId);
      }
      break;
      
    case '/agregar':
      const datosAgregar = text.substring(8).trim();
      if (!datosAgregar) {
        await sendMessage(chatId, '⚠️ Formato incorrecto. Ejemplo: `/agregar Nombre|1200|categoria|Descripción`');
      } else {
        await agregarProducto(chatId, datosAgregar);
      }
      break;
      
    case '/actualizar':
      const partesActualizar = text.substring(10).trim().split(' ');
      if (partesActualizar.length < 2) {
        await sendMessage(chatId, '⚠️ Formato incorrecto. Ejemplo: `/actualizar abc123 Nombre|1500|categoria|Descripción nueva`');
      } else {
        const [idActualizar, ...resto] = partesActualizar;
        const datosActualizar = resto.join(' ');
        await actualizarProducto(chatId, idActualizar, datosActualizar);
      }
      break;
      
    case '/eliminar':
      const idEliminar = text.split(' ')[1];
      if (!idEliminar) {
        await sendMessage(chatId, '⚠️ Debes proporcionar un ID. Ejemplo: `/eliminar abc123`');
      } else {
        await eliminarProducto(chatId, idEliminar);
      }
      break;
      
    case '/categorias':
      await listarCategorias(chatId);
      break;
      
    default:
      await sendMessage(chatId, 
        '❓ Comando no reconocido. Usa `/ayuda` para ver los comandos disponibles.\n' +
        'Para comenzar, usa `/start`'
      );
  }
}

// ===== FUNCIONES CRUD PARA PRODUCTOS =====

// Listar todos los productos
async function listarProductos(chatId) {
  try {
    await sendMessage(chatId, '🔄 Buscando productos...');
    
    const productosRef = db.collection('productos');
    const snapshot = await productosRef.orderBy('fechaActualizacion', 'desc').limit(20).get();
    
    if (snapshot.empty) {
      await sendMessage(chatId, '📭 No hay productos registrados.');
      return;
    }
    
    let mensaje = '📦 *Productos disponibles:*\n\n';
    let contador = 1;
    
    snapshot.forEach(doc => {
      const producto = doc.data();
      mensaje += `*${contador}.* ${producto.nombre}\n`;
      mensaje += `   💰 ${formatearPrecio(producto.precio)}\n`;
      mensaje += `   🏷️ ${producto.categoria}\n`;
      mensaje += `   🔑 ID: \`${doc.id}\`\n`;
      mensaje += `   ──────────────\n`;
      contador++;
    });
    
    mensaje += `\n*Total:* ${snapshot.size} productos\n`;
    mensaje += `Usa \`/buscar <id>\` para ver detalles específicos`;
    
    await sendMessage(chatId, mensaje);
  } catch (error) {
    console.error('Error listando productos:', error);
    await sendMessage(chatId, '❌ Error al listar productos: ' + error.message);
  }
}

// Buscar producto por ID
async function buscarProducto(chatId, productoId) {
  try {
    const docRef = db.collection('productos').doc(productoId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      await sendMessage(chatId, `❌ No se encontró producto con ID: \`${productoId}\``);
      return;
    }
    
    const producto = doc.data();
    const fecha = producto.fechaActualizacion ? 
      producto.fechaActualizacion.toDate().toLocaleDateString('es-CL') : 
      'No disponible';
    
    let mensaje = `🔍 *Producto encontrado:*\n\n`;
    mensaje += `*Nombre:* ${producto.nombre}\n`;
    mensaje += `*Descripción:* ${producto.descripcion}\n`;
    mensaje += `*Precio:* ${formatearPrecio(producto.precio)}\n`;
    mensaje += `*Categoría:* ${producto.categoria}\n`;
    mensaje += `*Imagen:* ${producto.imagenUrl ? '✅ Sí' : '❌ No'}\n`;
    mensaje += `*Última actualización:* ${fecha}\n`;
    mensaje += `*ID:* \`${productoId}\`\n\n`;
    mensaje += `*Comandos disponibles:*\n`;
    mensaje += `\`/actualizar ${productoId} Nuevo Nombre|1500|categoria|Descripción\`\n`;
    mensaje += `\`/eliminar ${productoId}\``;
    
    await sendMessage(chatId, mensaje);
  } catch (error) {
    console.error('Error buscando producto:', error);
    await sendMessage(chatId, '❌ Error al buscar producto: ' + error.message);
  }
}

// Agregar nuevo producto
async function agregarProducto(chatId, datos) {
  try {
    // Formato: nombre|precio|categoria|descripcion
    const partes = datos.split('|').map(part => part.trim());
    
    if (partes.length < 4) {
      await sendMessage(chatId, 
        '⚠️ Formato incorrecto. Debe ser:\n' +
        '`nombre|precio|categoria|descripción`\n\n' +
        'Ejemplo: `/agregar Huevo AA|1200|alimentos|Huevo fresco de gallina`'
      );
      return;
    }
    
    const [nombre, precio, categoria, descripcion] = partes;
    
    // Validar precio
    const precioNumero = parseFloat(precio);
    if (isNaN(precioNumero) || precioNumero <= 0) {
      await sendMessage(chatId, '⚠️ El precio debe ser un número válido mayor a 0');
      return;
    }
    
    const productoData = {
      nombre,
      descripcion,
      precio: precioNumero,
      categoria,
      imagenUrl: 'https://via.placeholder.com/300x200?text=Sin+imagen',
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('productos').add(productoData);
    
    let mensaje = '✅ *Producto agregado exitosamente!*\n\n';
    mensaje += `*Nombre:* ${nombre}\n`;
    mensaje += `*Precio:* ${formatearPrecio(precioNumero)}\n`;
    mensaje += `*Categoría:* ${categoria}\n`;
    mensaje += `*Descripción:* ${descripcion}\n`;
    mensaje += `*ID asignado:* \`${docRef.id}\`\n\n`;
    mensaje += `Puedes actualizarlo con:\n`;
    mensaje += `\`/actualizar ${docRef.id} ${nombre}|${precioNumero}|${categoria}|Nueva descripción\``;
    
    await sendMessage(chatId, mensaje);
    
    // Notificar al frontend sobre la actualización
    try {
      await axios.post('https://elreydelhuevo.onrender.com/api/actualizar', {
        tipo: 'producto_agregado',
        id: docRef.id,
        timestamp: Date.now()
      });
    } catch (notifyError) {
      console.log('Nota: No se pudo notificar al frontend', notifyError.message);
    }
    
  } catch (error) {
    console.error('Error agregando producto:', error);
    await sendMessage(chatId, '❌ Error al agregar producto: ' + error.message);
  }
}

// Actualizar producto existente
async function actualizarProducto(chatId, productoId, datos) {
  try {
    // Formato: nombre|precio|categoria|descripcion
    const partes = datos.split('|').map(part => part.trim());
    
    if (partes.length < 4) {
      await sendMessage(chatId, 
        '⚠️ Formato incorrecto. Debe ser:\n' +
        '`nombre|precio|categoria|descripción`\n\n' +
        'Ejemplo: `/actualizar abc123 Huevo AAA|1500|alimentos|Huevo premium`'
      );
      return;
    }
    
    const [nombre, precio, categoria, descripcion] = partes;
    
    // Validar precio
    const precioNumero = parseFloat(precio);
    if (isNaN(precioNumero) || precioNumero <= 0) {
      await sendMessage(chatId, '⚠️ El precio debe ser un número válido mayor a 0');
      return;
    }
    
    // Verificar que el producto existe
    const docRef = db.collection('productos').doc(productoId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      await sendMessage(chatId, `❌ No existe producto con ID: \`${productoId}\``);
      return;
    }
    
    const productoData = {
      nombre,
      descripcion,
      precio: precioNumero,
      categoria,
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.update(productoData);
    
    let mensaje = '✏️ *Producto actualizado exitosamente!*\n\n';
    mensaje += `*ID:* \`${productoId}\`\n`;
    mensaje += `*Nuevo nombre:* ${nombre}\n`;
    mensaje += `*Nuevo precio:* ${formatearPrecio(precioNumero)}\n`;
    mensaje += `*Nueva categoría:* ${categoria}\n`;
    mensaje += `*Nueva descripción:* ${descripcion}\n\n`;
    mensaje += `Ver producto: \`/buscar ${productoId}\``;
    
    await sendMessage(chatId, mensaje);
    
    // Notificar al frontend sobre la actualización
    try {
      await axios.post('https://elreydelhuevo.onrender.com/api/actualizar', {
        tipo: 'producto_actualizado',
        id: productoId,
        timestamp: Date.now()
      });
    } catch (notifyError) {
      console.log('Nota: No se pudo notificar al frontend', notifyError.message);
    }
    
  } catch (error) {
    console.error('Error actualizando producto:', error);
    await sendMessage(chatId, '❌ Error al actualizar producto: ' + error.message);
  }
}

// Eliminar producto
async function eliminarProducto(chatId, productoId) {
  try {
    // Verificar que el producto existe
    const docRef = db.collection('productos').doc(productoId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      await sendMessage(chatId, `❌ No existe producto con ID: \`${productoId}\``);
      return;
    }
    
    const producto = doc.data();
    
    // Confirmar eliminación
    await sendMessage(chatId, 
      `⚠️ *¿Estás seguro de eliminar este producto?*\n\n` +
      `*Nombre:* ${producto.nombre}\n` +
      `*Precio:* ${formatearPrecio(producto.precio)}\n` +
      `*ID:* \`${productoId}\`\n\n` +
      `Para confirmar, escribe: \`/confirmar_eliminar ${productoId}\`\n` +
      `Para cancelar, escribe: \`/cancelar\``
    );
    
  } catch (error) {
    console.error('Error preparando eliminación:', error);
    await sendMessage(chatId, '❌ Error: ' + error.message);
  }
}

// Comando para confirmar eliminación
async function confirmarEliminarProducto(chatId, productoId) {
  try {
    const docRef = db.collection('productos').doc(productoId);
    await docRef.delete();
    
    await sendMessage(chatId, `🗑️ *Producto eliminado exitosamente!*\nID: \`${productoId}\``);
    
    // Notificar al frontend sobre la actualización
    try {
      await axios.post('https://elreydelhuevo.onrender.com/api/actualizar', {
        tipo: 'producto_eliminado',
        id: productoId,
        timestamp: Date.now()
      });
    } catch (notifyError) {
      console.log('Nota: No se pudo notificar al frontend', notifyError.message);
    }
    
  } catch (error) {
    console.error('Error eliminando producto:', error);
    await sendMessage(chatId, '❌ Error al eliminar producto: ' + error.message);
  }
}

// Listar categorías
async function listarCategorias(chatId) {
  try {
    const categoriasRef = db.collection('categorias');
    const snapshot = await categoriasRef.get();
    
    if (snapshot.empty) {
      await sendMessage(chatId, '📭 No hay categorías registradas.');
      return;
    }
    
    let mensaje = '🏷️ *Categorías disponibles:*\n\n';
    
    snapshot.forEach(doc => {
      const categoria = doc.data();
      mensaje += `• *${categoria.nombre}*\n`;
      mensaje += `  ${categoria.descripcion || 'Sin descripción'}\n`;
      mensaje += `  ──────────────\n`;
    });
    
    await sendMessage(chatId, mensaje);
  } catch (error) {
    console.error('Error listando categorías:', error);
    await sendMessage(chatId, '❌ Error al listar categorías: ' + error.message);
  }
}

// Función auxiliar para formatear precio
function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(precio);
}

// Función para enviar mensajes a Telegram
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error enviando mensaje a Telegram:', error.message);
  }
}

// Endpoint para manejar comandos específicos
app.post('/comando', async (req, res) => {
  try {
    const { chatId, comando } = req.body;
    
    if (!chatId || !comando) {
      return res.status(400).json({ error: 'chatId y comando son requeridos' });
    }
    
    await handleCommand(chatId, comando);
    res.json({ success: true });
  } catch (error) {
    console.error('Error en endpoint /comando:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🤖 Bot de Telegram corriendo en puerto ${PORT}`);
  
  // Configurar webhook al iniciar
  await setTelegramWebhook();
});

// Exportar para Render
module.exports = app;