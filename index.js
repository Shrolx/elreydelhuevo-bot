// index.js - BOT COMPLETO PARA EL REY DEL HUEVO
import { Telegraf, session } from 'telegraf';
import express from 'express';
import dotenv from 'dotenv';
import { setupProductosCommands } from './commands/productos.js';
import { setupCategoriasCommands } from './commands/categorias.js';
import { setupPublicacionesCommands } from './commands/publicaciones.js';
import { setupAdminCommands } from './commands/admin.js';
import { setupEstadisticasCommands } from './commands/estadisticas.js';
import { authMiddleware, loggingMiddleware } from './handlers/middleware.js';

dotenv.config();

// ========== CONFIGURACIÓN ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
const PORT = process.env.PORT || 3000;
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL;

// Validar configuración esencial
if (!BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN no está configurado en las variables de entorno');
    console.error('Agrega BOT_TOKEN=tu_token en Railway Variables');
    process.exit(1);
}

if (ADMIN_USERS.length === 0) {
    console.warn('⚠️  ADVERTENCIA: ADMIN_USERS está vacío. Agrega tu ID de Telegram');
}

console.log('='.repeat(60));
console.log('🤖 BOT DE ADMINISTRACIÓN - EL REY DEL HUEVO 🥚');
console.log('='.repeat(60));
console.log('🔑 Token:', BOT_TOKEN ? '✅ Configurado' : '❌ Faltante');
console.log('👤 Admins:', ADMIN_USERS.length > 0 ? ADMIN_USERS.join(', ') : 'Ninguno configurado');
console.log('🌐 Dominio:', RAILWAY_PUBLIC_DOMAIN || 'localhost');
console.log('📡 Puerto:', PORT);
console.log('='.repeat(60));

// ========== INICIALIZAR ==========
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Configurar sesiones para flujos conversacionales
bot.use(session({
    defaultSession: () => ({})
}));

// Middleware de autenticación y logging
bot.use(authMiddleware(ADMIN_USERS));
bot.use(loggingMiddleware());

// ========== IMPORTAR Y CONFIGURAR MÓDULOS ==========
console.log('📦 Cargando módulos...');
setupProductosCommands(bot);
setupCategoriasCommands(bot);
setupPublicacionesCommands(bot);
setupAdminCommands(bot);
setupEstadisticasCommands(bot);
console.log('✅ Módulos cargados correctamente');

// ========== COMANDOS PRINCIPALES ==========

