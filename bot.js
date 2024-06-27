const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');
const googleIt = require('google-it');
const fs = require('fs');
const path = require('path');

// Token bot dari Telegram
const TOKEN = '7228466714:AAFlTFTdG1-WXDDJzMZjBLTX4ZpLEJf4PnA';
const bot = new TelegramBot(TOKEN, { polling: true });

// Fungsi untuk mengambil screenshot menggunakan API Screenshot Machine
async function takeScreenshot(url) {
    const apiKey = 'b24ade';
    const dimension = '1024x768';
    const apiUrl = `https://api.screenshotmachine.com?key=${apiKey}&url=${url}&dimension=${dimension}`;

    try {
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        if (response.status === 200) {
            const screenshotPath = path.resolve(__dirname, 'screenshot.png');
            fs.writeFileSync(screenshotPath, response.data);
            return screenshotPath;
        } else {
            throw new Error(`Terjadi kesalahan saat mengambil screenshot: ${response.status}`);
        }
    } catch (error) {
        throw new Error(`Terjadi kesalahan saat mengambil screenshot: ${error.message}`);
    }
}

// Fungsi untuk melakukan dorking
async function performDorking(query, site, numResults) {
    const dorkQuery = `${query} site:${site}`;
    try {
        const results = await googleIt({ query: dorkQuery, limit: numResults });
        return results.map(result => result.link);
    } catch (error) {
        throw new Error(`Terjadi kesalahan saat melakukan dorking: ${error.message}`);
    }
}

// Fungsi untuk mencari subdomain menggunakan crt.sh
async function findSubdomains(domain) {
    try {
        const response = await axios.get(`https://crt.sh/?q=%.${domain}`);
        const $ = cheerio.load(response.data);
        const subdomains = new Set();
        $('td').each((index, element) => {
            const subdomain = $(element).text().trim();
            if (subdomain.endsWith(`.${domain}`)) {
                subdomains.add(subdomain);
            }
        });
        return Array.from(subdomains);
    } catch (error) {
        throw new Error(`Terjadi kesalahan saat mencari subdomain: ${error.message}`);
    }
}

// Fungsi untuk mencari domain berdasarkan IP menggunakan HackerTarget
async function findDomainsByIp(ip) {
    try {
        const response = await axios.get(`https://api.hackertarget.com/reverseiplookup/?q=${ip}`);
        if (response.status === 200) {
            return response.data.trim().split('\n');
        } else {
            throw new Error(`Terjadi kesalahan saat mencari domain: ${response.status}`);
        }
    } catch (error) {
        throw new Error(`Terjadi kesalahan saat mencari domain: ${error.message}`);
    }
}

// Fungsi untuk mendownload video TikTok
async function downloadTikTok(url) {
    const apiUrl = `https://dikaardnt.com/api/download/tiktok?url=${url}`;
    try {
        const response = await axios.get(apiUrl);
        console.log(response.data); // Logging the response data for debugging
        if (response.data && response.data.video && response.data.video.url) {
            const videoUrl = response.data.video.url.without_watermark_hd || response.data.video.url.without_watermark || response.data.video.url.watermark;
            return videoUrl;
        } else {
            throw new Error('Tidak dapat mengambil video TikTok.');
        }
    } catch (error) {
        throw new Error(`Terjadi kesalahan saat mendownload video TikTok: ${error.message}`);
    }
}

// Command handler untuk /ss
bot.onText(/\/ss (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1];
    try {
        const screenshotPath = await takeScreenshot(url);
        await bot.sendPhoto(chatId, screenshotPath);
        fs.unlinkSync(screenshotPath);
    } catch (error) {
        bot.sendMessage(chatId, `Terjadi kesalahan: ${error.message}`);
    }
});

