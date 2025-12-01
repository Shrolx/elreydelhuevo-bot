// index.js - VERSIÓN DE PRUEBA SIN MÓDULOS COMPLEJOS
import { Telegraf } from 'telegraf';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : ['6571645457'];
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando bot de prueba...');

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());

// Middleware simple
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id?.toString();
    console.log(`📨 De: ${ctx.from?.first_name} - Mensaje: "${ctx.message?.text}"`);
    
    if (!ADMIN_USERS.includes(userId)) {
        await ctx.reply('❌ No autorizado');
        return;
    }
    
    console.log(`✅ Usuario autorizado: ${ctx.from.first_name}`);
    await next();
});

// COMANDO /start
bot.start(async (ctx) => {
    console.log('🎉 /start recibido');
    
    await ctx.reply(`¡HOLA ${ctx.from.first_name}! 👋\n\nBot de El Rey del Huevo`);
    
    await ctx.reply('Elige una opción:', {
        reply_markup: {
            keyboard: [
                ['📦 Ver Productos'],
                ['➕ Nuevo Producto'],
                ['📊 Estadísticas'],
                ['🔧 Configurar Firebase']
            ],
            resize_keyboard: true
        }
    });
});

// VER PRODUCTOS
bot.hears('📦 Ver Productos', async (ctx) => {
    try {
        // Importar dinámicamente para evitar errores de carga
        const { productosDB } = await import('./firebase-config.js');
        const productos = await productosDB.getAll();
        
        let mensaje = `📦 *PRODUCTOS (${productos.length})*\n\n`;
        
        productos.forEach((p, index) => {
            mensaje += `${index + 1}. *${p.nombre}*\n`;
            mensaje += `   💰 $${p.precio ? p.precio.toLocaleString('es-CL') : '0'}\n`;
            mensaje += `   📂 ${p.categoria || 'General'}\n\n`;
        });
        
        await ctx.reply(mensaje, { parse_mode: 'Markdown' });
        
    } catch (error) {
        console.error('Error:', error);
        await ctx.reply('❌ Error conectando con Firebase.\n\nPrueba más tarde o revisa la configuración.');
    }
});

// NUEVO PRODUCTO SIMPLE
bot.hears('➕ Nuevo Producto', async (ctx) => {
    await ctx.reply(
        'Para agregar un producto rápido:\n\n' +
        'Escribe en este formato:\n' +
        '`Nombre|Precio|Categoría`\n\n' +
        'Ejemplo:\n' +
        '`Huevos Blancos|1200|Alimentos`',
        { parse_mode: 'Markdown' }
    );
});

// PROCESAR PRODUCTO SIMPLE
bot.on('text', async (ctx) => {
    const texto = ctx.message.text;
    
    if (texto.includes('|') && texto.split('|').length === 3) {
        try {
            const [nombre, precioStr, categoria] = texto.split('|');
            const precio = parseInt(precioStr.trim());
            
            if (!nombre || isNaN(precio)) {
                await ctx.reply('❌ Formato incorrecto');
                return;
            }
            
            await ctx.reply(`🔄 Guardando "${nombre.trim()}"...`);
            
            // Importar dinámicamente
            const { productosDB } = await import('./firebase-config.js');
            const producto = await productosDB.create({
                nombre: nombre.trim(),
                precio: precio,
                categoria: categoria.trim(),
                descripcion: 'Agregado desde Telegram'
            });
            
            await ctx.reply(
                `✅ *PRODUCTO GUARDADO*\n\n` +
                `Nombre: ${producto.nombre}\n` +
                `Precio: $${producto.precio.toLocaleString('es-CL')}\n` +
                `Categoría: ${producto.categoria}\n\n` +
                `ID: ${producto.id}`,
                { parse_mode: 'Markdown' }
            );
            
        } catch (error) {
            console.error('Error:', error);
            await ctx.reply('❌ Error al guardar');
        }
    }
});

// CONFIGURACIÓN DEL SERVIDOR
const WEBHOOK_PATH = '/webhook';
app.post(WEBHOOK_PATH, (req, res) => {
    bot.handleUpdate(req.body, res);
});

// HEALTH CHECK MEJORADO
app.get('/health', async (req, res) => {
    try {
        const { getFirebaseStatus } = await import('./firebase-config.js');
        const firebaseStatus = getFirebaseStatus();
        
        res.json({
            status: 'healthy',
            service: 'elreydelhuevo-bot',
            telegram: 'connected',
            firebase: firebaseStatus.initialized ? 'connected' : 'disconnected',
            firebase_project: firebaseStatus.projectId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: 'degraded',
            telegram: 'connected',
            firebase: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// PÁGINA PRINCIPAL
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 Bot de El Rey del Huevo</h1>
        <p><strong>ESTADO:</strong> ✅ OPERATIVO</p>
        <p><strong>TELEGRAM:</strong> @ElReyDelHuevoBot</p>
        <p><strong>FIREBASE:</strong> ${firebaseInitialized ? '✅ Conectado' : '⚠️ Offline'}</p>
        <p><a href="/health">Ver estado detallado</a></p>
    `);
});

// INICIAR
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/health`);
    console.log('🎉 Bot listo para Telegram');
    
    // Configurar webhook si hay dominio
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        const webhookUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}${WEBHOOK_PATH}`;
        bot.telegram.setWebhook(webhookUrl)
            .then(() => console.log(`✅ Webhook: ${webhookUrl}`))
            .catch(err => console.error('❌ Webhook error:', err.message));
    }
});
