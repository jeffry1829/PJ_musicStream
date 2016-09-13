var config = require('./lib/config.js');
var express = require('express');
var app = express();
var id3 = require('music-tag');
var mp3duration = require('mp3-duration');
var path = require('path');
var fs = require('fs');
var fq = require('filequeue');
var bodyParser = require('body-parser');

var songpath=config['songpath'];
songpath=path.resolve(songpath);
var CurrentSong={};
var SongList={};
var tmp_s_no=0;
START();
app.use(bodyParser.json());
app.use(express.static(songpath));
app.listen(3000);
app.get('/', function(req, res){
	res.sendFile(__dirname+'/web/index.html');
})
app.post('/getCurrent',function(req, res){
	res.json(CurrentSong);
});
app.post('/setCurrent',function(req, res){
	var s_id = req.body.s_id;
	var start_time = req.body.start_time;
	setCurrent(s_id,start_time);
});
app.post('/getList',function(req, res){
	res.json(SongList);
});

function setCurrent(s_id=0, start_time=0){
	Object.assign(CurrentSong, SongList[s_id]);
	delete CurrentSong['s_path'];
}
function s_reload(this_f_path){
	id3.read(this_f_path,{recursive: true}).then(function(result){
		var p = result.path;
		p = path.resolve(p);
		var tags = result.tags;
		var duration = mp3duration(p); //sec
		SongList[tags['title']] = {
				s_path: p,
				s_name: tags.title,
				s_id: tmp_s_no++,
				s_url: '/songs/'+p,
				s_t: duration,
				s_description: {
					artist: tags.artist,
					album: tags.album
				}
		};
	}).fail(function(err){
		console.log(err);
		return;
	})
}
function START(){
	s_reload(songpath);
}
setInterval(function(){
	if(CurrentSong.s_id){
		if(!CurrentSong.now_Len){
			CurrentSong.now_Len = 0;
		}else{
			if(CurrentSong.s_t - CurrentSong.now_Len > 0){
				CurrentSong.now_Len++;
			}else{
				CurrentSong.now_Len = 0; //replay
			}
		}
	}
},1000);