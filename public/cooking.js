import {species} from './models.js';
const pools={mushroom:['milkcap','porcini','chanterelle','morel','oyster'],berry:['raspberry','strawberry','blueberry'],fruit:['raspberry','strawberry','blueberry','cactusfruit','sunfruit','iceberry','rainfruit','bellfruit'],flower:['cosmos','daisy','sandrose','snowlotus','moonlily'],mint:['mint']};
const slot=(pool,label)=>({pool,label,ids:pools[pool]});
export const recipes=Object.freeze([
  {id:'mushroom-skewer',name:'香烤菌菇串',kind:'skewer',color:0xd7a361,description:'炉火慢烤，留住一口森林的香气。',slots:[slot('mushroom','一份菌菇')],yield:1},
  {id:'forest-soup',name:'田园双菇暖汤',kind:'soup',color:0xe3bf81,description:'两份菌菇煨成暖汤，也可以混合不同种类。',slots:[slot('mushroom','第一份菌菇'),slot('mushroom','第二份菌菇')],yield:2},
  {id:'berry-jam',name:'手作莓果酱',kind:'jam',color:0xd75f8c,description:'把两份浆果熬成一罐甜甜的果酱。',slots:[slot('berry','第一份浆果'),slot('berry','第二份浆果')],yield:1},
  {id:'berry-pie',name:'花园莓果派',kind:'pie',color:0xd99768,description:'浆果与花瓣，配上家中常备的酥皮。',slots:[slot('berry','第一份浆果'),slot('berry','第二份浆果'),slot('flower','一份花瓣')],yield:1},
  {id:'fruit-salad',name:'缤纷果园沙拉',kind:'salad',color:0xc8dc94,description:'任意搭配两份果实，装进田园陶碗。',slots:[slot('fruit','第一份果实'),slot('fruit','第二份果实')],yield:1},
  {id:'berry-tea',name:'薄荷莓果茶',kind:'tea',color:0xd69c92,description:'清新的薄荷和一份浆果，慢慢泡开。',slots:[slot('berry','一份浆果'),slot('mint','一份薄荷')],yield:1},
  {id:'flower-biscuit',name:'花瓣糖饼',kind:'biscuit',color:0xe1bf9b,description:'把花瓣揉进面团，烤成小小的糖饼。',slots:[slot('flower','一份花瓣')],yield:2},
  {id:'mint-biscuit',name:'清风薄荷饼',kind:'biscuit',color:0xb4c99d,description:'薄荷配上常备面粉，做一盘清香的小饼。',slots:[slot('mint','一份薄荷')],yield:2}
]);
const index=new Map(species.map((s,i)=>[s.id,i]));
export function depositHarvest(bag,stored){let total=0;for(let i=0;i<bag.length;i++){const amount=bag[i];if(amount>0){stored[i]+=amount;bag[i]=0;total+=amount;}}return total;}
export function chooseIngredients(recipe,stock){const remaining=[...stock];return recipe.slots.map(s=>{const id=s.ids.find(id=>remaining[index.get(id)]>0)||s.ids[0];remaining[index.get(id)]--;return id;});}
export function planMeal(recipeId,ids,stock){
  const recipe=recipes.find(r=>r.id===recipeId);if(!recipe||!Array.isArray(ids)||ids.length!==recipe.slots.length)return{ok:false,reason:'请选择食材'};
  const need=new Map();for(let i=0;i<ids.length;i++){const id=ids[i],at=index.get(id);if(!recipe.slots[i].ids.includes(id)||at===undefined||species[at].poisonous)return{ok:false,reason:'这种采集物只作标本收藏'};need.set(at,(need.get(at)||0)+1);}
  for(const [at,amount]of need)if(!Number.isSafeInteger(stock[at])||stock[at]<amount)return{ok:false,reason:'家中食材还不够'};
  return{ok:true,recipe,need};
}
function mealName(recipe,ids){const first=species[index.get(ids[0])].name,unique=new Set(ids).size;if(recipe.kind==='jam')return unique>1?'双莓手作果酱':first+'果酱';if(recipe.kind==='skewer')return first+'烤串';if(recipe.kind==='soup')return unique>1?'森林双菇暖汤':first+'暖汤';if(recipe.kind==='tea')return first+'薄荷茶';return recipe.name;}
export function cookMeal(recipeId,ids,stock,meals){
  const plan=planMeal(recipeId,ids,stock);if(!plan.ok)return plan;
  const key=recipeId+':'+[...ids].sort().join(','),existing=meals.find(m=>m.key===key);if(existing&&existing.count>99990)return{ok:false,reason:'这一道菜已经存满了'};
  for(const [at,amount]of plan.need)stock[at]-=amount;
  const food=existing||{key,recipeId,ids:[...ids],name:mealName(plan.recipe,ids),count:0};if(!existing)meals.push(food);food.count+=plan.recipe.yield;
  return{ok:true,food,recipe:plan.recipe};
}
export function restoreMeals(raw){
  const meals=[];if(!Array.isArray(raw))return meals;
  for(const candidate of raw.slice(0,250)){if(!candidate||!Number.isSafeInteger(candidate.count)||candidate.count<1||candidate.count>99999)continue;const unlimited=species.map(()=>99999),plan=planMeal(candidate.recipeId,candidate.ids,unlimited);if(!plan.ok)continue;const key=candidate.recipeId+':'+[...candidate.ids].sort().join(',');if(meals.some(m=>m.key===key))continue;meals.push({key,recipeId:candidate.recipeId,ids:[...candidate.ids],name:mealName(plan.recipe,candidate.ids),count:candidate.count});}
  return meals;
}
