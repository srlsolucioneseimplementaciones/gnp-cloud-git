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
            $scope.obtenerEmails();
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

    $scope.obtenerEmails = () => {
        var request = ApiService.obtenerEmails($scope.cloudUser.id);
        request.then((response) => {

            console.log(response);

            $scope.conversations = [];
            response.forEach((val, index) => {

                var conversation = {
                    conversationId: val.conversationId,
                    fechaInicial: val.conversationStart,
                    fechaFinal: val.conversationEnd,
                    direccion: val.originatingDirection,
                };

                val.participants.forEach((participant, pIndex) => {
                    if (participant.purpose == 'agent') {
                        conversation.de = participant.sessions[0].addressFrom;
                        conversation.para = participant.sessions[0].addressTo;

                        participant.sessions.forEach((session, sIndex) => { 
                            session.segments.forEach((segment, sIndex) => {
                                if (segment.segmentType == 'wrapup') {
                                    
                                    if (!conversation.calificacion) {
                                        conversation.calificacion = segment.wrapUpName;
                                    }

                                    conversation.nota = segment.wrapUpNote;
                                    conversation.asunto = segment.subject;
                                    conversation.queueId = segment.queueId;
                                }
                            })
                        })

                    }
                })

                $scope.conversations.push(conversation);
            })


            $scope.inbound = [];
            $scope.outbound = [];
            
            $scope.conteoInbound = 0;
            $scope.conteoOutbound = 0;

            $scope.currentPageInb = 1;
            $scope.currentPageOut = 1;
            $scope.itemsPerPage = 50;
            $scope.maxSize = 50;
            $scope.totalItemsInb = $scope.conteoInbound;
            $scope.totalItemsOut = $scope.conteoOutbound;

            for (var i = 0; i < $scope.conversations.length; i++) {
                if ($scope.conversations[i].direccion == 'inbound') {
                    $scope.conteoInbound++;
                    $scope.inbound.push($scope.conversations[i]);
                } else {
                    $scope.conteoOutbound++;
                    $scope.outbound.push($scope.conversations[i]);
                    $scope.numOfPagesOutbound();
                    $scope.numOfPagesInbound();
                }
            }
        })
    }

    $scope.numOfPagesOutbound = function () {
        $scope.outboundPages = [];
        for (var i = 0; i < Math.ceil($scope.outbound.length / $scope.itemsPerPage); i++) {
            $scope.outboundPages.push(i + 1);
        }
    };

    $scope.numOfPagesInbound = function () {
        $scope.inboundPages = [];
        for (var i = 0; i < Math.ceil($scope.inbound.length / $scope.itemsPerPage); i++) {
            $scope.inboundPages.push(i + 1);
        }
    };

    $scope.CheckSession();

    $scope.getUser();
}]);