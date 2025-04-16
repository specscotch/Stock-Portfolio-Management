// risk.js
const app = angular.module("riskApp", []);

app.controller("RiskController", function ($scope, $http) {
  $scope.symbol = "";
  $scope.benchmark = "";
  $scope.history = [];
  $scope.volatility = 0;
  $scope.errorMessage = "";
  
  // Wait for AngularJS to finish rendering
  app.run(['$rootScope', '$timeout', function($rootScope, $timeout) {
    $rootScope.$on('$viewContentLoaded', function() {
      console.log("View content loaded");
    });
  }]);
  
  $scope.fetchData = function () {
    $scope.history = [];
    $scope.volatility = 0;
    $scope.errorMessage = "";

    if (!$scope.symbol) {
      $scope.errorMessage = "Stock symbol is required";
      return;
    }

    // Fetch stock data
    $http
      .post("http://localhost:3000/historical", { 
        symbol: $scope.symbol.toUpperCase().trim() 
      })
      .then(function (response) {
        if (!response.data || response.data.length === 0) {
          $scope.errorMessage = "No historical data found for " + $scope.symbol;
          return;
        }
        
        $scope.history = response.data;

        // Calculate volatility
        const closes = $scope.history.map((entry) => parseFloat(entry.close));
        const mean = closes.reduce((acc, val) => acc + val, 0) / closes.length;
        const variance = closes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / closes.length;
        $scope.volatility = Math.sqrt(variance).toFixed(4);

        // Explicitly wait for digest cycle to complete and DOM to update
        setTimeout(function() {
          createChart();
        }, 100);
      })
      .catch(function (error) {
        $scope.errorMessage = error.data?.message || "Error fetching historical data";
      });
  };

  function createChart() {
    try {
      // Get the canvas element directly
      const canvas = document.getElementById('priceChart');
      
      // Ensure canvas size is set
      canvas.style.height = '300px';
      canvas.height = canvas.offsetHeight;
      canvas.width = canvas.offsetWidth;
      
      // Prepare data
      const labels = $scope.history.map(item => item.date);
      const data = $scope.history.map(item => parseFloat(item.close));
      
      // Destroy existing chart if any
      if (window.stockChart) {
        window.stockChart.destroy();
      }
      
      // Create new chart with basic configuration
      window.stockChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: $scope.symbol.toUpperCase() + ' Price',
            data: data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1
          }]
        },
        options: {
          animation: false,  // Disable animation for troubleshooting
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          }
        }
      });
    } catch (e) {
      console.error("Chart creation error:", e);
      $scope.errorMessage = "Chart error: " + e.message;
    }
  }
});

// Ensure Chart.js is properly loaded
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded properly!");
  } else {
    console.log("Chart.js is loaded correctly", Chart.version);
  }
});