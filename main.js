var canvas = document.createElement('canvas');
canvas.appendChild(document.createTextNode('Your browser does not support the canvas API.'));
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var ctx = canvas.getContext('2d');

function Vector(X,Y) //Constructor
{
	this.X = X;
	this.Y = Y;

	this.add = function(Vect)
	{
		return new Vector(this.X+Vect.X,this.Y+Vect.Y);
	}

	this.magnitude = function()
	{
		return (Math.sqrt((this.X*this.X) + (this.Y*this.Y)));
	}

	this.unitVector = function()
	{
		var magnitude = this.magnitude();
		return (new Vector(this.X/magnitude,this.Y/magnitude));
	}

	this.dot = function(Vect)
	{
		return (this.X*Vect.X)+(this.Y*Vect.Y);
	}

	this.normal = function()
	{
		return new Vector(-this.Y,this.X);
	}
}

function loopIndex(anArray, Index)
{
	if(Index>=anArray.length)
	{
		return anArray[0];
	}
	if(Index<0)
	{
		return anArray[anArray.length-1];
	}
	else
	{
		return anArray[Index];
	}
}

function CircleObj(Position, Radius)
{
	this.Position = Position;
	this.Radius = Radius;
	//this.Mass = this.getArea();
	this.Anchored = false;
	this.Kinematic = false;
	this.Velocity = new Vector(0,0);
	this.Rotation = 0;
	this.RotationalVelocity = 0;
	this.Type = "Circle";

	this.Rotate = function(Radians)
	{
		if(Radians!=0)
		{
			if((this.Rotation+Radians)>Math.PI || (this.Rotation+Radians)<(-Math.PI))
			{
				this.Rotation = (-this.Rotation)+Radians;
			}
			else
			{
				this.Rotation+=Radians;
			}
		}
	}

	this.getArea = function()
	{
		return this.Radius*this.Radius*Math.PI;
	}

	this.draw = function()
	{
		ctx.moveTo((this.Position.X-Camera.Position.X)+(canvas.width/2),(this.Position.Y-Camera.Position.Y)+(canvas.height/2));
		ctx.arc((this.Position.X-Camera.Position.X)+(canvas.width/2),(this.Position.Y-Camera.Position.Y)+(canvas.height/2),this.Radius,0,Math.PI*2);
		ctx.FillStyle = "rgb(0,0,0)";
		ctx.fill();
	}
	this.checkCollision = function(obj)
	{
		switch(obj.Type)
		{
			case "Circle":
				var distance = Math.sqrt(Math.pow(this.Position.X-obj.Position.X,2)+Math.pow(this.Position.Y-obj.Position.Y,2));
				if(distance<this.Radius+obj.Radius)
				{
					var difference = distance - (this.Radius+obj.Radius);
					
					if(this.Position.X<obj.Position.X)
					{
						this.Position.X += difference;
					}
					else
					{
						this.Position.X += -difference;
					}
				}
				break;
			case "Polygon":

				var Vertices = [];
				for(var Index=0; Index<obj.Vertices.length; Index++)
				{
					Vertices[Index] = obj.getVertex(Index);
				}

				for(var Side=0; Side<Vertices.length; Side++)
				{

					var Collisions = [];
					
					if(Side<Vertices.length-1)
					{
						var Axis = obj.getSide(Vertices[Side], Vertices[Side+1]).unitVector().normal();
					}
					else
					{
						var Axis = obj.getSide(Vertices[Side],Vertices[0]).unitVector().normal();
					}                                

					var MaxB = Vertices[0].dot(Axis);
					var MinB = Vertices[0].dot(Axis);
					for(var Index=0; Index<Vertices.length; Index++)
					{
						var Projection = Vertices[Index].dot(Axis);
						MaxB = Math.max(Projection,MaxB);
						MinB = Math.min(Projection,MinB);
					}   

					var P1 = this.Position.add(new Vector(Axis.X*this.Radius,Axis.Y*this.radius)).dot(Axis);
					var P2 = this.Position.add(new Vector(Axis.X*-this.Radius,Axis.Y*-this.Radius)).dot(Axis);
					if(!isNaN(P1)) 
					{
						MaxA = Math.max(P1,P2);
						MinA = Math.min(P1,P2);
						console.log(MaxA);
						console.log(MinA);
					}   
					else
					{
						MaxA = P1;
						MinA = P2;
					}


					if(MaxA<=MaxB && MaxA>=MinB || MaxB <= MaxA && MaxB >= MinA)
					{
						Collisions[Collisions.length] = {};
						Collisions[Collisions.length-1].Axis = Axis;
						Collisions[Collisions.length-1].Magnitude = MinB-MaxA;

					}
					if(MinA<=MaxB && MinA>=MinB || MinB <= MaxA && MinB >= MinA)
					{
						Collisions[Collisions.length] = {}
						Collisions[Collisions.length-1].Axis = Axis;
						Collisions[Collisions.length-1].Magnitude = MaxB-MinA;
					}

					if(!(MaxA<=MaxB && MaxA>=MinB || MinA<=MaxB && MinA>=MinB))
					{
						return;
					}
				}

				var Min = {};
				Min.Magnitude = Collisions[0].Magnitude;
				Min.Axis = Collisions[0].Axis;

				for(var Index=0; Index<Collisions.length; Index++)
				{
					if(Math.abs(Min.Magnitude)>Math.abs(Collisions[Index].Magnitude))
					{
						Min.Magnitude = Collisions[Index].Magnitude;
						Min.Axis = Collisions[Index].Axis;
					}
				}
				
				if(obj.Anchored == false)
				{
						//Min.Magnitude/=2;
						var SeparationValue = Min.Magnitude/2;
						this.Position = this.Position.add(new Vector(-SeparationValue*Min.Axis.X,-SeparationValue*Min.Axis.Y));
						obj.Position = obj.Position.add(new Vector((SeparationValue)*Min.Axis.X,(SeparationValue)*Min.Axis.Y));
						
						//this.Velocity = new Vector(0,0);  
				}
				else
				{
					this.Position = this.Position.add(new Vector(Min.Magnitude*Min.Axis.X,Min.Magnitude*Min.Axis.Y));
					this.Velocity = new Vector(0,0)
				}
				
				break;

			default:
				console.log("Invalid Type");
		}
	}
}


