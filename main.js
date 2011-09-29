var direction=["Top","Bottom","Left","Right"];

//*=Wall
//p=Player
//g=Ghost
//.=Pill
//o=Hunter Pill
// =Nothing

var initialise=function() {
	var maze=[
	"*********************",
	"*.........*.........*",
	"*.***.***.*.***.***.*",
	"*o***.***.*.***.***o*",
	"*.***.***.*.***.***.*",
	"*...................*",
	"*.***.*.*****.*.***.*",
	"*.***.*.*****.*.***.*",
	"*.....*...*...*.....*",
	"*****.*** * ***.*****",
	"    *.*       *.*    ",
	"    *.* ** ** *.*    ",
	"*****.* * g * *.*****",
	"1    .  *ggg*  .    1",
	"*****.* ***** *.*****",
	"    *.*       *.*    ",
	"    *.* ***** *.*    ",
	"*****.* ***** *.*****",
	"*.........*.........*",
	"*.***.***.*.***.***.*",
	"*o..*.....p.....*..o*",
	"***.*.*.*****.*.*.***",
	"***.*.*.*****.*.*.***",
	"*.....*...*...*.....*",
	"*.*******.*.*******.*",
	"*...................*",
	"*********************"
	];

	var playerDefaultSpeed = 100, ghostDefaultSpeed = 150;
	var board = document.body.appendChild(createBoard(maze));
	
	var keyboard=new Keyboard(playerDefaultSpeed);
	keyboard.setListener("Up",function() {board.movePlayer("Top");});
	keyboard.setListener("Down",function() {board.movePlayer("Bottom");});
	keyboard.setListener("Right",function() {board.movePlayer("Right");});
	keyboard.setListener("Left",function() {board.movePlayer("Left");});
	
	var ghostTimer = undefined, ghostHardness = ghostDefaultSpeed;
	var resetGhostTimer = function(hardness) {
		if (ghostTimer) window.clearInterval(ghostTimer);
		ghostTimer=window.setInterval( function(){ 
			board.moveGhosts(); 
		},ghostHardness=hardness);
	}
	resetGhostTimer(ghostDefaultSpeed);

	var resetPlayer = function(speed) {
		keyboard.stop();
		keyboard.start(speed||playerDefaultSpeed);
	}
	var toolbox = document.body.appendChild(document.createElement("DIV"));
	toolbox.className = "Toolbox";
	
	var restartButton = toolbox.appendChild(document.createElement("BUTTON"));
	restartButton.innerHTML = "Restart";
	restartButton.onclick = function(e) {
		window.clearInterval(ghostTimer); 
		ghostTimer = 0;
		keyboard.stop();
		document.body.removeChild(board);
		board = document.body.insertBefore(createBoard(maze),document.body.firstChild);
		resetGhostTimer(ghostHardness);
		resetPlayer(playerDefaultSpeed);
		return false;
	}

	
	var easyButton = toolbox.appendChild(document.createElement("BUTTON"));
		easyButton.innerHTML = "Easy";
		easyButton.onclick = function() {
			resetGhostTimer(500);
		}
	var mediumButton = toolbox.appendChild(document.createElement("BUTTON"));
		mediumButton.innerHTML = "Medium";
		mediumButton.onclick = function() {
			resetGhostTimer(100);
		}
	var hardButton = toolbox.appendChild(document.createElement("BUTTON"));
		hardButton.innerHTML = "Hard";
		hardButton.onclick = function() {
			resetGhostTimer(50);
		}
		
	toolbox.style.height = board.offsetHeight+"px";
	
	board.endGame = function(ghost) {
		window.clearInterval(ghostTimer);
		ghostTimer = undefined;
		keyboard.stop();
		board.showPlayer(false);
		if (confirm("Game over - again?")) {
			// OK
			keyboard.start(playerDefaultSpeed);
			board.showPlayer(true);
			restartButton.click();	
		} else {
			// Cancel
			window.location.replace("about:blank");
		}
	}
}

