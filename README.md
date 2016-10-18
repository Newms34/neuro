#Neuron Simulation

##Contents:
 - [Purpose](#purpose)
 - [Installation and Running](#installation-and-running)
 - [How It Works](#how-it-works)
 - [Other Notes](#other-notes)
 - [Credits](#credits)

##Purpose
This is a simple neuron simulation app, written to explore emergent phenomena from simple neural networks. It is still *very* much a work-in-progress! 

##Installation and Running
 1. Run `npm install` to set everything up.
 2. Start the server with `npm start`.
 3. Go to `localhost:8080`.
 4. You'll be prompted to pick a number of neurons. I'd suggest at least 70. 
 5. Click the &#9881;, and adjust controls as desired.
  - If you want the simulation to auto-repeat (generally a good idea if you want it to actually learn anything!), check the 'Auto-repeat' box.
  - Adjust the speed as desired. Faster speeds mean the simulation will, obviously, happen faster. Lower speeds are better if you actually want to see the path that the neurons take. Be aware that, especially on lower-end machines, too fast a speed may cause issues, as the simulation may not be able to calculate the current 'tick' before the next tick is called.
  - Uncheck the 'Uncheck to halt' box at any time to stop the simulation.
 6. Click 'Go'! Your organism (blue) will attempt to learn how to 'catch' the red bunny!

##How It Works
###Ending the Simulation:
The simulation ends when any of the following occur:

  - Greater than 95% of the neurons are active. Biologically, this is a simulation of seizure-type activity, where the brain is essentially firing without any set pattern. Programmatically, it's so that we don't hit a situation where all neurons are active.
  - No neurons are firing. Essentially, this is brain death.
  - The 'Uncheck to halt' box is unchecked.
  - The organism successfully 'preys on' (colides with) the bunny.

###Sensing:
 The organism has two sensors, which can be liked to eyes or the echolocation system of bats. Each sensor senses distance from it to the prey item.

###Score:
 The score is comprised of three factors: 

  - Total energy remaining. Maximum of 100 points.
  - Average distance from both 'eyes'. Small distance is better, for a maximum of 200 points.
  - The angle at which the organism contacts the prey, if it does. Maximum of 50 points.

##Other Notes
 - Uncheck the checkbox at any time to halt the simulation.
 - Try different neuron numbers for different behavior.


##Credits:
This was written by yours truly, [David Newman](https://github.com/Newms34)
