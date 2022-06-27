app.directive('clearFilters', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                scope.$apply(() => {
                    scope.filtroId = undefined;
                    scope.filtroFecha = undefined;
                    scope.filtroConversationId = undefined;
                    scope.filtroTelefono = undefined;
                    scope.filtroAgente = undefined;
                    scope.filtroCola = undefined;
                });

                scope.obtenerConteoMSJ();
            })
        }
    }
})

app.directive('changePage', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                scope.$apply(scope.$parent.currentPage = scope.t);

                scope.obtenerMSJ();
            })
        }
    }
})

app.directive('addPage', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                if (scope.currentPage < scope.pages.length) {
                    scope.$apply(scope.currentPage++);
                } else {
                    scope.$apply(scope.currentPage = 1);
                }

                scope.obtenerMSJ();
            })
        }
    }
})

app.directive('subtractPage', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                if (scope.currentPage >= scope.pages.length || scope.currentPage == 2) {
                    scope.$apply(scope.currentPage--);
                } else {
                    if (scope.currentPage < scope.pages.length && scope.currentPage > 2) {
                        scope.$apply(scope.currentPage--);
                    } else {
                        scope.$apply(scope.currentPage = scope.pages.length);
                    }
                }

                scope.obtenerMSJ();
            })
        }
    }
})

app.directive('searchMsjId', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                console.log(scope.filtroId);
                scope.obtenerConteoMSJFilter(scope.filtroId, 'Id');
                scope.filtroId = null;
            })
        }
    }
})

app.directive('searchMsjFecha', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoMSJFilter(scope.filtroFecha, 'fecha');
                scope.filtroFecha = null;
            })
        }
    }
})

app.directive('searchMsjTelefono', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoMSJFilter(scope.filtroTelefono, 'telefono');
                scope.filtroTelefono = null;
            })
        }
    }
})

app.directive('searchMsjConversationid', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoMSJFilter(scope.filtroConversationId, 'conversationId');
                scope.filtroConversationId = null;
            })
        }
    }
})

app.directive('searchMsjAgente', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                var request = ApiService.obtenerUserId(scope.filtroAgente);
                request.then((response) => {
                    scope.obtenerConteoMSJFilter(response.recordset[0].userId, 'agentId');
                    scope.filtroAgente = null;
                })
                    .catch((error) => {
                        console.log(error);
                    })
            })
        }
    }
})

app.directive('searchMsjCola', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                var request = ApiService.obtenerQueueId(scope.filtroCola);
                request.then((response) => {
                    scope.obtenerConteoMSJFilter(response.recordset[0].queueId, 'queueId');
                    scope.filtroCola = null;
                })
                    .catch((error) => {
                        console.log(error);
                    })
            })
        }
    }
})
