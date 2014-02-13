// Element Dots by pok5.de
// Licence: http://creativecommons.org/licenses/MIT/

var updateTime = 30;
var spawnTime = 200;
var updateEvent = null;
var fountainEvent = null;
var matrix = new Array();
var matrix_old = new Array();
var matrix_lock = new Array();
var spawn = new Array();
var dotw = 2;
var doth = 2;
var width = 0;
var height = 0;
var brushtyp = 10;
var canvas;
var context;

var water = 1;
var sand = 2;
var fire = 3;
var steam = 4;
var oil = 5;
var acid = 8;
var plasma = 9;
var solid = 10;
var rock = 11;


$(document).ready(function(){
    initGame();
    initForms();
    shuffleGallery();
});


function initGame() {
	
    canvas = $('#canvas');
    width = Math.floor(canvas.width() / dotw);
    height = Math.floor(canvas.height() / doth);
    $('input[name=brush][value=10]').attr('checked', true);
    updateBrush();
    context = canvas.get(0).getContext('2d');
    if (!context) return;
    for (var w=0; w<=width; w++) {
        matrix[w] = new Array(height);
        matrix_old[w] = new Array(height);
        matrix_lock[w] = new Array(height);
    }

    updateEvent = setInterval(update, updateTime);
    fountainEvent = setInterval(spawnFountain, spawnTime);
    canvas.live('mousedown', spawnEvent);
    canvas.live('mouseup', stopMouseMove);

    updateSpawnPos();
    
    $(".spawn").draggable({
        containment: '#canvasarea',
        stop: function() {
            updateSpawnPos()
        }
    });

    document.addEventListener('touchmove', function(e) {
        //        e.preventDefault();
        var touch = e.touches[0];
        var x = Math.round((touch.pageX - $("#canvasarea").offset().left) / dotw);
        var y = Math.round((touch.pageY - $("#canvasarea").offset().top) / doth);
        spawnDot(x, y);
    }, false);

}

function updateBrush() {
    setBrush( $('input[name=brush]:radio:checked').val() );
}

function setBrush(v) {
    brushtyp = v;
}

function dot(x,y) {
    return (matrix[x] && matrix[x][y]) ? matrix[x][y] : 0;
}

function killDot(x,y) {
    if (x>=0 && y>=0 && x<=width && y<=height) {
        matrix[x][y] = null;
        matrix_lock[x][y]=false;
    }
}

function addDot(x,y,d) {
    if (x>=0 && y>=0 && x<=width && y<=height) {
        matrix[x][y] = d;
        matrix_lock[x][y]=true;
    }
}

function boom(x,y,d,width,height) {
    newMatrix = new Array();
    for (i=0; i<3; i++) {
        newMatrix[i] = new Array();
        for (j=0; j<20; j++) {
            newMatrix[i][j] = d;
        }
    }
    for (w=0; w<newMatrix.length; w++) {
        for (var h=0; h<newMatrix[w].length; h++) {
            matrix[x+w][y-h] = newMatrix[w][h];
        }            
    }
}

function moveDot(x,y,nx,ny,typ,ntyp) {
    if (nx>=0 && ny>=0 && nx<=width && ny<=height && x>=0 && y>=0 && x<=width && y<=height) {
        matrix[x][y] = typ;
        matrix_lock[x][y] = (typ!=null);
        matrix[nx][ny] = ntyp;
        matrix_lock[nx][ny] = true;
    }
}

function draw(x,y,d) {
    if (d==water) context.fillStyle = (Math.random()<0.5)?"#12d":"#12f";
    else if (d==sand) context.fillStyle = (Math.random()<0.6)?"#b73":"#a82";
    else if (d==fire) context.fillStyle = (Math.random()<0.5)?"#c41":"#f60";
    else if (d==steam) context.fillStyle = (Math.random()<0.5)?"#bbd":"#ccc";
    else if (d==oil) context.fillStyle = (Math.random()<0.7)?"#212":"#111";
    else if (d==acid) context.fillStyle = (Math.random()<0.9)?"#f1f":"#e4e";
    else if (d==plasma) context.fillStyle = (Math.random()<0.7)?"#f3a":"#ee0";
    else if (d==solid) context.fillStyle = (Math.random()<0.5)?"#0b0":"#2d2";
    else if (d==rock) context.fillStyle = (Math.random()<0.5)?"#777":"#666";
    else context.fillStyle = "#fff";
    context.fillRect(dotw*x, doth*y, dotw, doth);
}


