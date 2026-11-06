// A shared won balance. Read-only views never create or debit a wallet.
export const startingMoney=100000;
export function moneyBalance(s){return s.wallet?.balance??Math.max(0,startingMoney-(s.cafeLife?.spent??0));}
export function debitMoney(s,amount,label){
 if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('올바른 결제 금액이 아닙니다.');
 const balance=moneyBalance(s);if(balance<amount)throw new Error('소지금이 부족합니다. 다른 메뉴를 고르거나 구매를 취소해 주세요.');
 s.wallet??={balance,ledger:[]};s.wallet.ledger??=[];s.wallet.balance-=amount;s.wallet.ledger.push({day:s.day,minute:s.clock.minute,amount,label});
}
