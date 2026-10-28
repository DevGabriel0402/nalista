function setItemPrice(id){
 const item=state.items.find(i=>i.id===id);if(!item)return;
 const answer=prompt('Preço unitário de '+item.name+' (R$):',item.pricePending?'':String(item.price).replace('.',','));
 if(answer===null)return;const value=num(answer.trim());
 if(!answer.trim()||!Number.isFinite(value)||value<0)return toast('Informe um preço válido.');
 item.price=value;item.pricePending=false;state.note=null;save();render();
}
function renderChecklist(){
 const done=state.items.filter(i=>i.checked).length,pendingPrices=state.items.filter(i=>i.pricePending).length;
 $('items').innerHTML=state.items.length?state.items.map(i=>`<div class="todo-row ${i.checked?'is-done':''}"><label class="todo-target" for="check-${i.id}"><input id="check-${i.id}" type="checkbox" ${i.checked?'checked':''} onchange="toggle('${i.id}')"><span class="todo-circle" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="m5 10 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="todo-copy"><b>${esc(i.name)}</b>${i.qty!==1||i.unit!=='un'?`<small>${i.qty} ${esc(i.unit)}</small>`:''}</span></label><button class="item-price" type="button" aria-label="${i.pricePending?'Adicionar':'Editar'} preço de ${esc(i.name)}" onclick="setItemPrice('${i.id}')">${i.pricePending?'+ preço':money(i.qty*i.price)}</button><button class="todo-remove" type="button" aria-label="Remover ${esc(i.name)}" onclick="removeItem('${i.id}')">×</button></div>`).join('')+`<p class="simple-status" role="status">${done} de ${state.items.length} marcados</p>`:'<div class="empty">Sua lista está vazia.<br>Adicione o primeiro produto acima.</div>';
 $('priceHint').textContent=pendingPrices?`Total parcial · ${pendingPrices} ${pendingPrices===1?'item sem preço':'itens sem preço'}`:'Total da lista';
}
