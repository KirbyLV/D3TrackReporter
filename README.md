# D3 Track Reporter

This runs a web server with a websocket connection to a Disguise director and reports:
-what layers are currently actively playing on the active transport controller
-and the video assets playing back on each layer.

This is designed to run on a separate system with a network connection to the D3 Director

## To Use
In /src/App.vue, on line 7, change the fallback IP to the IP address of the D3 Director

From the "D3TrackReporter" folder, run 'npm run dev'

## Requirements
-python  
-node.js + npm  
-This folder should contain all other requirements  
-navigate to the folder for D3TrackReporter and run `npm install` to install vite