// Command handler untuk /dorking
bot.onText(/\/dorking (.+) (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];
    const site = match[2];
    const numResults = parseInt(match[3], 10);
    try {
        const results = await performDorking(query, site, numResults);
        if (results.length > 0) {
            bot.sendMessage(chatId, results.join('\n'));
        } else {
            bot.sendMessage(chatId, 'Tidak ada hasil yang ditemukan.');
        }
    } catch (error) {
        bot.sendMessage(chatId, `Terjadi kesalahan: ${error.message}`);
    }
});

// Command handler untuk /subdomain
bot.onText(/\/subdomain (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const domain = match[1];
    try {
        const subdomains = await findSubdomains(domain);
        if (subdomains.length > 0) {
            bot.sendMessage(chatId, subdomains.join('\n'));
        } else {
            bot.sendMessage(chatId, 'Tidak ada subdomain yang ditemukan untuk domain tersebut.');
        }
    } catch (error) {
        bot.sendMessage(chatId, `Terjadi kesalahan: ${error.message}`);
    }
});

// Command handler untuk /reverseip
bot.onText(/\/reverseip (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const ip = match[1];
    try {
        const domains = await findDomainsByIp(ip);
        if (domains.length > 0) {
            bot.sendMessage(chatId, domains.join('\n'));
        } else {
            bot.sendMessage(chatId, 'Tidak ada domain yang ditemukan untuk IP tersebut.');
        }
    } catch (error) {
        bot.sendMessage(chatId, `Terjadi kesalahan: ${error.message}`);
    }
});

// Command handler untuk /tiktok
bot.onText(/\/tiktok (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match[1];
    try {
        const videoUrl = await downloadTikTok(url);
        await bot.sendVideo(chatId, videoUrl);
    } catch (error) {
        bot.sendMessage(chatId, `Terjadi kesalahan: ${error.message}`);
    }
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.username;
    const response = `
Halo selamat malam ${userName}! 👋🏻

Saya adalah bot yang dibuat oleh @KrusSiu.

MAAF BOT INI MASIH DALAM MASA PENGEMBANGAN, JADI MASIH BELUM BANYAK FITUR, DAN FITUR YANG TERSEDIA ADA DI BAWAH

Klik salah satu tombol di bawah untuk info lebih lanjut:
    `;
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Screenshot Website', callback_data: 'help_ss' }],
                [{ text: 'Dorking', callback_data: 'help_dorking' }],
                [{ text: 'Cek Subdomain', callback_data: 'help_subdomain' }],
                [{ text: 'Reverse IP Lookup', callback_data: 'help_reverseip' }],
                [{ text: 'Download TikTok', callback_data: 'help_tiktok' }],
            ],
        },
    };
    bot.sendMessage(chatId, response, opts);
});

bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    let response;
    switch (callbackQuery.data) {
        case 'help_ss':
            response = 'Cara menggunakan /ss:\n\n/ss URL_WEBSITE\n\nContoh:\n/ss https://www.example.com';
            break;
        case 'help_dorking':
            response = 'Cara menggunakan /dorking:\n\n/dorking inurl SITE JUMLAH\n\nContoh:\n/dorking inurl:index.php?id= site:.com 10';
            break;
        case 'help_subdomain':
            response = 'Cara menggunakan /subdomain:\n\n/subdomain DOMAIN\n\nContoh:\n/subdomain example.com';
            break;
        case 'help_reverseip':
            response = 'Cara menggunakan /reverseip:\n\n/reverseip IP_ADDRESS\n\nContoh:\n/reverseip 192.168.1.1';
            break;
        case 'help_tiktok':
            response = 'Cara menggunakan /tiktok:\n\n/tiktok URL_TIKTOK\n\nContoh:\n/tiktok https://vt.tiktok.com/ZSYuGMKCs/';
            break;
        default:
            response = 'Perintah tidak dikenali.';
            break;
    }
    bot.sendMessage(message.chat.id, response);
});

// Menjalankan bot
bot.on('polling_error', (error) => {
    console.error(`Polling error: ${error.code}, ${error.message}`);
});
