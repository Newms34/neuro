var app = angular.module('neur-app', []).controller('neur-con', function($scope, $http) {
    // simple sim: https://jsfiddle.net/zg5vknbr/8/
    $scope.h = $('#brain').height();
    $scope.w = $('#brain').width();
    $scope.neurons = [];
    $scope.outs = [];
    $scope.ins = [];
    $scope.numIns = 5;
    $scope.numOuts = 7;
    $scope.speed = 150;
    $scope.prey = {
        x: $scope.w * .5,
        y: $scope.h * .5,
        dx: (Math.random() * 10) - 5,
        dy: (Math.random() * 10) - 5,
        facing: 0
    }
    $scope.org = {
        x:0,
        y:0
    }
    $scope.numNeurs = parseInt(prompt('Number of neurons?', '30'));
    $scope.totalEn = 120000;
    $scope.remainingEn = $scope.totalEn;
    $scope.enPerNeur = $scope.totalEn / ($scope.speed * $scope.numNeurs);
    $scope.activeNeurs = [];
    $scope.getDist = function(a, b, conMode) {
        var firstItem = conMode == 2 ? $scope.ins[a] : $scope.neurons[a];
        var secondItem = conMode == 1 ? $scope.outs[b] : $scope.neurons[b];
        //a & b are indeces of the source and target, respectively
        return Math.sqrt(Math.pow((secondItem.x - firstItem.x), 2) + Math.pow((secondItem.y - firstItem.y), 2));
    }
    $scope.getAng = function(a, b, conMode) {
        var firstItem = conMode == 2 ? $scope.ins[a] : $scope.neurons[a];
        var secondItem = conMode == 1 ? $scope.outs[b] : $scope.neurons[b];
        var theAng = Math.atan((secondItem.y - firstItem.y) / (secondItem.x - firstItem.x)) * 180 / Math.PI;
        return secondItem.x >= firstItem.x ? theAng : theAng - 180;
    }
    $scope.outConst = function(action,does) {
        this.x = $scope.w;
        this.y = $scope.h * $scope.outs.length / $scope.numOuts;
        this.active = false;
        this.action = action;//title of action
        this.does = does;//what does this output do?
    }
    $scope.inConst = function() {
        this.x = 50;
        this.y = $scope.h * $scope.ins.length / $scope.numIns;
        this.o = [];
        this.active = false;
    }
    $scope.neurConst = function() {
        this.i = []; //inputs. Determined by another neuron's out targetting this neuron
        this.o = []; //outputs. Set randomly
        this.x = Math.floor(Math.random() * ($scope.w - 10));
        this.y = Math.floor(Math.random() * ($scope.h - 10));
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
        this.len = $scope.getDist(s, t, conMode);
        this.ang = $scope.getAng(s, t, conMode);
    }
    for (var i = 0; i < $scope.numNeurs; i++) {
        $scope.neurons.push(new $scope.neurConst())
    }
    // for (var q = 0; q < $scope.numOuts; q++) {
    //     $scope.outs.push(new $scope.outConst());
    // }
    $scope.outs.push(new $scope.outConst('Move right',function(){
        $scope.org.x+=3;
    }))
    $scope.outs.push(new $scope.outConst('Move left',function(){
        $scope.org.x-=3;
    }))
    $scope.outs.push(new $scope.outConst('Move down',function(){
        $scope.org.y+=3;
    }))
    $scope.outs.push(new $scope.outConst('Move up',function(){
        $scope.org.y-=3;
    }))
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
    var numCons = Math.ceil(Math.random() * .1 * $scope.numNeurs);
    for (var j = 0; j < numCons; j++) {
        var whichTarg = false;
        var wt = 0.1 + (Math.random() * 0.8);
        whichTarg = Math.floor(Math.random() * $scope.numNeurs);
        $scope.neurons[whichTarg].i.push('inRight');
        $scope.ins[1].o.push(new $scope.connection(1, whichTarg, wt, 2));
    }

    for (i = 0; i < $scope.numNeurs; i++) {
        var numCons = Math.ceil(Math.random() * .3 * $scope.numNeurs);
        for (var j = 0; j < numCons; j++) {
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
    $scope.okayRun = true;
    $scope.lastScore = 0;
    $scope.startTime = new Date().getTime();
    $scope.movePrey = function() {
        var w = $('#playfield').width() - 50,
            h = $('#playfield').height() - 50;
        //first, random dir change chances
        if (Math.random() > .98) {
            $scope.prey.dx = (Math.random() * 10) - 5;
        }
        if (Math.random() > .98) {
            $scope.prey.dy = (Math.random() * 10) - 5;
        }
        if ($scope.prey.dx < 0 && ($scope.prey.dx + $scope.prey.x) < 0) {
            $scope.prey.dx = Math.random() * 5; //change horiz to positive
        } else if ($scope.prey.dx > 0 && ($scope.prey.dx + $scope.prey.x) > w) {
            $scope.prey.dx = 0 - Math.random() * 5; //change horiz to negative;
        }

        if ($scope.prey.dy < 0 && ($scope.prey.dy + $scope.prey.y) < 0) {
            $scope.prey.dy = Math.random() * 5; //change horiz to positive
        } else if ($scope.prey.dy > 0 && ($scope.prey.dy + $scope.prey.y) > h) {
            $scope.prey.dy = 0 - Math.random() * 5; //change horiz to negative;
        }
        $scope.prey.x += $scope.prey.dx;
        $scope.prey.y += $scope.prey.dy;
        var theAng = Math.atan($scope.prey.dy / $scope.prey.dx) * 180 / Math.PI;
        $scope.prey.facing = $scope.dx > 0 ? theAng + 90 : theAng - 90;
    }
    $scope.run = function() {
        var newActive = [];
        for (var i = 0; i < $scope.activeNeurs.length; i++) {
            var probArr = [];
            for (var j = 0; j < $scope.neurons[$scope.activeNeurs[i]].o.length; j++) {
                var numRepeats = Math.ceil($scope.neurons[$scope.activeNeurs[i]].o[j].weight * 15);
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
                if ($scope.neurons[$scope.activeNeurs[i]].doesSplit && maxRolls) {
                    if ($scope.neurons[$scope.activeNeurs[i]].o[secondOut].out) {
                        //going to output, so do NOT push in a new neuron
                        $scope.outs[$scope.neurons[$scope.activeNeurs[i]].o[secondOut].target].active = !$scope.outs[$scope.neurons[$scope.activeNeurs[i]].o[secondOut].target].active;
                    } else {
                        if (newActive.indexOf($scope.neurons[$scope.activeNeurs[i]].o[secondOut].target) == -1) {
                            newActive.push($scope.neurons[$scope.activeNeurs[i]].o[secondOut].target);
                        }
                        $scope.neurons[$scope.neurons[$scope.activeNeurs[i]].o[secondOut].target].active = true;
                    }
                }
            }
        }
        //now do inputs
        //read inputs:
        var leftEye = document.querySelector('#sensL').getBoundingClientRect(),
            rightEye = document.querySelector('#sensR').getBoundingClientRect(),
            targPos = document.querySelector('#prey').getBoundingClientRect(),
            distL = ($('#playfield').width() - Math.sqrt(Math.pow((leftEye.left - targPos.left), 2) + Math.pow((leftEye.top - targPos.top), 2))) / $('#playfield').width(),
            distR = ($('#playfield').width() - Math.sqrt(Math.pow((rightEye.left - targPos.left), 2) + Math.pow((rightEye.top - targPos.top), 2))) / $('#playfield').width();

        console.log(distL, distR)
        $scope.ins[0].active = Math.random()<distL;
        $scope.ins[1].active = Math.random()<distR;
        for (var m = 0; m < $scope.ins.length; m++) {
            var probArr = [];
            for (j = 0; j < $scope.ins[m].o.length; j++) {
                var numRepeats = Math.ceil($scope.ins[m].o[j].weight * 15);
                for (var k = 0; k < numRepeats; k++) {
                    probArr.push(j);
                }
            }
            //now got a probability arr
            var firstOut = probArr[Math.floor(Math.random() * probArr.length)];
            if (Math.random() > .02 && $scope.ins[m].active) {
                if (newActive.indexOf($scope.ins[m].o[firstOut].target) == -1) {
                    newActive.push($scope.ins[m].o[firstOut].target);
                }
                $scope.neurons[$scope.ins[m].o[firstOut].target].active = true;
            }
        }
        //calc energy/heat usage.
        $scope.remainingEn -= newActive.length * $scope.enPerNeur;
        if ($scope.activeNeurs / $scope.numNeurs > .8) {
            alert('The brain overheated!');
            return;
        }
        if ($scope.remainingEn <= 0) {
            alert('Ran out of energy!')
            return;
        }
        //move org
        for (i=0;i<$scope.outs.length;i++){
            if($scope.outs[i].active){
                console.log('OUTPUT',$scope.outs[i].does)
                $scope.outs[i].does();
            }
        }
        //finally, move target;
        $scope.movePrey();
        var t = setTimeout(function() {
            $scope.activeNeurs = [];
            $scope.activeNeurs = newActive;
            $scope.$apply();
            if (!$scope.activeNeurs.length && $scope.hasStarted) {
                alert('No more active neurons! Try a different starting neuron, or include more neurons.');
            }
            if (!$scope.okayRun) {
                return;
            }
            $scope.run();
        }, $scope.speed)
    }
    $scope.hasStarted = false;
    $scope.running = false;
    $scope.toggleInp = function(n) {
        $scope.ins[n].active = !$scope.ins[n].active;
        if (!$scope.hasStarted) {
            $scope.hasStarted = true;
            $scope.run();
        }
    }
    $scope.startSim = function(){
        $scope.neurons[0].active=true;
        if (!$scope.hasStarted) {
            $scope.hasStarted = true;
            $scope.run();
        }
    }
})
