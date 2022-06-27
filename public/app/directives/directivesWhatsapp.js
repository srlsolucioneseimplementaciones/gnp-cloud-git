app.directive('clearFilters', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                scope.$apply(() => {
                    scope.filtroId = undefined;
                    scope.filtroFecha = undefined;
                    scope.filtroNombre = undefined;
                    scope.filtroTelefono = undefined;
                    scope.filtroUsuario = undefined;
                });

                scope.obtenerConteoHSM();
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

                scope.obtenerHSM();
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

                scope.obtenerHSM();
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

                scope.obtenerHSM();
            })
        }
    }
})

app.directive('searchHsmId', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoHSMFilter(scope.filtroId, 'id');
                scope.filtroId = null;
            })
        }
    }
})

app.directive('searchHsmFecha', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoHSMFilter(scope.filtroFecha, 'fecha');
                scope.filtroFecha = null;
            })
        }
    }
})

app.directive('searchHsmNombre', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoHSMFilter(scope.filtroNombre, 'nombre');
                scope.filtroNombre = null;
            })
        }
    }
})

app.directive('searchHsmTelefono', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoHSMFilter(scope.filtroTelefono, 'telefono');
                scope.filtroTelefono = null;
            })
        }
    }
})

app.directive('searchHsmUsuario', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                var request = ApiService.obtenerUserId(scope.filtroUsuario);
                request.then((response) => {
                    scope.obtenerConteoHSMFilter(response.recordset[0].userId, 'usuario');
                    scope.filtroUsuario = null;
                })
                    .catch((error) => {
                        console.log(error);
                    })
            })
        }
    }
})
