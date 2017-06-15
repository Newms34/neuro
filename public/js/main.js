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
                        $scope.hideCons = $('#con-status').checked;
                        $scope.$apply();
                        $scope.drawInitBoard();
                        return true;
                    }
                    return false;
                }
            }
        }
    })

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
        $scope.enPerNeur = $scope.totalEn / ($scope.speed * $scope.numNeurs);
        for (var i = 0; i < $scope.numNeurs; i++) {
            $scope.neurons.push(new $scope.neurConst())
        }
        $scope.outs.push(new $scope.outConst('Move right', function() {
            if ($scope.org.x < $scope.playw - 3) $scope.org.x += 3;
        }));
        $scope.outs.push(new $scope.outConst('Move left', function() {
            if ($scope.org.x > 3) $scope.org.x -= 3;
        }));
        $scope.outs.push(new $scope.outConst('Move down', function() {
            if ($scope.org.y < $scope.playh - 3) $scope.org.y += 3;
        }));
        $scope.outs.push(new $scope.outConst('Move up', function() {
            if ($scope.org.y > 3) $scope.org.y -= 3;
        }));
        // left eye
        $scope.ins.push(new $scope.inConst());
        var numCons = Math.ceil(Math.random() * .1 * $scope.numNeurs);
        for (var j = 0; j < numCons; j++) {
            var whichTarg = false;
            var wt = 0.1 + (Math.random() * 0.8);
            whichTarg = Math.floor(Math.random() * $scope.numNeurs);
            $scope.neurons[whichTarg].i.push('inLeft');
            $scope.ins[0].o.push(new $scope.connection(0, whichTarg, wt, 2));
        }
        // right eye
        $scope.ins.push(new $scope.inConst());
        for (var j = 0; j < numCons; j++) {
            var whichTarg = false;
            var wt = 0.1 + (Math.random() * 0.8);
            whichTarg = Math.floor(Math.random() * $scope.numNeurs);
            $scope.neurons[whichTarg].i.push('inRight');
            $scope.ins[1].o.push(new $scope.connection(1, whichTarg, wt, 2));
        }
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
                data: []
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

        $scope.ins[0].active = (Math.random() < (distL / 3));
        $scope.ins[1].active = (Math.random() < (distR / 3));
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
            $scope.lastDeath = 'User'
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
                $scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight += isGood ? .02 : -.02;
                //cap values
                if ($scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight < 0.02) {
                    $scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight = 0.02;
                } else if ($scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight > 0.98) {
                    $scope.neurons[$scope.currPath[0][i][0]].o[$scope.currPath[0][i][1]].weight = 0.98;
                }
            }
        }
        for (i = 0; i < $scope.currPath[1].length; i++) {
            if ($scope.ins[$scope.currPath[1][i][0]] && $scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]]) {
                $scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight += isGood ? .02 : -.02;
                if ($scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight < 0.02) {
                    $scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight = 0.02;
                } else if ($scope.ins[$scope.currPath[1][i][0]].o[$scope.currPath[1][i][1]].weight > 0.98) {
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
        //find out what to do with score;
        $scope.scores.push(score);
        $scope.scoreGraff.data.datasets[0].data.push(score);
        $scope.scoreGraff.data.labels.push($scope.scores.length);
        if ($scope.scores.length >= 3) {
            //calc score
            $scope.scoreAvg = $scope.scores.slice(-3).reduce(function(p, c) {
                return p + c;
            }) / 3;
            $scope.changePaths(score > $scope.scoreAvg);
        }
        if ($scope.scores.length == 3) {
            $scope.scChart = new Chart(document.querySelector('#score-canv'), $scope.scoreGraff);
        } else if ($scope.scores.length > 3) {
            $scope.scChart.update();
        }
        if ($scope.scoreGraff.data.labels.length>50){
            $scope.scoreGraff.data.datasets[0].data.shift();
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
