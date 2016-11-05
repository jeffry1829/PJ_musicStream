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
var createIfNotExist = require("create-if-not-exist");
var escape = require('escape-html');
var http = require('http');
var q = require('queue')({
	concurrency: config.concurrency // maximum async work at a time
});
q.setMaxListeners(0); // disable limitation
q.on('success', function(result){
	console.log('one song loaded');
});
if(!fs.existsSync('./cached_pics')){
	fs.mkdirSync('./cached_pics');
}
process.on('uncaughtException', function(err){
	console.log('uncaughtException event! => '+err);
	console.log(err.stack);
});

var io = require('socket.io')(app.listen(config.port)); // I really don't know why it works

var y_config = path.resolve('./y_config.json');
createIfNotExist(y_config, '[]');
var y_Ss = jsonfile.readFileSync(y_config) ? jsonfile.readFileSync(y_config) : []; // init stat
var s_cache_path = path.resolve('./s_cache.json');
createIfNotExist(s_cache_path, '{}');
var s_cache = jsonfile.readFileSync(s_cache_path) ? jsonfile.readFileSync(s_cache_path) : {};

var songpath=config.songpath;
songpath=path.resolve(songpath);
var picpath=config.picpath;
picpath=path.resolve(picpath);
var CurrentSong={};
var SongList={dir_cover: {}};
var QueueList=[];
var tmp_s_no=0;
var default_start_time = -3;
var is_pause = false;
var is_user_set_to_pause = false;
var online_count = 0;
START();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.static(__dirname+'/web'));
app.use('/songs',express.static(songpath, {
	dotfiles: "allow"
}));
app.use('/embbedpics',express.static(picpath, {
	dotfiles: "allow"
}));
app.get('/', function(req, res){
	res.sendFile(__dirname+'/web/index.html');
});
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
/*
app.post('/addQueue', function(req, res){
	addQueue(req.body.s_id, req.body.start_time);
	res.end();
});
*/
app.post('/forcePlay', function(req, res){
	forcePlay(req.body.queue_index);
	io.emit('QueueBeenSet', QueueList);
	res.end();
});
app.post('/removeQueue', function(req, res){
	removeQueue(req.body.queue_index);
	io.emit('QueueBeenSet', QueueList);
	res.end();
});
app.post('/removeYoutube', function(req, res){
	removeYoutube(req.body.youtube_s_id);
	res.json({message: 'i really dont know why i should add a json here'});
});
app.post('/getList',function(req, res){
	res.json(SongList);
});
app.post('/GlobalPause', function(req, res){
	is_pause = true;
	is_user_set_to_pause = true;
	res.end();
});
app.post('/GlobalPlay', function(req, res){
	is_pause = false;
	is_user_set_to_pause = false;
	res.end(); 
});
app.post('/addYoutube', function(req, res){
	var y_url = req.body.url;
	if(y_Ss.indexOf(y_url) === -1){
		y_Ss.push(y_url);
		jsonfile.writeFileSync(y_config, y_Ss);
		youtubeInfo(getYouTubeID(y_url, {fuzzy: false}), function(err, info){
			if(err){
				console.log(err);
				res.end();
				return;
			}
			SongList[tmp_s_no] = {
					s_path: false,
					s_name: info.title,
					s_id: tmp_s_no++,
					y_url: info.url, // changed to y_url
					y_id: getYouTubeID(y_url, {fuzzy: false}), // shortcut
					s_t: info.duration,
					s_type: 'Youtube',
					s_description: {
						owner: info.owner // !!! owner !!!
					}
			};
			res.json({message: 'why should i add json here'});
		});
	}
});

io.on('connection', function(socket){
	online_count++;
	io.emit('online_count', {online_count: online_count});
	
	if(online_count > 0 && is_pause && !is_user_set_to_pause){
		is_pause = false;
	}
	
	socket.on('addQueue', function(s_id, start_time){
		addQueue(s_id, start_time);
		io.emit('QueueBeenSet', QueueList);
	});
	
	socket.on('disconnect', function(){
		online_count--;
		io.emit('online_count', {online_count: online_count});
		if(online_count === 0){
			is_pause = true;
		}
	});
	
});

