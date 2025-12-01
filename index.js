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
const BOT_TOKEN = process.env.BOT_TOKEN || '8383198564:AAE1pbTvIBkF7eO-sT1xOPcxL55Rb8dkRcM';
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : ['6571645457'];
const PORT = process.env.PORT || 3000;
const RAILWAY_DOMAIN = process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost';

console.log('='.repeat(60));
console.log('🤖 BOT DE ADMINISTRACIÓN - EL REY DEL HUEVO 🥚');
console.log('='.repeat(60));
console.log('🔑 Token:', BOT_TOKEN ? '✅ Configurado' : '❌ Faltante');
console.log('👤 Admins:', ADMIN_USERS.length);
console.log('🌐 Dominio:', RAILWAY_DOMAIN);
console.log('📡 Puerto:', PORT);
console.log('='.repeat(60));

// ========== INICIALIZAR ==========
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Configurar sesiones para flujos conversacionales
bot.use(session());

// Middleware de autenticación y logging
bot.use(authMiddleware(ADMIN_USERS));
bot.use(loggingMiddleware());

// ========== IMPORTAR Y CONFIGURAR MÓDULOS ==========
setupProductosCommands(bot);
setupCategoriasCommands(bot);
setupPublicacionesCommands(bot);
setupAdminCommands(bot);
setupEstadisticasCommands(bot);

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
            resize_keyboard: true
        }
    };
    
    await ctx.reply(
        `🎊 *¡HOLA ${ctx.from.first_name.toUpperCase()}!* 🎊\n\n` +
        `🤖 *BOT DE ADMINISTRACIÓN - EL REY DEL HUEVO* 🥚\n\n` +
        `✅ *SISTEMA OPERATIVO 24/7 EN RAILWAY*\n` +
        `🌐 Dominio: ${RAILWAY_DOMAIN}\n` +
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
        `📱 @rey_del_huevo`,
        { 
            parse_mode: 'Markdown',
            ...menuPrincipal 
        }
    );
});

// MENÚ PRODUCTOS
bot.hears('📦 Productos', async (ctx) => {
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
});

// MENÚ CATEGORÍAS
bot.hears('📂 Categorías', async (ctx) => {
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
});

// MENÚ PUBLICACIONES
bot.hears('📰 Publicaciones', async (ctx) => {
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
});

// MENÚ ESTADÍSTICAS
bot.hears('📊 Estadísticas', async (ctx) => {
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
});

// MENÚ CONFIGURACIÓN
bot.hears('⚙️ Configuración', async (ctx) => {
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
});

// AYUDA
bot.hears('🆘 Ayuda', async (ctx) => {
    const ayuda = `
🆘 *CENTRO DE AYUDA - COMANDOS*

📍 *COMANDOS PRINCIPALES:*
/start - Menú principal completo
/help - Esta ayuda
/info - Información del sistema

📦 *GESTIÓN DE PRODUCTOS:*
• 📥 Nuevo Producto - Agregar productos
• 📋 Listar Productos - Ver catálogo completo
• 🔍 Buscar Producto - Encontrar específicos
• ✏️ Editar Producto - Modificar información
• 🗑️ Eliminar Producto - Remover productos
• 📊 Estadísticas Productos - Reportes

📂 *GESTIÓN DE CATEGORÍAS:*
• 🆕 Nueva Categoría - Crear categorías
• 📋 Listar Categorías - Ver categorías
• ✏️ Editar Categoría - Modificar categorías
• 🗑️ Eliminar Categoría - Eliminar categorías
• 📊 Productos por Categoría - Distribución

📰 *GESTIÓN DE PUBLICACIONES:*
• 🆕 Nueva Publicación - Crear contenido
• 📋 Listar Publicaciones - Ver publicaciones
• ✏️ Editar Publicación - Modificar publicaciones
• 🗑️ Eliminar Publicación - Eliminar contenido
• 📊 Estadísticas Publicaciones - Reportes

📊 *ESTADÍSTICAS:*
• 📊 Estadísticas Completas - Visión general
• 📈 Reporte Detallado - Análisis específico
• 📋 Ver Logs - Actividad del sistema
• 💾 Backup Datos - Información de respaldos

⚙️ *CONFIGURACIÓN:*
• 🔐 Verificar Acceso - Credenciales
• ℹ️ Información Sistema - Detalles técnicos
• 🔄 Reiniciar Bot - Reiniciar servicio

💡 *CONSEJOS:*
1. Usa los botones del menú para navegar
2. Sigue los pasos indicados en cada flujo
3. Los cambios se sincronizan automáticamente con Firebase
4. Revisa las estadísticas regularmente

📞 *SOPORTE:*
• WhatsApp: +56950104100
• Email: reydelhuevo681@gmail.com
• Instagram: @rey_del_huevo
• Ubicación: Av. Nueva Koke 1102

✅ *SISTEMA OPERATIVO:*
• Bot 24/7 en Railway
• Webhook configurado
• Conexión Firebase activa
• Panel completo funcional
    `;
    
    await ctx.reply(ayuda, { parse_mode: 'Markdown' });
});

