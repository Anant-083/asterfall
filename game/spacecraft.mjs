// A reusable metallic exploration lander, drawn in local ship coordinates.
export function drawSpacecraft(ctx,s,t,{scale=1}={}){
  ctx.save();ctx.scale(scale,scale);
  const light=ctx.createLinearGradient(-19,0,22,0);light.addColorStop(0,'#3b4a58');light.addColorStop(.25,'#d7dfe2');light.addColorStop(.45,'#f4f6ee');light.addColorStop(.63,'#8196a4');light.addColorStop(1,'#263644');
  // Thruster bell and exhaust, behind the pressure hull.
  for(const side of [-1,1]){
    const x=side*10;ctx.fillStyle='#4d5a64';ctx.beginPath();ctx.moveTo(x-4,15);ctx.lineTo(x-7,26);ctx.lineTo(x+7,26);ctx.lineTo(x+4,15);ctx.fill();
    ctx.strokeStyle='#afbac0';ctx.lineWidth=.8;ctx.stroke();
    if(s.burn||s.braking){const length=(s.braking?22:42)+Math.sin(t*41+side)*5;const flame=ctx.createLinearGradient(x,25,x,25+length);flame.addColorStop(0,'#ffffff');flame.addColorStop(.2,'#c1f4ff');flame.addColorStop(.5,'#63b4ffbb');flame.addColorStop(1,'#4a9fff00');ctx.fillStyle=flame;ctx.beginPath();ctx.moveTo(x-5,25);ctx.quadraticCurveTo(x-7,35,x,25+length);ctx.quadraticCurveTo(x+7,35,x+5,25);ctx.fill();}
  }
  // Deployable struts and broad shock-absorbing feet.
  ctx.lineWidth=2;ctx.strokeStyle='#b3c3c9';
  for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*13,5);ctx.lineTo(side*29,28);ctx.lineTo(side*34,28);ctx.moveTo(side*15,17);ctx.lineTo(side*26,25);ctx.stroke();ctx.fillStyle='#485a66';ctx.fillRect(side*30-7,27,14,3);ctx.fillStyle='#e2c38b';ctx.fillRect(side*22-2,17,4,4);}
  // Cylindrical pressure vessel and tapered heat shield.
  ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(-17,16);ctx.lineTo(-18,-8);ctx.bezierCurveTo(-18,-25,-8,-35,0,-39);ctx.bezierCurveTo(8,-35,18,-25,18,-8);ctx.lineTo(17,16);ctx.closePath();ctx.fill();ctx.strokeStyle='#dce6e677';ctx.lineWidth=.8;ctx.stroke();
  ctx.fillStyle='#182b38';ctx.beginPath();ctx.moveTo(-12,-17);ctx.lineTo(-9,-26);ctx.lineTo(-2,-29);ctx.lineTo(-2,-16);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(2,-29);ctx.lineTo(9,-26);ctx.lineTo(12,-17);ctx.lineTo(2,-16);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#79c5df';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(-10,-24);ctx.lineTo(-4,-26);ctx.moveTo(4,-26);ctx.lineTo(9,-23);ctx.stroke();
  // Panel seams, copper thermal blankets, docking hatch, radiator panels.
  ctx.strokeStyle='#24384677';ctx.lineWidth=.7;for(const y of [-10,3,13]){ctx.beginPath();ctx.moveTo(-17,y);ctx.lineTo(17,y);ctx.stroke();}
  ctx.fillStyle='#ae8853';ctx.fillRect(-16,6,7,8);ctx.fillRect(9,6,7,8);
  ctx.fillStyle='#40525d';ctx.fillRect(-5,-5,10,12);ctx.strokeStyle='#d0dddf';ctx.strokeRect(-5,-5,10,12);ctx.fillStyle='#adf5df';ctx.fillRect(-2,-2,4,2);
  ctx.fillStyle='#182d42';ctx.strokeStyle='#91a5b1';for(const side of [-1,1]){ctx.fillRect(side<0?-34:20,-9,14,15);ctx.strokeRect(side<0?-34:20,-9,14,15);ctx.strokeStyle='#607f97';for(let j=1;j<4;j++){ctx.beginPath();ctx.moveTo(side<0?-34:20,-9+j*3.7);ctx.lineTo(side<0?-20:34,-9+j*3.7);ctx.stroke();}ctx.strokeStyle='#91a5b1';}
  ctx.strokeStyle='#d3dfdf';ctx.beginPath();ctx.moveTo(12,-23);ctx.lineTo(25,-35);ctx.stroke();ctx.fillStyle='#a4b8c7';ctx.beginPath();ctx.ellipse(25,-35,5,2,-.7,0,Math.PI*2);ctx.fill();
  if(s.side){ctx.fillStyle='#bfefff';const x=s.side>0?-21:21;ctx.beginPath();ctx.moveTo(x,-3);ctx.lineTo(x-s.side*(10+Math.sin(t*35)*3),0);ctx.lineTo(x,3);ctx.fill();}
  ctx.restore();
}