function PhysicsObj(Position /*Vector*/,Vertices /*Vector Array*/)
{
	this.Position = Position;
	this.Vertices = Vertices;
	this.DrawComponents = null;
	//this.Mass = 0;
	this.Rotation = 0;
	this.RotationalVelocity = 0;
	this.Anchored = false;
	this.Kinematic = false;
	this.Velocity = new Vector(0,0);
	this.Colour = "rgb(100,100,100)";
	this.Type = "Polygon";

	this.Rotate = function(Radians)
	{
		if(Radians!=0)
		{
			if((this.Rotation+Radians)>Math.PI || (this.Rotation+Radians)<(-Math.PI))
			{
				this.Rotation = (-this.Rotation)+Radians;
			}
			else
			{
				this.Rotation+=Radians;
			}
		}
	}

	this.getVertex = function(VertexNumber)
	{
		/* int X = origin.x + (int) ((point.x - origin.x) * cos(angle) - (point.y - origin.y) * sin(angle));
			int Y = origin.y + (int) ((point.x - origin.x) * sin(angle) +(point.y - origin.y) * cos(angle)); */

		var X = this.Position.X + ((this.Vertices[VertexNumber].X*Math.cos(this.Rotation)) - (this.Vertices[VertexNumber].Y*Math.sin(this.Rotation)));
		var Y = this.Position.Y + ((this.Vertices[VertexNumber].X*Math.sin(this.Rotation)) + (this.Vertices[VertexNumber].Y*Math.cos(this.Rotation)));
		return new Vector(X,Y);
	}

	this.getSide = function(PointA,PointB)
	{
		return new Vector(PointA.X-PointB.X, PointA.Y-PointB.Y);
	}

	this.getArea = function()
	{
		/*function polygonArea(X, Y, numPoints) 
		{ 
			area = 0;         // Accumulates area in the loop
			j = numPoints-1;  // The last vertex is the 'previous' one to the first

			for (i=0; i<numPoints; i++)
			{ area = area +  (X[j]+X[i]) * (Y[j]-Y[i]); 
				j = i;  //j is previous vertex to i
			}
			return area/2;
		}
		*/
		var area = 0;

		for(var Index=0; Index<this.Vertices.length; Index++)
		{
			area += ((loopIndex(this.Vertices,Index).X*loopIndex(this.Vertices,Index+1).Y)-(loopIndex(this.Vertices,Index+1).X*loopIndex(this.Vertices,Index).Y));
		}
		area/=2;
		return area;
	}

	this.draw = function()
	{
		ctx.beginPath();
		var Vertex = this.getVertex(0);
		ctx.moveTo((Vertex.X-Camera.Position.X)+(canvas.width/2),(Vertex.Y-Camera.Position.Y)+(canvas.height/2));
		for(var point=1; point<this.Vertices.length; point++)
		{
			Vertex = this.getVertex(point);
			ctx.lineTo((Vertex.X-Camera.Position.X)+(canvas.width/2),(Vertex.Y-Camera.Position.Y)+(canvas.height/2));
		}
		ctx.closePath();
		ctx.fillStyle = this.Colour;
		ctx.fill();
		ctx.strokeStyle = this.Colour;
		ctx.stroke();
	}

	//Uses Separating Axis Theorem
	this.checkCollision = function(obj)
	{
		switch(obj.Type)
		{
			case "Polygon":
			
			/*
			* TO-DO:
			*
			* −(2(n · v) n − v)
			*
			*Ve = Vi - 2 * (Vi dot Vn) * Vn
			*
			* Take Collision Point, and Closest Vertex to find Collision Normal.
			*
			*/
			//Grab all vertices of both shapes.
			var VerticesA = [];
			for(var Index=0; Index<this.Vertices.length; Index++)
			{
				VerticesA[Index] = this.getVertex(Index);
			}
			var VerticesB = [];
			for(var Index=0; Index<obj.Vertices.length; Index++)
			{
				VerticesB[Index] = obj.getVertex(Index);
			}

			var Collisions = [];

			//Grab a side of the polygon, find the normal, and use that as an axis for testing.
			//Loop through all the projection axes from both polygons.
			for(var Side=0; Side<VerticesA.length+VerticesB.length; Side++)
			{
				
				var Axis;
				if(Side<VerticesA.length-1)
				{
					Axis = this.getSide(VerticesA[Side], VerticesA[Side+1]).unitVector().normal();
				}
				else
				{
					if(Side==VerticesA.length-1)
					{
					Axis = this.getSide(VerticesA[Side], VerticesA[0]).unitVector().normal();
					}
					else
					{
					if(Side>VerticesA.length-1 && Side<VerticesA.length+VerticesB.length-1)
					{
						Axis = obj.getSide(VerticesB[Side-VerticesA.length], VerticesB[Side-VerticesA.length+1]).unitVector().normal();
					}
					else
					{
						Axis = obj.getSide(VerticesB[Side-VerticesA.length], VerticesB[0]).unitVector().normal();
					}
					}
				}

				//Project all vertices onto the axis, and keep the max/min values.
				var MaxA = VerticesA[0].dot(Axis);
				var MinA = VerticesA[0].dot(Axis);
				for(var Index=0; Index<VerticesA.length; Index++)
				{
					var Projection = VerticesA[Index].dot(Axis);
					MaxA = Projection>MaxA ? Projection:MaxA;
					MinA = Projection>MinA ? MinA:Projection;
				}

				var MaxB = VerticesB[0].dot(Axis);
				var MinB = VerticesB[0].dot(Axis);
				for(var Index=0; Index<VerticesB.length; Index++)
				{
					var Projection = VerticesB[Index].dot(Axis);
					MaxB = Projection>MaxB ? Projection:MaxB;
					MinB = Projection>MinB ? MinB:Projection;
				}

				if(MaxA<=MaxB && MaxA>=MinB || MaxB <= MaxA && MaxB >= MinA)
				{
					Collisions[Collisions.length] = {};
					Collisions[Collisions.length-1].Axis = Axis;
					Collisions[Collisions.length-1].Magnitude = MinB-MaxA;

				}
				if(MinA<=MaxB && MinA>=MinB || MinB <= MaxA && MinB >= MinA)
				{
					Collisions[Collisions.length] = {};
					Collisions[Collisions.length-1].Axis = Axis;
					Collisions[Collisions.length-1].Magnitude = MaxB-MinA;
				}

				if(!(MaxA<=MaxB && MaxA>=MinB || MinA<=MaxB && MinA>=MinB))
				{
					return;
				}
			}

			var Min = {};
			Min.Magnitude = Collisions[0].Magnitude;
			Min.Axis = Collisions[0].Axis;

			for(var Index=0; Index<Collisions.length; Index++)
			{
				if(Math.abs(Min.Magnitude)>Math.abs(Collisions[Index].Magnitude))
				{
					Min.Magnitude = Collisions[Index].Magnitude;
					Min.Axis = Collisions[Index].Axis;
				}
			}

			//Momentum = M*V


			
			var VAMagnitude = Math.sqrt((this.Velocity.X*this.Velocity.X)+(this.Velocity.Y*this.Velocity.Y));

			if(obj.Anchored == false)
			{
				//Min.Magnitude/=2;
				var SeparationValue = Min.Magnitude/2;
				this.Position = this.Position.add(new Vector(SeparationValue*Min.Axis.X,SeparationValue*Min.Axis.Y));
				obj.Position = obj.Position.add(new Vector((-SeparationValue)*Min.Axis.X,(-SeparationValue)*Min.Axis.Y));
				
				//this.Velocity = new Vector(0,0);  
			}
			else
			{

				this.Position = this.Position.add(new Vector(Min.Magnitude*Min.Axis.X,Min.Magnitude*Min.Axis.Y));
				this.Velocity = new Vector(0,0)
			}
		break;
		}

	}
}