function removeYoutube(youtube_s_id){
	y_Ss.splice(y_Ss.indexOf(SongList[youtube_s_id].y_url), 1);
	SongList[youtube_s_id].removed = true; // delete this s_id !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	jsonfile.writeFileSync(y_config, y_Ss);
}
function forcePlay(queue_index){
	setCurrent(QueueList[queue_index].s_id, QueueList[queue_index].start_time);
	removeQueue(queue_index);
}
function removeQueue(queue_index){
	QueueList.splice(queue_index, 1);
	io.emit('QueueBeenSet', QueueList);
}
function setCurrent(s_id, start_time){
	console.log('setCurrent => SongList');
	console.dir(SongList);
	console.log('setCurrent => s_id');
	console.log(s_id);
	
	if(!s_id && s_id !== 0){
		s_id=0;
	}
	if(SongList[s_id].removed){
		CurrentSong.s_id++; // id++
		CurrentSong.s_t = CurrentSong.now_Len+1;
		interval_checking();
		return;
	}
	
	CurrentSong = {};
	CurrentSong = Object.assign(CurrentSong, SongList[s_id]);
	CurrentSong.now_Len = start_time;
	delete CurrentSong.s_path;
	
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
	delete queueItem.s_path;
	queueItem.s_id = s_id;
	queueItem.start_time = start_time;
	QueueList.push(queueItem);
	io.emit('QueueBeenSet', QueueList);
}
function s_reload(this_f_path){
	y_Ss = jsonfile.readFileSync(y_config) ? jsonfile.readFileSync(y_config) : [];
	if(y_Ss.length>=1){
		load_one_youtube(y_Ss, 0, this_f_path);
	}else{
		hardsong_load(this_f_path);
	}
}
function load_one_youtube(y_Ss, index, this_f_path){
	youtubeInfo(getYouTubeID(y_Ss[index], {fuzzy: false}) ? getYouTubeID(y_Ss[index], {fuzzy: false}) : 'NO ID', function(err, info){
		if(err){
			console.log(err);
			if(y_Ss.length-1 >= index+1){
				console.log('load_one_youtube => err => y_Ss.length, index');
				console.log(y_Ss.length+', '+index);
				console.log('load_one_youtube => err => y_Ss[index]');
				console.log(y_Ss[index]);
				load_one_youtube(y_Ss, index+1, this_f_path);
			}else{
				hardsong_load(this_f_path);
			}
			return;
		}
		
		console.log('load_one_youtube => success!');
		SongList[tmp_s_no] = {
				s_path: false,
				s_name: escape(info.title),
				s_id: tmp_s_no++,
				y_url: y_Ss[index], // changed to y_url
				y_id: getYouTubeID(y_Ss[index], {fuzzy: false}), // shortcut
				s_t: info.duration,
				s_type: 'Youtube',
				s_description: {
					owner: escape(info.owner) // !!! owner !!!
				},
				cover_path: '/songs/nocover.png'
		};
		
		//i'm trying to make it sync
		if(y_Ss.length-1 >= index+1){
			console.log('load_one_youtube => recall!');
			load_one_youtube(y_Ss, index+1, this_f_path);
		}else{
			hardsong_load(this_f_path);
		}
	});
}
function jsmediatag_readOne(file, duration, cover_path){ // two param types: only file(should be absolute) or all passed
	var re_file = path.relative(__dirname, file);
	q.push(function(ok){
		jsmediatags.read(file, {
			onSuccess: function(result){
				var tags = result.tags;
				if(!duration && !cover_path){
					mp3duration(file, function(err, duration){
						
					try{
						
						if(err){
							console.log(err);
							ok();
							return;
						}
						var embbed_cover_path = null;
						if(tags.picture){
							var replaceWhat = path.sep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
					    	var re = new RegExp(replaceWhat, 'g');
							embbed_cover_path = picpath+'/'+re_file.replace(re, '!')+'.jpg';
							console.log('embbed_cover_path => '+embbed_cover_path);
							fs.writeFileSync(embbed_cover_path, new Buffer(tags.picture.data)); // not good, but for lower version of nodejs
							embbed_cover_path = path.relative(picpath, embbed_cover_path);
						}else{}// no picture
						
						console.log('relatived embbed_cover => ' + embbed_cover_path);
						var cover_path = embbed_cover_path ? '/embbedpics/'+embbed_cover_path : fs.existsSync(path.join(path.basename(file), 'cover.jpg')) ? '/songs/'+path.relative(songpath,path.basename(file))+'/cover.jpg' : fs.existsSync(path.join(path.basename(file), 'cover1.jpg')) ? '/songs/'+path.relative(songpath,path.basename(file))+'/cover1.jpg' : '/songs/'+'nocover.png'; // relative from songpath
						s_cache[re_file] = {};
						s_cache[re_file].duration = duration;
						s_cache[re_file].cover_path = cover_path;
						
						s_cache[re_file].mtime = fs.statSync(file).mtime.getTime();
						SongList[tmp_s_no] = {
							s_path: file,
							s_name: escape(tags.title),
							s_id: tmp_s_no++,
							s_url: '/songs/'+path.relative(songpath,file),
							s_t: duration,
							s_type: escape(path.dirname(path.relative(songpath,file)) === '.' ? 'ROOT' : path.dirname(path.relative(songpath,file))), // new added property!
							s_description: {
								artist: escape(tags.artist),
								album: escape(tags.album)
							},
							cover_path: cover_path
						};
						console.log('write caches...');
						jsonfile.writeFileSync(s_cache_path, s_cache);
						ok();
						
					}catch(err_){
						console.log('catch err => '+err_);
						console.log(err_.stack);
					}
					});
				}else{ // the duration and cover_path are passed parameters
					SongList[tmp_s_no] = {
							s_path: file,
							s_name: escape(tags.title),
							s_id: tmp_s_no++,
							s_url: '/songs/'+path.relative(songpath,file),
							s_t: duration,
							s_type: escape(path.dirname(path.relative(songpath,file)) === '.' ? 'ROOT' : path.dirname(path.relative(songpath,file))), // new added property!
							s_description: {
								artist: escape(tags.artist),
								album: escape(tags.album)
							},
							cover_path: cover_path
						};
						ok();
				}
		  },
		  onError: function(error){
		    console.log(':(', error.type, error.info);
		    ok();
		  }
		});
	});
}
function hardsong_load(this_f_path){
	recursive(this_f_path, function(err, files){
		if(err){
			console.log(err);
			return;
		}
		if(!files){
			console.log('no mp3');
			return;
		}
		// file order is not garenteed
		files.forEach(function(file){
			file = path.resolve(file);
			var re_file = path.relative(__dirname, file);
			
			if(path.basename(file).toLowerCase().match(/^cover.*\.jpg$/gi)){
				var name = path.parse(file).name;
				var ext = path.parse(file).ext;
				var cut = name.replace(/.$/, '');
				var nextIntStr;
				if(isNaN(Number(name.match(/.$/)))){
					nextIntStr = '1';
				}else{
					nextIntStr = String(Number(name.match(/.$/))+1);
				}
				if(!fs.existsSync(cut+nextIntStr+ext)){
					SongList.dir_cover[escape(path.dirname(path.relative(songpath,file)) === '.' ? 'ROOT' : path.dirname(path.relative(songpath,file)))] = '/songs/'+path.relative(songpath,file); // NEED CHECK!!! I DON'T KNOW IF RELATIVE WORKS!
				}
			}
			
			if(s_cache[re_file]){
				if(s_cache[re_file].mtime === fs.statSync(file).mtime.getTime()){
					jsmediatag_readOne(file, s_cache[re_file].duration, s_cache[re_file].cover_path);
				}else{
					jsmediatag_readOne(file);
				}
			}else{
				jsmediatag_readOne(file);
			}
			q.start(function(err){ // write cache changes when empty
				console.log('q.start cb occured => will be called when the queue empties or when an error occurs.');
				console.log('err=> '+err);
			});
		});
	});
}
function START(){
	s_reload(songpath);
}
function interval_checking(){
	if(!is_pause){
		if(CurrentSong.s_id || CurrentSong.s_id === 0){
			if(!CurrentSong.now_Len && CurrentSong.now_Len !== 0){
				CurrentSong.now_Len = default_start_time;
			}else{
				if(CurrentSong.s_t - CurrentSong.now_Len > 0){
					CurrentSong.now_Len++;
				}else{//start [When the song is over]
					if(QueueList[0]){
						setCurrent(QueueList.shift().s_id, default_start_time);
						io.emit('QueueBeenSet', QueueList);
					}else if(SongList[CurrentSong.s_id+1]){
						if(!SongList[CurrentSong.s_id+1].removed){ // and not removed
							setCurrent(Math.floor(Math.random()*(Object.keys(SongList).length-1)), default_start_time);
						}else{ // if is removed
							CurrentSong.s_id++; // id++
							CurrentSong.s_t = CurrentSong.now_Len+1;
							interval_checking();
						}
					}else{
						setCurrent(0, default_start_time);
					}
				}//end
			}
		}
	}
}
setInterval(interval_checking,1000);