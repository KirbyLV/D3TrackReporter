# D3 Track Reporter

This runs a web server with a websocket connection to a Disguise director and reports:
-what layers are currently actively playing on the active transport controller. 
-and the video assets playing back on each layer.  

This is designed to run on a separate system with a network connection to the D3 Director

## To Use
~~In /src/App.vue, on line 7, change the fallback IP to the IP address of the D3 Director~~  
For the first time, be sure to run `npm install` within the project folder to install dependencies  

From the "D3TrackReporter" folder, run 'npm run dev'

## User interface
Only the currently active transport controller / the currently viewed timeline is reported. This hs not yet been tested with multi-transport.  
In each view, the current playhead position will be at the top in `mm:ss`  
Select which view you want to be in from the top header bar in yellow.

### IP Address & Disconnected Window
<img width="409" alt="Screenshot 2025-06-22 at 4 36 43 PM" src="https://github.com/user-attachments/assets/f0ee9544-b6f6-4d09-ae43-7d829011463e" />  

This pop-up overlay only appears if the app cannot reach the D3 server. Either the network information is wrong, or the D3 session is not running.  
Type in the IP adrees AND port and click reconnect.  Defualt port is 80, so an example connection point would be 10.10.22.101:80.
Ensure you can ping your servers and your network is working.  
The connection status is also reported at the bottom of the screen.  
__NOTE:__ be sure to specify the port as well. port :80 is default.

### Current Video Assets 
![Screenshot 2025-06-21 at 12 21 26 PM](https://github.com/user-attachments/assets/d5143c91-ea08-4371-a2e4-0928ff4f8864)  
This window shows the currently playing layers, and the video assets associated with them.

### Track Details
![Screenshot 2025-06-21 at 12 22 18 PM](https://github.com/user-attachments/assets/c8c171a9-3c53-4d60-9c71-82d8c0189cca)  
This window shows the total count of layers present in the current timeline, the name of that timeline, and a readout of all layers, their associated video assets, and when on the timeline they play. This content will be tracked and the highlights change with the playhead position to show the currently playing layers.  
Use the button at the bottom to export this table as a CSV. This can be used as an "As-Built" Run of Show.

### Play Logger
![Screenshot 2025-06-21 at 12 22 35 PM](https://github.com/user-attachments/assets/8a69505d-8639-410b-9ae9-7f9f5e1b1dd7)  
This tool logs each video asset as it is played. If you start the logger before an asset is played, the currently playing asset will not be logged. It triggers upon a state-change of the D3, whether thats a new section, new asset, new layer, etc.  
Be sure to click the "Start Logging" button to start the capture process. This button dynamically changes with the logging state.  
The layer name, associated video asset, and a timestamp for when the event occurred are all captured.  
**NOTE:** This window must be in view in order for the log to be running. If you click over to Track Details or Current Assets, logging will stop and start fresh.  
You can export the log to a CSV, or clear the log to start over.

## Editing the Play Logger
Under the tab "Play Logger", there is an played asset log, that dynamically builds as layers are played.  
Currently, this log tracks all assets and layers and lists a timestamp for when they begin playing, even if the same layer-asset combination is played multiple times.  
If you would like to compare entries so the same layerName - AssetName cannot be added to the list twice, you must alter the PlayLogger.vue file:  
```
Uncomment lines 138 - 141.
Comment lines 142 - 145
```
Remember to Start the logger, using the "StartLogging" button.  
Click the button at the bottom "Export Log to CSV" to download a CSV file of the shown data table.

## Requirements
-python  
-node.js + npm  
-This folder should contain all other requirements  
-navigate to the folder for D3TrackReporter and run `npm install` to install vite

## Building and serving
The configurations have been updated to build this project and serve it locally.  
To build, run `npm run build`. 
To run this as a local server, cd to the dist directory and run `npx serve -s`
