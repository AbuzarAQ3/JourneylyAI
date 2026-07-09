ddEventListener('click', function(e){
  const el = e.target.closest('.c2-sub-heading-item-1');
  // close previously open tooltips
  document.querySelectorAll('.c2-sub-heading-item-1.open').forEach(i => {
    if (i !== el) i.classList.remove('open');
  });
  if(!el) return;
  // toggle
  el.classList.toggle('open');
});

