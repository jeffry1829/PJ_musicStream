var socket = io.connect(domain);
socket.on('online_count', function(data) {
    console.log('socket.io client on online_count event get!')
    var online_count = data.online_count;
    online_count_changed(online_count);
});
socket.on('QueueBeenSet', function(QueueList) {
    updateQueueList(QueueList);
});

function online_count_changed(count) {
    $('#online-count-number').text(count);
}
/*var first_play_ok = false;
function mobile_move_handler(){
	if(!first_play_ok){
		y_player.playVideo();
		$('#player')[0].play();
		first_play_ok = true;	
	}
}*/
function y_url_add() {
    $.ajax({
        type: 'POST',
        url: domain + '/addYoutube',
        dataType: 'json',
        data: {
            url: $(this).val()
        },
        success: function(res) {
            // res doesn't matter
            $('#y-url-input').val('')
            updateSongList();
        },
        error: function(xhr) {
            console.log(xhr);
        }
    })
}

function mp4_add() {
    $.ajax({
        type: 'POST',
        url: domain + '/addMp4',
        dataType: 'json',
        data: {
            url: $(this).val(),
            title: $('#mp4-title').val(),
            img: $('#mp4-img').val()
        },
        success: function(res) {
            // res doesn't matter
            $('#mp4-input').val('')
            $('#mp4-title').val('')
            $('#mp4-img').val('')
            updateSongList();
        },
        error: function(xhr) {
            console.log(xhr);
        }
    })
}

function img_click() {
    $(this).nextUntil('.ts.massive.header').toggle();
}