function update() {
    for (var y=height; y>=0; y--) {
        for (var x=0; x<=width; x++) {

            if (matrix_lock[x][y]==true) continue;

            var d = dot(x,y);
            if (d==0 || d==10 || d==11) continue;
            if (y>=height) killDot(x,y);
												
            // Water
            if (d==1) { 
                var dbc = dot(x,y+1);
                if (dbc==0) {
                    if (Math.random()<0.95) moveDot(x,y,x,y+1,null,d);
                }
                else if (dbc==fire) moveDot(x,y,x,y+1,steam,d);
                else if (dot(x+1,y)==fire) {
                    addDot(x,y,steam);
                    killDot(x+1,y);
                } 
                else if (dot(x-1,y)==fire) {
                    addDot(x,y,steam);
                    killDot(x-1,y);
                } 
                else if (dbc==oil && Math.random()<0.3) 	moveDot(x,y,x,y+1,oil,d);
                else if (dbc==acid && Math.random()<0.01) 	killDot(x,y+1);
                else if (Math.random()<0.1 && dot(x+1,y)==oil) 	moveDot(x+1,y,x,y,d,oil);
                else if (Math.random()<0.1 && dot(x-1,y)==oil) 	moveDot(x-1,y,x,y,d,oil);
                //else if (Math.random()<0.4 && dot(x+1,y)==acid) moveDot(x+1,y,x,y,d,acid);
                //else if (Math.random()<0.4 && dot(x-1,y)==acid) moveDot(x-1,y,x,y,d,acid);
                else if (dbc>0) liquid(x,y,d);
						
            // Sand	
            } else if (d==2) {
                var dbc = dot(x,y+1);
                if (dbc==0) {
                    if (Math.random()<0.9) moveDot(x,y,x,y+1,null,d);
                }
                else if (dbc==water) {
                    if (Math.random()<0.6) moveDot(x,y,x,y+1,water,d);
                } 
                else if (dbc==acid) {
                    if (Math.random()<0.1) moveDot(x,y,x,y+1,acid,d);
                } 
                else if (dbc==oil) {
                    if (Math.random()<0.3) moveDot(x,y,x,y+1,oil,d);
                }
                else if (dbc==fire) killDot(x,y+1);
                else if (Math.random()<0.01 && dot(x-1,y)==0) moveDot(x,y,x-1,y,null,d);
                else if (Math.random()<0.01 && dot(x+1,y)==0) moveDot(x,y,x+1,y,null,d);
                else if (dbc>0 && Math.random()<0.3 && dot(x+1,y+1)==0 && dot(x+1,y)==0) moveDot(x,y,x+1,y,null,d);
                else if (dbc>0 && Math.random()<0.3 && dot(x+1,y)==water) moveDot(x,y,x+1,y,water,d);
                else if (dbc>0 && Math.random()<0.3 && dot(x-1,y)==water) moveDot(x,y,x-1,y,water,d);
                else if (dbc>0 && Math.random()<0.3 && dot(x+1,y)==oil) moveDot(x,y,x+1,y,oil,d);
                else if (dbc>0 && Math.random()<0.3 && dot(x-1,y)==oil) moveDot(x,y,x-1,y,oil,d);
                else if (dbc>0 && Math.random()<0.3 && dot(x-1,y)==0 && dot(x-1,y+1)==0) moveDot(x,y,x-1,y,null,d); 
			
            // Fire	
            } else if (d==3) {
                var dbc = dot(x,y+1);
                var dtc = dot(x,y-1);
                if (dbc==0 && Math.random()<0.7) moveDot(x,y,x,y+1,null,d);
                else if (dtc==rock) killDot(x,y);
                else if ((dbc==oil || dbc==acid) && Math.random()<0.5) addDot(x+1,y-1,d);  
                else if ((dbc==oil || dbc==acid) && Math.random()<0.5) addDot(x-1,y-1,d); 
                else if (dbc==oil) {
                    if (Math.random()<0.002) killDot(x,y+1);
                    addDot(x,y-10-(20*Math.random()),d);
                    addDot(x,y-1-(10*Math.random()),d);
                } 
                else if (dbc==acid) {
                    if (Math.random()<0.1) boom(x,y+1,fire);
                } 
                else if (dbc==rock && Math.random()<0.03) killDot(x,y);
                else if ((dbc==0 || dbc==10) && Math.random()<0.02) addDot(x+1,y-1,d);
                else if ((dbc==0 || dbc==10) && Math.random()<0.02) addDot(x-1,y-1,d);
                else if (dbc==solid && Math.random()<0.004) killDot(x,y+1);  
                else if (dbc==d && Math.random()<0.4) moveDot(x,y,x,y-2,null,d);
                else if (dtc==d && dot(x,y-2)==d && dot(x,y-3)==d) killDot(x,y);

            // Steam	
            } else if (d==4) {
                var dtc = dot(x,y-1);
                if (dtc!=solid && dtc!=rock && dtc!=d && Math.random()<0.5) moveDot(x,y,x,y-1,dtc,d);
                else if (Math.random()<0.3 && dtc>0 && dot(x-1,y)==0 && dot(x-1,y+1)!=d) 	moveDot(x,y,x-1,y,null,4);
                else if (Math.random()<0.3 && dtc>0 && dot(x+1,y)==0 && dot(x+1,y+1)!=d) 	moveDot(x,y,x+1,y,null,4);
                else if (Math.random()<0.3 && dtc>0 && dot(x+2,y)==0 && dot(x+2,y+1)!=d) 	moveDot(x,y,x+2,y,null,4);
                else if (Math.random()<0.3 && dtc>0 && dot(x-2,y)==0 && dot(x-2,y+1)!=d) 	moveDot(x,y,x-2,y,null,4);
                if (Math.random()<0.03 || y<1) killDot(x,y);
				
            // Oil	
            } else if (d==5) {
                var dbc = dot(x,y+1);
                if (dbc==fire && Math.random()<0.2) moveDot(x,y,x,y+1,fire,oil); 
                else if (dbc==0) {
                    if (Math.random()<0.7) moveDot(x,y,x,y+1,null,d);
                }
                else if (dbc==fire && Math.random()<0.1) addDot(x,y,fire);
                else if (dbc==0 && Math.random()<0.05) addDot(x,y+1,d);
                else if (dbc>0) liquid(x,y,d);
            
            // Acid	
            } else if (d==8) {
                var dbc = dot(x,y+1);
                if (dbc==0) {
                    if (Math.random()<0.9) moveDot(x,y,x,y+1,null,d);
                }
                else if (dbc==fire) moveDot(x,y,x,y+1,plasma,acid); 
                else if (dbc==water) {
                    if (Math.random()<0.7) moveDot(x,y,x,y+1,water,d);
                }
                else if (dbc==sand) {
                    if (Math.random()<0.05) killDot(x,y);
                }
                else if (dbc==rock || dot(x-1,y)==rock || dot(x+1,y)==rock) liquid(x,y,d);
                else if (dbc>0 && dbc!=d && Math.random()<0.04) moveDot(x,y,x,y+1,null,d);
                else if (Math.random()<0.05 && dot(x+1,y)!=d) moveDot(x,y,x+1,y,null,d);
                else if (Math.random()<0.05 && dot(x-1,y)!=d) moveDot(x,y,x-1,y,null,d);
                else if (dbc==oil) {
                    if (Math.random()<0.005) boom(x,y,fire);
                }
                else if (dbc>0) liquid(x,y,d);
            
            // Plasma	
            } else if (d==9) {
                if (Math.random()<0.1) killDot(x,y);
            }

        }// for x
    }// for y
					
    for (y=height; y>=0; y--) {
        for (x=0; x<=width; x++) {
            d = dot(x,y);
            if (d != matrix_old[x][y]) draw(x,y,d); // draw only new dots
            matrix_old[x][y] = d;
            matrix_lock[x][y] = false;
        }
    }

}