function Entity(Position, Vertices)
{
	PhysicsObj.call(this,Position,Vertices)

	this.Animated = true;
	
	this.Torso = [new Vector(10,35),new Vector(-10,35), new Vector(-10,-35), new Vector(10,-35)];
	this.Head = new Vector();
	this.Leg1 = [];
	this.Leg2 = [];
	this.Arm1 = [];
	this.Arm2 = [];

		/* int X = origin.x + (int) ((point.x - origin.x) * cos(angle) - (point.y - origin.y) * sin(angle));
		int Y = origin.y + (int) ((point.x - origin.x) * sin(angle) +(point.y - origin.y) * cos(angle)); */

	this.drawTorso = function()
	{
		ctx.beginPath();
								
		var Vertex = new Vector(this.Position.X + ((this.Torso[0].X*Math.cos(this.Rotation)) - (this.Torso[0].Y*Math.sin(this.Rotation))), 
		this.Position.Y + ((this.Torso[0].X*Math.sin(this.Rotation)) + (this.Torso[0].Y*Math.cos(this.Rotation))));

		ctx.moveTo((Vertex.X-Camera.Position.X)+(canvas.width/2),(Vertex.Y-Camera.Position.Y)+(canvas.height/2));
		for(var point=1; point<this.Vertices.length; point++)
		{
			Vertex = new Vector(this.Position.X + ((this.Torso[point].X*Math.cos(this.Rotation)) - (this.Torso[point].Y*Math.sin(this.Rotation))), 
			this.Position.Y + ((this.Torso[point].X*Math.sin(this.Rotation)) + (this.Torso[point].Y*Math.cos(this.Rotation))));
			ctx.lineTo((Vertex.X-Camera.Position.X)+(canvas.width/2),(Vertex.Y-Camera.Position.Y)+(canvas.height/2));
		}
		ctx.closePath();
		ctx.fillStyle = this.Colour;
		ctx.fill();
		ctx.strokeStyle = this.Colour;
		ctx.stroke();
	}
}

