import express from 'express';
import cors from 'cors';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.PLAYWRIGHT_PORT || 3001;
const AIWA_WEBHOOK_URL = process.env.AIWA_WEBHOOK_URL || 'http://127.0.0.1:8000/api/webhooks/playwright';
const STORAGE_DIR = path.resolve(__dirname, 'storage', 'playwright_auth');
const MEDIA_DIR = path.resolve(__dirname, 'storage', 'media');
const HEADLESS = process.env.HEADLESS === 'true'; // Default is FALSE (Headed) to override laptop screen visibly

// Ensure directories exist
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Locate installed Chrome or Edge executable on Windows
function findBrowserExecutable() {
    const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

const BROWSER_EXECUTABLE = findBrowserExecutable();
logger.info(`Using Browser Executable: ${BROWSER_EXECUTABLE || 'System Default'}`);

// In-memory sessions map
// sessionId -> { context, page, status: 'starting'|'qr_ready'|'connected'|'disconnected', qrDataUrl, userPhone, processedMessageIds }
const sessions = new Map();

/**
 * Format phone to clean international number
 */
function cleanPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
}

/**
 * Send event to AIWA webhook
 */
async function sendToWebhook(payload) {
    try {
        const response = await fetch(AIWA_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.text();
        logger.info(`Webhook sent to AIWA [${payload.event}]: status=${response.status} response=${data.substring(0, 100)}`);
    } catch (err) {
        logger.error(`Failed to send event to AIWA webhook (${AIWA_WEBHOOK_URL}): ${err.message}`);
    }
}

/**
 * Anti-detect stealth injection for WhatsApp Web
 */
async function injectAntiDetection(page) {
    await page.addInitScript(() => {
        // 1. Hide navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });

        // 2. Mock chrome runtime
        window.chrome = {
            runtime: {
                connect: () => {},
                sendMessage: () => {},
            },
            loadTimes: () => {},
            csi: () => {},
            app: {
                isInstalled: false,
                InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
                RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
            }
        };

        // 3. Mock languages and plugins
        Object.defineProperty(navigator, 'languages', {
            get: () => ['id-ID', 'id', 'en-US', 'en'],
        });

        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
            ],
        });

        // 4. Preserve standard notifications permission
        const originalQuery = window.navigator.permissions?.query;
        if (originalQuery) {
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        }
    });
}

/**
 * Initialize Playwright browser session for channel
 */
async function initSession(sessionId) {
    if (sessions.has(sessionId)) {
        const existing = sessions.get(sessionId);
        if (existing.page && !existing.page.isClosed()) {
            return existing;
        }
    }

    // Check if any other session is already holding Chrome
    for (const [id, s] of sessions.entries()) {
        if (s.page && !s.page.isClosed()) {
            logger.info(`[PLAYWRIGHT] Browser already active under session [${id}]. Reusing for [${sessionId}]...`);
            return s;
        }
    }

    const sessionDir = path.join(STORAGE_DIR, sessionId);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Clean stale lockfiles that cause Chromium "Opening in existing browser session" error
    const lockFiles = ['lockfile', 'SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    for (const lf of lockFiles) {
        const fp = path.join(sessionDir, lf);
        if (fs.existsSync(fp)) {
            try {
                fs.unlinkSync(fp);
                logger.info(`[PLAYWRIGHT] Removed stale lock: ${fp}`);
            } catch (e) {}
        }
    }

    const sessionData = {
        sessionId,
        context: null,
        page: null,
        status: 'starting',
        qrDataUrl: null,
        userPhone: null,
        monitoringInterval: null,
        processedMessageIds: new Set(),
    };
    sessions.set(sessionId, sessionData);

    try {
        logger.info(`[PLAYWRIGHT] Launching Chrome persistent context for [${sessionId}] in ${HEADLESS ? 'HEADLESS' : 'HEADED (OVERRIDE LAPTOP)'} mode...`);

        const context = await chromium.launchPersistentContext(sessionDir, {
            executablePath: BROWSER_EXECUTABLE,
            headless: HEADLESS,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--no-default-browser-check',
                '--no-first-run',
                '--start-maximized',
                '--disable-popup-blocking',
                '--window-size=1366,768'
            ],
            viewport: null, // Full native window size
            ignoreDefaultArgs: ['--enable-automation']
        });

        sessionData.context = context;
        const pages = context.pages();
        const page = pages.length > 0 ? pages[0] : await context.newPage();
        sessionData.page = page;

        await injectAntiDetection(page);

        logger.info(`[PLAYWRIGHT] Navigating to https://web.whatsapp.com for [${sessionId}]...`);
        await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Setup session monitoring and QR code listener
        startSessionWatcher(sessionData);

        return sessionData;
    } catch (err) {
        logger.error(`[PLAYWRIGHT] Failed to initialize session [${sessionId}]: ${err.message}`);
        sessionData.status = 'disconnected';
        sessionData.error = err.message;
        return sessionData;
    }
}

/**
 * Watcher for QR code scanning, login state, popup dismissal, and unread inbound messages
 */
