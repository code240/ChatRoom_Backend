const UserCode = (existing_code) => {
    newCode = "";
    const chars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','1','2','3','4','5','6','7','8','9','0','*'];
    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    while(true){
        for(let i = 0; i < 4; i++){
            r = getRandomInt(36);
            newCode += chars[r];
        }
        if(!existing_code.includes(newCode)){
            break;
        }    
    }
    return newCode;
}

module.exports = UserCode;