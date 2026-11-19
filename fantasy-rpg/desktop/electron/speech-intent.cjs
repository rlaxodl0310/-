'use strict';
// Conservative cues, not a learned Korean language model. Ambiguous cues abstain.
const patterns=[
 ['threaten',/(?:가만\s*안\s*두|때려\s*버|죽(?:여\s*버|이겠)|해치겠|찌르겠|목숨을\s*빼앗|무사하지\s*못할|안\s*들으면.{0,15}다치)/,.88],
 ['refuse',/(?:거절(?:할|하|해)|싫(?:어|다)|안\s*할|하지\s*마|사양할|들어줄\s*수\s*없|받아들이지\s*않|생각(?:은|이)?\s*없|너희끼리\s*가|나는?\s*여기에?\s*남)/,.85],
 ['apologize',/(?:미안(?:해|하다|합니다)?|죄송|사과(?:할|하|해)|사죄|용서해\s*줘|내\s*(?:잘못|실수))/,.85],
 ['reassure',/(?:괜찮아|진정해|걱정하지|걱정\s*마|천천히\s*해|안심해|안전해|마음\s*놓|네\s*잘못이\s*아니|급할\s*것\s*없|네\s*속도대로)/,.84],
 ['help',/(?:도와\s*(?:줄|드릴|드|주겠)|부축(?:한다|해|하|한)|상처.{0,15}감싸|(?:짐|가방).{0,12}들어\s*줄|대신\s*처리|식량.{0,12}나눠|일으켜\s*세운|들보.{0,15}사람.{0,10}꺼낸)/,.82],
 ['invite',/(?:같이\s*가|함께\s*가|동행|합류|일행이\s*되어|여행.{0,12}끼지|우리\s*집으로\s*와|모임에\s*나와|길을\s*함께)/,.82],
 ['question',/(?:\?|뭐야|어디(?:야|에|로)|왜\s|누구|어떻게|알려\s*(?:줘|줄)|궁금해|궁금한|알고\s*싶)/,.8]
];
function interpret(text){text=String(text||'').trim();let utterance=text.replace(/[“「『][^”」』]*[”」』]/g,' ');const quotation=/(?:라는\s*(?:말|대사)|에서\s*들은\s*대사|다고\s*했(?:다는|다)|영화에서|인용)/.test(utterance);if(quotation&&!/\?|궁금|알고\s*싶/.test(utterance))return{intent:'neutral',confidence:.35,evidence:'',alternatives:['question'],abstained:true};
 // Negated threats cannot count as actual threats; explicit subsequent reassurance wins.
 utterance=utterance.replace(/(?:죽이겠다는\s*말|협박(?:하려는)?\s*(?:말|게)?|해치려는\s*게)\s*(?:이\s*)?아니(?:야|고|다|니까)?/g,' ');
 // Evaluate the actual later action rather than a quoted/negated request earlier in the sentence.
 const pivot=utterance.search(/(?:지만|결국|지금은|지금부터)/);if(pivot>=0)utterance=utterance.slice(pivot).replace(/^(?:지만|결국|지금은|지금부터)/,'');
 const matches=patterns.flatMap(([intent,re,confidence])=>{const match=utterance.match(re);return match?[{intent,confidence,evidence:match[0],position:match.index}]:[];});
 const deniedHelp=/(?:도와\s*줄|도와\s*주|함께\s*가|같이\s*가).{0,18}(?:않|없|거절|싫)/.test(utterance);if(deniedHelp)return{intent:'refuse',confidence:.87,evidence:utterance.slice(0,100),alternatives:[],abstained:false};
 // An actual conditional threat outranks a polite apology; a question about an apology is a question.
 const threat=matches.find(m=>m.intent==='threaten');if(threat)return{...threat,alternatives:[],abstained:false};
 if(/\?|궁금|알고\s*싶/.test(utterance)&&!/(?:같이\s*가|합류|일행이\s*되어|모임에\s*나와|여행.{0,12}끼지)/.test(utterance))return{intent:'question',confidence:.8,evidence:utterance.slice(-100),alternatives:matches.map(m=>m.intent).filter(i=>i!=='question'),abstained:false};
 if(!matches.length)return{intent:'neutral',confidence:.3,evidence:'',alternatives:[],abstained:true};
 const distinct=[...new Set(matches.map(m=>m.intent))];if(distinct.length>1){const last=matches.reduce((a,b)=>a.position>b.position?a:b);return{...last,confidence:.55,alternatives:distinct.filter(i=>i!==last.intent),abstained:true};}
 return{...matches[0],alternatives:[],abstained:false};}
module.exports={interpret};