// COMANDO /start - MENÚ PRINCIPAL
bot.start(async (ctx) => {
    console.log(`🎉 /start de ${ctx.from.first_name} (${ctx.from.id})`);
    
    const menuPrincipal = {
        reply_markup: {
            keyboard: [
                ['📦 Productos', '📂 Categorías'],
                ['📰 Publicaciones', '📊 Estadísticas'],
                ['⚙️ Configuración', '🔐 Verificar Acceso'],
                ['🆘 Ayuda', 'ℹ️ Información Sistema']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    
    await ctx.replyWithMarkdownV2(
        `🎊 *¡HOLA ${ctx.from.first_name.toUpperCase()}!* 🎊\n\n` +
        `🤖 *BOT DE ADMINISTRACIÓN \\- EL REY DEL HUEVO* 🥚\n\n` +
        `✅ *SISTEMA OPERATIVO 24/7 EN RAILWAY*\n` +
        `🌐 Dominio: ${RAILWAY_PUBLIC_DOMAIN || 'localhost'}\n` +
        `📅 ${new Date().toLocaleString('es\\-CL')}\n\n` +
        `*FUNCIONES DISPONIBLES:*\n` +
        `📦 *Productos* \\- Gestión completa \\(CRUD\\)\n` +
        `📂 *Categorías* \\- Organización por tipo\n` +
        `📰 *Publicaciones* \\- Noticias y promociones\n` +
        `📊 *Estadísticas* \\- Reportes del sitio\n` +
        `⚙️ *Configuración* \\- Información del sistema\n` +
        `🔐 *Verificar Acceso* \\- Credenciales admin\n\n` +
        `*📍 TU NEGOCIO:*\n` +
        `🏪 El Rey del Huevo\n` +
        `📞 \\+56950104100\n` +
        `📧 reydelhuevo681@gmail\\.com\n` +
        `📱 @rey\\_del\\_huevo`
    ).then(() => {
        ctx.reply('Usa los botones del menú para navegar:', menuPrincipal);
    }).catch(err => {
        console.error('Error enviando mensaje:', err);
    });
});

// ========== MANEJO DE ERRORES ==========
bot.catch((err, ctx) => {
    console.error(`💥 Error en el bot para ${ctx.updateType}:`, err);
    
    // Intentar enviar mensaje de error al usuario
    if (ctx.chat) {
        ctx.reply('❌ Ocurrió un error. Por favor, intenta nuevamente.').catch(e => {
            console.error('No se pudo enviar mensaje de error:', e);
        });
    }
});

// ========== CONFIGURAR WEBHOOK (PARA RAILWAY) ==========

// Verificar que tenemos el dominio de Railway
if (!RAILWAY_PUBLIC_DOMAIN) {
    console.warn('⚠️  RAILWAY_PUBLIC_DOMAIN no está configurado. Usando modo polling.');
} else {
    console.log('🌐 Dominio Railway:', RAILWAY_PUBLIC_DOMAIN);
}

// RUTA DEL WEBHOOK
const WEBHOOK_PATH = '/webhook';
const WEBHOOK_URL = RAILWAY_PUBLIC_DOMAIN ? 
    `https://${RAILWAY_PUBLIC_DOMAIN}${WEBHOOK_PATH}` : 
    null;

console.log('📍 Ruta del webhook configurada:', WEBHOOK_PATH);
if (WEBHOOK_URL) {
    console.log('🔗 URL del webhook:', WEBHOOK_URL);
}

// ========== CONFIGURACIÓN DEL SERVIDOR WEB ==========

// HEALTH CHECK (IMPORTANTE para Railway)
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
            url: WEBHOOK_URL,
            domain: RAILWAY_PUBLIC_DOMAIN
        }
    });
});

