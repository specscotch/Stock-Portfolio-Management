📊 Stock Portfolio Management

Stock Portfolio Management is a comprehensive full-stack web application built to help users manage their stock investments efficiently. It provides a wide range of features including real-time stock tracking, portfolio management, risk analysis, price alerts via email, stock comparisons, and financial news aggregation. The application is designed with a user-friendly interface using AngularJS for the frontend and Node.js (without Express) for the backend. MySQL is used for storing user data, stock alerts, and portfolio information, while stock data is fetched using the Alpha Vantage API.

The application allows users to register and log in to access their personalized dashboard where they can add, view, or delete stocks from their portfolio. Real-time stock prices are displayed alongside detailed statistics and graphical visualizations. Users can set price alerts for specific stocks, and the system automatically monitors those prices at regular intervals. When a target price is reached, an email notification is sent to the registered user using Nodemailer.

In addition to alerts, the app includes a risk analyzer that calculates standard deviation for individual stocks or entire portfolios, helping users assess the volatility and risk of their investments. It also features a stock comparison tool that visually compares the performance of different stocks over time, and a news aggregator that fetches the latest headlines related to the user’s tracked stocks.

This project uses technologies such as HTML, CSS, JavaScript, AngularJS for the frontend, and a custom-built Node.js backend that connects to a MySQL database. The backend handles all core functionalities including user authentication, data storage, API requests, and email delivery. Stock data is retrieved through the Alpha Vantage API, and emails are sent securely using Nodemailer configured with environment variables.

To run the project, clone the repository and set up the database as described in the documentation. Make sure to include your environment variables for email and API credentials in a .env file. Once everything is configured, you can run the server and access the frontend through a browser.



