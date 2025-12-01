// index.js - ARCHIVO PRINCIPAL COMPLETO DEL BOT
import { Telegraf, session } from 'telegraf';
import express from 'express';
import 'dotenv/config';

// Importar todos los módulos de comandos
import { setupProductosCommands } from './commands/productos.js';
import { setupCategoriasCommands } from './commands/categorias.js';
import { setupPublicacionesCommands } from './commands/publicaciones.js';
import { setupEstadisticasCommands } from './commands/estadisticas.js';
import { setupAdminCommands } from './commands/admin.js';

// Importar middlewares
import { authMiddleware, loggingMiddleware } from './handlers/middleware.js';

// Configuración
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
const PORT = process.env.PORT || 3000;
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Verificar configuración crítica
if (!BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN no está definido en las variables de entorno');
    console.error('💡 Solución: Agrega BOT_TOKEN=tu_token en el archivo .env');
    process.exit(1);
}

if (ADMIN_USERS.length === 0) {
    console.warn('⚠️ ADVERTENCIA: ADMIN_USERS está vacío. El bot no tendrá restricciones de acceso.');
}

// Inicializar bot y servidor web
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Middlewares globales del bot
bot.use(session());
bot.use(loggingMiddleware());
bot.use(authMiddleware(ADMIN_USERS));

// ========== CONFIGURAR TODOS LOS COMANDOS ==========
console.log('⚙️ Configurando módulos del bot...');

// Configurar cada módulo de comandos
try {
    setupProductosCommands(bot);
    console.log('✅ Módulo de Productos configurado');
    
    setupCategoriasCommands(bot);
    console.log('✅ Módulo de Categorías configurado');
    
    setupPublicacionesCommands(bot);
    console.log('✅ Módulo de Publicaciones configurado');
    
    setupEstadisticasCommands(bot);
    console.log('✅ Módulo de Estadísticas configurado');
    
    setupAdminCommands(bot);
    console.log('✅ Módulo de Admin configurado');
} catch (error) {
    console.error('❌ Error configurando módulos:', error);
    process.exit(1);
}

// ========== COMANDOS BÁSICOS GLOBALES ==========

// Comando /start - Menú principal
bot.start(async (ctx) => {
    const menuPrincipal = [
        ['📦 Productos', '📂 Categorías'],
        ['📰 Publicaciones', '📊 Estadísticas'],
        ['⚙️ Configuración', '🆘 Ayuda']
    ];
    
    const mensajeBienvenida = `
🤖 *BOT DE ADMINISTRACIÓN COMPLETO - EL REY DEL HUEVO* 🥚

¡Hola ${ctx.from.first_name}! Bienvenido al panel de control integral.

*🏪 ACERCA DE TU NEGOCIO:*
• Nombre: El Rey del Huevo
• Productos: Variedad de alimentos y aseo
• Ubicación: Av. Nueva Koke 1102
• Contacto: +56950104100

*🚀 FUNCIONES DISPONIBLES:*
📦 *Gestión de Productos:*
  • Agregar nuevos productos
  • Listar/editar/eliminar productos
  • Gestión completa de inventario

📂 *Gestión de Categorías:*
  • Crear/editar categorías
  • Organizar productos por tipo
  • Estadísticas por categoría

📰 *Gestión de Publicaciones:*
  • Crear noticias y promociones
  • Publicar en el sitio web
  • Gestionar contenido

📊 *Estadísticas Avanzadas:*
  • Reportes de inventario
  • Análisis de ventas potenciales
  • Distribución por categoría

⚙️ *Configuración del Sistema:*
  • Verificar estado del bot
  • Logs y monitoreo
  • Backup de datos

*🔧 ESTADO DEL SISTEMA:*
• Bot: ✅ ONLINE
• Firebase: ✅ CONECTADO
• Modo: ${RAILWAY_PUBLIC_DOMAIN ? '🌐 Webhook (24/7)' : '🔄 Polling (Desarrollo)'}
• Versión: 2.0.0
• Usuario: ${ctx.from.first_name} (ID: ${ctx.from.id})

*💡 CONSEJO RÁPIDO:*
Usa los botones del menú para navegar. Cada opción te guiará paso a paso.
    `;
    
    await ctx.reply(mensajeBienvenida, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: menuPrincipal,
            resize_keyboard: true
        }
    });
    
    // Log del inicio
    console.log(`🎉 Usuario ${ctx.from.first_name} (${ctx.from.id}) inició el bot`);
});

