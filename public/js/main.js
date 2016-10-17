var app = angular.module('neur-app', []).controller('neur-con', function($scope, $http) {
    // simple sim: https://jsfiddle.net/zg5vknbr/8/
    $scope.h = $('#brain').height();
    $scope.w = $('#brain').width();
    $scope.neurons = [];
    $scope.outs = [];
    $scope.ins = [];
    $scope.numIns = 5;
    $scope.numOuts = 7
    $scope.numNeurs = parseInt(prompt('Number of neurons?', '30'));
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
    $scope.outConst = function() {
        this.x = $scope.w;
        this.y = $scope.h * $scope.outs.length / $scope.numOuts;
        this.active = false;
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
    for (var q = 0; q < $scope.numOuts; q++) {
        $scope.outs.push(new $scope.outConst());
    }
    for (var p = 0; p < $scope.numIns; p++) {
        $scope.ins.push(new $scope.inConst());
        var numCons = Math.ceil(Math.random() * .1 * $scope.numNeurs);
        for (var j = 0; j < numCons; j++) {
            var whichTarg = false;
            var wt = 0.1 + (Math.random() * 0.8);
            whichTarg = Math.floor(Math.random() * $scope.numNeurs);
            $scope.neurons[whichTarg].i.push('in' + p);
            $scope.ins[p].o.push(new $scope.connection(p, whichTarg, wt, 2));
        }

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
            if (Math.random() > .02) {
                if (newActive.indexOf($scope.ins[m].o[firstOut].target) == -1) {
                    newActive.push($scope.ins[m].o[firstOut].target);
                }
                $scope.neurons[$scope.ins[m].o[firstOut].target].active = true;
            }
        }
        //finally, calc energy/heat usage.
        if ($scope.activeNeurs / $scope.numNeurs > .8) {
            alert('The brain overheated!');
            return;
        }
        var t = setTimeout(function() {
            $scope.activeNeurs = [];
            $scope.activeNeurs = newActive;
            $scope.$apply();
            console.log(newActive.length, 'neurons:', newActive)
            if (!$scope.activeNeurs.length && $scope.hasStarted) {
                alert('No more active neurons! Try a different starting neuron, or include more neurons.');
            }
            if (!$scope.okayRun) {
                return;
            }
            $scope.run();
        }, 150)
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
})
