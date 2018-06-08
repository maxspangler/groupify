module.exports = {
    checkForInputErrors: function(data) {
        let errors = [];
        for (var key in data){

            // if(key.includes('roomTypeSelect') && req.body[key] === '') {
            //     errors.push({text: 'room type'})
            // }
            if(key.includes('purposedRate') && data[key] === '') {
                errors.push({text: 'Please completely fill out the proposal'})
            }
            // if(key.includes('roomsPerNight') && req.body[key] === '') {
            //     errors.push({text: 'per night'})
            // }
        }

        if(!data.groupName) errors.push({text: 'Please add a group name'});
        if(!data.groupDateFrom) errors.push({text: 'Please add an arrival date'});
        if(!data.groupDateTo) errors.push({text: 'Please add a departure date'});
    //    if(!req.body.roomTypeSelect) errors.push({text: 'Please add a room type'});
    //    if(!req.body.purposedRate) errors.push({text: 'Please add propose a rate'});
    //    if(!req.body.roomsPerNight) errors.push({text: 'Please add rooms'});
        if(!data.sourceOfBusiness) errors.push({text: 'Please add a source of business'});
        if(!data.conferenceOption) errors.push({text: 'Please add a conference option'});

        return errors;

    }
}