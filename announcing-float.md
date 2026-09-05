# Announcing Float

September 5, 2026

Robinhood Chain carries 193 tokenized stocks. The world's top 2,000 public companies include 1,880 that are not among them.

The missing set is not the long tail. It is the head. Samsung. Tencent. LVMH. Aramco. Nintendo. SK Hynix. The companies whose products fill an ordinary day: the phone screen, the game console, the luxury drop, the memory chips inside the AI boom. People consume them constantly. They just can't own them.

Cultural diets went global decades ago. Portfolios stayed national. That gap is not a demand problem.

## The wall

Try to buy Samsung from the US and you hit a stack of barriers that has nothing to do with the company.

The Korean won is not deliverable outside Korea, so a Korean trade cannot settle without Korean plumbing. Opening the account means custodian paperwork designed for institutions. Disclosures are in Korean until 2027. Dividends lose 22% by default unless you file treaty forms almost nobody has heard of.

SK Hynix, arguably the most important company in the AI supply chain, delisted its ADR years ago. There is not even a wrapper to buy.

Tokenized stocks were supposed to be the answer, and Robinhood Chain proved the model: real shares, held one for one by a regulated custodian, issued as tokens. But it proved it for a menu of names it chose, tradeable during US market hours. Extending that to a foreign stock means crossing the wall: licensing into the home market, custodying in its system, settling in its currency. For an individual that crossing is impossible. For an institution it is expensive, slow, and only worth doing name by name.

So nobody did it, and the head of the global market went unlisted.

## Float

Float lists them by doing the crossing once, so nobody else has to.

Every fSHARE is backed one for one by a real share of the underlying, held in custody and attested on chain. A dealer we call the Desk quotes each market continuously against a live price reference, so the token trades at the real price around the clock. Your USDG mints the token; it does not set the price. The price comes from the company.

The wall still exists. You never touch it. No Korean account, no FX leg, no treaty forms, no index classification standing between a person and a company.

## The launch: a meme funds a stock

Listing a company needs capital before anyone can trade it, and nobody funds a market that does not exist yet. So Float lets a meme token do the fundraising.

Somebody launches a coin on a bonding curve, people buy it because it is a meme, and **every dollar of that raise splits between the stock's cash cushion and the stock's own share reserve.** The meme is the customer acquisition. The stock is what gets built. The market opens on the first dollar and thickens with every one after.

The curve is priced in USDG, so a buyer needs none of the fSHARE to get in, and their money still becomes the company. Its shape is one number: the token opens at a twelfth of its graduation price and leaves 23.4% of supply for the pool.

At graduation the curve stops and two Uniswap v4 pools open:

```
USDG  <->  fSHARE  <->  MEME
```

The meme is quoted in the stock's fSHARE, not in dollars. That is the point of the whole arrangement. Holding the coin is holding a claim on a real company plus a bet, and every buyer of the coin has already bought the stock.

## Where this actually is

The contracts are deployed on Robinhood Chain and running with real money. Thirty-six markets are listed, priced by a median over independent posters. Four launches have graduated into live pools.

One thing is not done, and we would rather say it than let you find it: **no real share has been bought yet.** The reserve rail is built, deployed and enforced on chain, the custody adapters are written, and the issuance gate that reads them is live. What has not happened is the funded brokerage account behind it. Every token in issue today is backed by the cash held against it, not by stock.

Today: cash-backed. Designed and coded: share-backed. The difference is a funded account, not a contract that has yet to be written.

Nothing about this asks for your trust. The reserve is there to be checked: `coverageBps` reads 10000 when there is exactly one share per token, and anyone can call it.

## Get started

Launch a coin on any listed company at [app.floatdesks.com](https://app.floatdesks.com).

Read how the backing works at [docs.floatdesks.com](https://docs.floatdesks.com).

The Float team
