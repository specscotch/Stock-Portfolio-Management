const app = angular.module('PortfolioApp', []);

app.controller('PortfolioController', ['$scope', '$http', function($scope, $http) {
  $scope.portfolio = [];
  $scope.newStock = {};


  const API_KEY = 'NXB4EJ8M06ZCV6UL';

  $scope.addStock = function() {
    const stock = angular.copy($scope.newStock);
    stock.symbol = stock.symbol.toUpperCase();
    $scope.portfolio.push(stock);
    $scope.newStock = {};

    fetchCurrentPrice(stock, $scope.portfolio.length - 1);
  };

  $scope.removeStock = function(index) {
    $scope.portfolio.splice(index, 1);
    renderChart(); 
  };

  function fetchCurrentPrice(stock, index) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock.symbol}&apikey=${API_KEY}`;

    $http.get(url).then(response => {
      const data = response.data['Time Series (Daily)'];
      if (data) {
        const latestDate = Object.keys(data)[0];
        const close = parseFloat(data[latestDate]['4. close']);
        const totalValue = close * stock.quantity;
        const profitLoss = (close - stock.buyPrice) * stock.quantity;

        $scope.portfolio[index].currentPrice = close.toFixed(2);
        $scope.portfolio[index].totalValue = totalValue.toFixed(2);
        $scope.portfolio[index].profitLoss = profitLoss.toFixed(2);

        renderChart();
      } else {
        $scope.portfolio[index].currentPrice = 'N/A';
        $scope.portfolio[index].totalValue = '0.00';
        $scope.portfolio[index].profitLoss = '0.00';
      }
    }, error => {
      console.error('API error:', error);
    });
  }

  function renderChart() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    const labels = $scope.portfolio.map(stock => stock.symbol);
    const data = $scope.portfolio.map(stock => parseFloat(stock.totalValue));

    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Portfolio Value',
          data: data,
          backgroundColor: '#008000',
          borderColor: '#000000',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}]);
