module.exports = {
    validateUserInput: function(data) {
        let errors = []
        if(data.password != data.password2){
            errors.push({text:'Passwords do not match'});
          }
        
        if(data.password.length < 4){
            errors.push({text:'Password must be at least 4 characters'});
          }
        return errors;
    }
}