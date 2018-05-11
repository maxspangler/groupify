module.exports = {
    calculateTotalGroupRevenue: function(arr1, arr2) {
        let total = 0;
        for(let i = 0; i < arr1.length; i++) {
            total += arr1[i] * arr2[i]
        }
        return total;
    }
}