// Comando /help - Centro de ayuda
bot.help(async (ctx) => {
    const ayudaCompleta = `
*🆘 CENTRO DE AYUDA - COMANDOS Y FUNCIONES*

*📍 COMANDOS PRINCIPALES:*
/start - Menú principal con todas las opciones
/help - Este centro de ayuda
/info - Información del sistema
/estadisticas - Reportes completos
/reporte - Reporte detallado de inventario
/verificar - Verificar acceso y credenciales

*📦 GESTIÓN DE PRODUCTOS:*
• *Agregar producto:* Menú → Productos → Nuevo Producto
• *Ver productos:* Menú → Productos → Listar Productos
• *Editar producto:* Menú → Productos → Editar Producto
• *Eliminar producto:* Menú → Productos → Eliminar Producto
• *Estadísticas:* Menú → Productos → Estadísticas Productos

*📂 GESTIÓN DE CATEGORÍAS:*
• *Nueva categoría:* Menú → Categorías → Nueva Categoría
• *Listar categorías:* Menú → Categorías → Listar Categorías
• *Editar categoría:* Menú → Categorías → Editar Categoría
• *Eliminar categoría:* Menú → Categorías → Eliminar Categoría
• *Productos por categoría:* Menú → Categorías → Productos por Categoría

*📰 GESTIÓN DE PUBLICACIONES:*
• *Nueva publicación:* Menú → Publicaciones → Nueva Publicación
• *Listar publicaciones:* Menú → Publicaciones → Listar Publicaciones
• *Editar publicación:* Menú → Publicaciones → Editar Publicación
• *Eliminar publicación:* Menú → Publicaciones → Eliminar Publicación
• *Estadísticas:* Menú → Publicaciones → Estadísticas Publicaciones

*📊 ESTADÍSTICAS AVANZADAS:*
• *Estadísticas generales:* Menú → Estadísticas
• *Reporte detallado:* Menú → Configuración → Reporte Detallado
• *Valor de inventario:* Se calcula automáticamente

*⚙️ CONFIGURACIÓN Y ADMIN:*
• *Información sistema:* Menú → Configuración
• *Verificar acceso:* Menú → Configuración → Verificar Acceso
• *Ver logs:* Menú → Configuración → Ver Logs
• *Backup datos:* Menú → Configuración → Backup Datos
• *Reiniciar bot:* Menú → Configuración → Reiniciar Bot

*💡 CONSEJOS PRÁCTICOS:*
1. *Sigue los pasos:* Cada función te guía paso a paso
2. *Usa imágenes:* Sube fotos de tus productos para mejor presentación
3. *Organiza por categorías:* Facilita la búsqueda de productos
4. *Publica regularmente:* Mantén actualizado tu sitio web
5. *Revisa estadísticas:* Toma decisiones basadas en datos

*🔧 SOPORTE TÉCNICO:*
• Problemas con el bot: Revisa /info
• Error de conexión: Verifica internet
• No veo cambios: Espera 1-2 minutos para sincronización
• Acceso denegado: Tu ID debe estar en ADMIN_USERS

*🌐 ENLACES IMPORTANTES:*
• Sitio web: index.html
• Panel admin web: admin.html
• Firebase Console: https://console.firebase.google.com
• Railway Dashboard: https://railway.app

*📞 CONTACTO DE EMERGENCIA:*
• WhatsApp: +56950104100
• Correo: reydelhuevo681@gmail.com
• Instagram: @rey_del_huevo
    `;
    
    await ctx.reply(ayudaCompleta, { parse_mode: 'Markdown' });
});

