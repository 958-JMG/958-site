(function(){
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v,a,b){return Math.min(Math.max(v,a),b);}

  /* ---------- DECK : cards pilotées par le scroll ---------- */
  var questions=[
    "Yohann est absent ce matin, le camion est bloqué. On fait quoi ?",
    "Je viens de recevoir le devis Morel signé… mais qui s'en était occupé ? Ah, c'est Karim | parti depuis 4 mois.",
    "Je suis devant le 14 rue des Ajoncs à Theix. Le PLU dit quoi, exactement ?"
  ];
  var track=document.getElementById('deck-track');
  var cards=[document.getElementById('c0'),document.getElementById('c1'),document.getElementById('c2')];
  var typedEls=[document.getElementById('t0'),document.getElementById('t1'),document.getElementById('t2')];
  var carets=[document.getElementById('k0'),document.getElementById('k1'),document.getElementById('k2')];
  var deckCur=document.getElementById('deck-cur');
  var played=[false,false,false];
  var typeTimers=[null,null,null];

  function playCard(i){
    if(played[i])return;
    played[i]=true;
    var mods=[].slice.call(cards[i].querySelectorAll('.mod'));
    if(reduced){
      typedEls[i].textContent=questions[i];
      carets[i].style.display='none';
      mods.forEach(function(m){m.classList.add('on');});
      return;
    }
    carets[i].style.display='inline-block';
    var q=questions[i],k=0;
    function type(){
      if(k<q.length){
        typedEls[i].textContent+=q.charAt(k);k++;
        typeTimers[i]=setTimeout(type,26+Math.random()*30);
      }else{
        setTimeout(function(){
          carets[i].style.display='none';
          mods.forEach(function(m,j){setTimeout(function(){m.classList.add('on');},j*440);});
        },350);
      }
    }
    typeTimers[i]=setTimeout(type,300);
  }

  function onDeck(){
    if(reduced){cards.forEach(function(c,i){playCard(i);});return;}
    var r=track.getBoundingClientRect();
    var total=r.height-window.innerHeight;
    var p=total>0?clamp(-r.top/total,0,1):1;
    var seg=p*3; /* 0..3 */

    cards.forEach(function(card,i){
      if(i===0){
        /* card de base : se tasse quand la 2 arrive */
        var cover=clamp((seg-0.5)/0.5,0,1);
        card.style.transform='translateY('+(-16*cover)+'px) scale('+(1-0.05*cover)+')';
        card.style.opacity=String(1-0.55*cover);
      }else{
        var e=clamp((seg-(i-0.5))/0.5,0,1); /* entrée */
        var y=(1-e)*108;
        var rot=(1-e)*2.2;
        card.style.transform='translateY('+y+'%) rotate('+rot+'deg)';
        card.style.opacity=e>0?'1':'0';
        if(i<2){
          var cover2=clamp((seg-(i+0.5))/0.5,0,1);
          if(e>=1){
            card.style.transform='translateY('+(-16*cover2)+'px) scale('+(1-0.05*cover2)+')';
            card.style.opacity=String(1-0.55*cover2);
          }
        }
      }
    });

    var active=clamp(Math.floor(seg+0.35),0,2);
    deckCur.textContent='0'+(active+1);
    if(seg>-0.1)playCard(0);
    if(seg>=0.55)playCard(1);
    if(seg>=1.55)playCard(2);
  }
  window.addEventListener('scroll',onDeck,{passive:true});
  window.addEventListener('resize',onDeck);
  onDeck();

  /* ---------- progress bar ---------- */
  var pfill=document.getElementById('pfill');
  function onProg(){
    var h=document.documentElement;
    pfill.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
  }
  window.addEventListener('scroll',onProg,{passive:true});
  onProg();

  /* ---------- manifeste ---------- */
  var mtrack=document.getElementById('manif-track');
  var lns=[].slice.call(document.querySelectorAll('.manif .ln'));
  function onManif(){
    if(reduced)return;
    var r=mtrack.getBoundingClientRect();
    var total=r.height-window.innerHeight;
    var done=clamp(-r.top,0,total);
    var p=total>0?done/total:1;
    var lit=Math.floor(p*(lns.length+0.6));
    lns.forEach(function(l,i){l.classList.toggle('lit',i<lit);});
  }
  window.addEventListener('scroll',onManif,{passive:true});
  onManif();

  /* ---------- fades / slides ---------- */
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);}});
  },{threshold:.16}):null;
  [].slice.call(document.querySelectorAll('.fade,.slide-l,.slide-r')).forEach(function(el){
    if(reduced||!io){el.classList.add('on');}else{io.observe(el);}
  });

  /* ---------- compteur ---------- */
  var count=document.getElementById('count');
  if(count){
    var cio=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          cio.unobserve(e.target);
          if(reduced){count.textContent='100';return;}
          var t0=null;
          function step(t){
            if(!t0)t0=t;
            var p=Math.min((t-t0)/1600,1);
            count.textContent=Math.round((1-Math.pow(1-p,3))*100);
            if(p<1)requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }
      });
    },{threshold:.5});
    cio.observe(count);
  }

  /* ---------- barre 100→20 ---------- */
  var barDemo=document.getElementById('bar-demo');
  if(barDemo){
    var bio=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          bio.unobserve(e.target);
          document.getElementById('bar-paid').style.width='100%';
          document.getElementById('bar-used').style.width='20%';
          setTimeout(function(){document.getElementById('bar-verdict').classList.add('on');},reduced?0:2000);
        }
      });
    },{threshold:.5});
    bio.observe(barDemo);
  }

  /* ---------- CTA sticky contextuel : zone au centre du viewport ---------- */
  var sticky=document.getElementById('sticky');
  var stickyTxt=document.getElementById('sticky-txt');
  if(sticky && !reduced){
    var zones=[].slice.call(document.querySelectorAll('[data-cta]'));
    var ticking=false;
    function updateCta(){
      ticking=false;
      var mid=window.innerHeight*0.55;
      var val=null;
      for(var i=0;i<zones.length;i++){
        var r=zones[i].getBoundingClientRect();
        if(r.top<=mid && r.bottom>=mid){val=zones[i].getAttribute('data-cta');break;}
      }
      if(!val || val==='hide'){sticky.classList.remove('show');}
      else{stickyTxt.textContent=val;sticky.classList.add('show');}
    }
    window.addEventListener('scroll',function(){
      if(!ticking){ticking=true;requestAnimationFrame(updateCta);}
    },{passive:true});
    updateCta();
  }

  /* ---------- FAQ ---------- */
  [].slice.call(document.querySelectorAll('.faq-q')).forEach(function(b){
    b.addEventListener('click',function(){
      var item=b.parentElement,open=item.classList.contains('open');
      [].slice.call(document.querySelectorAll('.faq-item')).forEach(function(f){f.classList.remove('open');});
      if(!open){item.classList.add('open');}
    });
  });
})();
