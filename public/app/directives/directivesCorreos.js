app.directive('clearFilters', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                scope.$apply(() => {
                    scope.filtroCorreoDe = undefined;
                    scope.filtroCorreoPara = undefined;
                    scope.filtroCorreoAsunto = undefined;
                    scope.filtroCorreoWrapup = undefined;
                    scope.filtroCorreoFechaI = undefined;
                    scope.filtroCorreoFechaF = undefined;
                    scope.filtroCorreoNotas = undefined;
                });
            })
        }
    }
})

app.directive('replyEmail', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                var request = ApiService.obtenerMensajes(scope.x.conversationId);
                request
                    .then((response) => {
                        var text = "";

                        response.forEach((val, index) => {
                            val.fecha = moment(val.time).format('DD/MM/YYYY HH:mm:ss');
                            text += val.htmlBody;
                        });

                        var body = {
                            "queueId": scope.x.queueId,
                            "toAddress": scope.x.direccion == "inbound" ? scope.x.de: scope.x.para,
                            "subject": scope.x.asunto,
                            "direction": "OUTBOUND",
                            "htmlBody": text
                        }

                        var request = ApiService.createEmail(scope.$parent.Token, body);
                        request
                            .then((resp) => {

                            })
                            .catch((err) => {
                                console.log(error);
                            })
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            })
        }
    }
})

app.directive('showModal', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                var request = ApiService.obtenerMensajes(scope.x.conversationId);
                request
                    .then((response) => {
                        scope.$parent.curItem = scope.x;
                        scope.$parent.curEmailMessages = response;

                        response.forEach((val, index) => {
                            val.fecha = moment(val.time).format('DD/MM/YYYY HH:mm:ss');
                        });

                        $('#contentModal').modal('show');
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            })
        }
    }
})

app.directive('changePageOut', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                scope.$apply(scope.$parent.currentPageOut = scope.y);
            })
        }
    }
})

app.directive('changePageInb', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                scope.$apply(scope.$parent.currentPageInb = scope.t);
            })
        }
    }
})

app.directive('addPageOut', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                if (scope.currentPageOut < scope.outboundPages.length) {
                    scope.$apply(scope.currentPageOut++);
                } else {
                    scope.$apply(scope.currentPageOut = 1);
                }

            })
        }
    }
})

app.directive('subtractPageOut', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                if (scope.currentPageOut >= scope.outboundPages.length || scope.currentPageOut == 2) {
                    scope.$apply(scope.currentPageOut--);
                } else {
                    scope.$apply(scope.currentPageOut = scope.outboundPages.length);
                }
            })
        }
    }
})

app.directive('addPageIn', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                if (scope.currentPageInb < scope.inboundPages.length) {
                    scope.$apply(scope.currentPageInb++);
                } else {
                    scope.$apply(scope.currentPageInb = 1);
                }

            })
        }
    }
})

app.directive('subtractPageIn', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                if (scope.currentPageInb >= scope.inboundPages.length || scope.currentPageInb == 2) {
                    scope.$apply(scope.currentPageInb--);
                } else {
                    scope.$apply(scope.currentPageInb = scope.inboundPages.length);
                }
            })
        }
    }
})