const keys = require('../config/keys');

module.exports = {
    sendEmail: function(address,sender,title,data) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(keys.sgKey);
        const msg = {
            to: address,
            from: sender,
            subject: title,
            html: data,
            };
            sgMail.send(msg);  
        }
}