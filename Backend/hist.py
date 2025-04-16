# This script downloads historical stock data for a list of symbols and inserts it into a MySQL database.
import yfinance as yf
import mysql.connector

# 🔹 List of stock symbols
stock_symbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN','NFLX', 'META', 'NVDA', 'AMD', 'INTC', 'CSCO', 'IBM', 'ORCL', 'QCOM', 'TXN', 'AVGO', 'ADBE', 'CRM', 'PYPL', 'INTU']  

# 🔹 Date range
start_date = '2024-02-01'
end_date = '2024-02-28'

# 🔹 MySQL connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='root',
    database='stock_portfolio'
)
cursor = conn.cursor()

# 🔹 Loop through each stock and insert data
for symbol in stock_symbols:
    print(f"📥 Downloading data for {symbol}...")
    data = yf.download(symbol, start=start_date, end=end_date)

    if data.empty:
        print(f"⚠️ No data found for {symbol}. Skipping.")
        continue

    for index, row in data.iterrows():
        sql = """
        INSERT INTO historical_data (stock_symbol, date, open, high, low, close, volume)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            open = VALUES(open),
            high = VALUES(high),
            low = VALUES(low),
            close = VALUES(close),
            volume = VALUES(volume)
        """
        cursor.execute(sql, (
            symbol,
            index.date(),
            float(row['Open']),
            float(row['High']),
            float(row['Low']),
            float(row['Close']),
            int(row['Volume'])
        ))

    print(f"✅ Inserted data for {symbol}")

# 🔹 Cleanup
conn.commit()
cursor.close()
conn.close()
print("🎉 All data inserted successfully!")