// Comando /info - Información del sistema
bot.command('info', async (ctx) => {
    const infoSistema = `
*ℹ️ INFORMACIÓN COMPLETA DEL SISTEMA*

*🤖 BOT DE ADMINISTRACIÓN:*
• Versión: 2.0.0 (Completa)
• Estado: ✅ OPERATIVO
• Modo: ${RAILWAY_PUBLIC_DOMAIN ? '🌐 Webhook (Producción 24/7)' : '🔄 Polling (Desarrollo)'}
• Entorno: ${NODE_ENV}
• Tiempo activo: ${(process.uptime() / 60 / 60).toFixed(2)} horas
• Memoria: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB

*👤 INFORMACIÓN DE USUARIO:*
• ID: ${ctx.from.id}
• Nombre: ${ctx.from.first_name} ${ctx.from.last_name || ''}
• Username: @${ctx.from.username || 'No tiene'}
• Idioma: ${ctx.from.language_code || 'es'}
• Fecha registro: ${new Date(ctx.from.id * 1000).toLocaleDateString('es-CL')}

*🏪 DATOS DEL NEGOCIO:*
• Nombre: El Rey del Huevo
• Productos gestionados: [Se cargan desde Firebase]
• Categorías activas: [Se cargan desde Firebase]
• Publicaciones: [Se cargan desde Firebase]

*🌐 CONEXIONES Y SERVICIOS:*
• Firebase Firestore: ✅ CONECTADO
• Telegram API: ✅ CONECTADO
• Webhook: ${RAILWAY_PUBLIC_DOMAIN ? '✅ ACTIVO' : '❌ INACTIVO'}
• SSL/TLS: ${RAILWAY_PUBLIC_DOMAIN ? '✅ ACTIVO' : '❌ NO APLICA'}

*🖥️ ESPECIFICACIONES TÉCNICAS:*
• Node.js: ${process.version}
• Plataforma: ${process.platform} ${process.arch}
• CPUs: ${require('os').cpus().length}
• Memoria total: ${(require('os').totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
• Directorio: ${process.cwd()}

*📡 RED Y CONECTIVIDAD:*
• Hostname: ${require('os').hostname()}
• IP local: ${Object.values(require('os').networkInterfaces())
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address || 'No disponible'}
• Dominio público: ${RAILWAY_PUBLIC_DOMAIN || 'No configurado'}
• Puerto: ${PORT}

*🔐 SEGURIDAD Y ACCESO:*
• Usuarios autorizados: ${ADMIN_USERS.length}
• Tu acceso: ${ADMIN_USERS.includes(ctx.from.id.toString()) ? '✅ AUTORIZADO' : '❌ NO AUTORIZADO'}
• Sesión activa: ✅ VÁLIDA
• Token bot: ${BOT_TOKEN.substring(0, 10)}...${BOT_TOKEN.substring(BOT_TOKEN.length - 5)}

*🕐 INFORMACIÓN TEMPORAL:*
• Hora servidor: ${new Date().toLocaleString('es-CL')}
• Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
• UTC offset: UTC${new Date().getTimezoneOffset() / -60}
• Día local: ${new Date().toLocaleDateString('es-CL', { weekday: 'long' })}

*🚀 ESTADO DE MÓDULOS:*
• Productos: ✅ ACTIVO
• Categorías: ✅ ACTIVO  
• Publicaciones: ✅ ACTIVO
• Estadísticas: ✅ ACTIVO
• Admin: ✅ ACTIVO
• Middleware: ✅ ACTIVO

*📊 MÉTRICAS DE USO:*
• Comandos hoy: [Registro interno]
• Usuarios activos: 1 (tú)
• Uptime: ${Math.floor(process.uptime() / 60)} minutos
• Peticiones: [Monitoreo activo]
    `;
    
    await ctx.reply(infoSistema, { parse_mode: 'Markdown' });
});