function liquid(x,y,c) {
    var r1 = dot(x+1,y);
    var r2 = dot(x+2,y);
    var r3 = dot(x+3,y); 
    var l1 = dot(x-1,y);
    var l2 = dot(x-2,y);
    var l3 = dot(x-3,y); 
    var w = ((r1==c)?1:0) + ((r2==c)?1:0) + ((r3==c)?1:0) - ((l1==c)?1:0) - ((l2==c)?1:0) - ((l3==c)?1:0);
    if (w<=0 && Math.random()<0.5) {
        if (r1==0 && dot(x+1,y-1)!=c) moveDot(x,y,x+1,y,null,c);
        else if (r2==0 && dot(x+2,y-1)!=c) moveDot(x,y,x+2,y,null,c);
        else if (r3==0 && dot(x+3,y-1)!=c) moveDot(x,y,x+3,y,null,c);
    } else if (w>=0 && Math.random()<0.5) {
        if (l1==0 && dot(x-1,y-1)!=c) moveDot(x,y,x-1,y,null,c);
        else if (l2==0 && dot(x-2,y-1)!=c) moveDot(x,y,x-2,y,null,c);
        else if (l3==0 && dot(x-3,y-1)!=c) moveDot(x,y,x-3,y,null,c);
    }
}

function mousePos(e) {
    return {
        x: Math.round((e.pageX-canvas.offset().left)/dotw), 
        y: Math.round((e.pageY-canvas.offset().top)/doth)
    }
}