// PÁGINA PRINCIPAL
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🤖 El Rey del Huevo - Bot de Administración</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
            body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
            .container { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); border-radius: 20px; padding: 40px; max-width: 800px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); border: 1px solid rgba(255, 255, 255, 0.2); }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 2.8rem; margin-bottom: 10px; background: linear-gradient(45deg, #fff, #f1c40f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .status-badge { display: inline-block; background: #27ae60; color: white; padding: 10px 25px; border-radius: 50px; font-weight: bold; margin: 15px 0; font-size: 1.1rem; animation: pulse 2s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
            .info-card { background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.3s ease; }
            .info-card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            .info-card h3 { color: #f1c40f; margin-bottom: 10px; font-size: 1.3rem; border-bottom: 2px solid rgba(241, 196, 15, 0.3); padding-bottom: 5px; }
            .telegram-button { display: inline-block; background: #0088cc; color: white; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 1.1rem; transition: all 0.3s ease; margin-top: 10px; text-align: center; width: 100%; }
            .telegram-button:hover { background: #0077b5; transform: scale(1.05); }
            .stats { display: flex; justify-content: space-around; flex-wrap: wrap; margin: 30px 0; text-align: center; }
            .stat-item { padding: 15px; }
            .stat-number { font-size: 2.2rem; font-weight: bold; color: #f1c40f; display: block; }
            .stat-label { font-size: 0.9rem; opacity: 0.8; margin-top: 5px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.9rem; opacity: 0.8; }
            code { background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; }
            @media (max-width: 600px) { .container { padding: 20px; } .header h1 { font-size: 2rem; } .info-grid { grid-template-columns: 1fr; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 El Rey del Huevo Bot 🥚</h1>
                <p>Servicio de administración vía Telegram - 24/7</p>
                <div class="status-badge">✅ SISTEMA OPERATIVO</div>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-number">24/7</span>
                    <span class="stat-label">Disponibilidad</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">✅</span>
                    <span class="stat-label">Webhook Activo</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">📦</span>
                    <span class="stat-label">Productos CRUD</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">🚂</span>
                    <span class="stat-label">Railway</span>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <h3>📱 Cómo usar el bot</h3>
                    <p>1. Busca <strong>@ElReyDelHuevoBot</strong> en Telegram</p>
                    <p>2. Envía <code>/start</code> para comenzar</p>
                    <p>3. Usa los botones del menú</p>
                    <p>4. Gestiona productos, categorías y publicaciones</p>
                    <a href="https://t.me/ElReyDelHuevoBot" class="telegram-button" target="_blank">🚀 Abrir en Telegram</a>
                </div>
                
                <div class="info-card">
                    <h3>⚙️ Funciones disponibles</h3>
                    <p>📦 <strong>Gestión de Productos:</strong> CRUD completo</p>
                    <p>📂 <strong>Gestión de Categorías:</strong> Organización</p>
                    <p>📰 <strong>Publicaciones:</strong> Noticias y promociones</p>
                    <p>📊 <strong>Estadísticas:</strong> Reportes avanzados</p>
                    <p>🔐 <strong>Administración:</strong> Panel completo</p>
                </div>
                
                <div class="info-card">
                    <h3>🌐 Información técnica</h3>
                    <p><strong>Servidor:</strong> Railway.app</p>
                    <p><strong>Base de datos:</strong> Firebase Firestore</p>
                    <p><strong>Dominio:</strong> ${RAILWAY_PUBLIC_DOMAIN || 'localhost'}</p>
                    <p><strong>Puerto:</strong> ${PORT}</p>
                    <p><strong>Webhook:</strong> ${WEBHOOK_URL ? '✅ Configurado' : '⚠️ Local'}</p>
                    <p><strong>SSL/TLS:</strong> ✅ Activo (Railway)</p>
                </div>
                
                <div class="info-card">
                    <h3>🏪 Información del negocio</h3>
                    <p><strong>Nombre:</strong> El Rey del Huevo</p>
                    <p><strong>Contacto:</strong> +56950104100</p>
                    <p><strong>Email:</strong> reydelhuevo681@gmail.com</p>
                    <p><strong>Instagram:</strong> @rey_del_huevo</p>
                    <p><strong>Ubicación:</strong> Av. Nueva Koke 1102</p>
                </div>
            </div>
            
            <div class="footer">
                <p>🤖 Bot de Administración - El Rey del Huevo 🥚</p>
                <p>Versión 2.0.0 | Implementado: ${new Date().toLocaleDateString('es-CL')}</p>
                <p>© 2024 El Rey del Huevo. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    res.send(html);
});

// ========== INICIAR EL SERVIDOR ==========

async function startServer() {
    try {
        // Iniciar servidor Express
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Servidor web iniciado en puerto ${PORT}`);
            console.log(`🌐 Página principal: http://localhost:${PORT}/`);
            console.log(`❤️  Health check: http://localhost:${PORT}/health`);
            
            if (RAILWAY_PUBLIC_DOMAIN) {
                console.log(`🚂 Railway URL: https://${RAILWAY_PUBLIC_DOMAIN}`);
                console.log(`🔗 Health check en Railway: https://${RAILWAY_PUBLIC_DOMAIN}/health`);
            }
        });

        // Configuración del webhook para Railway
        if (WEBHOOK_URL) {
            console.log('🔗 Configurando webhook para Railway...');
            
            try {
                // Primero, eliminar cualquier webhook previo
                await bot.telegram.deleteWebhook();
                console.log('✅ Webhook anterior eliminado');
                
                // Configurar el nuevo webhook
                await bot.telegram.setWebhook(WEBHOOK_URL);
                console.log('✅ Webhook configurado exitosamente');
                console.log(`📱 Webhook URL: ${WEBHOOK_URL}`);
                
                // Usar webhook middleware en la ruta específica
                app.use(WEBHOOK_PATH, async (req, res, next) => {
                    try {
                        await bot.handleUpdate(req.body, res);
                    } catch (error) {
                        console.error('Error en webhook handler:', error);
                        res.status(500).send('Error processing update');
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
            console.log('💡 Para producción en Railway, configura RAILWAY_PUBLIC_DOMAIN');
            
            // Iniciar en modo polling (para desarrollo)
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
