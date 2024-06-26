import telebot
import requests
import os

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
    from googlesearch import search
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
        "FITUR :\n"
        "/ss URL WEBSITE - Mengambil screenshot website Yang lu depes\n"
        "/dorking inurl site jumlah - Buat dorking, sabar ya nama nya juga lagi dorking"
    )
    bot.reply_to(message, response)

# Jalankan bot
bot.polling()
