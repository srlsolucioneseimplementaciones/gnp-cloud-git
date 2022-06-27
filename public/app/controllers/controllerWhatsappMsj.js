app.controller('mainController', ['$scope', 'ApiService', '$timeout', function ($scope, ApiService, $timeout) {
    const platformClient = require('platformClient');


    $scope.Token = {};
    $scope.cloudUser =  {
        id: '',
        name: '',
        username: '',
        queues: []
    }

    $scope.itemsPerPage = 50;
    $scope.currentPage = 1;
    $scope.pages = [];
    $scope.ids = [];
    $scope.filter = false;

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
            $scope.conteoPaginas = $scope.obtenerConteoMSJ();
        });
    }

    $scope.getQueues = (userId) =>  {
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

    $scope.obtenerMSJ = () => {
        var query = '';

        var firstId = $scope.currentPage * $scope.itemsPerPage - $scope.itemsPerPage;
        var lastId = ($scope.currentPage * $scope.itemsPerPage - 1) > $scope.ids.length ? $scope.ids.length - 1 : $scope.currentPage * $scope.itemsPerPage - 1;

        for (var i = firstId; i <= lastId; i++) {
            query = query + $scope.ids[i] + ',';
        }

        query = query.slice(0, -1);
        
        var request = ApiService.obtenerMSJ(query);
        request.then((response) => {
            $scope.registros = response;
        })
    }

    $scope.obtenerMSJFilter = () => {
        var query = '';

        var firstId = $scope.currentPage * $scope.itemsPerPage - $scope.itemsPerPage;
        var lastId = ($scope.currentPage * $scope.itemsPerPage - 1) > $scope.ids.length ? $scope.ids.length - 1 : $scope.currentPage * $scope.itemsPerPage - 1;

        for (var i = firstId; i <= lastId; i++) {
            query = query + $scope.ids[i] + ',';
        }

        query = query.slice(0, -1);

        var request = ApiService.obtenerMSJFilter(query);
        request.then((response) => {
            $scope.registros = response;
        })
        .catch((error) => {
            console.log(error);
        })
    }

    $scope.obtenerConteoMSJ = () => {
        $scope.filter = false;
        $scope.currentPage = 1;
        $scope.pages = [];
        $scope.ids = [];
        var request = ApiService.obtenerConteoMSJ();
        request.then((response) => {
            $scope.ids = response;

            for (var i = 0; i < (Math.ceil(Number(response.length) / $scope.itemsPerPage)) ; i++) {
                try {
                    $scope.pages.push(i + 1);
                } catch (e) {

                }
            }

            $scope.obtenerMSJ();
        })
    }

    $scope.obtenerConteoMSJFilter = (query, field) => {
        $scope.filter = true;
        $scope.currentPage = 1;
        $scope.pages = [];
        $scope.ids = [];

        var request = ApiService.obtenerConteoMSJFilter(query, field);
        request.then((response) => {
            $scope.ids = response.data;
            for (var i = 0; i < (Math.ceil(Number(response.data.length) / $scope.itemsPerPage)); i++) {
                try {
                    $scope.pages.push(i + 1);
                } catch (e) {
                    console.log(e);
                }
            }

            $scope.obtenerMSJ();
        })
    }

    $scope.downloadReportMSJ = () => {
        var request = ApiService.downloadReportMSJ($scope.ids);
        request.then((response) => {
            var a = document.createElement('a');
            document.body.appendChild(a);
            a.download = "reporteMensajes.csv";
            a.href = "https://941b-54-208-78-74.ngrok.io/reporteMSJ.csv";
            a.click();
        })
            .catch((error) => {
                console.log(error);
            })
    }

    $scope.CheckSession();
    $scope.getUser();
}]);