function PlayerObj(Position /*Vector*/,Vertices /*Vector Array*/, BaseVertex1, BaseVertex2 /*Indexes of Vertices Array*/)
{
	PhysicsObj.call(this,Position,Vertices);
	this.Kinematic = true;
	this.BaseVertices = [BaseVertex1,BaseVertex2];

	this.draw = function()
	{
		ctx.beginPath();
		var Vertex = this.getVertex(0);
		ctx.moveTo((Vertex.X-Camera.Position.X)+(canvas.width/2),(Vertex.Y-Camera.Position.Y)+(canvas.height/2));
		for(var point=1; point<this.Vertices.length; point++)
		{
			Vertex = this.getVertex(point);
			ctx.lineTo((Vertex.X-Camera.Position.X)+(canvas.width/2),(Vertex.Y-Camera.Position.Y)+(canvas.height/2));
		}
		ctx.closePath();
		ctx.fillStyle = this.Colour;
		ctx.fill();
		ctx.strokeStyle = this.Colour;
		ctx.stroke();
	}

	this.move = function(key)
	{
		//To fix this, look for key combinations.
		switch(key)
		{
			case 65:
				this.Velocity.X = -5;
				break;
			case 68:
				this.Velocity.X = +5;
				break;
			case 87:
				this.Velocity.Y = -5;
				break;
			case 83:
				this.Velocity.Y = +5;
				break;
		}
	}

	this.cease = function(key)
	{
		switch(key)
		{
			case 65:
				this.Velocity.X = 0;
				break;
			case 68:
				this.Velocity.X = 0;
				break;
			case 87:
				this.Velocity.Y = 0;
				break;
			case 83:
				this.Velocity.Y = 0;
				break;
			default:
				this.Velocity = new Vector(0,0);
		}
	}
}


