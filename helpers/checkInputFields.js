module.exports = {
    checkForInputErrors: function(data) {
        let errors = [];

        if(!data.groupName) errors.push({text: 'Please add a group name'});
        if(!data.groupDateFrom) errors.push({text: 'Please add an arrival date'});
        if(!data.groupDateTo) errors.push({text: 'Please add a departure date'});
        // On the edit page, this is error is happening, even though we have a room type
        // if(!data.roomTypeSelect) errors.push({text: 'Please add a room type'});

        for (var key in data){
            if(key.includes('purposedRate') && data[key] === '') {
                errors.push({text: 'Please add a proposed rate'})
            }
            if(key.includes('roomsPerNight') && data[key] === '') {
                errors.push({text: 'Please add rooms per night'})
            }
        }
 
        if(!data.sourceOfBusiness) errors.push({text: 'Please add a source of business'});
        if(!data.conferenceOption) errors.push({text: 'Please add a conference option'});

        return errors;

    }
}