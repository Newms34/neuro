var app = angular.module('neur-app', []).controller('neur-con', function($scope, $http) {
    // simple sim: https://jsfiddle.net/zg5vknbr/8/
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
    $scope.speed = 150;
    $scope.speedRaw = 86;
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
    $scope.is3d = false;
    bootbox.dialog({
        title: 'Neuron Simulation Startup Options',
        message: '<div class="form-group col-md-12"><div class="col-md-5">Number of neurons</div><div class="col-md-6"><input type="number" id="num-in" value="99" /></div></div><br/><br/><div class="form-group col-md-12"><div class="col-md-5">Connections Per Neuron (percent of total)</div><div class="col-md-6"><div class="col-md-1">0%</div><div class="col-md-8"><input type="range" min="1" value ="20" max="50" id="numConnects"/></div><div class="col-md-1">50%</div></div></div><br/><br/><div class="form-group col-md-12"><div class="col-md-5">Enable 3d Brain</div><div class="col-md-6"><input type="checkbox" onchange="angular.element(\'body\').scope().toggle3d();" /></div></div><br/><br/><div class="alert-danger" id="warn3d" style="display:none"><h4>Warning:</h4>3d brain rendering is a LOT more processor intensive!</div>',
        buttons: {
            confirm: {
                label: 'Create',
                className: 'btn-success',
                callback: function() {
                    console.log('RESULT:', $('#num-in').val(), $scope.is3d)
                    if (isNaN(parseInt($('#num-in').val()))) {
                        bootbox.alert('Please enter a number of neurons');
                    } else if (parseInt($('#num-in').val()) < 5) {
                        bootbox.alert('Number of neurons too low!')
                    } else {
                        $scope.numNeurs = parseInt($('#num-in').val());
                        $scope.numBaseCons = $scope.numNeurs*parseInt($('#numConnects').val())/100;
                        console.log('Neurons:',$scope.numNeurs,'Connects per neuron',$scope.numBaseCons)
                        $scope.drawBoard();
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
    $scope.toggle3d = function() {
        $scope.is3d = !$scope.is3d;
        $scope.$apply();
        if ($scope.is3d) {
            $('#warn3d').show(100);
        } else {
            $('#warn3d').hide(100);;
        }
    }
    $scope.mouseAng = 0;
    window.onmousemove = function(e) {
        if ($scope.rotOn) {
            $scope.mouseAng = e.x || e.clientX;
            $scope.$apply();
        }
    }
    window.onkeyup = function(e) {
        if (e.which == 32) {
            e.preventDefault();
            $scope.rotOn = !$scope.rotOn;
        }
    }
    $scope.getDist = function(a, b, conMode) {
        var firstItem = conMode == 2 ? $scope.ins[a] : $scope.neurons[a];
        var secondItem = conMode == 1 ? $scope.outs[b] : $scope.neurons[b];
        //a & b are indices of the source and target, respectively
        return Math.sqrt(Math.pow((secondItem.x - firstItem.x), 2) + Math.pow((secondItem.y - firstItem.y), 2));
    }
    $scope.getAng = function(a, b, conMode) {
        var firstItem = conMode == 2 ? $scope.ins[a] : $scope.neurons[a];
        var secondItem = conMode == 1 ? $scope.outs[b] : $scope.neurons[b];
        var theAng = Math.atan((secondItem.y - firstItem.y) / (secondItem.x - firstItem.x)) * 180 / Math.PI;
        return secondItem.x >= firstItem.x ? theAng : theAng - 180;
    }
    $scope.getDist3d = function(a, b, conMode) {
        var firstItem = conMode == 2 ? $scope.ins[a] : $scope.neurons[a];
        var secondItem = conMode == 1 ? $scope.outs[b] : $scope.neurons[b];
        return Math.sqrt(Math.pow((secondItem.x - firstItem.x), 2) + Math.pow((secondItem.y - firstItem.y), 2) + Math.pow((secondItem.z - firstItem.z), 2));
    }
    $scope.getAng3d = function(a, b, conMode) {
        var firstItem = conMode == 2 ? $scope.ins[a] : $scope.neurons[a];
        var secondItem = conMode == 1 ? $scope.outs[b] : $scope.neurons[b];
        var theAngs = {
            v: Math.atan((secondItem.y - firstItem.y) / (Math.sqrt(Math.pow((secondItem.x - firstItem.x), 2) + Math.pow((secondItem.z - firstItem.z), 2)))) * 180 / Math.PI,
            h: Math.atan((secondItem.z - firstItem.z) / (secondItem.x - firstItem.x)) * 180 / Math.PI
        }
        if (secondItem.x < firstItem.x) {
            theAngs.h = theAngs.h - 180;
        }
        console.log('ANGLES from', a, 'to', b, 'are', theAngs)
        return theAngs;
    }
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
        this.len = $scope.is3d ? $scope.getDist3d(s, t, conMode) : $scope.getDist(s, t, conMode);
        this.ang = $scope.getAng(s, t, conMode);
        this.threeAng = $scope.is3d ? $scope.getAng3d(s, t, conMode) : { h: null, v: null };
    }
    $scope.drawBoard = function() {
        $scope.totalEn = 120000;
        $scope.remainingEn = $scope.totalEn;
        $scope.enPerNeur = $scope.totalEn / ($scope.speed * $scope.numNeurs);
        for (var i = 0; i < $scope.numNeurs; i++) {
            $scope.neurons.push(new $scope.neurConst())
        }
        $scope.$apply();
        $scope.outs.push(new $scope.outConst('Move right', function() {
            if ($scope.org.x < $scope.playw - 3) $scope.org.x += 3;
        }))
        $scope.$apply();
        $scope.outs.push(new $scope.outConst('Move left', function() {
            if ($scope.org.x > 3) $scope.org.x -= 3;
        }))
        $scope.$apply();
        $scope.outs.push(new $scope.outConst('Move down', function() {
            if ($scope.org.y < $scope.playh - 3) $scope.org.y += 3;
        }))
        $scope.$apply();
        $scope.outs.push(new $scope.outConst('Move up', function() {
            if ($scope.org.y > 3) $scope.org.y -= 3;
        }))
        $scope.$apply();
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
        $scope.$apply();
        // right eye
        $scope.ins.push(new $scope.inConst());
        for (var j = 0; j < numCons; j++) {
            var whichTarg = false;
            var wt = 0.1 + (Math.random() * 0.8);
            whichTarg = Math.floor(Math.random() * $scope.numNeurs);
            $scope.neurons[whichTarg].i.push('inRight');
            $scope.ins[1].o.push(new $scope.connection(1, whichTarg, wt, 2));
        }
        $scope.$apply();
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
    };
    $scope.okayRun = true;
    $scope.lastScore = 0;
    $scope.tracePath = false;
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
        console.log('NUM PREV ACTIVE PATHS', $scope.activePath.length)
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

        $scope.ins[0].active = (Math.random() < (distL/3));
        $scope.ins[1].active = (Math.random() < (distR/3));
        
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
        if (score > $scope.lastScore) {
            $scope.lastScore = score;
            $scope.changePaths(true);
        } else {
            $scope.changePaths(false);
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
        $scope.totalEn = 120000;
        $scope.remainingEn = $scope.totalEn;
        if (!$scope.hasStarted) {
            $scope.hasStarted = true;
            $scope.run();
        }
    }
    $scope.grafWarn = function(n) {
        n=parseInt(n);
        if (((!n||n==0) && !$scope.is3d && $scope.tracePath) ||(n==1 && $scope.is3d && !$scope.tracePath)) {
            if((!n||n==0)){
                $scope.tracePath=false;
            }else{
                $scope.is3d=false;
            }//set these both to false, so user has time to think about wat they've done >:(
            bootbox.confirm({
                title: 'Performance Warning',
                message: '3d mode and Path Tracing both use some fairly complex calculations. They can severely slow down or crash your browser. Are you sure you want to activate one of these advanced modes?',
                callback: function(r) {
                    console.log('warn response is',r)
                    if(r && r!=null){
                        if(!n||n==0){
                            $scope.tracePath=true;
                        }else{
                            $scope.is3d=true;
                        }
                    }
                    $scope.$apply();
                }
            })
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