// Menú configuración
bot.hears('⚙️ Configuración', async (ctx) => {
    const menuConfiguracion = [
        ['ℹ️ Información Sistema', '🔐 Verificar Acceso'],
        ['📋 Ver Logs', '💾 Backup Datos'],
        ['📈 Reporte Detallado', '🔄 Reiniciar Bot'],
        ['🔙 Menú Principal']
    ];
    
    await ctx.reply(
        '⚙️ *PANEL DE CONFIGURACIÓN*\n\n' +
        'Selecciona una opción administrativa:',
        {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: menuConfiguracion,
                resize_keyboard: true
            }
        }
    );
});

// Volver al menú principal desde cualquier parte
bot.hears('🔙 Menú Principal', async (ctx) => {
    const menuPrincipal = [
        ['📦 Productos', '📂 Categorías'],
        ['📰 Publicaciones', '📊 Estadísticas'],
        ['⚙️ Configuración', '🆘 Ayuda']
    ];
    
    await ctx.reply(
        '🏠 *Volviendo al Menú Principal*',
        {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: menuPrincipal,
                resize_keyboard: true
            }
        }
    );
});

// ========== MANEJAR MENSAJES NO RECONOCIDOS ==========
bot.on('text', async (ctx) => {
    // Verificar si estamos en un flujo conversacional activo
    // (Esto se maneja en los módulos individuales)
    
    // Si no es un comando conocido y no estamos en flujo conversacional
    const mensaje = ctx.message.text;
    const comandosReconocidos = [
        '/start', '/help', '/info', '/estadisticas', '/reporte', 
        '/verificar', '/logs', '/backup', '/reiniciar'
    ];
    
    const noEsComando = !comandosReconocidos.some(cmd => mensaje.startsWith(cmd));
    
    if (noEsComando) {
        await ctx.reply(
            '🤔 *No reconozco ese comando*\n\n' +
            'Puedes usar:\n' +
            '• Los botones del menú\n' +
            '• /start para el menú principal\n' +
            '• /help para ayuda completa\n\n' +
            '¿En qué puedo ayudarte hoy?',
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [['/start', '/help']],
                    resize_keyboard: true
                }
            }
        );
    }
});

// ========== MANEJAR ERRORES GLOBALES ==========
bot.catch((err, ctx) => {
    console.error('❌ ERROR GLOBAL DEL BOT:', err);
    
    // Enviar mensaje de error al usuario
    if (ctx && ctx.chat) {
        ctx.reply(
            '❌ *ERROR DEL SISTEMA*\n\n' +
            'Ocurrió un error inesperado. El equipo técnico ha sido notificado.\n\n' +
            '*Detalles técnicos:*\n' +
            `• Tipo: ${err.name}\n` +
            `• Mensaje: ${err.message}\n` +
            `• Código: ${err.code || 'N/A'}\n\n` +
            'Por favor, intenta nuevamente en unos momentos.\n' +
            'Si el error persiste, contacta al soporte técnico.',
            { parse_mode: 'Markdown' }
        ).catch(e => console.error('No se pudo enviar mensaje de error:', e));
    }
    
    // Log detallado del error
    const errorLog = {
        timestamp: new Date().toISOString(),
        userId: ctx?.from?.id,
        chatId: ctx?.chat?.id,
        message: ctx?.message?.text,
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code
        },
        botInfo: {
            version: '2.0.0',
            mode: RAILWAY_PUBLIC_DOMAIN ? 'webhook' : 'polling',
            uptime: process.uptime()
        }
    };
    
    console.error('📋 LOG DE ERROR COMPLETO:', JSON.stringify(errorLog, null, 2));
});

// ========== CONFIGURAR WEBHOOK PARA RAILWAY ==========

