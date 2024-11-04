<ul>
  <li>This is a game where user can draw 2D shapes and can extrude shape to3D</li>
</ul>
<h2>Thught Process</h2>
<ul>
  <li>I created a angular project and install babylon js to draw 2D shapes and extrude it into 3D shapes</li>
  <li>In main app componet i defined all the necessary variable and created some methods<li>
  <ol>
    <li>initializeBabylon: In this i initialized all the created variables and called some methods</li>
    <li>startDrawing(): It resets the previous state shape and start a new drawnig it meant it doesn't delete prvious shapes</li>
    <li>finilazeShape(): It used when 2D shape created and  for for colling extrudeShapeTo3d() method </li>
    <li>extrudeShapeTo3d(): It used to create 3D shapes from 2D shapes using Babylon Vector</li>
  </ol>
    
</ul>