var createBoard = function(maze) {
	var board=document.createElement("table");
	board.className="Board";
	
	var rows=maze.length;
	var cells=maze[0].length;
	var player = undefined;
	var ghosts = []
	var boardBody=board.appendChild(document.createElement("tbody"));
	
	board.getPlayer = function() {
		return player;
	}
	board.showPlayer = function(show) {
		player.style.display = show?"block":"none";
	}
	for (var y=0;y<rows;++y) {
		var row=boardBody.appendChild(document.createElement("tr"));
		for (var x=0;x<cells;++x) {
			var cell=row.appendChild(document.createElement("td"));
			cell.getNeighbor=function(direction) {
				switch(direction) {
					case "Left":
						return this.previousSibling; break;
					
					case "Right":
						return this.nextSibling; break;
					
					case "Top":
						var p1=this.parentNode.previousSibling;
						if (!p1) return undefined;
						return p1.cells[this.cellIndex];
						break;
					
					case "Bottom":
						var p2=this.parentNode.nextSibling;
						if(!p2) return undefined;
						return p2.cells[this.cellIndex];
						break;
				}
			}
			

			var type=maze[y].charAt(x)
			if (type=="*") {
				cell.className="Wall";
			}
			if (type=="/") {
				cell.className="Text";
			}
			if (type==".") {
				cell.appendChild(createImage("pill.jpg","Pill"));
			}
			if (type=="g") {
				var g=cell.appendChild(createImage("ghost.jpg","Ghost"));
				ghosts.push(g);
				g.moveTo = function (c) {
					if (this.pill) this.parentNode.appendChild(this.pill);
					this.parentNode.removeChild(this);
					this.pill=c.firstChild;
					c.appendChild(this);
					if (this.pill && this.pill.className!="Pill") this.pill = undefined;
					if (this.pill) c.removeChild(this.pill);
					
					if (this.HunterPill) this.parentNode.appendChild(this.HunterPill);
					this.parentNode.removeChild(this);
					this.HunterPill=c.firstChild;
					c.appendChild(this);
					if (this.HunterPill && this.HunterPill.className!="HunterPill") this.HunterPill = undefined;
					if (this.HunterPill) c.removeChild(this.HunterPill);
					
					if (player.parentNode==c) 
						board.endGame(this);
				}
			}
			if (type=="p") {
				player=cell.appendChild(createImage("player.jpg","Player"));
				player.moveTo=function (c) {
					this.parentNode.removeChild(this);
					c.appendChild(this);
					for (var i=0;i<ghosts.length;++i) 
						if (ghosts[i].parentNode==c) { board.endGame(ghosts[i]); break; }
				}
			}
			if (type=="o") {
				cell.appendChild(createImage("hunterpill.jpg","HunterPill"));
			}
		}
	}
	
	board.movePlayer=function(direction) {
		var currentCell=player.parentNode;
		var nextCell=currentCell.getNeighbor(direction);
		
		if (!nextCell) return;
		if (nextCell.className=="Wall"/* || (nextCell.firstChild && nextCell.firstChild.className=="Ghost")*/) return;
		
		if (nextCell.firstChild) nextCell.removeChild(nextCell.firstChild);
		
		player.src="pacman"+direction+".jpg";
		
		player.moveTo(nextCell);
	}
	
	board.moveGhosts=function() {
		for(var i=0;i<ghosts.length;++i) {
			var g=ghosts[i];
			var p=g.parentNode;
			var newDirection=this.calcDirection(g,player);
			if (newDirection) {
				var newCell=g.parentNode.getNeighbor(newDirection);
				g.moveTo(newCell);
			}
		}
	}
	
	board.calcDirection = function(g,p) {
		// 1. Finde alle gyldige retninger (-vægge, -undenfor-felter)
		// 2. Find, blandt de gyldige, den retning der får spøgelset tættere på spilleren.
		// 3. What if cond. not satisfied?
		// 4. Add randomness
		var gc=g.parentNode;
		if (!gc) return undefined;
		
		var gT=gc.getNeighbor("Top")
		var gB=gc.getNeighbor("Bottom")
		var gL=gc.getNeighbor("Left")
		var gR=gc.getNeighbor("Right")
		
		if(gT && (gT.className=="Wall" || (gT.firstChild && gT.firstChild.className=="Ghost"))) {
			gT=undefined;
		}
		if(gB && (gB.className=="Wall" || (gB.firstChild && gB.firstChild.className=="Ghost"))) {
			gB=undefined;
		}
		if(gL && (gL.className=="Wall" || (gL.firstChild && gL.firstChild.className=="Ghost"))) {
			gL=undefined;
		}
		if(gR && (gR.className=="Wall" || (gR.firstChild && gR.firstChild.className=="Ghost"))) {
			gR=undefined;
		}
		
		
		var pX=p.parentNode.cellIndex;
		var pY=p.parentNode.parentNode.rowIndex;
		
		var dT=100000,dB=100000,dL=100000,dR=100000,dC=100000;
		
		if(gT) {
			var gX=gT.cellIndex-pX;
			var gY=gT.parentNode.rowIndex-pY;
			dT=gX*gX+gY*gY;
		}
		if(gB) {
			var gX=gB.cellIndex-pX;
			var gY=gB.parentNode.rowIndex-pY;
			dB=gX*gX+gY*gY;
		}
		if(gL) {
			var gX=gL.cellIndex-pX;
			var gY=gL.parentNode.rowIndex-pY;
			dL=gX*gX+gY*gY;
		}
		if(gR) {
			var gX=gR.cellIndex-pX;
			var gY=gR.parentNode.rowIndex-pY;
			dR=gX*gX+gY*gY;
		}
		
		
		if (!gT && !gB && !gL && !gR) return undefined;
		
		var dir;
		
		if(dT<dB && dT<dL && dT<dR) {
			dir="Top";
		}
		else if(dB<dL && dB<dR) {
			dir="Bottom";
		}
		else if(dL<dR) {
			dir="Left";
		}
		else{dir="Right";}
		
		return dir;
	}
	
	board.endGame = function(ghost) {}
	return board
	
}

var createImage=function(src,className) {
	var img=document.createElement("img");
	img.src=src;
	img.className = className;
	return img;
}