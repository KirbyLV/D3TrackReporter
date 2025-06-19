# Vue 3 + Vite

This runs a web server with a websocket connection to a Disguise director and reports:
-what layers are currently actively playing on the active transport controller
-and the video assets playing back on each layer.

This is designed to run on a separate system with a network connection to the D3 Director

<h> To Use </h>
In App.vue, on line 7, change the fallback IP to the IP address of the D3 Director

From the "D3TrackReporter" folder, run 'npm run dev'

<h> Requirements </h>
-This folder should contain all the requirements
-May need to run 'npm install'