function spawnEvent(e) {
    var pos = mousePos(e);
    spawnDot(pos.x, pos.y);
    canvas.live('mousemove', paintEvent);
}

function paintEvent(e) {
    var pos = mousePos(e);
    spawnDot(pos.x, pos.y);
}

function spawnDot(x,y) {
    if (brushtyp==0 || brushtyp==9 || brushtyp==10 || brushtyp==11) {
        var b = 4;
        for (var i=0;i<=b;i++) {	
            for (var j=0;j<=b;j++) {
                if ((i==0 || i==b) && (j==0 || j==b)) continue;
                addDot(x-(b/2)+i, y-(b/2)+j, brushtyp);
            }
        }
    } else {
        addDot(x, y, brushtyp);
    }
}

function stopMouseMove(e) {
    canvas.die('mousemove');
}

function updateSpawnPos() {
    $(".spawn").each(function(idx, obj) {
        var x = Math.round(($(obj).offset().left - $("#canvasarea").offset().left) / dotw);
        var y = Math.round(($(obj).offset().top - $("#canvasarea").offset().top) / doth);
        var typ = (idx==0) ? 1 : ((idx==1) ? 2 : 5);
        spawn[idx] = {
            x:x, 
            y:y, 
            typ:typ, 
            id:$(obj).attr('id')
        };
    });
}

function spawnFountain() {
    for (i=0; i<spawn.length; i++) {
        addDot(spawn[i].x+2, spawn[i].y+4, spawn[i].typ);
    }
}
/*
function initForms() {

    $("#saveGameForm").on('submit', function() {
        
        $(".saveBtn").val('processing...');
        $(".saveBtn").attr('disabled', 'disabled');
    
        $.ajax({
            url: "ajax/save.php",
            type: "POST",
            data: {
                matrix: JSON.stringify(matrix),
                spawns: JSON.stringify(spawn),
                img: $("#canvas").get(0).toDataURL("image/png")
            },
            dataType: "html"
        }).done(function(gameid) {
            $("#permalink").val("http://pok5.de/elementdots/?g="+gameid).show().select();
            $("#fbShareFeed").load("sharelink.php?g="+gameid);
            
        }).always(function() {
            $(".saveBtn").val('Snapshot');
            $(".saveBtn").removeAttr('disabled');
        });
        
        return false;
    });

}
*/
/*
function loadGame(filename, scaleX, scaleY) {

    $.ajax({
        url: "ajax/load.php",
        type: "GET",
        data: {
            g: filename,
            sx: scaleX,
            sy: scaleY
        },
        dataType: "html"
    }).done(function(msg) {
        try {
            var obj = JSON.parse(msg);
        
            var newMatrix = obj.matrix;
            var s = obj.spawns;
        
            for (w=0; w<newMatrix.length; w++) {
                for (var h=0; h<newMatrix[w].length; h++) {
                    matrix[w][h] = newMatrix[w][h];
                }            
            }
        
            for (i=0; i<s.length; i++) {
                $("#"+s[i].id).offset({
                    left: s[i].x * doth + $("#canvasarea").offset().left,
                    top: s[i].y * dotw + $("#canvasarea").offset().top
                });
            }
            updateSpawnPos();
        
            window.history.pushState(null, filename, "?g="+filename);
            
            $("#fbShareFeed").load("sharelink.php?g="+filename);
            
        } catch (e) {
            //console.log(e);
        }
    });
    
    return false;
}


function shuffleGallery() {

    $.ajax({
        url: "ajax/gallery.php",
        dataType: "html"
    }).done(function(msg) {
        $("#gallery").html(msg);
    });

}*/

