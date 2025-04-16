angular.module('StockNewsApp', [])
.controller('NewsController', function($scope, $http) {
    $scope.searchSymbol = '';
    $scope.articles = [];
    $scope.searched = false;

    const API_KEY = 'heYFx6HDNDiKkSJKm8OlWQcEyWSBmjygA6X6Ks0v';
    const BASE_URL = 'https://api.marketaux.com/v1/news/all';

    $scope.fetchNews = function() {
        $scope.articles = [];
        $scope.searched = true;

        if (!$scope.searchSymbol) return;

        const query = $scope.searchSymbol.toUpperCase();

        const url = `${BASE_URL}?symbols=${query}&filter_entities=true&limit=10&api_token=${API_KEY}`;

        $http.get(url)
            .then(response => {
                $scope.articles = response.data.data || [];
            })
            .catch(error => {
                console.error("Error fetching news:", error);
                $scope.articles = [];
            });
    };
});