async function startSessionWatcher(sessionData) {
    const { page, sessionId } = sessionData;

    const checkInterval = setInterval(async () => {
        if (!page || page.isClosed()) {
            clearInterval(checkInterval);
            sessionData.status = 'disconnected';
            return;
        }

        try {
            // 1. Auto-dismiss any blocking WhatsApp Web dialog (e.g. "Apa yang baru di WhatsApp Web", "Nyalakan notifikasi", etc.)
            await page.evaluate(() => {
                const dialog = document.querySelector('div[role="dialog"]');
                if (dialog) {
                    const closeBtn = dialog.querySelector('button[aria-label="Tutup" i], button[aria-label="Close" i], button[data-testid*="close" i]') ||
                                    Array.from(dialog.querySelectorAll('button, div[role="button"]')).find(b => /lanjut|tutup|close|continue|oke|ok/i.test(b.innerText));
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }).catch(() => {});

            // 2. Check if already logged in (#pane-side or chat list exists)
            const isLoggedIn = await page.evaluate(() => {
                const pane = document.querySelector('#pane-side') || 
                             document.querySelector('div[aria-label="Chat list"]') ||
                             document.querySelector('div[aria-label="Daftar chat"]') ||
                             document.querySelector('header span[data-icon="menu"]');
                return !!pane;
            }).catch(() => false);

            if (isLoggedIn) {
                if (sessionData.status !== 'connected') {
                    sessionData.status = 'connected';
                    sessionData.qrDataUrl = null;
                    logger.info(`[PLAYWRIGHT] Session [${sessionId}] connected to WhatsApp Web successfully!`);

                    // Try to extract user phone from localStorage or app state
                    try {
                        const userPhone = await page.evaluate(() => {
                            try {
                                const wid = localStorage.getItem('last-wid-md');
                                if (wid) {
                                    return wid.split('@')[0].split(':')[0].replace(/\D/g, '');
                                }
                            } catch (e) {}
                            return null;
                        });
                        if (userPhone) {
                            sessionData.userPhone = userPhone;
                        }
                    } catch (e) {}

                    await sendToWebhook({
                        event: 'session_connected',
                        sessionId,
                        provider: 'playwright',
                        userPhone: sessionData.userPhone,
                        timestamp: Math.floor(Date.now() / 1000)
                    });
                }

                // 3. Scan for messages in ACTIVE chat AND UNREAD chats in pane-side
                await scanForMessages(sessionData);

            } else {
                // Not yet logged in: Check for QR Code canvas or reload button
                try {
                    // Check and auto-reload expired QR code if overlay button appears
                    await page.evaluate(() => {
                        const qrContainer = document.querySelector('div[data-testid="qrcode"], div._akau, div._akav');
                        if (qrContainer) {
                            const btn = qrContainer.querySelector('button, [role="button"], span[data-icon="refresh"]') ||
                                        Array.from(qrContainer.querySelectorAll('*')).find(el => /muat ulang|reload|click to reload|pindai ulang/i.test(el.innerText || ''));
                            if (btn && btn.click) {
                                btn.click();
                            }
                        }
                    }).catch(() => {});
                    await page.waitForTimeout(500);

                    const qrCanvas = await page.$('canvas');
                    if (qrCanvas) {
                        const dataUrl = await page.evaluate(() => {
                            const canvas = document.querySelector('canvas');
                            return canvas ? canvas.toDataURL('image/png') : null;
                        });
                        if (dataUrl) {
                            sessionData.status = 'qr_ready';
                            if (dataUrl !== sessionData.qrDataUrl) {
                                sessionData.qrDataUrl = dataUrl;
                                logger.info(`[PLAYWRIGHT] Captured QR code for session [${sessionId}]`);
                                await sendToWebhook({
                                    event: 'qr_code',
                                    sessionId,
                                    provider: 'playwright',
                                    qrDataUrl: dataUrl
                                });
                            }
                        }
                    } else {
                        if (sessionData.status !== 'connected') {
                            sessionData.status = 'starting';
                        }
                    }
                } catch (qrErr) {
                    logger.debug(`QR evaluation error: ${qrErr.message}`);
                }
            }
        } catch (err) {
            logger.debug(`Watcher error in [${sessionId}]: ${err.message}`);
        }
    }, 2000);

    sessionData.monitoringInterval = checkInterval;
}

/**
 * Scan for messages in both ACTIVE chat (#main) and unread chats in left panel (#pane-side)
 */
async function scanForMessages(sessionData) {
    const { page, sessionId } = sessionData;
    if (!page || page.isClosed()) return;

    try {
        // --- STEP A: Check the currently open active chat (#main) ---
        const activeChatResult = await page.evaluate(() => {
            const main = document.querySelector('#main');
            if (!main) return null;

            // Get header title / contact phone
            const header = main.querySelector('header');
            const contactTitle = header?.querySelector('span[dir="auto"], span[title]')?.getAttribute('title') || 
                                header?.innerText?.split('\n')[0] || '';

            // Get all message bubbles
            const copyables = Array.from(main.querySelectorAll('div.copyable-text'));
            if (copyables.length === 0) return null;

            // Detect bot/self name if any message has checkmarks
            let detectedSelfName = null;
            for (let i = copyables.length - 1; i >= 0; i--) {
                const c = copyables[i];
                const bubble = c.closest('div[role="row"], div.message-out, div.message-in') || c.parentElement;
                const hasCheck = !!bubble?.querySelector('span[data-icon*="check"], span[data-icon="msg-time"]');
                if (hasCheck) {
                    const pre = c.getAttribute('data-pre-plain-text') || '';
                    const match = pre.match(/\]\s*([^:]+):/);
                    if (match && match[1]) {
                        detectedSelfName = match[1].trim();
                        break;
                    }
                }
            }

            const lastCopyable = copyables[copyables.length - 1];
            const prePlain = lastCopyable.getAttribute('data-pre-plain-text') || '';

            // Cleanly isolate actual user message from any WhatsApp Web quote preview container
            let text = '';
            let quotedText = null;

            const quoteEl = lastCopyable.querySelector('div[data-testid="quoted-message"], div[aria-label*="kutipan" i], div[aria-label*="quoted" i], div._amkd, div._amke, div[role="button"][tabindex="-1"]');
            if (quoteEl) {
                quotedText = quoteEl.innerText ? quoteEl.innerText.trim() : null;
                const clone = lastCopyable.cloneNode(true);
                const cloneQuote = clone.querySelector('div[data-testid="quoted-message"], div[aria-label*="kutipan" i], div[aria-label*="quoted" i], div._amkd, div._amke, div[role="button"][tabindex="-1"]');
                if (cloneQuote) cloneQuote.remove();
                text = clone.innerText ? clone.innerText.trim() : '';
            } else {
                text = lastCopyable.innerText ? lastCopyable.innerText.trim() : '';
            }

            // Fallback: If text still starts with "Anda\n" or "You\n" or "+62...\n" (plain text quote format)
            if (/^(?:anda|you|\+\d[\d\s\-]+)\n/i.test(text)) {
                const lines = text.split(/\r?\n/);
                if (lines.length >= 3) {
                    const lastLine = lines[lines.length - 1].trim();
                    if (lastLine.length > 0) {
                        quotedText = lines.slice(0, -1).join('\n').trim();
                        text = lastLine;
                    }
                }
            }

            // Check if last copyable bubble is outgoing (.message-out or checkmarks)
            const lastBubble = lastCopyable.closest('div[role="row"]') || lastCopyable.closest('div.message-out, div.message-in') || lastCopyable.parentElement;
            const lastIsMsgOut = !!lastCopyable.closest('.message-out, [class*="message-out"]') || !!lastBubble?.querySelector('.message-out, [class*="message-out"]');
            const lastHasCheck = lastIsMsgOut || !!lastBubble?.querySelector('span[data-icon*="check"], [data-icon*="check"], [data-icon*="dblcheck"], span[data-icon="msg-time"]');

            return {
                hasMain: true,
                contactTitle: contactTitle.trim(),
                detectedSelfName,
                lastHasCheck,
                prePlain,
                text,
                quotedText
            };
        });

        if (activeChatResult) {
            if (activeChatResult.detectedSelfName) {
                sessionData.botName = activeChatResult.detectedSelfName;
            }

            if (activeChatResult.text) {
                const pre = activeChatResult.prePlain;
                const botName = sessionData.botName ? sessionData.botName.toLowerCase() : 'lano';
                const senderMatch = pre.match(/\]\s*([^:]+):/);
                const rawSender = senderMatch ? senderMatch[1].trim() : activeChatResult.contactTitle;
                const cleanPhone = cleanPhoneNumber(rawSender) || cleanPhoneNumber(activeChatResult.contactTitle);

                // Update active chat phone tracking
                sessionData.activeChatPhone = cleanPhone;
                sessionData.activeChatTitle = activeChatResult.contactTitle;

                // Determine if this message is outgoing (sent by us) or incoming (sent by customer)
                const isOutbound = activeChatResult.lastHasCheck ||
                                   rawSender.toLowerCase() === botName ||
                                   /^(anda|saya|me|ats|sinar|admin)/i.test(rawSender) ||
                                   (sessionData.userPhone && (cleanPhone === sessionData.userPhone || rawSender.includes(sessionData.userPhone)));

                if (!isOutbound) {
                    // Construct stable unique message ID
                    const msgId = 'pw_' + cleanPhone + '_' + pre.replace(/\D/g, '') + '_' + activeChatResult.text.substring(0, 20);

                    if (!sessionData.processedMessageIds.has(msgId)) {
                        sessionData.processedMessageIds.add(msgId);

                        // Cap set size
                        if (sessionData.processedMessageIds.size > 2000) {
                            const first = sessionData.processedMessageIds.values().next().value;
                            sessionData.processedMessageIds.delete(first);
                        }

                        logger.info(`[PLAYWRIGHT INBOUND DETECTED] [${sessionId}] from [${rawSender}] (${cleanPhone}): "${activeChatResult.text}"` + (activeChatResult.quotedText ? ` [Quoting: "${activeChatResult.quotedText.substring(0, 30)}..."]` : ''));

                        await sendToWebhook({
                            event: 'inbound_message',
                            sessionId,
                            provider: 'playwright',
                            fromPhone: cleanPhone || rawSender,
                            pushName: rawSender,
                            messageId: msgId,
                            text: activeChatResult.text,
                            quotedText: activeChatResult.quotedText,
                            timestamp: Math.floor(Date.now() / 1000)
                        });
                    }
                }
            }
        }

        // --- STEP B: Check left panel (#pane-side) for unread chats or incoming chats ---
        const targetRowIndex = await page.evaluate(() => {
            const pane = document.querySelector('#pane-side');
            if (!pane) return null;

            const rows = Array.from(pane.querySelectorAll('div[role="row"]'));
            if (rows.length === 0) return null;

            // 1. Check for rows with unread badge or unread label (exclude already selected chat)
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                const isSelected = r.getAttribute('aria-selected') === 'true' || !!r.querySelector('[aria-selected="true"]');
                if (isSelected) continue;

                const text = r.innerText || '';
                const unreadEl = r.querySelector('span[data-testid="unread-count"], [aria-label*="belum dibaca" i], [aria-label*="unread" i]');
                const aria = unreadEl?.getAttribute('aria-label') || '';
                // Ensure not disappearing messages notice ("hilang...")
                const hasUnreadBadge = unreadEl && !aria.includes('hilang');
                const hasUnreadText = /pesan yang belum dibaca|unread message/i.test(text);

                if (hasUnreadBadge || hasUnreadText) {
                    return i;
                }
            }

            // 2. If #main is NOT open at all, open the most recent chat (row 0)
            const main = document.querySelector('#main');
            if (!main && rows.length > 0) {
                return 0;
            }

            return null;
        });

        if (targetRowIndex !== null) {
            try {
                const rowLocator = page.locator('#pane-side div[role="row"]').nth(targetRowIndex);
                if (await rowLocator.count() > 0) {
                    await rowLocator.click();
                    logger.info(`[PLAYWRIGHT] Clicked chat row #${targetRowIndex} in left panel to open into active view.`);
                    await page.waitForTimeout(600);
                }
            } catch (clickErr) {
                logger.debug(`Failed to click chat row: ${clickErr.message}`);
            }
        }

    } catch (e) {
        logger.debug(`scanForMessages error: ${e.message}`);
    }
}

