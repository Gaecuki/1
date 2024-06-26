import telebot
import requests
import os
from googlesearch import search
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from googletrans import Translator

# Token bot dari Telegram
TOKEN = '7228466714:AAFlTFTdG1-WXDDJzMZjBLTX4ZpLEJf4PnA'
bot = telebot.TeleBot(TOKEN)

# Fungsi untuk mengambil screenshot menggunakan API Screenshot Machine
def take_screenshot(url):
    api_key = 'b24ade'
    dimension = '1024x768'
    api_url = f'https://api.screenshotmachine.com?key={api_key}&url={url}&dimension={dimension}'

    response = requests.get(api_url)
    if response.status_code == 200:
        screenshot_path = 'screenshot.png'
        with open(screenshot_path, 'wb') as file:
            file.write(response.content)
        return screenshot_path
    else:
        raise Exception(f"Terjadi kesalahan saat mengambil screenshot: {response.status_code}")

# Fungsi untuk melakukan dorking
def perform_dorking(query, site, num_results):
    import random
    import time

    # Daftar User-Agent yang bagus
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ]

    dork_query = f"{query} site:{site}"
    results = []
    for url in search(dork_query, num=10, stop=num_results, pause=random.uniform(2, 5), user_agent=random.choice(user_agents)):
        results.append(url)
        time.sleep(random.uniform(2, 5))
    return results

# Fungsi untuk menerjemahkan teks menggunakan API Google Translate
def translate_text(text, target_lang='en'):
    translator = Translator()
    translation = translator.translate(text, dest=target_lang)
    return translation.text

# Command handler untuk /ss
@bot.message_handler(commands=['ss'])
def handle_screenshot(message):
    try:
        # Memisahkan command dan URL
        parts = message.text.split()
        if len(parts) < 2:
            bot.reply_to(message, "Harap berikan URL yang valid. Contoh penggunaan: /ss https://www.example.com")
            return
        
        url = parts[1]
        screenshot_path = take_screenshot(url)
        with open(screenshot_path, 'rb') as photo:
            bot.send_photo(message.chat.id, photo)
        os.remove(screenshot_path)
    except Exception as e:
        bot.reply_to(message, f"Terjadi kesalahan: {e}")

# Command handler untuk /dorking
@bot.message_handler(commands=['dorking'])
def handle_dorking(message):
    try:
        # Memisahkan command dan parameter
        parts = message.text.split()
        if len(parts) < 4:
            bot.reply_to(message, "Harap berikan parameter yang valid. Contoh penggunaan: /dorking inurl site jumlah")
            return
        
        query = parts[1]
        site = parts[2]
        num_results = int(parts[3])

        results = perform_dorking(query, site, num_results)
        if results:
            result_text = "\n".join(results)
            bot.reply_to(message, result_text)
        else:
            bot.reply_to(message, "Tidak ada hasil yang ditemukan.")
    except Exception as e:
        bot.reply_to(message, f"Terjadi kesalahan: {e}")

# Command handler untuk /start
@bot.message_handler(commands=['start'])
def handle_start(message):
    response = (
        "MAAF BOT INI MASIH DALAM MASA PENGEMBANGAN, JADI MASIH BELUM BANYAK FITUR, DAN FITUR YANG TERSEDIA ADA DI BAWAH\n\n"
    )

    # Membuat tombol inline untuk fitur
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton("Fitur: /ss URL WEBSITE", callback_data="help_ss"))
    markup.add(InlineKeyboardButton("Fitur: /dorking inurl site jumlah", callback_data="help_dorking"))
    markup.add(InlineKeyboardButton("Fitur: AI Translation", callback_data="help_ai"))
    
    bot.send_message(message.chat.id, response, reply_markup=markup)

# Callback handler untuk tombol inline
@bot.callback_query_handler(func=lambda call: True)
def handle_query(call):
    if call.data == "help_ss":
        response = "Cara penggunaan /ss:\n\n/ss URL WEBSITE\n\nContoh:\n/ss https://www.example.com"
        bot.send_message(call.message.chat.id, response)
    elif call.data == "help_dorking":
        response = "Cara penggunaan /dorking:\n\n/dorking inurl site jumlah\n\nContoh:\n/dorking inurl:index.php?id= site:example.com 10"
        bot.send_message(call.message.chat.id, response)
    elif call.data == "help_ai":
        response = "Bot ini dapat membantu Anda menerjemahkan teks menggunakan layanan AI Translation.\n\nKirimkan teks yang ingin Anda terjemahkan, dan bot akan menerjemahkannya ke dalam bahasa yang Anda inginkan."
        bot.send_message(call.message.chat.id, response)

# Message handler untuk menerima pesan teks
@bot.message_handler(func=lambda message: True)
def handle_message(message):
    if message.text.startswith('/'):
        return  # Hindari menanggapi pesan jika dimulai dengan '/'

    try:
        # Menerjemahkan teks yang diterima menggunakan layanan AI Translation
        translated_text = translate_text(message.text)

        # Mengirimkan hasil terjemahan ke pengguna
        bot.reply_to(message, f"Terjemahan:\n\n{translated_text}")
    except Exception as e:
        bot.reply_to(message, f"Terjadi kesalahan saat menerjemahkan teks: {e}")

# Jalankan bot
bot.polling()
