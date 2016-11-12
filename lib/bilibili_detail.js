//http://www.bilibilijj.com/apiword/
//http://www.bilibilijj.com/Api/AvToCid/{Av}/{P}
//list=>Mp4Url time(desc) title img code
/*
    return structure
    {
        mp4: mp4url
        title: title
        time: time sec
        img: imgurl
    }
*/
var request = require('sync-request');
function get_av(av){
    var json = JSON.parse(request('GET', 'http://www.bilibilijj.com/Api/AvToCid/'+av).getBody());
    if(json.code !== 0){
        return new Error('request not success');
    }
    return {
        mp4: json.list[0].Mp4Url,
        title: json.title,
        time: Math.round(50000), //never mind
        img: json.img
    };
}
module.exports = get_av;