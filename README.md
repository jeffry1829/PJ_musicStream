# PJ\_musicStream  
## Installation  
```node index.js``` to run.  
Deploied at port 3000 by default    
edit /lib/config.js.example 's path and remove the .example    
that's your song folder  
put songs into it  
and edit /web/lib/config.js.example 's domain name as well(remove .example as well)    
Remember to add "http://"  
For instance: http://example.com:3000  
REMEMBER TO PUT "nocover.png" into your "song folder" (You can use the one I give you, or you can use your custom one)    
## Update  
1. shutdown the server  
2. git fetch  
3. checkout tag  
4. rm -rf node_modules  
5. npm install  
6. reopen the server  
## Song Time Change  
password can be set in ./lib/config.js  
enter password in the first input section  
and feel free to change song time!
