#PJ\_musicStream  
##Installation  
```node index.js``` to run.  
if you have so many songs that nodejs told you memory leak, then use this parameter --max_old_space_size=4096  
via http://stackoverflow.com/questions/38558989/node-js-heap-out-of-memory  
Deploied at port 3000  
edit /lib/config.js 's path  
that's your song folder  
put songs into it  
and edit /web/lib/config.js 's domain name as well  
Remember to add "http://"  
For instance: http://example.com:3000  
##Update  
1. shutdown the server  
2. git pull  
3. check this repo if external steps needed  
3. reopen the server  
