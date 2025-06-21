# D3 Track Reporter

This runs a web server with a websocket connection to a Disguise director and reports:
-what layers are currently actively playing on the active transport controller
-and the video assets playing back on each layer.

This is designed to run on a separate system with a network connection to the D3 Director

## To Use
In /src/App.vue, on line 7, change the fallback IP to the IP address of the D3 Director

From the "D3TrackReporter" folder, run 'npm run dev'

## Play Logger
Under the tab "Play Logger", there is an played asset log, that dynamically builds as layers are played. Currently, this compares entries so the same layerName - AssetName cannot be added to the list twice. This results in a list of assets that have been played, along with a timestamp for the first time they are played.  
Click the button at the bottom "Export Log to CSV" to download a CSV file of the shown data table.

## Requirements
-python  
-node.js + npm  
-This folder should contain all other requirements  
-navigate to the folder for D3TrackReporter and run `npm install` to install vite
