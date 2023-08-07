app.filter("MaxPagesFilter", function() {
    return function(input, currentPage) {
        if(input) {
            let myArr = [];
            let myCurrentPage = currentPage - 1;
            let maxPage = myCurrentPage + 10;

            console.log(myCurrentPage);
            console.log(maxPage);

            for(let i = myCurrentPage; i < maxPage; i++) {
                myArr.push(input[i]);
            }

            console.log(myArr);

            return myArr;
        } else {
            return [];
        }
    }
})
