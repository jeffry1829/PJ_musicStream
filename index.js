var config = require('./lib/config.js');
var express = require('express');
var app = express();
var jsmediatags = require('jsmediatags');
var recursive = require('recursive-readdir');
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
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.static(__dirname+'/web'));
app.use('/songs',express.static(songpath));
app.listen(3000);
app.get('/', function(req, res){
	res.sendFile(__dirname+'/web/index.html');
})
app.post('/getCurrent',function(req, res){
	res.json(CurrentSong);
});
app.post('/setCurrent',function(req, res){
	console.log('Router /setCurrent => req.body');
	console.dir(req.body);
	
	var s_id = req.body.s_id;
	var start_time = req.body.start_time;
	setCurrent(s_id,start_time);
});
app.post('/getList',function(req, res){
	res.json(SongList);
});

function setCurrent(s_id, start_time){
	console.log('setCurrent => SongList');
	console.dir(SongList);
	console.log('setCurrent => s_id');
	console.log(s_id);
	
	if(!s_id && s_id !== 0){
		s_id=0;
	}
	
	CurrentSong = Object.assign(CurrentSong, SongList[s_id]);
	CurrentSong.now_Len = 0;
	delete CurrentSong['s_path'];
	
	console.log('setCurrent => CurrentSong');
	console.dir(CurrentSong);
}
function s_reload(this_f_path){
	recursive(this_f_path, function(err, files){
		// file order is not garenteed
		files.forEach(function(file){
			file = path.resolve(file);
			jsmediatags.read(file, {
				onSuccess: function(result){
					var tags = result.tags;
					mp3duration(file, function(err, duration){
						SongList[tmp_s_no] = {
								s_path: file,
								s_name: tags.title, // why is there a "title" tag?!, it's not mentioned in the document!
								s_id: tmp_s_no++,
								s_url: '/songs/'+path.relative(songpath,file),
								s_t: duration,
								s_description: {
									artist: tags.artist,
									album: tags.album
								}
						};
					})
			  },
			  onError: function(error){
			    console.log(':(', error.type, error.info);
			  }
			})
		})
	})
}
function START(){
	s_reload(songpath);
}
setInterval(function(){
	if(CurrentSong.s_id || CurrentSong.s_id === 0){
		if(!CurrentSong.now_Len && CurrentSong.now_Len !== 0){
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