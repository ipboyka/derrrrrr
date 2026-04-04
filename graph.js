// ============================================================
// GRAFİK ÇİZİCİ (MathJS tabanlı fonksiyon çizici)
// ============================================================

    (function(){
        'use strict';
        const COLORS=['#007bff','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e'];
        let functions=[],nextId=1,view={xMin:-10,xMax:10,yMin:-10,yMax:10};
        let isDragging=false,dragStart=null,dragView=null,animFrame=null;
        let canvas,ctx,tooltip,fnList,addBtn,_inited=false;

        function init(){
            canvas=document.getElementById('graphCanvas');
            if(!canvas||_inited)return; _inited=true;
            ctx=canvas.getContext('2d');
            tooltip=document.getElementById('graphTooltip');
            fnList=document.getElementById('graphFnList');
            addBtn=document.getElementById('graphAddFnBtn');
            resizeCanvas();
            window.addEventListener('resize',resizeCanvas);
            addBtn.addEventListener('click',()=>addFn(''));
            document.getElementById('gApplyRange').addEventListener('click',()=>{
                const xMin=parseFloat(document.getElementById('gXmin').value);
                const xMax=parseFloat(document.getElementById('gXmax').value);
                const yMin=parseFloat(document.getElementById('gYmin').value);
                const yMax=parseFloat(document.getElementById('gYmax').value);
                if(isNaN(xMin)||isNaN(xMax)||isNaN(yMin)||isNaN(yMax)||xMin>=xMax||yMin>=yMax)return;
                view={xMin,xMax,yMin,yMax}; draw();
            });
            canvas.addEventListener('mousedown',e=>{isDragging=true;dragStart={x:e.clientX,y:e.clientY};dragView={...view};canvas.style.cursor='grabbing';});
            canvas.addEventListener('mousemove',e=>{
                const r=canvas.getBoundingClientRect();
                const mx=e.clientX-r.left,my=e.clientY-r.top;
                tooltip.style.display='block';tooltip.style.left=(mx+14)+'px';tooltip.style.top=(my-10)+'px';
                tooltip.textContent='x='+toWX(mx).toFixed(3)+'  y='+toWY(my).toFixed(3);
                if(isDragging&&dragStart){
                    const dx=(e.clientX-dragStart.x)/canvas.width*(dragView.xMax-dragView.xMin);
                    const dy=(e.clientY-dragStart.y)/canvas.height*(dragView.yMax-dragView.yMin);
                    view.xMin=dragView.xMin-dx;view.xMax=dragView.xMax-dx;
                    view.yMin=dragView.yMin+dy;view.yMax=dragView.yMax+dy;
                    syncInputs();scheduleDraw();
                }
            });
            window.addEventListener('mouseup',()=>{isDragging=false;dragStart=null;dragView=null;if(canvas)canvas.style.cursor='crosshair';});
            canvas.addEventListener('mouseleave',()=>tooltip.style.display='none');
            canvas.addEventListener('wheel',e=>{
                e.preventDefault();
                const r=canvas.getBoundingClientRect();
                const wx=toWX(e.clientX-r.left),wy=toWY(e.clientY-r.top);
                const f=e.deltaY>0?1.15:1/1.15;
                view.xMin=wx+(view.xMin-wx)*f;view.xMax=wx+(view.xMax-wx)*f;
                view.yMin=wy+(view.yMin-wy)*f;view.yMax=wy+(view.yMax-wy)*f;
                syncInputs();scheduleDraw();
            },{passive:false});
            canvas.style.cursor='crosshair';
            addFn('sin(x)');
        }
        function resizeCanvas(){
            if(!canvas)return;
            const r=canvas.parentElement.getBoundingClientRect();
            canvas.width=r.width;canvas.height=r.height;scheduleDraw();
        }
        function toSX(wx){return(wx-view.xMin)/(view.xMax-view.xMin)*canvas.width;}
        function toSY(wy){return(1-(wy-view.yMin)/(view.yMax-view.yMin))*canvas.height;}
        function toWX(sx){return view.xMin+sx/canvas.width*(view.xMax-view.xMin);}
        function toWY(sy){return view.yMax-sy/canvas.height*(view.yMax-view.yMin);}
        function scheduleDraw(){if(animFrame)cancelAnimationFrame(animFrame);animFrame=requestAnimationFrame(draw);}
        function niceStep(range){const r=range/10,m=Math.pow(10,Math.floor(Math.log10(r))),n=r/m;return(n<1.5?1:n<3.5?2:n<7.5?5:10)*m;}
        function draw(){
            if(!ctx)return;
            const W=canvas.width,H=canvas.height;
            ctx.clearRect(0,0,W,H);
            const dk=document.documentElement.getAttribute('data-theme')==='dark';
            ctx.fillStyle=dk?'#0f0f11':'#ffffff';ctx.fillRect(0,0,W,H);
            const gc=dk?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.07)';
            const ac=dk?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.4)';
            const lc=dk?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.4)';
            const xs=niceStep(view.xMax-view.xMin),ys=niceStep(view.yMax-view.yMin);
            ctx.font='11px Segoe UI,sans-serif';ctx.fillStyle=lc;
            for(let x=Math.ceil(view.xMin/xs)*xs;x<=view.xMax+xs*0.01;x+=xs){
                const sx=toSX(x);const isAx=Math.abs(x)<xs*0.01;
                ctx.strokeStyle=isAx?ac:gc;ctx.lineWidth=isAx?2:1;
                ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,H);ctx.stroke();
                if(!isAx){ctx.textAlign='center';const ay=Math.min(Math.max(toSY(0),4),H-14);ctx.fillText(parseFloat(x.toPrecision(5)),sx,ay+13);}
            }
            for(let y=Math.ceil(view.yMin/ys)*ys;y<=view.yMax+ys*0.01;y+=ys){
                const sy=toSY(y);const isAy=Math.abs(y)<ys*0.01;
                ctx.strokeStyle=isAy?ac:gc;ctx.lineWidth=isAy?2:1;
                ctx.beginPath();ctx.moveTo(0,sy);ctx.lineTo(W,sy);ctx.stroke();
                if(!isAy){ctx.textAlign='right';const ax=Math.min(Math.max(toSX(0),30),W-4);ctx.fillText(parseFloat(y.toPrecision(5)),ax-4,sy+4);}
            }
            const ay=toSY(0),ax=toSX(0);
            ctx.strokeStyle=ac;ctx.lineWidth=2;ctx.fillStyle=ac;ctx.font='bold 13px Segoe UI';
            if(ay>=0&&ay<=H){ctx.beginPath();ctx.moveTo(0,ay);ctx.lineTo(W,ay);ctx.stroke();ctx.beginPath();ctx.moveTo(W-8,ay-5);ctx.lineTo(W,ay);ctx.lineTo(W-8,ay+5);ctx.stroke();ctx.textAlign='left';ctx.fillText('x',W-12,ay-8);}
            if(ax>=0&&ax<=W){ctx.beginPath();ctx.moveTo(ax,H);ctx.lineTo(ax,0);ctx.stroke();ctx.beginPath();ctx.moveTo(ax-5,8);ctx.lineTo(ax,0);ctx.lineTo(ax+5,8);ctx.stroke();ctx.textAlign='left';ctx.fillText('y',ax+6,14);}
            const N=Math.max(W*2,2000);
            functions.forEach(fn=>{
                if(!fn.visible||!fn.compiled||fn.error)return;
                ctx.beginPath();ctx.strokeStyle=fn.color;ctx.lineWidth=2.5;ctx.lineJoin='round';
                let pen=false,lastY;
                for(let i=0;i<=N;i++){
                    const wx=view.xMin+(i/N)*(view.xMax-view.xMin);
                    let wy;try{wy=fn.compiled.evaluate({x:wx});}catch(e){pen=false;continue;}
                    if(typeof wy!=='number'||!isFinite(wy)){pen=false;continue;}
                    if(pen&&lastY!==undefined&&Math.abs(wy-lastY)>(view.yMax-view.yMin)*8){ctx.stroke();ctx.beginPath();pen=false;}
                    const sx=toSX(wx),sy=toSY(wy);
                    if(!pen){ctx.moveTo(sx,sy);pen=true;}else ctx.lineTo(sx,sy);
                    lastY=wy;
                }
                ctx.stroke();
            });
        }
        function compileFn(fn){
            fn.error=null;fn.compiled=null;
            if(!fn.expr.trim())return;
            try{fn.compiled=math.compile(fn.expr);fn.compiled.evaluate({x:0});}
            catch(e){fn.error=e.message;fn.compiled=null;}
        }
        function addFn(exprStr){
            const id=nextId++;const color=COLORS[functions.length%COLORS.length];
            const fn={id,expr:exprStr,color,error:null,visible:true,compiled:null};
            compileFn(fn);functions.push(fn);renderRow(fn);scheduleDraw();
        }
        function renderRow(fn){
            const row=document.createElement('div');
            row.id='gfn-'+fn.id;
            row.style.cssText='display:flex;align-items:center;gap:6px;background:var(--color-bg-input);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:7px 9px;transition:0.2s;';
            const dot=document.createElement('div');
            dot.style.cssText='width:13px;height:13px;border-radius:50%;background:'+fn.color+';flex-shrink:0;cursor:pointer;transition:0.2s;';
            dot.title='Göster/Gizle';
            dot.addEventListener('click',()=>{fn.visible=!fn.visible;dot.style.opacity=fn.visible?'1':'0.3';scheduleDraw();});
            const yLbl=document.createElement('span');
            yLbl.textContent='y =';yLbl.style.cssText='font-size:12px;font-weight:800;color:'+fn.color+';flex-shrink:0;';
            const inp=document.createElement('input');
            inp.type='text';inp.value=fn.expr;inp.placeholder='sin(x), x^2, 2*x+1…';
            inp.style.cssText='flex:1;border:none;background:transparent;color:var(--color-text-main);font-size:14px;font-weight:700;outline:none;min-width:0;';
            const err=document.createElement('span');
            err.style.cssText='font-size:10px;color:#e74c3c;display:none;cursor:help;';err.textContent='!';
            const del=document.createElement('button');
            del.innerHTML='<i class="fa-solid fa-xmark"></i>';
            del.style.cssText='background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:13px;padding:2px 3px;border-radius:4px;transition:0.2s;flex-shrink:0;';
            del.addEventListener('mouseenter',()=>del.style.color='#e74c3c');
            del.addEventListener('mouseleave',()=>del.style.color='var(--color-text-muted)');
            del.addEventListener('click',()=>{functions=functions.filter(f=>f.id!==fn.id);row.remove();scheduleDraw();});
            inp.addEventListener('input',()=>{fn.expr=inp.value;compileFn(fn);err.style.display=fn.error?'inline':'none';err.title=fn.error||'';row.style.borderColor=fn.error?'#e74c3c44':'var(--color-border)';scheduleDraw();});
            inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur();});
            row.appendChild(dot);row.appendChild(yLbl);row.appendChild(inp);row.appendChild(err);row.appendChild(del);
            fnList.appendChild(row);
            setTimeout(()=>inp.focus(),50);
        }
        function syncInputs(){
            document.getElementById('gXmin').value=parseFloat(view.xMin.toPrecision(4));
            document.getElementById('gXmax').value=parseFloat(view.xMax.toPrecision(4));
            document.getElementById('gYmin').value=parseFloat(view.yMin.toPrecision(4));
            document.getElementById('gYmax').value=parseFloat(view.yMax.toPrecision(4));
        }
        document.addEventListener('DOMContentLoaded',()=>{
            const modal=document.getElementById('graphModal');
            const closeBtn=document.getElementById('closeGraphModalBtn');
            const menuBtn=document.getElementById('openGraphModalBtn');
            const sm=document.getElementById('sideMenu');
            const ov=document.getElementById('menuOverlay');
            if(menuBtn){
                menuBtn.addEventListener('click',e=>{
                    e.preventDefault();
                    if(sm)sm.classList.remove('open');if(ov)ov.classList.remove('show');
                    modal.style.display='flex';
                    setTimeout(()=>{init();resizeCanvas();draw();},60);
                });
            }
            if(closeBtn)closeBtn.addEventListener('click',()=>modal.style.display='none');
            modal.addEventListener('click',e=>{if(e.target===modal)modal.style.display='none';});
        });
    })();