var MousePos = new Vector(0,0);

document.addEventListener('keydown',function(event)
							{
								Player.move(event.keyCode);
							});
document.addEventListener('keyup',function(event)
							{
								Player.cease(event.keyCode);
							});
document.addEventListener('mousemove',function(event)
							{
								MousePos.X = event.screenX;
								MousePos.Y = event.screenY;
							}); 

document.addEventListener('keydown',function(event)
							{
								if(event.keyCode == 81)
								{
								Player.RotationalVelocity -= 0.1;
								}
								else if(event.keyCode==69) 
								{
								Player.RotationalVelocity += 0.1;
								};
							});      

var Camera = {};
Camera.Position = new Vector(0,0);

var Player = new PlayerObj(new Vector(100,100),[new Vector(-50,-50),new Vector(50,-50),new Vector(50,50),new Vector(-50,50)],0,1);
Player.Rotation = 0;
var PolygonA = new PhysicsObj(new Vector(400,500),[new Vector(200,100),new Vector(200,-100),new Vector(-200,-100),new Vector(-200,100)]);
PolygonA.Anchored = true;

var thingy = new PhysicsObj(new Vector(300,300),
									[new Vector(-50,0),
										new Vector(-25,50),
										new Vector(25,50),
										new Vector(50,0),
										new Vector(25,-50),
										new Vector(-25,-50)]);
thingy.Anchored = false;
var PolygonA = new PhysicsObj(new Vector(400,500),[new Vector(200,100),new Vector(200,-100),new Vector(-200,-100),new Vector(-200,100)]);
PolygonA.Anchored = true;

var Rectangle = new PhysicsObj(new Vector(100,250),[new Vector(-50,-50),new Vector(50,-50),new Vector(50,50),new Vector(-50,50)]);
Rectangle.Anchored = false;

var CurrentWorld = {};
CurrentWorld.Player = Player;
CurrentWorld.PolygonA = PolygonA;
CurrentWorld.Rectangle = Rectangle;
CurrentWorld.thingy = thingy;
function Update()
{
	ctx.clearRect(0,0,canvas.width,canvas.height);
	for(var obj in CurrentWorld)
	{
		if(CurrentWorld[obj].Anchored == false)
		{
			CurrentWorld[obj].Position = CurrentWorld[obj].Position.add(CurrentWorld[obj].Velocity);
			CurrentWorld[obj].Rotate(CurrentWorld[obj].RotationalVelocity);
			for(var object in CurrentWorld)
			{
				if(CurrentWorld[obj] !== CurrentWorld[object])
				{
					CurrentWorld[obj].checkCollision(CurrentWorld[object]);
				}
			}
		}

		Camera.Position.X = CurrentWorld.Player.Position.X;
		Camera.Position.Y = CurrentWorld.Player.Position.Y;
		if(CurrentWorld[obj].Animated)
		{   
			CurrentWorld[obj].drawTorso();
		}
		else
		{
			CurrentWorld[obj].draw();
		}
	}
}
window.setInterval(Update,33)