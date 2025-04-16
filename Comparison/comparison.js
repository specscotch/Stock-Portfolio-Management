angular.module('StockCompareApp', [])
.controller('StockCompareController', function($scope) {
    $scope.symbol1 = '';
    $scope.symbol2 = '';

    const API_KEY = 'NXB4EJ8M06ZCV6UL';
    const BASE_URL = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&apikey=' + API_KEY;

    $scope.compareStocks = async function() {
        const symbols = [$scope.symbol1.toUpperCase(), $scope.symbol2.toUpperCase()];
        const datasets = [];
        let labels = [];

        for (let symbol of symbols) {
            try {
                const response = await fetch(`${BASE_URL}&symbol=${symbol}`);
                const data = await response.json();
                const timeSeries = data["Time Series (Daily)"];
                const dates = Object.keys(timeSeries).slice(0, 7).reverse();
                const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));

                if (labels.length === 0) labels = dates;

                datasets.push({
                    label: symbol,
                    data: prices,
                    borderColor: getRandomColor(),
                    fill: false,
                    tension: 0.3
                });
            } catch (err) {
                console.error(`Error fetching ${symbol}:`, err);
            }
        }

        renderChart(labels, datasets);
    };

    function renderChart(labels, datasets) {
        const ctx = document.getElementById('comparisonChart').getContext('2d');
        if (window.chart) window.chart.destroy();
        window.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#000'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#000' }
                    },
                    y: {
                        ticks: { color: '#000' }
                    }
                }
            }
        });
    }

    function getRandomColor() {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
});
