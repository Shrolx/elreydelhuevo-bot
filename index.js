// index.js - BOT COMPLETO CORREGIDO PARA EL REY DEL HUEVO
import { Telegraf, session } from 'telegraf';
import express from 'express';
import dotenv from 'dotenv';
import { setupProductosCommands } from './commands/productos.js';
import { setupCategoriasCommands } from './commands/categorias.js';
import { setupPublicacionesCommands } from './commands/publicaciones.js';
import { setupAdminCommands } from './commands/admin.js';
import { setupEstadisticasCommands } from './commands/estadisticas.js';

dotenv.config();

// ========== CONFIGURACIÓN ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
const PORT = process.env.PORT || 3000;
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;

console.log('='.repeat(60));
console.log('🤖 BOT DE ADMINISTRACIÓN - EL REY DEL HUEVO 🥚');
console.log('='.repeat(60));
console.log('🔑 Token:', BOT_TOKEN ? '✅ Configurado' : '❌ Faltante');
console.log('👤 Admins:', ADMIN_USERS.length > 0 ? ADMIN_USERS.join(', ') : 'Ninguno configurado');
console.log('🌐 Dominio:', RAILWAY_PUBLIC_DOMAIN || 'localhost');
console.log('📡 Puerto:', PORT);
console.log('='.repeat(60));

// Validar configuración esencial
if (!BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN no está configurado');
    process.exit(1);
}

if (ADMIN_USERS.length === 0) {
    console.warn('⚠️  ADVERTENCIA: ADMIN_USERS está vacío');
}

// ========== INICIALIZAR ==========
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Configurar sesiones para flujos conversacionales
bot.use(session({
    defaultSession: () => ({})
}));

// ========== MIDDLEWARE DE AUTENTICACIÓN CORREGIDO ==========
bot.use(async (ctx, next) => {
    try {
        const userId = ctx.from?.id?.toString();
        
        if (!userId) {
            console.log('⚠️  Mensaje sin usuario');
            return;
        }
        
        console.log(`📨 Mensaje de ${ctx.from.first_name} (${userId}): "${ctx.message?.text || 'Sin texto'}"`);
        
        if (!ADMIN_USERS.includes(userId)) {
            console.log(`🚫 Acceso denegado: ${userId}`);
            await ctx.reply('❌ No tienes permisos para usar este bot.');
            return;
        }
        
        console.log(`✅ Usuario autorizado: ${ctx.from.first_name} (${userId})`);
        await next();
        
    } catch (error) {
        console.error('❌ Error en middleware:', error.message);
    }
});

// ========== IMPORTAR Y CONFIGURAR MÓDULOS ==========
console.log('📦 Cargando módulos...');
try {
    setupProductosCommands(bot);
    setupCategoriasCommands(bot);
    setupPublicacionesCommands(bot);
    setupAdminCommands(bot);
    setupEstadisticasCommands(bot);
    console.log('✅ Módulos cargados correctamente');
} catch (error) {
    console.error('❌ Error cargando módulos:', error.message);
}

// ========== COMANDOS PRINCIPALES ==========