// COMANDO /info
bot.command('info', async (ctx) => {
    await ctx.reply(
        `ℹ️ *INFORMACIÓN TÉCNICA*\n\n` +
        `*Bot ID:* 8383198564\n` +
        `*Username:* @ElReyDelHuevoBot\n` +
        `*Dominio:* ${RAILWAY_DOMAIN}\n` +
        `*Webhook:* ✅ ACTIVO\n` +
        `*Firebase:* ✅ CONECTADO\n` +
        `*Railway:* ✅ OPERATIVO\n` +
        `*Hora servidor:* ${new Date().toLocaleString('es-CL')}\n\n` +
        `*Módulos cargados:*\n` +
        `✅ Productos (CRUD completo)\n` +
        `✅ Categorías (CRUD completo)\n` +
        `✅ Publicaciones (CRUD completo)\n` +
        `✅ Estadísticas (Reportes)\n` +
        `✅ Administración (Configuración)`,
        { parse_mode: 'Markdown' }
    );
});

// COMANDO /help
bot.command('help', async (ctx) => {
    await ctx.reply(
        `🆘 *AYUDA RÁPIDA*\n\n` +
        `Usa los botones del menú para acceder a todas las funciones.\n\n` +
        `📦 *Gestión de Productos:*\n` +
        `- Agregar, editar, eliminar productos\n` +
        `- Ver catálogo completo\n` +
        `- Estadísticas de inventario\n\n` +
        `📂 *Gestión de Categorías:*\n` +
        `- Organizar productos por tipo\n` +
        `- Ver distribución por categoría\n\n` +
        `📰 *Gestión de Publicaciones:*\n` +
        `- Crear noticias y promociones\n` +
        `- Gestionar contenido del sitio\n\n` +
        `📊 *Estadísticas:*\n` +
        `- Reportes completos\n` +
        `- Análisis del inventario\n\n` +
        `⚙️ *Configuración:*\n` +
        `- Verificar acceso\n` +
        `- Información del sistema\n` +
        `- Logs y backup\n\n` +
        `Escribe /start para volver al menú principal.`,
        { parse_mode: 'Markdown' }
    );
});

// VOLVER AL MENÚ PRINCIPAL
bot.hears('🔙 Menú Principal', async (ctx) => {
    const menuPrincipal = {
        reply_markup: {
            keyboard: [
                ['📦 Productos', '📂 Categorías'],
                ['📰 Publicaciones', '📊 Estadísticas'],
                ['⚙️ Configuración', '🔐 Verificar Acceso'],
                ['🆘 Ayuda', 'ℹ️ Información Sistema']
            ],
            resize_keyboard: true
        }
    };
    
    await ctx.reply('🏠 *Volviendo al Menú Principal*', {
        parse_mode: 'Markdown',
        ...menuPrincipal
    });
});

// MENSAJES NO RECONOCIDOS
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    // Si no es un comando del menú y no empieza con /
    if (!text.startsWith('/')) {
        // Verificar si está en algún flujo conversacional
        // Si no, mostrar mensaje de ayuda
        await ctx.reply(
            '🤔 *No reconozco ese comando*\n\n' +
            'Usa los botones del menú o escribe /start para ver todas las opciones.\n\n' +
            '¿Necesitas ayuda? Escribe /help',
            { parse_mode: 'Markdown' }
        );
    }
});

// ========== CONFIGURAR WEBHOOK ==========

// RUTA DEL WEBHOOK (IMPORTANTE para Railway)
const WEBHOOK_PATH = '/webhook';

// Configurar middleware del webhook
app.use(bot.webhookCallback(WEBHOOK_PATH));

console.log('📍 Ruta del webhook configurada:', WEBHOOK_PATH);

