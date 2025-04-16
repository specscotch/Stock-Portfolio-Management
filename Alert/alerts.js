const app = angular.module("alertApp", []);

app.controller("AlertController", function ($scope, $http) {
  $scope.alert = {
    symbol: "",
    targetPrice: "",
    email: ""
  };
  $scope.message = "";
  $scope.messageType = "";

  $scope.submitAlert = function () {
    if (!$scope.alert.symbol || !$scope.alert.targetPrice || !$scope.alert.email) {
      $scope.message = "Please fill in all fields.";
      $scope.messageType = "error";
      return;
    }

    const payload = {
      symbol: $scope.alert.symbol.toUpperCase(),
      targetPrice: $scope.alert.targetPrice,
      email: $scope.alert.email
    };

    $http.post("http://localhost:3000/set-alert", payload)
      .then(response => {
        $scope.message = response.data.message;
        $scope.messageType = "success";
        $scope.alert = {}; // Clear the form
        $scope.alertForm.$setPristine();
        $scope.alertForm.$setUntouched();
      })
      .catch(err => {
        $scope.message = err.data?.message || "Server error. Try again.";
        $scope.messageType = "error";
      });
  };
});