function updateSongList() {
    $('#s-list').empty();
    $.ajax({
        type: 'POST',
        url: domain + '/getList',
        dataType: 'json',
        success: function(res) {
            var type_object = {};
            $.each(res, function(index, value) {
                if (index === 'dir_cover') {
                    return;
                }
                if (!type_object[value.s_type]) {
                    type_object[value.s_type] = {};
                }
                // s_id as key
                type_object[value.s_type][value.s_id] = value;
                if (res['dir_cover'][value.s_type]) {
                    type_object[value.s_type]['dir_cover'] = res['dir_cover'][value.s_type]; // relative path from songpath
                } else {
                    type_object[value.s_type]['dir_cover'] = '/songs/nocover.png'
                }
            });
            // Because every pic_url are not same.... so.....
            $.each(type_object, function(index, value) {
                if (type_object[index]['dir_cover'] === '/songs/nocover.png') {
                    var now_pic_url = null;
                    $.each(value, function(index, value) {
                        if (index === 'dir_cover') {
                            return;
                        }
                        if (value.cover_path !== '/songs/nocover.png') {
                            now_pic_url = value.cover_path;
                            return false; //doc says this equals break
                        }
                    });
                    if (now_pic_url) {
                        type_object[index]['dir_cover'] = now_pic_url;
                    }
                }
            });
            $.each(type_object, function(index, value) {
                if (index === 'Youtube' || index === 'MP4') {
                    $('#s-list').append(' \
								<div class="ts massive header">' + index + '</div> \
							');
                } else {
                    $('#s-list').append(' \
								<div class="ts massive header">' + index + '</div> \
								<a class="type-img"> \
									<img class="ts link small image" src="' + value.dir_cover + '"></img> \
								</a> \
							');
                }

                // If type === Youtube, add remove button
                if (index === 'Youtube') {
                    $.each(value, function(index, value) {
                        if (index === 'dir_cover') {
                            return;
                        }
                        if (!value.removed) { // if not removed
                            $('#s-list').append(' \
											<div class="item s-list-item"> \
												<div class="header">' + value.s_id + ' ' + value.s_name + '</div> \
												' + value.s_t + 'sec \
												<button class="ts icon button mini compact negative youtube-item-remove"> \
													<i class="icon remove"></i> \
												</button> \
											</div> \
									');
                        }
                    });
                } else if (index === 'MP4') {
                    $.each(value, function(index, value) {
                        if (index === 'dir_cover') {
                            return;
                        }
                        if (!value.removed) { // if not removed
                            $('#s-list').append(' \
											<div class="item s-list-item"> \
												<img class="ts avatar image" src="' + value.cover_path + '"> \
												<content> \
													<div class="header">' + value.s_id + ' ' + value.s_name + '</div> \
													' + value.s_t + 'sec \
												</content> \
												<button class="ts icon button mini compact negative mp4-item-remove"> \
													<i class="icon remove"></i> \
												</button> \
											</div> \
									');
                        }
                    });
                } else {
                    $.each(value, function(index, value) {
                        if (index === 'dir_cover') {
                            return;
                        }
                        $('#s-list').append(' \
										<div class="item s-list-item"> \
											<img class="ts avatar image" src="' + value.cover_path + '"> \
											<content> \
											<div class="header">' + value.s_id + ' ' + value.s_name + '</div> \
											' + value.s_t + 'sec \
											</content> \
										</div> \
								');
                    });
                }
            });
            $('.type-img').nextUntil('.ts.massive.header').hide();
            $('.s-list-item').click(s_list_item_click);
            $('.youtube-item-remove').click(youtube_item_remove);
            $('.mp4-item-remove').click(mp4_item_remove);
            $('.type-img').click(img_click);
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
}

function youtube_item_remove(e) {
    e.stopPropagation(); // only for remove button
    $.ajax({
        type: 'POST',
        url: domain + '/removeYoutube',
        dataType: 'json',
        data: {
            youtube_s_id: Number($(this).parent()[0].innerText.split(' ')[0])
        },
        success: function(res) {
            updateSongList();
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
}

function mp4_item_remove(e) {
    e.stopPropagation(); // only for remove button
    $.ajax({
        type: 'POST',
        url: domain + '/removeMp4',
        dataType: 'json',
        data: {
            mp4_s_id: Number($(this).parent()[0].innerText.split(' ')[0])
        },
        success: function(res) {
            updateSongList();
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
}

function s_list_item_click() {
    socket.emit('addQueue', Number($(this)[0].innerText.split(' ')[0]), -3); //There's no way to set start_time yet
}

function highlightSongs(queuelist) {
    var list = [];
    queuelist.forEach(function(value, index) {
        list.push(value.s_id);
    });
    var $headers = $('.s-list-item .header');
    $headers.parents('.item').removeClass('-thisqueue');
    $headers.parents('.item').css('background-color', '');
    for (var i = 0; i < $headers.length; i++) {
        if (list.indexOf(Number($headers[i].innerHTML.split(' ')[0])) !== -1) {
            if ($($headers[i]).parents('.item').css('background-color') === '#FFFFBF') {
                if (!$($headers[i]).parents('.item').hasClass('-thisqueue')) {
                    $($headers[i]).parents('.item').css('background-color', '');
                }
            } else {
                $($headers[i]).parents('.item').css('background-color', '#FFFFBF');
                $($headers[i]).parents('.item').addClass('-thisqueue');
            }
        }
    }
}

function updateQueueList(QueueList) {
    highlightSongs(QueueList);
    $('#queue-list').empty();
    QueueList.forEach(function(value, index) {
        $('#queue-list').append(' \
					<div class="item queue-item" style="justify-content: center;"> \
						<img class="ts avatar image" src="' + value.cover_path + '"> \
						<content> \
							' + index + ' (' + value.s_id + ' ' + value.s_name + ' ' + value.s_t + 'sec) \
						</content> \
						<button class="ts icon button mini compact negative queue-item-remove"> \
							<i class="icon remove"></i> \
						</button> \
					</div> \
					<br /> \
				');
    });
    $('.queue-item-remove').click(removeQueue);
    $('.queue-item').click(queue_forcePlay);
}

function HTTP_updateQueueList() {
    $('#queue-list').empty();
    $.ajax({
        type: 'POST',
        url: domain + '/getQueue',
        dataType: 'json',
        success: function(res) {
            highlightSongs(res);
            res.forEach(function(value, index) {
                $('#queue-list').append(' \
							<div class="item queue-item" style="justify-content: center;"> \
								<img class="ts avatar image" src="' + value.cover_path + '"> \
								<content> \
									' + index + ' (' + value.s_id + ' ' + value.s_name + ' ' + value.s_t + 'sec) \
								</content> \
								<button class="ts icon button mini compact negative queue-item-remove"> \
									<i class="icon remove"></i> \
								</button> \
							</div> \
							<br /> \
						');
            });
            $('.queue-item-remove').click(removeQueue);
            $('.queue-item').click(queue_forcePlay);
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
}

function queue_forcePlay() {
    $.ajax({
        type: 'POST',
        url: domain + '/forcePlay',
        dataType: 'json',
        data: {
            queue_index: Number($(this)[0].innerText.split(' ')[0])
        },
        success: function(res) {
            // doesn't matter
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
    LoadPlayer_wholeProcess();
}

function removeQueue(e) {
    e.stopPropagation(); // only for remove button
    $.ajax({
        type: 'POST',
        url: domain + '/removeQueue',
        dataType: 'json',
        data: {
            queue_index: Number($(this).parent()[0].innerText.split(' ')[0])
        },
        success: function(res) {
            // doesn't matter
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
}

function setHTMLPlayer(current) { // getCurrent Object
    y_player.pauseVideo();
    $('#player').show();
    $('#y-player').hide();
    $('#mp4-player')[0].pause();
    $('#mp4-player').hide();
    $('#player').attr('src', current.s_url);
    $('#player')[0].currentTime = current.now_Len;
    $('#player')[0].play();
    $('#player')[0].volume = volume;
    now_song_id = current.s_id
    $('#s-id').text(current.s_id);
    $('#s-title').text(unescape(current.s_name));
    $('#s-artist').text(unescape(current.s_description.artist));
    $('#s-album').text(unescape(current.s_description.album));
    $('#s-length').text(current.s_t);
    $('#img-above-player').show();
    $('#img-above-player').attr('src', current.cover_path);
}

function setYTPlayer(current) { // getCurrent Object
    $('#player')[0].pause();
    $('#player').hide();
    $('#mp4-player')[0].pause();
    $('#mp4-player').hide();
    $('#y-player').show();
    y_player.loadVideoById(current['y_id'], current.now_Len, 'low');
    y_player.seekTo(current.now_Len, true);
    y_player.playVideo();
    y_player.setVolume(volume * 100);
    now_song_id = current.s_id
    $('#s-id').text(current.s_id);
    $('#s-title').text(unescape(current.s_name));
    $('#s-artist').text(unescape(current.s_description.owner));
    $('#s-album').text('None');
    $('#s-length').text(current.s_t);
    $('#img-above-player').hide();
}

function setMP4Player(current) {
    y_player.pauseVideo();
    $('#player')[0].pause();
    $('#player').hide();
    $('#y-player').hide();
    $('#mp4-player').show();
    $('#mp4-player').attr('src', current.mp4_url);
    $('#mp4-player')[0].currentTime = current.now_Len;
    $('#mp4-player')[0].play();
    $('#mp4-player')[0].volume = volume;
    now_song_id = current.s_id
    $('#s-id').text(current.s_id);
    $('#s-title').text(unescape(current.s_name));
    $('#s-artist').text('None');
    $('#s-album').text('None');
    $('#s-length').text(current.s_t);
    $('#img-above-player').hide();
}

function LoadPlayer_wholeProcess() {
    $.ajax({
        type: 'POST',
        url: domain + '/getCurrent',
        dataType: 'json',
        success: function(res) {
            console.log('/getCurrent => res');
            console.dir(res);
            if (!res['s_id'] && res['s_id'] !== 0) {
                console.log('songs are not ready yet');
                return;
            } else {
                if (res.y_url) {
                    setYTPlayer(res);
                } else if (res.mp4_url) {
                    setMP4Player(res);
                } else {
                    setHTMLPlayer(res);
                }
                var n = new Notification('~Now Playing~', {
                    body: res.s_name,
                    icon: res.cover_path
                });
                n.onclick = function() {
                    n.close.bind(n)();
                }
                setTimeout(n.close.bind(n), 4000);
            }
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
}
var now_song_id;
var y_player;



//VERY IMPORTANT
//WIRTE THE CODE WITH Youtube OBJECT BELOW

function onPlayerReady() { // doc and player are all ready
    Notification.requestPermission().then(function(result) {
        if (result === 'denied') {
            console.log('Permission wasn\'t granted. Allow a retry.');
            return;
        }
        if (result === 'default') {
            console.log('The permission request was dismissed.');
            return;
        }
    });
    var isMobile = false; //initiate as false
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) isMobile = true;
    if (isMobile) {
        alert('此網頁會自動播放音樂/影片,若流量不充足,還請不要瀏覽本站');
        //$(document).click(mobile_move_handler);
    }

    updateSongList();

    HTTP_updateQueueList();

    setInterval(function() {
        $.ajax({
            type: 'POST',
            url: domain + '/getCurrent',
            dataType: 'json',
            success: function(res) {
                console.log('Interval: check now len every 5sec => now_Len: ' + res['now_Len'])
                if (!res['s_id'] && res['s_id'] !== 0) {
                    console.log('songs are not ready yet');
                    return;
                } else {
                    if (res.s_id !== now_song_id) {
                        LoadPlayer_wholeProcess();
                    }
                    if (res.y_url) {
                        var y_player_t = y_player.getCurrentTime();
                        if (Math.abs(y_player_t - res.now_Len) > 5) {
                            y_player.seekTo(res.now_Len, true);
                            y_player.playVideo();
                        }
                    } else if (res.mp4_url) {
                        var player_t = $('#mp4-player')[0].currentTime;
                        if (Math.abs(player_t - res.now_Len) > 5) {
                            $('#mp4-player')[0].currentTime = res.now_Len;
                            $('#mp4-player')[0].play();
                        }
                    } else {
                        var player_t = $('#player')[0].currentTime;
                        if (Math.abs(player_t - res.now_Len) > 5) {
                            $('#player')[0].currentTime = res.now_Len;
                            $('#player')[0].play();
                        }
                    }
                }
            },
            error: function(xhr) {
                console.log(xhr);
            }
        });
    }, 5000);
    $('#y-url-input').keypress(function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code === 13) {
            $(this).submit();
        }
    });
    $('#mp4-input').keypress(function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code === 13) {
            $(this).submit();
        }
    });
    $('#pass-input').keypress(function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code === 13) {
            $(this).submit();
        }
    });
    $('#y-url-input').submit(y_url_add);
    $('#mp4-input').submit(mp4_add);
    $('#pass-input').submit(function() {
        document.cookie = 'pass=' + $(this).val();
        $(this).val('');
    });
    $('#global-pause-button').click(function() {
        $.ajax({
            type: 'POST',
            url: domain + '/GlobalPause',
            error: function(xhr) {
                console.log(xhr);
            }
        })
    });
    $('#global-play-button').click(function() {
        $.ajax({
            type: 'POST',
            url: domain + '/GlobalPlay',
            error: function(xhr) {
                console.log(xhr);
            }
        });
    });
    $('#random-next-button').click(function() {
        $.ajax({
            type: 'GET',
            url: domain + '/randomNext',
            error: function(xhr) {
                console.log(xhr);
            }
        });
    });

    /* NOW, THERE'S A BUG
        $('#player').on('seeking', timechange);
        $('#mp4-player').on('seeking', timechange);

        function timechange() {
            $.ajax({
                type: 'POST',
                url: domain + '/timechange',
                dataType: 'json',
                data: { time: this.currentTime },
                error: function(xhr) {
                    console.log(xhr);
                },
                xhrFields: {
                    withCredentials: true
                }
            });
        }
    */

    // Youtube player time watch
    var yt_time = y_player.getCurrentTime();
    setInterval(function() {
        if (Math.abs(y_player.getCurrentTime() - yt_time) > 1) { // *interval is 0.5 sec* to prevent bug :p
            $.ajax({
                type: 'POST',
                url: domain + '/timechange',
                dataType: 'json',
                data: { time: y_player.getCurrentTime() },
                error: function(xhr) {
                    console.log(xhr);
                },
                xhrFields: {
                    withCredentials: true
                }
            });
        }

        yt_time = y_player.getCurrentTime();
    }, 500);
}

function onYouTubeIframeAPIReady() {
    console.log('onYouTubeIframeAPIReady in!')
    y_player = new YT.Player('y-player', {
        playerVars: { autoplay: 1, loop: 1 },
        height: 390,
        width: 640,
        events: {
            'onReady': onPlayerReady
        }
    });
}
$(document).ready(function() {
    $('#player').hide();
    $('#mp4-player').hide();
    $('#y-player').hide();
    $('#img-above-player').hide();

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});