app.controller('mainController', ['$scope', 'ApiService', function ($scope, ApiService) {

	const platformClient = require('platformClient');
    $scope.Token = {};
    $scope.cloudUser =  {
        id: '',
        name: '',
        username: '',
        queues: []
    }

    $scope.regex = '/^[0-9]*$/';

    $scope.CheckSession = function () {
        var n = 'access_token';
        $scope.Token = ApiService.getUrlVars(n);

        if (!$scope.Token) {
            var req = ApiService.getClientId();
            req.then(function (response) {
                clientId = response.clientId;
                ApiService.cloudLogin(clientId);
            });
        }
    };

    $scope.getUser = function () {
        platformClient.ApiClient.instance.authentications['PureCloud Auth'].accessToken = $scope.Token;
        var users = new platformClient.UsersApi();

        users.getUsersMe().then(function (userObject) {
            $scope.cloudUser.id = userObject.id;
            $scope.cloudUser.name = userObject.name;
            $scope.cloudUser.username = userObject.username;
            $scope.getQueues($scope.cloudUser.id);
            var request = ApiService.getTemplates();
            request.then(function (response) {
                $scope.templates = response;
                $scope.templates.forEach(function (val, index) {
                    val.variables.forEach(function (v, i) {
                        if (v.name == 'nombre_agente') {
                            v.valor = $scope.cloudUser.name
                        }
                    })
                })
            })
            
        });
    }

    $scope.getQueues = function (userId) {
        var queues = new platformClient.UsersApi();
        var opts = {
            'pageSize': 100,
            'pageNumber': 1
        }

        queues.getUserQueues(userId, opts).then(function (data) {
            data.entities.forEach(function (arr, index) {
                $scope.cloudUser.queues.push({ 'id': arr.id, 'name': arr.name });
            })
        })
    }

    $scope.CheckSession();

    $scope.getUser();
}]);