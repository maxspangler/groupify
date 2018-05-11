let today = new Date();
let currentHour = today.getHours();
let userGreeting = document.getElementById('userGreeting');
function setGreeting(element, currentHour, name) {
    if (currentHour < 12) {
        element.innerText = `Good morning, ${name}.`;
    } else if (currentHour < 18) {
        element.innerText = `Good afternoon, ${name}.`;
    } else {
        element.innerText = `Good evening, ${name}.`;
    }
}



