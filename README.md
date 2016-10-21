#Neuron Simulation

![Screenshot](http://i.imgur.com/Il2rYhS.png)

##Contents:
 - [Purpose](#purpose)
 - [Installation and Running](#installation-and-running)
 - [How It Works](#how-it-works)
 - [Options](#options)
 - [Advanced Rendering Options](#advanced-rendering-options)
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
 6. Click 'Go'! Your organism (blue) will attempt to learn how to 'catch' the red prey item!

##How It Works
###Sensing:
 The organism has two sensors, which can be liked to eyes or the echolocation system of bats. Each sensor senses distance from it to the prey item. The sensors have a maximum sensing distance, and the chance of a particular sensor being 'on' increases the closer that sensor is to the prey item.

###Score:
 The score is comprised of three factors: 

  - Total energy remaining. Maximum of 200 points.
  - Average distance from both 'eyes'. Small distance is better, for a maximum of 400 points.
  - The angle at which the organism contacts the prey, if it does. Maximum of 100 points.

###Ending the Simulation:
The simulation ends when any of the following occur:

  - Greater than 95% of the neurons are active. Biologically, this is a simulation of seizure-type activity, where the brain is essentially firing without any set pattern. Programmatically, it's so that we don't hit a situation where all neurons are active.
  - No neurons are firing. Essentially, this is brain death.
  - The 'Uncheck to halt' box is unchecked.
  - The organism successfully 'preys on' (colides with) the prey item.

##Options
 - Uncheck the 'uncheck to halt' checkbox at any time to halt the simulation.
 - Try different neuron numbers for different behavior.
 - If you're having trouble getting the simulation to run without excessive lag, (or if you wanna use a large number of neurons), try starting the simulation with 'hide connections' hidden.

##Advanced Rendering Options
The following options will add some cool effects, but on lower-end machines (or when rendering large numbers of neurons), they may slow/halt the simulation:

 - To see the path taken between neurons, check the Trace Path box. This will change active connections to a red color, with the color brighter towards the *source* neuron.
 - To render the 'brain' in 3d, check the 3d Mode button. Be aware that this is *very* browser intensive.

##Credits:
This was written by yours truly, [David Newman](https://github.com/Newms34)
