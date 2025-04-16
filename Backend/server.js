const http = require("http");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const https = require("https");
const { parse } = require("querystring");
require("dotenv").config();

const API_KEY = "NXB4EJ8M06ZCV6UL"; 
const BASE_URL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&apikey=${API_KEY}&symbol=`;

// MySQL DB Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "stock_portfolio",
  port: 3306,
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL connected!");
});

// Mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === "/register" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const { username, email, password } = JSON.parse(body);
      if (!username || !email || !password) {
        res.writeHead(400);
        return res.end(JSON.stringify({ message: "All fields are required" }));
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
      db.query(sql, [username, email, hashedPassword], (err) => {
        if (err) {
          res.writeHead(500);
          return res.end(JSON.stringify({ message: "User already exists or DB error" }));
        }
        res.writeHead(201);
        res.end(JSON.stringify({ message: "User registered successfully" }));
      });
    });
  } else if (req.url === "/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { username, password } = JSON.parse(body);
      const sql = "SELECT * FROM users WHERE username = ?";
      db.query(sql, [username], async (err, results) => {
        if (err || results.length === 0) {
          res.writeHead(401);
          return res.end(JSON.stringify({ message: "Invalid username or password" }));
        }
        const match = await bcrypt.compare(password, results[0].password);
        if (!match) {
          res.writeHead(401);
          return res.end(JSON.stringify({ message: "Invalid username or password" }));
        }
        res.writeHead(200);
        res.end(JSON.stringify({ message: "Login successful" }));
      });
    });
  } else if (req.url === "/set-alert" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { symbol, targetPrice, email } = JSON.parse(body);
        console.log("Received alert data:", { symbol, targetPrice, email });
        
        if (!symbol || !targetPrice || !email) {
          res.writeHead(400);
          return res.end(JSON.stringify({ message: "All fields are required" }));
        }
        
        // First, check if the table exists and log its structure
        db.query("DESCRIBE alerts", (err, fields) => {
          if (err) {
            console.error("Error checking alerts table:", err);
            res.writeHead(500);
            return res.end(JSON.stringify({ message: "Error validating database structure" }));
          }
          
          console.log("Alerts table fields:", fields);
          
          // Now insert the alert with proper data conversion
          const sql = "INSERT INTO alerts (stock_symbol, target_price, email) VALUES (?, ?, ?)";
          
          // Ensure targetPrice is a number
          const numericTargetPrice = parseFloat(targetPrice);
          
          db.query(sql, [symbol.toUpperCase(), numericTargetPrice, email], (err, result) => {
            if (err) {
              console.error("Error inserting alert - FULL ERROR:", err);
              console.error("Error code:", err.code);
              console.error("Error message:", err.message);
              res.writeHead(500);
              return res.end(JSON.stringify({ message: "DB Error: Could not store alert" }));
            }
            
            console.log("Alert inserted successfully:", result);
            res.writeHead(200);
            res.end(JSON.stringify({ message: "Alert set successfully" }));
          });
        });
      } catch (err) {
        console.error("JSON parsing error:", err);
        res.writeHead(400);
        return res.end(JSON.stringify({ message: "Invalid request format" }));
      }
    });
  } else if (req.url === "/portfolio" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const { username, symbol, quantity, purchasePrice } = JSON.parse(body);
      if (!username || !symbol || !quantity || !purchasePrice) {
        res.writeHead(400);
        return res.end(JSON.stringify({ message: "All fields are required" }));
      }
      const sql = "INSERT INTO portfolio (username, symbol, quantity, purchase_price) VALUES (?, ?, ?, ?)";
      db.query(sql, [username, symbol, quantity, purchasePrice], (err) => {
        if (err) {
          res.writeHead(500);
          return res.end(JSON.stringify({ message: "Failed to add to portfolio" }));
        }
        res.writeHead(201);
        res.end(JSON.stringify({ message: "Stock added to portfolio" }));
      });
    });
  } else if (req.url.startsWith("/portfolio") && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const username = url.searchParams.get("username");
    if (!username) {
      res.writeHead(400);
      return res.end(JSON.stringify({ message: "Username is required" }));
    }
    const sql = "SELECT * FROM portfolio WHERE username = ?";
    db.query(sql, [username], (err, results) => {
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify({ message: "Failed to fetch portfolio" }));
      }
      res.writeHead(200);
      res.end(JSON.stringify(results));
    });
  } else if (req.url === "/portfolio" && req.method === "DELETE") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const { username, symbol } = JSON.parse(body);
      if (!username || !symbol) {
        res.writeHead(400);
        return res.end(JSON.stringify({ message: "Username and symbol required" }));
      }
      const sql = "DELETE FROM portfolio WHERE username = ? AND symbol = ?";
      db.query(sql, [username, symbol], (err) => {
        if (err) {
          res.writeHead(500);
          return res.end(JSON.stringify({ message: "Failed to delete stock" }));
        }
        res.writeHead(200);
        res.end(JSON.stringify({ message: "Stock deleted from portfolio" }));
      });
    });
  } else if (req.url === "/historical" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        console.log("Request body:", body); // Log the raw request body
        const { symbol } = JSON.parse(body);
        if (!symbol) {
          console.log("Symbol is missing in the request body");
          res.writeHead(400);
          return res.end(JSON.stringify({ message: "Symbol is required" }));
        }

        const sql = `
          SELECT date, close 
          FROM historical_data 
          WHERE stock_symbol = ? 
          ORDER BY date DESC 
          LIMIT 30
        `;
        console.log("Executing SQL query:", sql, "with symbol:", symbol);

        db.query(sql, [symbol], (err, results) => {
          if (err) {
            console.error("Database error:", err);
            res.writeHead(500);
            return res.end(JSON.stringify({ message: "DB error" }));
          }

          if (results.length === 0) {
            console.log("No historical data found for symbol:", symbol);
            res.writeHead(404);
            return res.end(JSON.stringify({ message: "No data found" }));
          }

          const history = results.reverse(); // oldest date first
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(history));
        });
      } catch (err) {
        console.error("Error parsing JSON or processing request:", err);
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Invalid JSON" }));
      }
    });
  } else if (req.url === "/test-email" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { email } = JSON.parse(body);
        if (!email) {
          res.writeHead(400);
          return res.end(JSON.stringify({ message: "Email is required" }));
        }
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Stock Alert System Test Email",
          text: "This is a test email from your Stock Alert System."
        };
        
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error("Test email failed:", err);
            res.writeHead(500);
            return res.end(JSON.stringify({ message: "Failed to send test email", error: err.message }));
          }
          console.log("Test email sent:", info.response);
          res.writeHead(200);
          res.end(JSON.stringify({ message: "Test email sent successfully" }));
        });
      } catch (err) {
        console.error("Error parsing JSON:", err);
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Invalid JSON" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

// Manually trigger check for an alert
const checkAlertNow = (alertId) => {
  const sql = "SELECT * FROM alerts WHERE id = ?";
  db.query(sql, [alertId], (err, results) => {
    if (err || results.length === 0) {
      return console.error("Error fetching alert or alert not found:", err);
    }
    
    const alert = results[0];
    console.log("Manually checking alert:", alert);
    
    if (!alert.stock_symbol) {
      return console.error("Missing stock_symbol in alert:", alert);
    }
    
    const url = BASE_URL + alert.stock_symbol;
    https.get(url, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => (data += chunk));
      apiRes.on("end", () => {
        try {
          console.log("API response data:", data);
          const parsed = JSON.parse(data);
          
          if (!parsed["Global Quote"] || !parsed["Global Quote"]["05. price"]) {
            return console.error("Invalid API response format:", parsed);
          }
          
          const price = parseFloat(parsed["Global Quote"]["05. price"]);
          console.log(`Current price for ${alert.stock_symbol}: ${price}, Target: ${alert.target_price}`);
          
          // Always send email for manual check (for testing)
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: alert.email,
            subject: `Stock Alert: ${alert.stock_symbol}`,
            text: `${alert.stock_symbol} current price is ${price}. Your target price is ${alert.target_price}.`,
          };
          
          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.error("Email failed:", err);
            } else {
              console.log(`Email sent to ${alert.email}: ${info.response}`);
            }
          });
        } catch (e) {
          console.error("Failed to parse API data:", e);
        }
      });
    }).on("error", (err) => {
      console.error("API request error:", err);
    });
  });
};

// Expose function to global scope for manual testing
global.checkAlertNow = checkAlertNow;

// Periodic price alert check (still uses API)
setInterval(() => {
  const sql = "SELECT * FROM alerts";
  db.query(sql, (err, results) => {
    if (err) return console.error("Error fetching alerts:", err);
    console.log(`Checking ${results.length} alerts`);
    
    results.forEach((alert) => {
      console.log("Alert fetched from database:", alert); // Log the alert object
      
      if (!alert.stock_symbol) {
        console.error("Missing stock_symbol in alert:", alert);
        return;
      }
      
      const url = BASE_URL + alert.stock_symbol;
      https.get(url, (apiRes) => {
        let data = "";
        apiRes.on("data", (chunk) => (data += chunk));
        apiRes.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            
            if (!parsed["Global Quote"] || !parsed["Global Quote"]["05. price"]) {
              console.error("Invalid API response format:", parsed);
              return;
            }
            
            const price = parseFloat(parsed["Global Quote"]["05. price"]);
            console.log(`Current price for ${alert.stock_symbol}: ${price}, Target: ${alert.target_price}`);
            
            if (price >= alert.target_price) {
              const mailOptions = {
                from: process.env.EMAIL_USER,
                to: alert.email,
                subject: `Stock Alert: ${alert.stock_symbol}`,
                text: `${alert.stock_symbol} has reached your target price of ${alert.target_price}. Current Price: ${price}`,
              };
              
              transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                  console.error("Email failed:", err);
                } else {
                  console.log(`Email sent to ${alert.email}: ${info.response}`);
                  // Only delete if email was successfully sent
                  db.query("DELETE FROM alerts WHERE id = ?", [alert.id]);
                }
              });
            }
          } catch (e) {
            console.error("Failed to parse API data for", alert.stock_symbol, e);
          }
        });
      }).on("error", (err) => {
        console.error("API request error for", alert.stock_symbol, err);
      });
    });
  });
}, 60000);

server.listen(3000, () => console.log("Server running at http://localhost:3000"));