// Mutex queue to serialize all outbound message typing & sending per session
const sendQueues = new Map();

function enqueueSend(sessionId, task) {
    const key = sessionId || 'default';
    const prev = sendQueues.get(key) || Promise.resolve();
    const next = prev.then(task, task);
    sendQueues.set(key, next);
    return next;
}

/**
 * Fast, atomic line-by-line text insertion into WhatsApp Web input box
 * Prevents character interleaving, dropped letters, and formatting caret jumps
 */
async function humanType(page, text) {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
            await page.keyboard.down('Shift');
            await page.keyboard.press('Enter');
            await page.keyboard.up('Shift');
            await page.waitForTimeout(25);
        }
        if (lines[i].length > 0) {
            await page.keyboard.insertText(lines[i]);
            await page.waitForTimeout(15);
        }
    }
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        engine: 'Playwright Desktop Anti-Detect',
        browser_executable: BROWSER_EXECUTABLE,
        headless: HEADLESS,
        active_sessions: sessions.size,
        uptime: process.uptime()
    });
});

/**
 * List all active Playwright sessions
 */
app.get('/sessions', (req, res) => {
    const list = [];
    for (const [id, data] of sessions.entries()) {
        list.push({
            sessionId: id,
            status: data.status,
            userPhone: data.userPhone,
            hasQr: !!data.qrDataUrl,
            headless: HEADLESS
        });
    }
    res.json({ sessions: list });
});