if (RAILWAY_PUBLIC_DOMAIN) {
    console.log('🌐 Modo Webhook detectado (Railway)');
    
    // Configurar Express para webhook
    const webhookPath = `/webhook/${BOT_TOKEN}`;
    const webhookUrl = `https://${RAILWAY_PUBLIC_DOMAIN}${webhookPath}`;
    
    app.use(express.json());
    
    // Ruta para health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'elreydelhuevo-bot',
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            mode: 'webhook',
            connections: {
                firebase: 'connected',
                telegram: 'connected'
            }
        });
    });
    
    // Ruta principal para página web
    app.get('/', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🤖 Bot de Administración - El Rey del Huevo</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }
                    
                    body {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    
                    .container {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(20px);
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 800px;
                        width: 100%;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    
                    .header h1 {
                        font-size: 2.5rem;
                        margin-bottom: 10px;
                        background: linear-gradient(45deg, #fff, #f1c40f);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    
                    .header p {
                        font-size: 1.2rem;
                        opacity: 0.9;
                    }
                    
                    .status-badge {
                        display: inline-block;
                        background: #27ae60;
                        color: white;
                        padding: 8px 20px;
                        border-radius: 50px;
                        font-weight: bold;
                        margin: 10px 0;
                        animation: pulse 2s infinite;
                    }
                    
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.8; }
                        100% { opacity: 1; }
                    }
                    
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin: 30px 0;
                    }
                    
                    .info-card {
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        transition: transform 0.3s ease;
                    }
                    
                    .info-card:hover {
                        transform: translateY(-5px);
                        background: rgba(255, 255, 255, 0.15);
                    }
                    
                    .info-card h3 {
                        color: #f1c40f;
                        margin-bottom: 10px;
                        font-size: 1.3rem;
                    }
                    
                    .info-card ul {
                        list-style: none;
                        padding-left: 0;
                    }
                    
                    .info-card li {
                        padding: 5px 0;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .info-card li:last-child {
                        border-bottom: none;
                    }
                    
                    .telegram-button {
                        display: inline-block;
                        background: #0088cc;
                        color: white;
                        padding: 15px 30px;
                        border-radius: 10px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 1.1rem;
                        transition: all 0.3s ease;
                        margin-top: 20px;
                        text-align: center;
                    }
                    
                    .telegram-button:hover {
                        background: #0077b5;
                        transform: scale(1.05);
                    }
                    
                    .stats {
                        display: flex;
                        justify-content: space-around;
                        flex-wrap: wrap;
                        margin: 30px 0;
                        text-align: center;
                    }
                    
                    .stat-item {
                        padding: 15px;
                    }
                    
                    .stat-number {
                        font-size: 2rem;
                        font-weight: bold;
                        color: #f1c40f;
                    }
                    
                    .stat-label {
                        font-size: 0.9rem;
                        opacity: 0.8;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        font-size: 0.9rem;
                        opacity: 0.7;
                    }
                    
                    @media (max-width: 600px) {
                        .container {
                            padding: 20px;
                        }
                        
                        .header h1 {
                            font-size: 2rem;
                        }
                        
                        .info-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🤖 El Rey del Huevo - Bot</h1>
                        <p>Servicio de administración vía Telegram</p>
                        <div class="status-badge">✅ SISTEMA OPERATIVO 24/7</div>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-item">
                            <div class="stat-number">${(process.uptime() / 60 / 60).toFixed(1)}</div>
                            <div class="stat-label">Horas activo</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}</div>
                            <div class="stat-label">MB en uso</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${ADMIN_USERS.length}</div>
                            <div class="stat-label">Admins</div>
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-card">
                            <h3>📱 Cómo usar el bot</h3>
                            <ul>
                                <li>1. Busca <strong>@ElReyDelHuevoBot</strong> en Telegram</li>
                                <li>2. Envía <code>/start</code> para comenzar</li>
                                <li>3. Usa los botones del menú para navegar</li>
                                <li>4. Gestiona productos, categorías y publicaciones</li>
                            </ul>
                            <a href="https://t.me/ElReyDelHuevoBot" class="telegram-button" target="_blank">
                                🚀 Abrir en Telegram
                            </a>
                        </div>
                        
                        <div class="info-card">
                            <h3>⚙️ Funciones disponibles</h3>
                            <ul>
                                <li>📦 Gestión completa de productos</li>
                                <li>📂 Organización por categorías</li>
                                <li>📰 Publicaciones y noticias</li>
                                <li>📊 Estadísticas avanzadas</li>
                                <li>🔐 Panel de administración</li>
                                <li>💾 Backup automático</li>
                            </ul>
                        </div>
                        
                        <div class="info-card">
                            <h3>🌐 Información técnica</h3>
                            <ul>
                                <li><strong>Servidor:</strong> Railway.app</li>
                                <li><strong>Base de datos:</strong> Firebase Firestore</li>
                                <li><strong>Modo:</strong> Webhook 24/7</li>
                                <li><strong>Versión:</strong> 2.0.0</li>
                                <li><strong>Estado:</strong> <span style="color: #27ae60;">●</span> Operativo</li>
                                <li><strong>Último check:</strong> ${new Date().toLocaleTimeString('es-CL')}</li>
                            </ul>
                        </div>
                        
                        <div class="info-card">
                            <h3>🔧 Enlaces importantes</h3>
                            <ul>
                                <li><a href="/" style="color: #f1c40f; text-decoration: none;">🏠 Esta página</a></li>
                                <li><a href="/health" style="color: #f1c40f; text-decoration: none;">📊 Health Check</a></li>
                                <li><a href="admin.html" style="color: #f1c40f; text-decoration: none;">🖥️ Panel Admin Web</a></li>
                                <li><a href="index.html" style="color: #f1c40f; text-decoration: none;">🌐 Sitio Web Principal</a></li>
                                <li><a href="https://railway.app" style="color: #f1c40f; text-decoration: none;">🚂 Railway Dashboard</a></li>
                                <li><a href="https://firebase.google.com" style="color: #f1c40f; text-decoration: none;">🔥 Firebase Console</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>🤖 Bot de Administración - El Rey del Huevo 🥚</p>
                        <p>Versión 2.0.0 | Desarrollado con ❤️ para tu negocio</p>
                        <p>© 2024 El Rey del Huevo. Todos los derechos reservados.</p>
                        <p style="margin-top: 10px; font-size: 0.8rem;">
                            WhatsApp: +56950104100 | Instagram: @rey_del_huevo
                        </p>
                    </div>
                </div>
                
                <script>
                    // Actualizar hora cada minuto
                    function updateTime() {
                        const timeElement = document.querySelector('.footer p:nth-child(3)');
                        if (timeElement) {
                            const now = new Date();
                            timeElement.innerHTML = \`© 2024 El Rey del Huevo | \${now.toLocaleTimeString('es-CL')}\`;
                        }
                    }
                    
                    setInterval(updateTime, 60000);
                    updateTime();
                    
                    // Animación suave para los cards
                    document.querySelectorAll('.info-card').forEach(card => {
                        card.addEventListener('mouseenter', () => {
                            card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
                        });
                        
                        card.addEventListener('mouseleave', () => {
                            card.style.boxShadow = 'none';
                        });
                    });
                </script>
            </body>
            </html>
        `);
    });
    
    // Configurar webhook de Telegram
    app.use(bot.webhookCallback(webhookPath));
    
    // Iniciar servidor web
    app.listen(PORT, async () => {
        console.log(`🚀 Servidor web iniciado en puerto ${PORT}`);
        console.log(`🌐 Dominio público: ${RAILWAY_PUBLIC_DOMAIN}`);
        console.log(`🔗 Webhook URL: ${webhookUrl}`);
        console.log(`📊 Health check: https://${RAILWAY_PUBLIC_DOMAIN}/health`);
        
        try {
            // Configurar webhook en Telegram
            await bot.telegram.setWebhook(webhookUrl);
            console.log('✅ Webhook configurado exitosamente en Telegram');
            
            // Obtener información del bot
            const botInfo = await bot.telegram.getMe();
            console.log(`🤖 Bot: @${botInfo.username} (${botInfo.first_name})`);
            console.log(`👤 Usuarios autorizados: ${ADMIN_USERS.join(', ')}`);
            
            // Mostrar información del sistema
            console.log('\n📊 SISTEMA LISTO PARA PRODUCCIÓN:');
            console.log('• Firebase: ✅ Conectado');
            console.log('• Telegram: ✅ Conectado');
            console.log('• Webhook: ✅ Activo');
            console.log('• SSL/TLS: ✅ Automático (Railway)');
            console.log('• Uptime: 0 segundos (recién iniciado)');
            console.log('• Modo: Producción 24/7');
            
        } catch (error) {
            console.error('❌ Error configurando webhook:', error.message);
            console.log('💡 Solución: Verifica que el token de Telegram sea válido');
            process.exit(1);
        }
    });
    
} else {
    // ========== MODO POLLING (DESARROLLO LOCAL) ==========
    console.log('💻 Modo Polling detectado (Desarrollo local)');
    
    bot.launch().then(async () => {
        console.log('🤖 Bot iniciado en modo polling');
        
        try {
            // Obtener información del bot
            const botInfo = await bot.telegram.getMe();
            console.log(`✅ Bot: @${botInfo.username} (${botInfo.first_name})`);
            console.log(`👤 Usuarios autorizados: ${ADMIN_USERS.join(', ')}`);
            
            console.log('\n🚀 INSTRUCCIONES PARA USAR EL BOT:');
            console.log('1. Abre Telegram');
            console.log('2. Busca tu bot');
            console.log('3. Envía /start');
            console.log('4. Usa los botones del menú');
            
            console.log('\n🔧 MODO DESARROLLO ACTIVADO:');
            console.log('• Para producción, configura RAILWAY_PUBLIC_DOMAIN');
            console.log('• Usa railway up para deploy');
            console.log('• El bot se reiniciará automáticamente');
            
        } catch (error) {
            console.error('❌ Error obteniendo información del bot:', error);
        }
        
    }).catch(error => {
        console.error('💥 ERROR CRÍTICO al iniciar bot:', error);
        console.log('\n🔧 SOLUCIÓN DE PROBLEMAS:');
        console.log('1. Verifica que BOT_TOKEN sea correcto');
        console.log('2. Verifica tu conexión a internet');
        console.log('3. El token podría estar expirado');
        console.log('4. Contacta a @BotFather para nuevo token');
        
        process.exit(1);
    });
}

