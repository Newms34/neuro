var app = angular.module('neur-app', []).controller('neur-con', function($scope, $http) {
    // simple sim: https://jsfiddle.net/zg5vknbr/8/

    //TO DO: add more than one 'range' to each eye dist sensor, so we can get more of a gradient than simple on/off. Custom num?
    $scope.h = $('#brain').height();
    $scope.w = $('#brain').width();
    $scope.playw = $('#playfield').width() - 50;
    $scope.playh = $('#playfield').height() - 50;
    $scope.neurons = [];
    $scope.outs = [];
    $scope.ins = [];
    $scope.numIns = 5;
    $scope.numBaseCons = 5;
    $scope.numOuts = 7;
    $scope.lastDeath = null;
    $scope.okayRun = true;
    $scope.scores = [];
    $scope.scoreAvgs = [];
    $scope.scoreAvg = null;
    $scope.tracePath = false;
    $scope.speed = 150;
    $scope.speedRaw = 86;
    $scope.numGenerations = 0;
    $scope.hideCons = false;
    $scope.prey = {
        x: $scope.w * .5,
        y: $scope.h * .5,
        dx: (Math.random() * 10) - 5,
        dy: (Math.random() * 10) - 5,
        facing: 0
    }
    $scope.org = {
        x: 0,
        y: 0
    }
    bootbox.dialog({
        title: 'Neuron Simulation Startup Options',
        message: `<div class="form-group col-md-12">
    <div class="col-md-5">Number of neurons</div>
    <div class="col-md-6">
        <input type="number" id="num-in" value="200" />
    </div>
</div>
<br/>
<br/>
<div class="form-group col-md-12">
    <div class="col-md-5">Connections Per Neuron (percent of total)</div>
    <div class="col-md-6">
        <div class="col-md-1">0%</div>
        <div class="col-md-8">
            <input type="range" min="1" value="20" max="50" id="numConnects" />
        </div>
        <div class="col-md-1">50%</div>
    </div>
</div>
<br/>
<br/>
<div class="form-group col-md-12">
    <div class="col-md-5">Hide connections </div>
    <div class="col-md-6">
        <input type="checkbox" id="con-status" />
    </div>
</div>
<br/>
<br/>
<div class="form-group col-md-12">
    <div class="col-md-5">Score Lookback Size (determines learning volatility)</div>
    <div class="col-md-6">
        <input type='number' value='3' min='2' max = '30' id='lbs'>
    </div>
</div>
`,
        buttons: {
            confirm: {
                label: 'Create',
                className: 'btn-success',
                callback: function() {
                    if (isNaN(parseInt($('#num-in').val()))) {
                        bootbox.alert('Please enter a number of neurons');
                    } else if (parseInt($('#num-in').val()) < 5) {
                        bootbox.alert('Number of neurons too low!')
                    } else {
                        $scope.numNeurs = parseInt($('#num-in').val());
                        $scope.numBaseCons = $scope.numNeurs * parseInt($('#numConnects').val()) / 100;
                        $scope.hideCons = $('#con-status')[0].checked;
                        $scope.avgSize = parseInt($('#lbs').val());
                        $scope.$apply();
                        $scope.drawInitBoard();
                        return true;
                    }
                    return false;
                }
            },
            help: {
                label: '?',
                className: 'btn-danger',
                callback: function() {
                    $scope.showHalp();
                    return false;
                }
            }
        }
    })
    $scope.showHalp = function() {
        bootbox.alert({ title: `<h3>Dave's Brain Sim v1.2.1</h3>`, message: `
<h4>About</h4> Dave's Brain Sim is a relatively simple brain simulation, using randomly generated 'pure' neural networks.
<hr>
<h4>Goal</h4> The overall goal of the simulation is for the prey item (in blue) to catch the prey item (red or green).
<hr>
<h4>Recommended Settings</h4> &#9745; Unless you have a really powerful system, I'd recommend around 500-800 neurons. Any fewer will limit the amount that the system can learn, and any more will severely impede performance (and thus generation duration, and learning speed).
<br>&#9745; I would also suggest that you keep 'Hide connections' checked, as while the system can (and will!) draw neural connections, this'll severely impede performance.
<br>&#9745; If you <em>do</em> elect to uncheck 'Hide connections', consider only showing active connections to increase performance. This is available in the simulation options, available after pressing Create (press the green [&#9881;] button). 
<br>&#9745; I'd suggest you lock the prey item to the center. This will convert the prey item into, essentially, a primary producer, and will eliminate the issue of the prey item running away from (or directly into!) the organism. This is available in the simulation options, available after pressing Create.
<br>&#9745; Finally, I'd suggest you keep 'Auto-repeat' checked to have the simulation automatically refresh after an organism hits its end state. This is available in the simulation options, available after pressing Create.
<hr>
<h4>How It Works</h4>
<ol>
    <li>
        The neural network works by first generating a number of randomly placed neurons, as well as a number of connections between those neurons. Each connection is given a weight. If a particular neuron is active, this weight determines how likely a given output connection is to <em>also</em> be active.
    </li>
    <li>
        The initial inputs are a series of distance sensors, which have a higher chance of being on ('active') the closer they are to their targets. Each of the organism's 'eyes' is in fact a pair of sensors: one for close range, and one for distance.</li>
    <li>
        Each generation consists of a number of cycles, run until the simulation encounters an End Condition (see below). During each cycle, each active neuron randomly picks another neuron via its weighted connections. The chosen connections are kept as an activeConnections list.</li>
    <li>
        After each generation finishes, a score is calculated as a combination of time taken, distance from final prey item, and other factors.</li>
    <li>
        A running tally is kept of the score, and the organism's current score is compared to a running average of the past three scores. This is done to prevent random 'fluke' scores from being over-weighted.</li>
    <li>
        If the score is <em>greater</em> than the average, the connections involved are made heavier (i.e., more likely to be chosen in the future. Otherwise, the connections are made lighter (less likely to be chosen).</li>
    <li>
        This repeats.</li>
</ol>
<hr>
<h4>End Conditions</h4> The simulation ends in one of five situations:
<ul>
    <li>
        <strong>Death from User:</strong> Caused by unchecking the "Uncheck to Halt" box in options.
    </li>
    <li>
        <strong>Death from overheating:</strong> Caused by too many neurons (greater than 90%) being active during any one cycle. This is akin to a seizure.
    </li>
    <li>
        <strong>Death from lack of neural activity:</strong> The polar opposite of Death from overheating. Caused by too few neurons being active. Akin to brain death.
    </li>
    <li>
        <strong>Death from lack of energy:</strong> Caused by the energy remaining timer hitting zero before the prey is caught. This is to prevent the organism just wandering around without a purpose
    </li>
    <li>
        <strong>Successful hunt</strong> Obviously, caused by the organism successfully catching the prey item. Achieves the highest score.
    </li>
</ul>
<hr>
<h4>Frequently Asked Questions</h4>
<ul>
    <li>
        <em>What does the organism start out knowing?</em><br>
        Nothing! It doesn't even know that, for example, having all four distance sensors active is generally good (since it means the prey item is closer.)
    </li>
    <li>
        <em>My organism doesn't seem to be doing much...</em><br>
        Be aware that this is an entirely unguided neural learning simulation. As such, it may take a while for the organism to 'figure things out'.
    </li>
    <li>
        <em>How can I be sure that my organism is, in fact, learning?</em><br>
        While the individual scores can and will fluctuate a lot (especially at first!), you should eventually notice a slight upward trend. 
    </li>
    <li>
        <em>What technologies is this running on?</em><br>
        Dave's Brain Sim uses the following tech:
        <ul>
            <li>NodeJS - for the backend</li>
            <li>ExpressJS - for routing</li>
            <li>GulpJS - for making everything nice and smol to send to your browser</li>
            <li>AngularJS - for dynamic front-end stuffs!</li>
            <li>ChartJS - for drawing graphs!</li>
        </ul>
    </li>
</ul>

`, size: 'large' })
    };
    $scope.showExpl = function(m) {
        if (m == 'avgSize') {
            bootbox.alert(`<h3>Score Lookback Size</h3> The Score Lookback Size determines the size of the average (number of generations) considered by the score comparison function to consider whether a particular generation is good or bad.`)
        } else if (m == 'pcm') {
            bootbox.alert(`<h3>Path Change Method</h3>After each generation is run, this determines how the resultant path is changed.<ul>
                    <li>If it's multiplicative, the each path's weight is multiplied by 1.1 if successful, and 0.9 if unsuccessful.</li>
                    <li>If it's additive, 0.02 is added to each path's weight if the run is successful. Otherwise, 0.02 is subtracted (to a minimum of 0.02)</li>
                </ul>`)
        }
    };
    $scope.pcm = 'add';
    $scope.avgSize = 3;
    $scope.activeNeurs = [];
    $scope.changeSpeed = function() {
            $scope.speed = (-10 * $scope.speedRaw) + 1010;
        }
        //construction
    $scope.outConst = function(action, does) {
        this.x = $scope.w;
        this.y = $scope.h * $scope.outs.length / $scope.numOuts;
        this.z = Math.floor(Math.random() * ($scope.w - 10));
        this.active = false;
        this.action = action; //title of action
        this.does = does; //what does this output do?
    }
    $scope.inConst = function() {
        this.x = 50;
        this.y = $scope.h * $scope.ins.length / $scope.numIns;
        this.z = 0;
        this.o = [];
        this.active = false;
    }
    $scope.neurConst = function() {
        this.i = []; //inputs. Determined by another neuron's out targetting this neuron
        this.o = []; //outputs. Set randomly
        this.x = Math.floor(Math.random() * ($scope.w - 10));
        this.y = Math.floor(Math.random() * ($scope.h - 10));
        this.z = Math.floor(Math.random() * ($scope.w - 10));
        this.mood = .1;
        this.active = false;
        this.doesSplit = Math.random() > .9 ? true : false;
    }
    $scope.connection = function(s, t, w, conMode) {
        this.source = s;
        this.target = t;
        this.weight = w;
        this.active = true;
        this.out = conMode == 1;
    }
    $scope.drawInitBoard = function() {
        $scope.totalEn = 120000;
        $scope.remainingEn = $scope.totalEn;
        $scope.sc = 0;
        $scope.enPerNeur = $scope.totalEn / ($scope.speed * $scope.numNeurs);
        //first, make numNeurons neurons.
        for (var i = 0; i < $scope.numNeurs; i++) {
            $scope.neurons.push(new $scope.neurConst())
        }

        //now, make the 4 directional 'output' functions.
        $scope.outs.push(new $scope.outConst('Move right', function() {
            if ($scope.org.x < $scope.playw - 3) {
                $scope.org.x += 3;
                if($scope.prey.x<$scope.org.x){
                    $scope.sc--;
                }
            }
        }));
        $scope.outs.push(new $scope.outConst('Move left', function() {
            if ($scope.org.x > 3) {
                $scope.org.x -= 3;
                if($scope.prey.x<$scope.org.x){
                    $scope.sc++;
                }
            }
        }));
        $scope.outs.push(new $scope.outConst('Move down', function() {
            if ($scope.org.y < $scope.playh - 3) {
                $scope.org.y += 3;
                if($scope.prey.y<$scope.org.y){
                    $scope.sc--;
                }
            }
        }));
        $scope.outs.push(new $scope.outConst('Move up', function() {
            if ($scope.org.y > 3) {
                $scope.org.y -= 3;
                if($scope.prey.y<$scope.org.y){
                    $scope.sc++;
                }
            }
        }));

        //now, the four inputs (2 per eye: one large, one small)
        var numCons = Math.ceil(Math.random() * .1 * $scope.numNeurs); //number of connections per eye sensor
        // left eye, small
        $scope.ins.push(new $scope.inConst());
        for (var j = 0; j < numCons; j++) {
            var whichTarg = false;
            var wt = 0.1 + (Math.random() * 0.8);
            whichTarg = Math.floor(Math.random() * $scope.numNeurs);
            $scope.neurons[whichTarg].i.push('inLeftSm');
            $scope.ins[0].o.push(new $scope.connection(0, whichTarg, wt, 2));
        }
        // right eye, small
        $scope.ins.push(new $scope.inConst());
        for (var j = 0; j < numCons; j++) {
            var whichTarg = false;
            var wt = 0.1 + (Math.random() * 0.8);
            whichTarg = Math.floor(Math.random() * $scope.numNeurs);
            $scope.neurons[whichTarg].i.push('inRightSm');
            $scope.ins[1].o.push(new $scope.connection(1, whichTarg, wt, 2));
        }

        // left eye, large
        $scope.ins.push(new $scope.inConst());
        for (var j = 0; j < numCons; j++) {
            var whichTarg = false;
            var wt = 0.1 + (Math.random() * 0.8);
            whichTarg = Math.floor(Math.random() * $scope.numNeurs);
            $scope.neurons[whichTarg].i.push('inLeftBg');
            $scope.ins[2].o.push(new $scope.connection(2, whichTarg, wt, 2));
        }
        // right eye, large
        $scope.ins.push(new $scope.inConst());
        for (var j = 0; j < numCons; j++) {
            var whichTarg = false;
            var wt = 0.1 + (Math.random() * 0.8);
            whichTarg = Math.floor(Math.random() * $scope.numNeurs);
            $scope.neurons[whichTarg].i.push('inRightBg');
            $scope.ins[3].o.push(new $scope.connection(3, whichTarg, wt, 2));
        }
        //now, regular neuron connections
        for (i = 0; i < $scope.numNeurs; i++) {
            for (var j = 0; j < $scope.numBaseCons; j++) {
                var whichTarg = false;
                var wt = 0.1 + (Math.random() * 0.8)
                if (Math.random() < .98) {
                    whichTarg = Math.floor(Math.random() * $scope.numNeurs);
                    while (whichTarg == i || $scope.neurons[i].i.indexOf(whichTarg) != -1) {
                        // keep rolling if the picked target is either this neuron, or is an incoming connection
                        whichTarg = Math.floor(Math.random() * $scope.numNeurs);
                    }
                    $scope.neurons[whichTarg].i.push(i);
                    $scope.neurons[i].o.push(new $scope.connection(i, whichTarg, wt, 0));
                } else {
                    whichTarg = Math.floor(Math.random() * $scope.outs.length);
                    $scope.neurons[i].o.push(new $scope.connection(i, whichTarg, wt, 1));
                }
            }
        }
        $scope.$apply();
        $scope.drawBoard();
    };
    $scope.scoreGraff = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Score',
                data: [],
                borderColor: '#009',
                fill: false
            }, {
                label: 'Score Average',
                data: [],
                borderColor: '#090',
                fill: false
            }]
        }
    };

    $scope.ctx = document.querySelector('#brain-canv').getContext("2d");
    $scope.cw = $('#brain').width();
    $scope.ch = $('#brain').height();
    var grd = $scope.ctx.createLinearGradient(0, 0, 100, 0);
    grd.addColorStop(0, 'rgba(250,0,0,.5)');
    grd.addColorStop(1, 'rgba(0,250,0,.5)');
    $scope.drawBoard = function() {
        $scope.ctx.fillStyle = '#000'
        $scope.ctx.fillRect(0, 0, $scope.cw, $scope.ch); //blank the canvas for redraw
        $scope.ctx.strokeStyle = '#005';
        $scope.ctx.lineWidth = 1;
        if (!$scope.hideCons) {
            $scope.ins.forEach((ins) => {
                ins.o.forEach((ino) => {
                    if (ins.active) {
                        $scope.ctx.strokeStyle = '#00d';
                        $scope.ctx.lineWidth = 2;
                    } else {
                        $scope.ctx.strokeStyle = '#005';
                        $scope.ctx.lineWidth = .1;
                    }
                    $scope.ctx.beginPath();
                    $scope.ctx.moveTo(0, ins.y);
                    $scope.ctx.lineTo($scope.neurons[ino.target].x, $scope.neurons[ino.target].y);
                    $scope.ctx.stroke();
                    $scope.ctx.closePath();
                })
            });
        }
        $scope.neurons.forEach((neur) => {
            //first, draw the actual neuron
            $scope.ctx.fillStyle = neur.active ? '#ccf' : '#555';
            $scope.ctx.fillRect(neur.x - 3, neur.y - 3, 6, 6);
            //and its connekshunz
            if (!$scope.hideCons) {
                neur.o.forEach((neurOut) => {
                    if (neur.active) {
                        $scope.ctx.strokeStyle = grd;
                        $scope.ctx.lineWidth = 5 * neurOut.weight;
                    } else {
                        $scope.ctx.strokeStyle = 'rgba(0,0,150,.5)';
                        $scope.ctx.lineWidth = .1;
                    }
                    if (!$scope.hideCons && (neur.active || !$scope.hideInactCon)) {
                        $scope.ctx.beginPath();
                        $scope.ctx.moveTo(neur.x, neur.y);
                        $scope.ctx.lineTo($scope.neurons[neurOut.target].x, $scope.neurons[neurOut.target].y);
                        $scope.ctx.stroke();
                        $scope.ctx.closePath();
                    }
                })
            }
        });
    }
    $scope.movePrey = function() {
        if (!$scope.lockPrey) {
            //first, random dir change chances
            if (Math.random() > .98) {
                $scope.prey.dx = (Math.random() * 10) - 5;
            }
            if (Math.random() > .98) {
                $scope.prey.dy = (Math.random() * 10) - 5;
            }
            if ($scope.prey.dx < 0 && ($scope.prey.dx + $scope.prey.x) < 0) {
                $scope.prey.dx = Math.random() * 5; //change horiz to positive
            } else if ($scope.prey.dx > 0 && ($scope.prey.dx + $scope.prey.x) > $scope.playw) {
                $scope.prey.dx = 0 - Math.random() * 5; //change horiz to negative;
            }

            if ($scope.prey.dy < 0 && ($scope.prey.dy + $scope.prey.y) < 0) {
                $scope.prey.dy = Math.random() * 5; //change horiz to positive
            } else if ($scope.prey.dy > 0 && ($scope.prey.dy + $scope.prey.y) > $scope.playh) {
                $scope.prey.dy = 0 - Math.random() * 5; //change horiz to negative;
            }
            $scope.prey.x += $scope.prey.dx;
            $scope.prey.y += $scope.prey.dy;
            var theAng = Math.atan($scope.prey.dy / $scope.prey.dx) * 180 / Math.PI;
            $scope.prey.facing = $scope.dx > 0 ? theAng + 90 : theAng - 90;
        }
    }
    $scope.currPath = [
        [],
        []
    ];
    $scope.activePath = [
        [],
        []
    ];
    $scope.run = function() {
        $scope.activePath = [
            [],
            []
        ];
        var newActive = [];
        for (var i = 0; i < $scope.activeNeurs.length; i++) {
            var probArr = [];
            for (var j = 0; j < $scope.neurons[$scope.activeNeurs[i]].o.length; j++) {
                var numRepeats = Math.ceil($scope.neurons[$scope.activeNeurs[i]].o[j].weight * 99);
                for (var k = 0; k < numRepeats; k++) {
                    probArr.push(j);
                }
            }
            //now got a probability arr
            $scope.neurons[$scope.activeNeurs[i]].active = false;
            var firstOut = probArr[Math.floor(Math.random() * probArr.length)];
            var secondOut = probArr[Math.floor(Math.random() * probArr.length)];
            var maxRolls = 5000;
            while (firstOut == secondOut && maxRolls && $scope.neurons[$scope.activeNeurs[i]].o.length > 1) {
                secondOut = probArr[Math.floor(Math.random() * probArr.length)];
                maxRolls--;
            };
            //first neuron. always runs if any do
            if (Math.random() > .01) {
                if ($scope.neurons[$scope.activeNeurs[i]].o[firstOut].out) {
                    //going to output, so do NOT push in a new neuron
                    $scope.outs[$scope.neurons[$scope.activeNeurs[i]].o[firstOut].target].active = !$scope.outs[$scope.neurons[$scope.activeNeurs[i]].o[firstOut].target].active;
                } else {
                    if (newActive.indexOf($scope.neurons[$scope.activeNeurs[i]].o[firstOut].target) == -1) {
                        newActive.push($scope.neurons[$scope.activeNeurs[i]].o[firstOut].target);
                    }
                    $scope.neurons[$scope.neurons[$scope.activeNeurs[i]].o[firstOut].target].active = true;
                }
                $scope.currPath[0].push([$scope.activeNeurs[i], $scope.neurons[$scope.activeNeurs[i]].o[firstOut]]);
                $scope.activePath[0].push([$scope.activeNeurs[i], $scope.neurons[$scope.activeNeurs[i]].o[firstOut]]);
                if ($scope.neurons[$scope.activeNeurs[i]].doesSplit && maxRolls) {
                    //split, so do 2nd path
                    if ($scope.neurons[$scope.activeNeurs[i]].o[secondOut].out) {
                        //going to output, so do NOT push in a new neuron
                        $scope.outs[$scope.neurons[$scope.activeNeurs[i]].o[secondOut].target].active = !$scope.outs[$scope.neurons[$scope.activeNeurs[i]].o[secondOut].target].active;
                    } else {
                        if (newActive.indexOf($scope.neurons[$scope.activeNeurs[i]].o[secondOut].target) == -1) {
                            newActive.push($scope.neurons[$scope.activeNeurs[i]].o[secondOut].target);
                        }
                        $scope.neurons[$scope.neurons[$scope.activeNeurs[i]].o[secondOut].target].active = true;
                    }
                    $scope.currPath[0].push([$scope.activeNeurs[i], $scope.neurons[$scope.activeNeurs[i]].o[secondOut]]);
                    $scope.activePath[0].push([$scope.activeNeurs[i], $scope.neurons[$scope.activeNeurs[i]].o[secondOut]]);
                }
            }
        }
        //now do inputs
        //read inputs:
        var leftEye = document.querySelector('#sensL').getBoundingClientRect(),
            rightEye = document.querySelector('#sensR').getBoundingClientRect(),
            targPos = document.querySelector('#prey').getBoundingClientRect(),
            distL = ($scope.playw - Math.sqrt(Math.pow((leftEye.left - targPos.left), 2) + Math.pow((leftEye.top - targPos.top), 2))) / $scope.playw,
            distR = ($scope.playw - Math.sqrt(Math.pow((rightEye.left - targPos.left), 2) + Math.pow((rightEye.top - targPos.top), 2))) / $scope.playw;

        $scope.ins[0].active = (Math.random() < (distL / 5));
        $scope.ins[1].active = (Math.random() < (distR / 5));
        $scope.ins[2].active = (Math.random() < (3 * distL / 5));
        $scope.ins[3].active = (Math.random() < (3 * distR / 5));
        for (var m = 0; m < $scope.ins.length; m++) {
            var probArr = [];
            for (j = 0; j < $scope.ins[m].o.length; j++) {
                var numRepeats = Math.ceil($scope.ins[m].o[j].weight * 99);
                for (var k = 0; k < numRepeats; k++) {
                    probArr.push(j);
                }
            }
            //now got a probability arr
            firstOut = probArr[Math.floor(Math.random() * probArr.length)];
            if (Math.random() > .02 && $scope.ins[m].active) {
                if (newActive.indexOf($scope.ins[m].o[firstOut].target) == -1) {
                    newActive.push($scope.ins[m].o[firstOut].target);
                }
                $scope.neurons[$scope.ins[m].o[firstOut].target].active = true;
                $scope.currPath[1].push([m, $scope.ins[m].o[firstOut]])
                $scope.activePath[1].push([m, $scope.ins[m].o[firstOut]])
            }
        }
        //calc energy/heat usage.
        $scope.remainingEn -= newActive.length * $scope.enPerNeur;
        //move org
        for (i = 0; i < $scope.outs.length; i++) {
            if ($scope.outs[i].active) {
                $scope.outs[i].does();
            }
        }
        //move target
        $scope.movePrey();
        //halt/death options
        if ($scope.activeNeurs / $scope.numNeurs > .95) {
            console.log('Death from: overheat at', new Date().getTime())
            $scope.lastDeath = 'Overheat'
            $scope.die(distL, distR);
        } else if ($scope.remainingEn <= 0) {
            console.log('Death from: lack of energy at', new Date().getTime())
            $scope.lastDeath = 'Lack of energy'
            $scope.die(distL, distR);
        } else if (!newActive.length && $scope.hasStarted) {
            console.log('Death from: lack of neural activity at', new Date().getTime())
            $scope.lastDeath = 'Lack of neural activity'
            $scope.die(distL, distR);
        } else if (!$scope.okayRun) {
            console.log('Death from: killed at', new Date().getTime())
            $scope.lastDeath = 'User';
            $scope.rpt = false;
            $scope.die(distL, distR);
        } else if (Math.sqrt(Math.pow(($scope.org.x - $scope.prey.x), 2) + Math.pow(($scope.org.y - $scope.prey.y), 2)) < 35) {
            console.log('Successful hunt!')
            $scope.lastDeath = 'Successful hunt'
            $scope.die(distL, distR, true);
        } else {
            var t = setTimeout(function() {
                $scope.activeNeurs = [];
                $scope.activeNeurs = newActive;
                $scope.$apply();
                $scope.drawBoard();
                $scope.run();
            }, $scope.speed)
        }
    }
    $scope.changePaths = function(isGood) {
        //neurons
        for (var i = 0; i < $scope.currPath[0].length; i++) {
            if ($scope.neurons[$scope.currPath[0][i][0]] && $scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]]) {
                if ($scope.pcm == 'add') {
                    $scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight += isGood ? .04 : -.02;
                } else {
                    $scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight *= isGood ? 1.2 : 0.9;
                }
                //cap vals (add mode only!)
                if ($scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight < 0.02 && $scope.pcm == 'add') {
                    $scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight = 0.02;
                } else if ($scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight > 0.98 && $scope.pcm == 'add') {
                    $scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight = 0.98;
                }
            }
        }
        for (i = 0; i < $scope.currPath[1].length; i++) {
            if ($scope.ins[$scope.currPath[1][i][0]] && $scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]]) {
                if ($scope.pcm == 'add') {
                    $scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight += isGood ? .04 : -.02;
                } else {
                    $scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight *= isGood ? 1.2 : 0.9;
                }
                //cap vals (add mode only!)
                if ($scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight < 0.02 && $scope.pcm == 'add') {
                    $scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight = 0.02;
                } else if ($scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight > 0.98 && $scope.pcm == 'add') {
                    $scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight = 0.98
                }
            }
        }
        //finally, reset the things.
        $scope.currPath = [
            [],
            []
        ];
    }
    $scope.die = function(l, r, isGood) {
        //calc score
        var score = ($scope.remainingEn / 120000) * 200; //time remaining
        score += 400 * (l + r) / 2;
        //success?
        if (isGood) {
            score += $scope.org.y < $scope.prey.y ? 40 : 0;
            score += 60 * ($scope.playw - Math.abs($scope.prey.x - $scope.org.x)) / $scope.playw;
        }
        // if ($scope.sc>0){
        //     score+=90
        // }else{
        //     score-=90;
        // }
        score+=$scope.sc;
        //find out what to do with score;
        $scope.scores.push(score);
        $scope.scoreGraff.data.datasets[0].data.push(score);
        $scope.scoreGraff.data.labels.push($scope.scores.length);
        if ($scope.scores.length >= $scope.avgSize) {
            //calc score
            $scope.scoreAvg = $scope.scores.slice(-$scope.avgSize).reduce(function(p, c) {
                return p + c;
            }) / $scope.avgSize;
            $scope.scoreAvgs.push($scope.scoreAvg);
            if ($scope.scoreAvgs.length > 50) {
                $scope.scoreAvgs.shift();
            }
            $scope.scoreGraff.data.datasets[1].data.push($scope.scoreAvg);
            $scope.changePaths(score > $scope.scoreAvg);
        } else {
            $scope.scoreGraff.data.datasets[1].data.push(score);
        }
        if ($scope.scores.length == $scope.avgSize) {
            $scope.scChart = new Chart(document.querySelector('#score-canv'), $scope.scoreGraff);
        } else if ($scope.scores.length > $scope.avgSize) {
            $scope.scChart.update();
        }
        if ($scope.scoreGraff.data.labels.length > 50) {
            $scope.scoreGraff.data.datasets[0].data.shift();
            $scope.scoreGraff.data.datasets[1].data.shift();
            $scope.scoreGraff.data.labels.shift();

        }
        //clear vars
        $scope.running = false;
        $scope.hasStarted = false;
        if ($scope.rpt) {
            $scope.resetBrain();
        }
    }
    $scope.hasStarted = false;
    $scope.running = false;

    $scope.startSim = function() {
        $scope.neurons[0].active = true;
        $scope.numGenerations++;
        $scope.totalEn = 120000;
        $scope.remainingEn = $scope.totalEn;
        if (!$scope.hasStarted) {
            $scope.hasStarted = true;
            $scope.run();
        }
    }
    $scope.resetBrain = function() {
        $scope.hasStarted = false;
        $scope.running = false;
        for (var i = 0; i < $scope.neurons.length; i++) {
            $scope.neurons[i].active = false;
        }
        for (var j = 0; j < $scope.ins.length; j++) {
            $scope.ins[j].active = false;
        }
        for (var k = 0; k < $scope.outs.length; k++) {
            $scope.outs[k].active = false;
        }
        $scope.prey = {
            x: $scope.w * .5,
            y: $scope.h * .5,
            dx: (Math.random() * 10) - 5,
            dy: (Math.random() * 10) - 5,
            facing: 0
        }
        $scope.org = {
            x: 0,
            y: 0
        }
        $scope.startSim();
    }
})