// COMANDO /start - MENÚ PRINCIPAL
bot.start(async (ctx) => {
    try {
        console.log(`🎉 /start de ${ctx.from.first_name} (${ctx.from.id})`);
        
        await ctx.replyWithMarkdown(
            `🎊 *¡HOLA ${ctx.from.first_name.toUpperCase()}!* 🎊\n\n` +
            `🤖 *BOT DE ADMINISTRACIÓN - EL REY DEL HUEVO* 🥚\n\n` +
            `✅ *SISTEMA OPERATIVO 24/7 EN RAILWAY*\n` +
            `🌐 Dominio: ${RAILWAY_PUBLIC_DOMAIN || 'localhost'}\n` +
            `📅 ${new Date().toLocaleString('es-CL')}\n\n` +
            `*FUNCIONES DISPONIBLES:*\n` +
            `📦 *Productos* - Gestión completa (CRUD)\n` +
            `📂 *Categorías* - Organización por tipo\n` +
            `📰 *Publicaciones* - Noticias y promociones\n` +
            `📊 *Estadísticas* - Reportes del sitio\n` +
            `⚙️ *Configuración* - Información del sistema\n` +
            `🔐 *Verificar Acceso* - Credenciales admin\n\n` +
            `*📍 TU NEGOCIO:*\n` +
            `🏪 El Rey del Huevo\n` +
            `📞 +56950104100\n` +
            `📧 reydelhuevo681@gmail.com\n` +
            `📱 @rey_del_huevo`
        );

        // Menú principal con teclado
        const menuPrincipal = {
            reply_markup: {
                keyboard: [
                    ['📦 Productos', '📂 Categorías'],
                    ['📰 Publicaciones', '📊 Estadísticas'],
                    ['⚙️ Configuración', '🔐 Verificar Acceso'],
                    ['🆘 Ayuda']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };

        await ctx.reply('Selecciona una opción del menú:', menuPrincipal);
        
    } catch (error) {
        console.error('❌ Error en comando /start:', error.message);
        try {
            await ctx.reply('❌ Error al procesar tu solicitud. Intenta nuevamente.');
        } catch (e) {
            console.error('No se pudo enviar mensaje de error:', e.message);
        }
    }
});

// MENÚ PRODUCTOS
bot.hears('📦 Productos', async (ctx) => {
    try {
        const menuProductos = {
            reply_markup: {
                keyboard: [
                    ['📥 Nuevo Producto', '📋 Listar Productos'],
                    ['🔍 Buscar Producto', '✏️ Editar Producto'],
                    ['🗑️ Eliminar Producto', '📊 Estadísticas Productos'],
                    ['🔙 Menú Principal']
                ],
                resize_keyboard: true
            }
        };
        
        await ctx.reply(
            '📦 *GESTIÓN COMPLETA DE PRODUCTOS*\n\n' +
            'Selecciona una opción:\n\n' +
            '📥 *Nuevo Producto* - Agregar producto al catálogo\n' +
            '📋 *Listar Productos* - Ver todos los productos\n' +
            '🔍 *Buscar Producto* - Encontrar por nombre o categoría\n' +
            '✏️ *Editar Producto* - Modificar información\n' +
            '🗑️ *Eliminar Producto* - Remover del catálogo\n' +
            '📊 *Estadísticas* - Reportes de inventario\n\n' +
            '✅ *Conectado a Firebase* - Sincronización automática',
            { 
                parse_mode: 'Markdown',
                ...menuProductos 
            }
        );
    } catch (error) {
        console.error('Error en menú Productos:', error);
        await ctx.reply('❌ Error al mostrar menú de productos.');
    }
});

// MENÚ CATEGORÍAS
bot.hears('📂 Categorías', async (ctx) => {
    try {
        const menuCategorias = {
            reply_markup: {
                keyboard: [
                    ['🆕 Nueva Categoría', '📋 Listar Categorías'],
                    ['✏️ Editar Categoría', '🗑️ Eliminar Categoría'],
                    ['📊 Productos por Categoría', '🔙 Menú Principal']
                ],
                resize_keyboard: true
            }
        };
        
        await ctx.reply(
            '📂 *GESTIÓN COMPLETA DE CATEGORÍAS*\n\n' +
            'Selecciona una opción:\n\n' +
            '🆕 *Nueva Categoría* - Crear categoría\n' +
            '📋 *Listar Categorías* - Ver todas las categorías\n' +
            '✏️ *Editar Categoría* - Modificar categoría\n' +
            '🗑️ *Eliminar Categoría* - Eliminar categoría\n' +
            '📊 *Productos por Categoría* - Ver distribución\n\n' +
            'Organiza tus productos eficientemente',
            { 
                parse_mode: 'Markdown',
                ...menuCategorias 
            }
        );
    } catch (error) {
        console.error('Error en menú Categorías:', error);
        await ctx.reply('❌ Error al mostrar menú de categorías.');
    }
});

// MENÚ PUBLICACIONES
bot.hears('📰 Publicaciones', async (ctx) => {
    try {
        const menuPublicaciones = {
            reply_markup: {
                keyboard: [
                    ['🆕 Nueva Publicación', '📋 Listar Publicaciones'],
                    ['✏️ Editar Publicación', '🗑️ Eliminar Publicación'],
                    ['📊 Estadísticas Publicaciones', '🔙 Menú Principal']
                ],
                resize_keyboard: true
            }
        };
        
        await ctx.reply(
            '📰 *GESTIÓN COMPLETA DE PUBLICACIONES*\n\n' +
            'Selecciona una opción:\n\n' +
            '🆕 *Nueva Publicación* - Crear noticia o promoción\n' +
            '📋 *Listar Publicaciones* - Ver todas las publicaciones\n' +
            '✏️ *Editar Publicación* - Modificar publicación\n' +
            '🗑️ *Eliminar Publicación* - Eliminar publicación\n' +
            '📊 *Estadísticas* - Reportes de actividad\n\n' +
            'Mantén informados a tus clientes',
            { 
                parse_mode: 'Markdown',
                ...menuPublicaciones 
            }
        );
    } catch (error) {
        console.error('Error en menú Publicaciones:', error);
        await ctx.reply('❌ Error al mostrar menú de publicaciones.');
    }
});

// MENÚ ESTADÍSTICAS
bot.hears('📊 Estadísticas', async (ctx) => {
    try {
        const menuEstadisticas = {
            reply_markup: {
                keyboard: [
                    ['📊 Estadísticas Completas', '📈 Reporte Detallado'],
                    ['📋 Ver Logs', '💾 Backup Datos'],
                    ['🔙 Menú Principal']
                ],
                resize_keyboard: true
            }
        };
        
        await ctx.reply(
            '📊 *ESTADÍSTICAS Y REPORTES*\n\n' +
            'Selecciona una opción:\n\n' +
            '📊 *Estadísticas Completas* - Visión general\n' +
            '📈 *Reporte Detallado* - Análisis específico\n' +
            '📋 *Ver Logs* - Actividad del sistema\n' +
            '💾 *Backup Datos* - Información de respaldos\n\n' +
            'Monitorea el rendimiento de tu negocio',
            { 
                parse_mode: 'Markdown',
                ...menuEstadisticas 
            }
        );
    } catch (error) {
        console.error('Error en menú Estadísticas:', error);
        await ctx.reply('❌ Error al mostrar menú de estadísticas.');
    }
});

// MENÚ CONFIGURACIÓN
bot.hears('⚙️ Configuración', async (ctx) => {
    try {
        const menuConfig = {
            reply_markup: {
                keyboard: [
                    ['🔐 Verificar Acceso', 'ℹ️ Información Sistema'],
                    ['📋 Ver Logs', '🔄 Reiniciar Bot'],
                    ['💾 Backup Datos', '🔙 Menú Principal']
                ],
                resize_keyboard: true
            }
        };
        
        await ctx.reply(
            '⚙️ *CONFIGURACIÓN DEL SISTEMA*\n\n' +
            'Selecciona una opción:\n\n' +
            '🔐 *Verificar Acceso* - Credenciales admin\n' +
            'ℹ️ *Información Sistema* - Detalles técnicos\n' +
            '📋 *Ver Logs* - Registros de actividad\n' +
            '🔄 *Reiniciar Bot* - Reiniciar servicio\n' +
            '💾 *Backup Datos* - Información de respaldos\n\n' +
            'Administra tu sistema eficientemente',
            { 
                parse_mode: 'Markdown',
                ...menuConfig 
            }
        );
    } catch (error) {
        console.error('Error en menú Configuración:', error);
        await ctx.reply('❌ Error al mostrar menú de configuración.');
    }
});

// VERIFICAR ACCESO
bot.hears('🔐 Verificar Acceso', async (ctx) => {
    try {
        await ctx.reply('🔐 *VERIFICACIÓN DE ACCESO*\n\n' +
            '✅ Usuario autorizado\n' +
            `👤 Nombre: ${ctx.from.first_name}\n` +
            `🆔 ID: ${ctx.from.id}\n` +
            `📅 Fecha: ${new Date().toLocaleString('es-CL')}\n\n` +
            'Tienes acceso completo al sistema.',
            { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error en Verificar Acceso:', error);
    }
});

// AYUDA
bot.hears('🆘 Ayuda', async (ctx) => {
    try {
        const ayuda = `
🆘 *CENTRO DE AYUDA*

📍 *COMANDOS PRINCIPALES:*
/start - Menú principal completo
/help - Esta ayuda

📦 *GESTIÓN DE PRODUCTOS:*
• Agregar productos nuevos
• Ver catálogo completo
• Editar información
• Eliminar productos

📂 *GESTIÓN DE CATEGORÍAS:*
• Crear categorías
• Organizar productos
• Ver por categoría

📰 *GESTIÓN DE PUBLICACIONES:*
• Crear noticias
• Publicar promociones
• Gestionar contenido

📊 *ESTADÍSTICAS:*
• Reportes de inventario
• Análisis por categoría
• Actividad reciente

💡 *CONSEJOS:*
1. Usa los botones del menú
2. Sigue los pasos indicados
3. Los cambios se sincronizan automáticamente

✅ *SISTEMA OPERATIVO:*
• Bot 24/7 en Railway
• Conexión Firebase activa
• Panel completo funcional
        `;
        
        await ctx.reply(ayuda, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error en Ayuda:', error);
    }
});

// VOLVER AL MENÚ PRINCIPAL
bot.hears('🔙 Menú Principal', async (ctx) => {
    try {
        const menuPrincipal = {
            reply_markup: {
                keyboard: [
                    ['📦 Productos', '📂 Categorías'],
                    ['📰 Publicaciones', '📊 Estadísticas'],
                    ['⚙️ Configuración', '🔐 Verificar Acceso'],
                    ['🆘 Ayuda']
                ],
                resize_keyboard: true
            }
        };
        
        await ctx.reply('🏠 *Volviendo al Menú Principal*', {
            parse_mode: 'Markdown',
            ...menuPrincipal
        });
    } catch (error) {
        console.error('Error volviendo al menú:', error);
    }
});

// COMANDO /info
bot.command('info', async (ctx) => {
    try {
        await ctx.reply(
            `ℹ️ *INFORMACIÓN TÉCNICA*\n\n` +
            `*Bot ID:* 8383198564\n` +
            `*Username:* @ElReyDelHuevoBot\n` +
            `*Dominio:* ${RAILWAY_PUBLIC_DOMAIN || 'localhost'}\n` +
            `*Webhook:* ✅ ACTIVO\n` +
            `*Hora servidor:* ${new Date().toLocaleString('es-CL')}\n\n` +
            `*Módulos cargados:*\n` +
            `✅ Productos (CRUD completo)\n` +
            `✅ Categorías (CRUD completo)\n` +
            `✅ Publicaciones (CRUD completo)\n` +
            `✅ Estadísticas (Reportes)\n` +
            `✅ Administración (Configuración)`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Error en comando /info:', error);
    }
});

// COMANDO /help
bot.command('help', async (ctx) => {
    try {
        await ctx.reply(
            `🆘 *AYUDA RÁPIDA*\n\n` +
            `Usa los botones del menú para acceder a todas las funciones.\n\n` +
            `Escribe /start para volver al menú principal.`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Error en comando /help:', error);
    }
});

// MENSAJES NO RECONOCIDOS
bot.on('text', async (ctx) => {
    try {
        const text = ctx.message.text;
        
        // Si no es un comando del menú y no empieza con /
        if (!text.startsWith('/')) {
            await ctx.reply(
                '🤔 *No reconozco ese comando*\n\n' +
                'Usa los botones del menú o escribe /start para ver todas las opciones.\n\n' +
                '¿Necesitas ayuda? Escribe /help',
                { parse_mode: 'Markdown' }
            );
        }
    } catch (error) {
        console.error('Error en handler de texto:', error);
    }
});

// ========== MANEJO DE ERRORES GLOBAL ==========
bot.catch((err, ctx) => {
    console.error(`💥 ERROR GLOBAL en ${ctx.updateType}:`, err.message);
    console.error('Stack:', err.stack);
    
    try {
        if (ctx.chat) {
            ctx.reply('❌ Ocurrió un error inesperado. Por favor, intenta nuevamente.').catch(e => {
                console.error('No se pudo enviar mensaje de error:', e.message);
            });
        }
    } catch (e) {
        console.error('Error en catch handler:', e.message);
    }
});

// ========== CONFIGURAR WEBHOOK ==========

// RUTA DEL WEBHOOK
const WEBHOOK_PATH = '/webhook';
const WEBHOOK_URL = RAILWAY_PUBLIC_DOMAIN ? 
    `https://${RAILWAY_PUBLIC_DOMAIN}${WEBHOOK_PATH}` : 
    null;

// ========== CONFIGURACIÓN DEL SERVIDOR WEB ==========

// HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'elreydelhuevo-bot',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        bot: {
            token_configured: !!BOT_TOKEN,
            admin_users_count: ADMIN_USERS.length,
            modules_loaded: true
        },
        webhook: {
            configured: !!WEBHOOK_URL,
            url: WEBHOOK_URL
        }
    });
});

// PÁGINA PRINCIPAL
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🤖 El Rey del Huevo Bot</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    padding: 30px;
                    border-radius: 15px;
                    display: inline-block;
                    backdrop-filter: blur(10px);
                }
                h1 { color: #f1c40f; }
                .status { color: #2ecc71; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 El Rey del Huevo Bot 🥚</h1>
                <p class="status">✅ SISTEMA OPERATIVO</p>
                <p>Servicio de administración vía Telegram</p>
                <p><strong>Dominio:</strong> ${RAILWAY_PUBLIC_DOMAIN || 'localhost'}</p>
                <p><strong>Webhook:</strong> ${WEBHOOK_URL ? '✅ Configurado' : '⚠️ Local'}</p>
                <p><strong>Estado:</strong> <span class="status">FUNCIONANDO</span></p>
                <p>📱 Busca @ElReyDelHuevoBot en Telegram</p>
                <p>💬 Envía /start para comenzar</p>
            </div>
        </body>
        </html>
    `);
});

// ========== INICIAR SERVIDOR ==========

async function startServer() {
    try {
        // Iniciar servidor Express
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Servidor web iniciado en puerto ${PORT}`);
            console.log(`🌐 Página: http://localhost:${PORT}/`);
            console.log(`❤️  Health: http://localhost:${PORT}/health`);
            
            if (RAILWAY_PUBLIC_DOMAIN) {
                console.log(`🚂 Railway: https://${RAILWAY_PUBLIC_DOMAIN}`);
            }
        });

        // Configuración del webhook
        if (WEBHOOK_URL) {
            console.log('🔗 Configurando webhook para Railway...');
            
            try {
                // Primero, eliminar cualquier webhook previo
                await bot.telegram.deleteWebhook({ drop_pending_updates: true });
                console.log('✅ Webhook anterior eliminado');
                
                // Configurar el nuevo webhook
                await bot.telegram.setWebhook(WEBHOOK_URL, {
                    allowed_updates: ['message', 'callback_query']
                });
                console.log(`✅ Webhook configurado: ${WEBHOOK_URL}`);
                
                // Configurar el middleware del webhook CORRECTAMENTE
                app.post(WEBHOOK_PATH, (req, res) => {
                    try {
                        bot.handleUpdate(req.body, res);
                    } catch (error) {
                        console.error('Error en webhook handler:', error);
                        res.status(500).end();
                    }
                });
                
                console.log('🤖 Bot listo para recibir mensajes vía webhook');
                
            } catch (webhookError) {
                console.error('❌ Error configurando webhook:', webhookError.message);
                console.log('🔄 Usando modo polling como fallback...');
                
                // Iniciar polling como fallback
                bot.launch().then(() => {
                    console.log('🤖 Bot iniciado en modo polling');
                }).catch(err => {
                    console.error('❌ Error iniciando bot en modo polling:', err);
                });
            }
        } else {
            console.log('🌐 Modo desarrollo: usando polling');
            await bot.launch();
            console.log('🤖 Bot iniciado en modo polling (desarrollo)');
        }
        
        console.log('='.repeat(60));
        console.log('🎉 Sistema completamente operativo');
        console.log('📱 Busca @ElReyDelHuevoBot en Telegram');
        console.log('💬 Envía /start para comenzar');
        console.log('='.repeat(60));

        // Manejar apagado graceful
        process.once('SIGINT', () => gracefulShutdown('SIGINT', server));
        process.once('SIGTERM', () => gracefulShutdown('SIGTERM', server));

    } catch (error) {
        console.error('💥 ERROR CRÍTICO al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Función para apagado graceful
function gracefulShutdown(signal, server) {
    console.log(`\n👋 Recibido ${signal}. Deteniendo servicios...`);
    
    // Detener el bot primero
    bot.stop(signal);
    console.log('✅ Bot detenido');
    
    // Cerrar el servidor
    server.close(() => {
        console.log('✅ Servidor web cerrado');
        console.log('👋 ¡Hasta luego!');
        process.exit(0);
    });
    
    // Timeout forzado después de 10 segundos
    setTimeout(() => {
        console.error('⚠️  Timeout forzando cierre...');
        process.exit(1);
    }, 10000);
}

// ========== INICIAR LA APLICACIÓN ==========

console.log('🚀 Iniciando sistema de administración...');
startServer();
