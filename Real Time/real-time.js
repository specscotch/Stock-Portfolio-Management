var app = angular.module('StockApp', []);

app.controller('StockTrackerController', ['$scope', '$http', function($scope, $http) {
    $scope.stockSymbol = '';
    $scope.stockData = {};
    $scope.errorMessage = '';

    $scope.fetchStockData = function() {
        $scope.errorMessage = '';
        $scope.stockData = {};

        if (!$scope.stockSymbol) {
            $scope.errorMessage = "Please enter a stock symbol.";
            return;
        }

        const symbol = $scope.stockSymbol.toUpperCase();
        const apiKey = 'NXB4EJ8M06ZCV6UL'; 
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

        $http.get(url).then(function(response) {
            const timeSeries = response.data['Time Series (Daily)'];
            if (timeSeries) {
                const latestDate = Object.keys(timeSeries)[0];
                const latestData = timeSeries[latestDate];

                $scope.stockData = {
                    symbol: symbol,
                    price: parseFloat(latestData['4. close']).toFixed(2),
                    date: latestDate
                };
            } else {
                $scope.errorMessage = "Invalid symbol or data not found.";
            }
        }).catch(function(error) {
            console.error("Error fetching data:", error);
            $scope.errorMessage = "Failed to fetch stock data. Try again later.";
        });
    };
}]);