app.get('/debug/screenshot', async (req, res) => {
    const sessionData = sessions.get('channel_3');
    if (!sessionData || !sessionData.page) return res.status(404).json({ error: 'No page' });
    try {
        const screenshotPath = 'C:\\Users\\itpta\\.gemini\\antigravity-ide\\brain\\4440e92f-85d1-4ce3-9276-30fc3b1f1c55\\whatsapp_screen.png';
        await sessionData.page.screenshot({ path: screenshotPath });
        res.json({ success: true, path: screenshotPath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/debug/click-chat', async (req, res) => {
    const sessionData = sessions.get('channel_3');
    if (!sessionData || !sessionData.page) return res.json({ error: 'no page' });
    const { page } = sessionData;
    try {
        await page.click('#pane-side div[role="row"]');
        await page.waitForTimeout(1000);
        const hasMain = await page.evaluate(() => !!document.querySelector('#main'));
        res.json({ success: true, hasMain });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Debug inspect WhatsApp Web DOM in real-time
 */
app.get('/debug/inspect', async (req, res) => {
    const sessionId = req.query.sessionId || 'channel_3';
    const sessionData = sessions.get(sessionId);
    if (!sessionData || !sessionData.page || sessionData.page.isClosed()) {
        return res.status(404).json({ error: 'Session not active', sessionId });
    }

    try {
        const info = await sessionData.page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            const main = document.querySelector('#main');
            const pane = document.querySelector('#pane-side');

            const dialogInfo = dialog ? {
                text: dialog.innerText,
                buttons: Array.from(dialog.querySelectorAll('button, div[role="button"]')).map(b => b.innerText || b.getAttribute('aria-label'))
            } : null;

            const mainInfo = main ? {
                headerText: main.querySelector('header')?.innerText,
                copyableCount: main.querySelectorAll('div.copyable-text').length,
                lastCopyables: Array.from(main.querySelectorAll('div.copyable-text')).slice(-5).map(c => ({
                    pre: c.getAttribute('data-pre-plain-text'),
                    text: c.innerText,
                    isIn: !!c.closest('.message-in'),
                    isOut: !!c.closest('.message-out'),
                }))
            } : null;

            const paneRows = pane ? Array.from(pane.querySelectorAll('div[role="row"], div[role="listitem"], div._ak8l, div[tabindex="-1"]')).slice(0, 15).map(r => ({
                tag: r.tagName,
                role: r.getAttribute('role'),
                className: r.className.substring(0, 50),
                text: r.innerText.replace(/\n+/g, ' | ').substring(0, 150),
                unreadSpans: Array.from(r.querySelectorAll('span')).filter(s => s.getAttribute('aria-label') || /^\d+$/.test(s.innerText.trim())).map(s => ({
                    aria: s.getAttribute('aria-label'),
                    text: s.innerText
                }))
            })) : [];

            const firstRow = pane ? pane.querySelector('div[role="row"]') : null;
            const firstRowDetails = firstRow ? {
                allText: firstRow.innerText,
                spans: Array.from(firstRow.querySelectorAll('span')).map(s => ({
                    text: s.innerText,
                    aria: s.getAttribute('aria-label'),
                    title: s.getAttribute('title'),
                    dataTestId: s.getAttribute('data-testid'),
                    className: s.className
                })),
                svGs: Array.from(firstRow.querySelectorAll('svg, span[data-icon]')).map(s => s.getAttribute('data-icon') || s.getAttribute('aria-label')),
                badges: Array.from(firstRow.querySelectorAll('span[data-testid="unread-count"], [aria-label*="unread" i], [aria-label*="belum" i], span.x1rg5ohu')).map(b => ({
                    tag: b.tagName,
                    aria: b.getAttribute('aria-label'),
                    text: b.innerText
                }))
            } : null;

            return {
                url: window.location.href,
                hasDialog: !!dialog,
                dialogInfo,
                hasMain: !!main,
                mainInfo,
                hasPane: !!pane,
                firstRowDetails,
                paneRowsCount: pane ? pane.querySelectorAll('div[role="row"]').length : 0,
                paneRowsSample: paneRows.slice(0, 8)
            };
        });

        res.json({
            sessionId,
            status: sessionData.status,
            userPhone: sessionData.userPhone,
            processedCount: sessionData.processedMessageIds.size,
            processedSample: Array.from(sessionData.processedMessageIds).slice(-5),
            dom: info
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Start or connect Playwright session (Opens Chrome on laptop)
 */
app.post('/sessions/start', async (req, res) => {
    let { sessionId } = req.body;
    sessionId = sessionId || 'default';

    // If any session is already active and open, return it immediately
    const active = sessions.get(sessionId) || Array.from(sessions.values()).find(s => s.page && !s.page.isClosed());
    if (active) {
        return res.json({
            success: true,
            sessionId: active.sessionId,
            status: active.status,
            qr: active.qrDataUrl,
            userPhone: active.userPhone,
            message: active.status === 'connected' ? 'WhatsApp Web sudah terhubung!' : 'Silakan scan kode QR di bawah ini.'
        });
    }

    try {
        const sessionData = await initSession(sessionId);
        res.json({
            success: true,
            sessionId: sessionData.sessionId,
            status: sessionData.status,
            qr: sessionData.qrDataUrl,
            userPhone: sessionData.userPhone,
            message: HEADLESS ? 'Sesi Playwright berjalan di background.' : 'Google Chrome asli dibuka di laptop Anda (Mode Override Layar Anti-Deteksi).'
        });
    } catch (err) {
        logger.error(`Failed to start Playwright session [${sessionId}]: ${err.message}`);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Get status and live QR code of a session
 */
app.get('/sessions/:sessionId/status', (req, res) => {
    const { sessionId } = req.params;
    let sessionData = sessions.get(sessionId);

    // If requested session is not found or disconnected, fallback to any active session!
    if (!sessionData || sessionData.status === 'disconnected') {
        const active = Array.from(sessions.values()).find(s => s.status === 'connected' || (s.status === 'qr_ready' && s.qrDataUrl));
        if (active) sessionData = active;
    }

    if (!sessionData) {
        return res.json({
            sessionId: sessionId || 'default',
            status: 'disconnected',
            qr: null,
            userPhone: null
        });
    }

    res.json({
        sessionId: sessionData.sessionId,
        status: sessionData.status,
        qr: sessionData.qrDataUrl,
        userPhone: sessionData.userPhone
    });
});

/**
 * Send outbound message via Playwright (Humanized typing on WhatsApp Web)
 */
app.post('/messages/send', async (req, res) => {
    const { sessionId, to, text, quotedMessageId } = req.body;

    if (!sessionId || !to || !text) {
        return res.status(400).json({ error: 'sessionId, to, and text are required' });
    }

    const sessionData = sessions.get(sessionId);
    if (!sessionData || !sessionData.page || sessionData.status !== 'connected') {
        return res.status(400).json({
            success: false,
            error: `Sesi Playwright [${sessionId}] belum terhubung ke WhatsApp Web.`
        });
    }

    const { page } = sessionData;
    const cleanTo = cleanPhoneNumber(to);
    const lastDigits = cleanTo.slice(-9); // last 9 digits for matching

    return enqueueSend(sessionId, async () => {
        try {
            logger.info(`[PLAYWRIGHT SEND] Preparing to send message to ${cleanTo} via session [${sessionId}]...`);

            // Check if chat is already open in #main
            const isTargetChatOpen = await page.evaluate((digits) => {
                const header = document.querySelector('#main header');
                if (!header) return false;
                const cleanHeader = header.innerText.replace(/\D/g, '');
                return cleanHeader.includes(digits);
            }, lastDigits);

            const isCurrentActive = sessionData.activeChatPhone && (sessionData.activeChatPhone === cleanTo || sessionData.activeChatPhone.endsWith(lastDigits));
            const inputSelector = '#main footer div[contenteditable="true"], footer div[contenteditable="true"]';

            if (!isTargetChatOpen && !isCurrentActive) {
                logger.info(`[PLAYWRIGHT SEND] Target chat not open in view. Searching in left panel...`);
                
                // Try to find row in left panel first
                let openedFromList = false;
                const rows = page.locator('#pane-side div[role="row"]');
                const count = await rows.count();
                for (let i = 0; i < Math.min(count, 15); i++) {
                    const row = rows.nth(i);
                    const rowText = await row.innerText().catch(() => '');
                    if (rowText.includes(lastDigits) || (sessionData.activeChatTitle && rowText.includes(sessionData.activeChatTitle))) {
                        await row.click();
                        await page.waitForTimeout(600);
                        openedFromList = true;
                        break;
                    }
                }

                if (!openedFromList) {
                    logger.info(`[PLAYWRIGHT SEND] Navigating to WhatsApp send URL for ${cleanTo}...`);
                    const sendUrl = `https://web.whatsapp.com/send?phone=${cleanTo}`;
                    await page.goto(sendUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await page.waitForTimeout(1500);
                }
            }

            // If quoting a message, attempt to double-click the last incoming message bubble in the open chat
            if (quotedMessageId) {
                try {
                    const incomingBubble = page.locator('#main .message-in div.copyable-text').last();
                    if (await incomingBubble.count() > 0) {
                        await incomingBubble.dblclick({ timeout: 1500 }).catch(() => {});
                        await page.waitForTimeout(300);
                    }
                } catch (quoteErr) {
                    logger.debug(`[PLAYWRIGHT] Could not quote message bubble: ${quoteErr.message}`);
                }
            }

            // Wait for message box to be ready
            await page.waitForSelector(inputSelector, { timeout: 15000 });
            await page.click(inputSelector);
            await page.waitForTimeout(200);

            // Fast atomic line insertion
            await humanType(page, text);

            // Wait 250ms then press Enter
            await page.waitForTimeout(250);
            await page.keyboard.press('Enter');

            // Wait for send execution
            await page.waitForTimeout(600);

            const providerMsgId = 'pw_out_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            logger.info(`[PLAYWRIGHT SEND SUCCESS] Message sent to ${cleanTo} via Chrome on laptop.`);

            res.json({
                success: true,
                provider: 'playwright',
                provider_message_id: providerMsgId,
                status: 'sent',
                recipient_id: cleanTo
            });

        } catch (err) {
            logger.error(`[PLAYWRIGHT SEND ERROR] Failed to send message to ${cleanTo}: ${err.message}`);
            res.status(500).json({
                success: false,
                error: `Gagal mengirim pesan via Playwright: ${err.message}`
            });
        }
    });
});

/**
 * Send document / media file via Playwright
 */
app.post('/messages/send-document', async (req, res) => {
    const { sessionId, to, documentUrl, filename, caption } = req.body;

    if (!sessionId || !to || (!documentUrl && !filename)) {
        return res.status(400).json({ error: 'sessionId, to, and documentUrl are required' });
    }

    const sessionData = sessions.get(sessionId);
    if (!sessionData || !sessionData.page || sessionData.status !== 'connected') {
        return res.status(400).json({
            success: false,
            error: `Sesi Playwright [${sessionId}] belum terhubung.`
        });
    }

    const { page } = sessionData;
    const cleanTo = cleanPhoneNumber(to);

    try {
        // Open chat with recipient
        await page.goto(`https://web.whatsapp.com/send?phone=${cleanTo}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1000);

        let localFilePath = documentUrl;
        if (documentUrl.startsWith('http://') || documentUrl.startsWith('https://')) {
            const tempFile = path.join(MEDIA_DIR, `temp_${Date.now()}_${filename || 'document.pdf'}`);
            const resp = await fetch(documentUrl);
            const buffer = await resp.arrayBuffer();
            fs.writeFileSync(tempFile, Buffer.from(buffer));
            localFilePath = tempFile;
        }

        // Attach file via file input
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
            await fileInput.setInputFiles(localFilePath);
            await page.waitForTimeout(1500);

            if (caption) {
                const captionInput = await page.$('div[contenteditable="true"]');
                if (captionInput) {
                    await captionInput.click();
                    await humanType(page, caption);
                }
            }

            const sendBtn = await page.$('span[data-icon="send"], button[aria-label="Send" i]');
            if (sendBtn) {
                await sendBtn.click();
            } else {
                await page.keyboard.press('Enter');
            }
            await page.waitForTimeout(1000);
        }

        res.json({
            success: true,
            provider: 'playwright',
            provider_message_id: 'pw_doc_' + Date.now(),
            status: 'sent'
        });

    } catch (err) {
        logger.error(`Failed to send document via Playwright: ${err.message}`);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Get live WhatsApp Web chats from #pane-side
 */
app.get('/sessions/:sessionId/chats', async (req, res) => {
    const { sessionId } = req.params;
    const sessionData = sessions.get(sessionId) || Array.from(sessions.values()).find(s => s.status === 'connected') || Array.from(sessions.values())[0];

    if (!sessionData || !sessionData.page || sessionData.page.isClosed()) {
        return res.json({ success: false, status: 'disconnected', chats: [] });
    }

    try {
        const chats = await sessionData.page.evaluate(() => {
            const pane = document.querySelector('#pane-side');
            if (!pane) return [];

            const rows = Array.from(pane.querySelectorAll('div[role="row"]'));
            return rows.map((r, idx) => {
                const titleEl = r.querySelector('span[title]');
                const name = titleEl ? (titleEl.getAttribute('title') || titleEl.innerText) : '';
                
                // Get unread badge count
                const unreadEl = r.querySelector('span[data-testid="unread-count"], [aria-label*="belum dibaca" i], [aria-label*="unread" i]');
                let unread = 0;
                if (unreadEl) {
                    const aria = unreadEl.getAttribute('aria-label') || '';
                    if (!aria.includes('hilang')) {
                        const parsed = parseInt(unreadEl.innerText.replace(/\D/g, ''));
                        unread = isNaN(parsed) ? 1 : parsed;
                    }
                }

                // Last message text
                const textNodes = Array.from(r.querySelectorAll('span[dir="ltr"], span.selectable-text, div._ak8k, div._ak8l'));
                let lastMsg = '';
                for (const t of textNodes) {
                    if (t !== titleEl && t.innerText && t.innerText.trim() !== name.trim()) {
                        lastMsg = t.innerText.trim();
                        break;
                    }
                }
                if (!lastMsg) {
                    const lines = r.innerText.split('\n').map(l => l.trim()).filter(Boolean);
                    lastMsg = lines.length > 2 ? lines[lines.length - 1] : (lines[1] || '');
                }

                // Time
                const timeEl = r.querySelector('div[data-testid="cell-frame-timestamp"], div._ak8i, span[data-testid="msg-time"]');
                const time = timeEl ? timeEl.innerText.trim() : '';

                // Is selected
                const isSelected = r.getAttribute('aria-selected') === 'true' || !!r.querySelector('[aria-selected="true"]');

                // Clean phone
                const digits = name.replace(/\D/g, '');
                const cleanPhone = digits.length >= 9 ? (digits.startsWith('0') ? '62' + digits.substring(1) : digits) : '';

                return {
                    id: idx + 1,
                    index: idx,
                    name: name.trim() || 'Kontak WhatsApp',
                    wa: cleanPhone ? ('+' + cleanPhone) : '',
                    lastMsg: lastMsg || 'Tidak ada pesan preview',
                    time: time || 'Baru saja',
                    unread,
                    isSelected,
                    mode: 'ai',
                    stage: 'negotiation'
                };
            }).filter(c => c.name.length > 0);
        });

        res.json({
            success: true,
            status: sessionData.status,
            userPhone: sessionData.userPhone,
            chats
        });
    } catch (err) {
        logger.error(`Error reading chats for [${sessionId}]: ${err.message}`);
        res.status(500).json({ success: false, error: err.message, chats: [] });
    }
});

// Helper for global /chats
app.get('/chats', async (req, res) => {
    const sessionData = Array.from(sessions.values()).find(s => s.status === 'connected') || Array.from(sessions.values())[0];
    if (!sessionData) {
        return res.json({ success: false, status: 'disconnected', chats: [] });
    }
    return res.redirect(`/sessions/${sessionData.sessionId}/chats`);
});

/**
 * Open chat in WhatsApp Web and fetch messages from #main
 */
app.post('/sessions/:sessionId/chats/open', async (req, res) => {
    const { sessionId } = req.params;
    const { index, name, phone } = req.body;
    const sessionData = sessions.get(sessionId) || Array.from(sessions.values()).find(s => s.status === 'connected') || Array.from(sessions.values())[0];

    if (!sessionData || !sessionData.page || sessionData.page.isClosed()) {
        return res.status(400).json({ success: false, error: 'Sesi Playwright belum terhubung' });
    }

    try {
        const { page } = sessionData;

        // Click row if index is provided
        if (typeof index === 'number') {
            const rows = page.locator('#pane-side div[role="row"]');
            if (await rows.count() > index) {
                await rows.nth(index).click();
                await page.waitForTimeout(600);
            }
        } else if (name) {
            // Find by name
            const rows = page.locator('#pane-side div[role="row"]');
            const count = await rows.count();
            for (let i = 0; i < count; i++) {
                const text = await rows.nth(i).innerText().catch(() => '');
                if (text.includes(name)) {
                    await rows.nth(i).click();
                    await page.waitForTimeout(600);
                    break;
                }
            }
        }

        // Read messages from #main
        const botName = sessionData.botName || 'lano';
        const userPhone = sessionData.userPhone || '';

        const messages = await page.evaluate(({ botNameArg, userPhoneArg }) => {
            const main = document.querySelector('#main');
            if (!main) return [];

            const headerEl = main.querySelector('header');
            const contactHeader = headerEl?.querySelector('span[title]')?.getAttribute('title') || headerEl?.innerText || '';
            const cleanHeader = contactHeader.replace(/\D/g, '');

            const copyables = Array.from(main.querySelectorAll('div.copyable-text'));

            // Step 1: Detect self sender name from any message that has delivery checkmarks
            let detectedSelfName = botNameArg ? botNameArg.toLowerCase() : 'lano';
            for (let i = copyables.length - 1; i >= 0; i--) {
                const c = copyables[i];
                const bubble = c.closest('div[role="row"]') || c.closest('div.message-out, div.message-in') || c.parentElement;
                const hasCheck = !!bubble?.querySelector('[data-icon*="check"], [data-icon*="dblcheck"], [data-icon="msg-time"], [data-testid*="check"]');
                if (hasCheck) {
                    const pre = c.getAttribute('data-pre-plain-text') || '';
                    const match = pre.match(/\]\s*([^:]+):/);
                    if (match && match[1]) {
                        detectedSelfName = match[1].trim().toLowerCase();
                        break;
                    }
                }
            }

            return copyables.map((c, i) => {
                const bubble = c.closest('div[role="row"]') || c.closest('div.message-out, div.message-in') || c.parentElement;

                // 1. Direct class checks on element or ancestors
                const isMsgOut = !!c.closest('.message-out, [class*="message-out"]') || !!bubble?.querySelector('.message-out, [class*="message-out"]');
                const isMsgIn = !!c.closest('.message-in, [class*="message-in"]') || !!bubble?.querySelector('.message-in, [class*="message-in"]');

                // 2. Sender from data-pre-plain-text
                const pre = c.getAttribute('data-pre-plain-text') || '';
                const match = pre.match(/\[(.*?)\]/);
                const time = match ? match[1].trim() : '';
                const senderMatch = pre.match(/\]\s*([^:]+):/);
                const rawSender = senderMatch ? senderMatch[1].trim() : '';
                const senderLower = rawSender.toLowerCase();

                // 3. Checkmarks check (strictly on outgoing messages)
                const hasCheck = !!(c.closest('div[role="row"]') || bubble)?.querySelector('[data-icon*="check"], [data-icon*="dblcheck"], [data-icon="msg-time"], [data-testid*="check"]');

                // 4. Sender heuristics
                const isSelfSender = /^(anda|you|saya|me|ats|sinar|admin)/i.test(rawSender) ||
                                     senderLower === detectedSelfName ||
                                     (userPhoneArg && rawSender.replace(/\D/g, '') === userPhoneArg);
                const isContactSender = cleanHeader && rawSender.replace(/\D/g, '').endsWith(cleanHeader.slice(-8));

                let isOut = false;
                if (hasCheck) {
                    isOut = true;
                } else if (isSelfSender) {
                    isOut = true;
                } else if (isContactSender) {
                    isOut = false;
                } else if (isMsgOut) {
                    isOut = true;
                } else if (isMsgIn) {
                    isOut = false;
                } else if (rawSender && cleanHeader && !rawSender.includes(cleanHeader)) {
                    isOut = true;
                }

                // Extract clean text (excluding quote if any)
                let text = '';
                const quoteEl = c.querySelector('div[data-testid="quoted-message"], div[aria-label*="kutipan" i], div[aria-label*="quoted" i], div._amkd, div._amke');
                if (quoteEl) {
                    const clone = c.cloneNode(true);
                    const cloneQuote = clone.querySelector('div[data-testid="quoted-message"], div[aria-label*="kutipan" i], div[aria-label*="quoted" i], div._amkd, div._amke');
                    if (cloneQuote) cloneQuote.remove();
                    text = clone.innerText ? clone.innerText.trim() : '';
                } else {
                    text = c.innerText ? c.innerText.trim() : '';
                }

                return {
                    id: i + 1,
                    sender: isOut ? 'ai' : 'customer',
                    body: text,
                    time: time || 'Sekarang'
                };
            });
        }, { botNameArg: botName, userPhoneArg: userPhone });

        res.json({
            success: true,
            messages
        });
    } catch (err) {
        logger.error(`Error opening chat: ${err.message}`);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Logout and close browser session
 */
app.post('/sessions/:sessionId/logout', async (req, res) => {
    const { sessionId } = req.params;
    const sessionData = sessions.get(sessionId);

    if (sessionData) {
        if (sessionData.monitoringInterval) {
            clearInterval(sessionData.monitoringInterval);
        }
        if (sessionData.context) {
            try {
                await sessionData.context.close();
            } catch (e) {}
        }
        sessions.delete(sessionId);
    }

    res.json({ success: true, message: `Sesi Playwright [${sessionId}] berhasil ditutup.` });
});

// Auto-restore default session stored on disk (single instance only)
async function restoreExistingSessions() {
    try {
        logger.info(`[BOOT] Initializing primary Playwright profile: [default]...`);
        await initSession('default');
    } catch (e) {
        logger.warn(`Could not auto-restore Playwright session: ${e.message}`);
    }
}

app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🚀 ATS Playwright WhatsApp Anti-Detect Service running on port ${PORT}`);
    console.log(`   Mode:           ${HEADLESS ? 'Headless (Background)' : 'Headed (Laptop Screen Override)'}`);
    console.log(`   Browser:        ${BROWSER_EXECUTABLE || 'Default Chrome'}`);
    console.log(`   Webhook Target: ${AIWA_WEBHOOK_URL}`);
    console.log(`   Storage:        ${STORAGE_DIR}`);
    console.log(`====================================================`);
    await restoreExistingSessions();
});