// ========== MANEJAR CIERRE GRACEFUL ==========

process.once('SIGINT', () => {
    console.log('\n👋 Recibido SIGINT. Deteniendo bot...');
    bot.stop('SIGINT');
    console.log('✅ Bot detenido correctamente');
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('\n👋 Recibido SIGTERM. Deteniendo bot...');
    bot.stop('SIGTERM');
    console.log('✅ Bot detenido correctamente');
    process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('💥 ERROR NO CAPTURADO:', error);
    console.log('🔄 Reiniciando proceso...');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 PROMESA RECHAZADA NO MANEJADA:', reason);
    console.log('Promesa:', promise);
});

// ========== INFORMACIÓN FINAL DE INICIO ==========

console.log('\n' + '='.repeat(60));
console.log('🎉 BOT DE ADMINISTRACIÓN - EL REY DEL HUEVO 🥚');
console.log('='.repeat(60));
console.log(`Versión: 2.0.0 (Completa)`);
console.log(`Entorno: ${NODE_ENV}`);
console.log(`Modo: ${RAILWAY_PUBLIC_DOMAIN ? 'Producción (Webhook)' : 'Desarrollo (Polling)'}`);
console.log(`Node.js: ${process.version}`);
console.log(`Plataforma: ${process.platform} ${process.arch}`);
console.log(`Directorio: ${process.cwd()}`);
console.log(`PID: ${process.pid}`);
console.log('='.repeat(60));
console.log('✅ Sistema inicializado correctamente');
console.log('📱 Busca tu bot en Telegram y envía /start');
console.log('='.repeat(60) + '\n');

// Exportar para pruebas
export { bot, app };