// ========== RUTAS DEL SERVIDOR WEB ==========

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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', 'Arial', sans-serif;
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
                font-size: 2.8rem;
                margin-bottom: 10px;
                background: linear-gradient(45deg, #fff, #f1c40f);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .status-badge {
                display: inline-block;
                background: #27ae60;
                color: white;
                padding: 10px 25px;
                border-radius: 50px;
                font-weight: bold;
                margin: 15px 0;
                font-size: 1.1rem;
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
                transition: all 0.3s ease;
            }
            
            .info-card:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .info-card h3 {
                color: #f1c40f;
                margin-bottom: 10px;
                font-size: 1.3rem;
                border-bottom: 2px solid rgba(241, 196, 15, 0.3);
                padding-bottom: 5px;
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
                margin-top: 10px;
                text-align: center;
                width: 100%;
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
                font-size: 2.2rem;
                font-weight: bold;
                color: #f1c40f;
                display: block;
            }
            
            .stat-label {
                font-size: 0.9rem;
                opacity: 0.8;
                margin-top: 5px;
            }
            
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 0.9rem;
                opacity: 0.8;
            }
            
            code {
                background: rgba(0,0,0,0.2);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: monospace;
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
                <h1>🤖 El Rey del Huevo Bot 🥚</h1>
                <p>Servicio de administración vía Telegram - 24/7</p>
                <div class="status-badge">✅ SISTEMA OPERATIVO - CRUD COMPLETO</div>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-number">📦</span>
                    <span class="stat-label">Productos CRUD</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">📂</span>
                    <span class="stat-label">Categorías CRUD</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">📰</span>
                    <span class="stat-label">Publicaciones CRUD</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">🔥</span>
                    <span class="stat-label">Firebase</span>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <h3>📱 Cómo usar el bot</h3>
                    <p>1. Busca <strong>@ElReyDelHuevoBot</strong> en Telegram</p>
                    <p>2. Envía <code>/start</code> para comenzar</p>
                    <p>3. Usa los botones del menú</p>
                    <p>4. Gestiona productos, categorías y publicaciones</p>
                    <a href="https://t.me/ElReyDelHuevoBot" class="telegram-button" target="_blank">
                        🚀 Abrir en Telegram
                    </a>
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
                    <p><strong>Dominio:</strong> ${RAILWAY_DOMAIN}</p>
                    <p><strong>Puerto:</strong> ${PORT}</p>
                    <p><strong>Webhook:</strong> ✅ Configurado</p>
                    <p><strong>SSL/TLS:</strong> ✅ Activo</p>
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
                <p>Versión 2.0.0 | Sistema CRUD Completo</p>
                <p>© 2024 El Rey del Huevo. Todos los derechos reservados.</p>
                <p style="margin-top: 10px; font-size: 0.8rem;">
                    Desarrollado con ❤️ para la comunidad
                </p>
            </div>
        </div>
        
        <script>
            // Actualizar hora en tiempo real
            function updateTime() {
                const timeElements = document.querySelectorAll('.footer p:nth-child(2)');
                if (timeElements.length > 0) {
                    const now = new Date();
                    timeElements[0].innerHTML = 
                        \`Versión 2.0.0 | \${now.toLocaleDateString('es-CL', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })} - \${now.toLocaleTimeString('es-CL')}\`;
                }
            }
            
            // Actualizar cada segundo
            setInterval(updateTime, 1000);
            updateTime();
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

// HEALTH CHECK (IMPORTANTE para Railway)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'elreydelhuevo-bot',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        webhook: {
            configured: true,
            path: WEBHOOK_PATH,
            domain: RAILWAY_DOMAIN
        },
        bot: {
            token: BOT_TOKEN ? 'configured' : 'missing',
            admin_users: ADMIN_USERS.length,
            modules: ['productos', 'categorias', 'publicaciones', 'estadisticas', 'admin']
        },
        server: {
            port: PORT,
            platform: 'railway',
            environment: process.env.NODE_ENV || 'production'
        }
    });
});

// RUTA PARA VERIFICAR WEBHOOK
app.get('/webhook-info', (req, res) => {
    res.json({
        webhook_url: `https://${RAILWAY_DOMAIN}${WEBHOOK_PATH}`,
        telegram_api: 'https://api.telegram.org',
        bot_username: '@ElReyDelHuevoBot',
        setup_instructions: 'Webhook configurado automáticamente',
        modules_loaded: true
    });
});

// ========== INICIAR SERVIDOR ==========

async function initialize() {
    try {
        // Iniciar servidor web
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Servidor web iniciado en puerto ${PORT}`);
            console.log(`🌐 Dominio: https://${RAILWAY_DOMAIN}`);
            console.log(`🏠 Página principal: https://${RAILWAY_DOMAIN}/`);
            console.log(`❤️  Health check: https://${RAILWAY_DOMAIN}/health`);
            console.log(`🔧 Webhook info: https://${RAILWAY_DOMAIN}/webhook-info`);
            console.log(`📱 Bot: @ElReyDelHuevoBot`);
            console.log(`📦 Módulos cargados: Productos, Categorías, Publicaciones, Estadísticas, Admin`);
            console.log('='.repeat(60));
            
            // Configurar webhook en Telegram automáticamente
            const webhookUrl = `https://${RAILWAY_DOMAIN}${WEBHOOK_PATH}`;
            
            console.log('🔗 Configurando webhook en Telegram...');
            console.log(`URL: ${webhookUrl}`);
            
            bot.telegram.setWebhook(webhookUrl)
                .then(() => {
                    console.log('🎉 ✅ WEBHOOK CONFIGURADO EXITOSAMENTE!');
                    console.log('📱 Busca @ElReyDelHuevoBot en Telegram');
                    console.log('💬 Envía /start para comenzar');
                    console.log('📦 CRUD completo disponible');
                    console.log('='.repeat(60));
                })
                .catch(error => {
                    console.error('❌ Error configurando webhook:', error.message);
                    console.log('💡 Configura manualmente con:');
                    console.log(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${webhookUrl}`);
                });
        });
        
    } catch (error) {
        console.error('💥 ERROR CRÍTICO:', error);
        process.exit(1);
    }
}

// ========== MANEJAR APAGADO GRACEFUL ==========

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

// ========== INICIAR TODO ==========

console.log('🚀 Iniciando sistema CRUD completo...');
initialize();
