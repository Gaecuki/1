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
  const api_key = 'b24ade';
  const dimension = '1024x768';
  const api_url = `https://api.screenshotmachine.com?key=${api_key}&url=${url}&dimension=${dimension}`;

  try {
    const response = await axios.get(api_url, { responseType: 'arraybuffer' });
    const screenshotPath = path.join(__dirname, 'screenshot.png');
    fs.writeFileSync(screenshotPath, response.data);
    return screenshotPath;
  } catch (error) {
    throw new Error(`Terjadi kesalahan saat mengambil screenshot: ${error.response.status}`);
  }
}

// Fungsi untuk melakukan dorking
async function performDorking(query, site, numResults) {
  const dorkQuery = `${query} site:${site}`;
  const results = await googleIt({ query: dorkQuery, limit: numResults });
  return results.map(result => result.link);
}

// Fungsi untuk mencari subdomain menggunakan crt.sh
async function findSubdomains(domain) {
  try {
    const response = await axios.get(`https://crt.sh/?q=%.${domain}`);
    const $ = cheerio.load(response.data);
    const subdomains = new Set();
    $('td').each((i, elem) => {
      const subdomain = $(elem).text().trim();
      if (subdomain.endsWith(`.${domain}`)) {
        subdomains.add(subdomain);
      }
    });
    return Array.from(subdomains);
  } catch (error) {
    console.error(`Error finding subdomains: ${error}`);
    return [];
  }
}

// Fungsi untuk mencari domain berdasarkan IP menggunakan HackerTarget
async function findDomainsByIp(ip) {
  try {
    const url = `https://api.hackertarget.com/reverseiplookup/?q=${ip}`;
    const response = await axios.get(url);
    return response.data.trim().split('\n');
  } catch (error) {
    console.error(`Error finding domains by IP: ${error}`);
    return [];
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
  const numResults = parseInt(match[3]);

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

// Command handler untuk /start
bot.onText(/\/start/, (msg) => {
  const userName = msg.from.username;
  const response = `
Halo selamat malam ${userName}! 👋🏻

Saya adalah bot yang dibuat oleh @KrusSiu.

MAAF BOT INI MASIH DALAM MASA PENGEMBANGAN, JADI MASIH BELUM BANYAK FITUR, DAN FITUR YANG TERSEDIA ADA DI BAWAH

Klik salah satu tombol di bawah untuk info lebih lanjut:
  `;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Screenshot Website', callback_data: 'help_ss' }],
        [{ text: 'Dorking', callback_data: 'help_dorking' }],
        [{ text: 'Cek Subdomain', callback_data: 'help_subdomain' }],
        [{ text: 'Reverse IP Lookup', callback_data: 'help_reverseip' }]
      ]
    }
  };

  bot.sendMessage(msg.chat.id, response, options);
});

// Callback handler untuk tombol inline
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  let response;

  switch (callbackQuery.data) {
    case 'help_ss':
      response = 'Cara menggunakan /ss:\n\n/ss URL_WEBSITE\n\nContoh:\n/ss https://www.example.com';
      break;
    case 'help_dorking':
      response = 'Cara menggunakan /dorking:\n\n/dorking inurl SITE JUMLAH\n\nContoh:\n/dorking inurl:index.php?id= site:example.com 10';
      break;
    case 'help_subdomain':
      response = 'Cara menggunakan /subdomain:\n\n/subdomain DOMAIN\n\nContoh:\n/subdomain example.com';
      break;
    case 'help_reverseip':
      response = 'Cara menggunakan /reverseip:\n\n/reverseip IP_ADDRESS\n\nContoh:\n/reverseip 192.168.1.1';
      break;
    default:
      response = 'Perintah tidak dikenal.';
  }

  bot.sendMessage(message.chat.id, response);
});
