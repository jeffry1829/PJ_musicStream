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
var jsonfile = require('jsonfile');
var queryString = require('query-string');
var getYouTubeID = require('get-youtube-id');
var youtubeInfo = require('youtube-info');

var y_config = './y_config.json';
var y_Ss = jsonfile.readFileSync(y_config) ? jsonfile.readFileSync(y_config) : []; // init stat

var songpath=config['songpath'];
songpath=path.resolve(songpath);
var CurrentSong={};
var SongList={};
var QueueList=[];
var tmp_s_no=0;
var default_start_time = -3;
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
app.post('/setCurrent',function(req, res){ // Won't be used now
	console.log('Router /setCurrent => req.body');
	console.dir(req.body);
	
	var s_id = req.body.s_id;
	var start_time = req.body.start_time;
	
	setCurrent(s_id,start_time);
	res.end();
});
app.post('/getQueue', function(req, res){
	res.json(QueueList);
});
app.post('/addQueue', function(req, res){
	addQueue(req.body.s_id, req.body.start_time);
	res.end();
});
app.post('/forcePlay', function(req, res){
	forcePlay(req.body.queue_index);
	res.end();
});
app.post('/removeQueue', function(req, res){
	removeQueue(req.body.queue_index);
	res.end();
});
app.post('/getList',function(req, res){
	res.json(SongList);
});
app.post('/addYoutube', function(req, res){
	var y_url = req.body.url;
	if(y_Ss.indexOf(y_url) === -1){
		y_Ss.push(y_url);
		jsonfile.writeFileSync(y_config, y_Ss);
		youtubeInfo(getYouTubeID(y_url), function(info){
			SongList[tmp_s_no] = {
					s_path: false,
					s_name: info.title,
					s_id: tmp_s_no++,
					y_url: info.url, // changed to y_url
					s_t: info.duration,
					s_type: 'Youtube',
					s_description: {
						owner: info.owner // !!! owner !!!
					}
			};
		});
	}
	res.end();
});
function forcePlay(queue_index){
	setCurrent(QueueList[queue_index].s_id, QueueList[queue_index].start_time);
	removeQueue(queue_index);
}
function removeQueue(queue_index){
	QueueList.splice(queue_index, 1);
}
function setCurrent(s_id, start_time){
	console.log('setCurrent => SongList');
	console.dir(SongList);
	console.log('setCurrent => s_id');
	console.log(s_id);
	
	if(!s_id && s_id !== 0){
		s_id=0;
	}
	
	CurrentSong = Object.assign(CurrentSong, SongList[s_id]);
	CurrentSong.now_Len = start_time;
	delete CurrentSong['s_path'];
	
	console.log('setCurrent => CurrentSong');
	console.dir(CurrentSong);
}
function addQueue(s_id, start_time){
	if(!CurrentSong.s_id && CurrentSong.s_id !== 0){
		setCurrent(s_id, start_time);
		return;
	}
	
	var queueItem = {};
	Object.assign(queueItem, SongList[s_id]);
	delete queueItem['s_path'];
	queueItem.s_id = s_id;
	queueItem.start_time = start_time;
	QueueList.push(queueItem);
}
function s_reload(this_f_path){
	// load Youtubes first , reload y_config
	y_Ss = jsonfile.readFileSync(y_config) ? jsonfile.readFileSync(y_config) : [];
	y.Ss.forEach(function(y_url){
		youtubeInfo(getYouTubeID(y_url), function(info){
			SongList[tmp_s_no] = {
					s_path: false,
					s_name: info.title,
					s_id: tmp_s_no++,
					y_url: y_url, // changed to y_url
					y_id: getYouTubeID(y_url), // shortcut
					s_t: info.duration,
					s_type: 'Youtube',
					s_description: {
						owner: info.owner // !!! owner !!!
					}
			};
		});
	});
	
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
								s_type: path.dirname(path.relative(songpath,file)) === '.' ? 'ROOT' : path.dirname(path.relative(songpath,file)), // new added property!
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
			CurrentSong.now_Len = default_start_time;
		}else{
			if(CurrentSong.s_t - CurrentSong.now_Len > 0){
				CurrentSong.now_Len++;
			}else{//start [When the song is over]
				if(QueueList[0]){
					setCurrent(QueueList.shift().s_id, default_start_time);
				}else if(SongList[CurrentSong.s_id+1]){
					setCurrent(CurrentSong.s_id+1, default_start_time);
				}else{
					setCurrent(0, default_start_time);
				}
			}//end
		}
	}
},1000);