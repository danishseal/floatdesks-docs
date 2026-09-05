# Float

<div class="float-intro">

**Documentation, v2.0.**

The published essay, [*Why the biggest companies on earth can't be tokenized, and
how Float lists them anyway*](https://x.com/floatdesks/status/2094998862712754323),
is still the argument. Nothing in the thesis has moved: 1,880 of the world's top
2,000 companies have no token on Robinhood Chain, the reason is plumbing rather
than demand, and the answer is to cross the wall once and hold the shares on the
other side.

What has moved is the machine. The essay described a market that waited at a
$5,000 milestone to open and a second at $10,000 to become spot. Building it
taught us that both numbers were guesses at things the system can measure
directly, and that the interesting problem was not the milestones but what
happens between them. So we tweaked it. This is Float 2.0, and the differences
are worth stating before anything else.

</div>

### What Float is

Float lists the companies the tokenization wave skipped. Of the world's top
2,000 companies, 1,880 have no token on Robinhood Chain. Nintendo, Tencent,
Nestle, LVMH, SoftBank and Hermes are all in that group. The reason is plumbing
rather than demand: buying a Tokyo or Hong Kong listed company from a US account
means a foreign account, an FX leg, treaty paperwork and a custodian in the home
market, and no consumer app is going to build that once per country.

Float crosses that wall once, holds the shares on the other side, and issues a
token against them.

**One fSHARE is one ordinary share of the underlying company, held in custody
and owed to the holder.** Not a basket, not a tracker, not an index: the
specific security, in the specific quantity, in a specific account. The claim is
redeemable, and selling an fSHARE back to the Desk burns it and releases the
share behind it. It carries no voting rights, which is true of every tokenized
equity and is worth saying rather than implying.

### How it works

**The Desk** is one vault of USDG standing on both sides of every listing. It
quotes continuously against a reference price, which is what makes a Japanese
company tradeable at three in the morning when Tokyo is shut and no pool exists
to trade against:

```
buy  = mark * (1 + spread + impact + txFee)
sell = mark * (1 - spread - impact - txFee)
```

The spread is 30 basis points while the home exchange is open and 150 when it is
closed, because a closed exchange is a stale reference and a stale reference is
worth less. Impact scales with how far a trade pushes the book away from
balance, so size pays for the risk it creates.

**The reserve** is five public numbers on `ReserveBook.sol`: what is
outstanding, what custody actually holds, what has been ordered and paid for but
not yet settled, and the ceilings those imply. Nothing about the backing exists
off chain except the broker account itself. A market that cannot prove its cover
becomes settle-only, which is the universal failure state here: existing
positions can be closed, nothing new can be issued.

**The launch** funds the custody purchase from the first dollar rather than
waiting at a milestone, thickening the market with every dollar after on a
decaying ramp. A launched token graduates into two real Uniswap v4 pools, USDG
to fSHARE to token, with 23.4% of supply seeded into the pool.

### What an ADR is

The promise is one token, one ordinary share. The thing sitting in a US
brokerage account is frequently not an ordinary share, and pretending otherwise
is how a reserve quietly becomes fractional.

An American Depositary Receipt is a US-listed certificate issued by a depositary
bank against home-market shares that bank holds through a local custodian. It
trades in dollars, settles US-style, and clears through US infrastructure. That
is its whole purpose: it is a wrapper that lets American plumbing hold a foreign
asset.

It is a **receipt, not the share**. The depositary is a real counterparty in the
chain. The receipt can be cancelled, the programme can be terminated, and the
ratio can be changed. **Sponsored** means the company set the programme up
itself, so there is one programme and real disclosure. **Unsponsored** means a
depositary created it without the company's involvement, which is why several
banks can run competing programmes on the same company and why the terms belong
to the depositary. Most of Float's target names trade unsponsored on the US OTC
market, Nintendo and Tencent among them.

### How Float connects to them

**One ADR is almost never one share.** The depositary picks a ratio to put the
receipt in a comfortable dollar price range, and it differs by name:

| company | line | one receipt is | kind |
|---|---|---|---|
| Nintendo | NTDOY | **0.25** ordinary shares | ADR, unsponsored |
| Tencent | TCEHY | 1 | ADR, unsponsored |
| Nestle | NSRGY | 1 | ADR, sponsored |
| LVMH | LVMUY | **0.2** | ADR |
| SoftBank | SFTBY | **0.5** | ADR |
| Hermes | HESAY | **0.1** | ADR, not fractionable |

Get that number wrong and the reserve is wrong by exactly that factor. Ship 1.0
where the truth is 0.2 and the market runs a 5x fractional reserve while every
on-chain view agrees with itself, because every view is derived from the same
wrong constant.

We learned it the expensive way. A published fact sheet gave the NTDOY ratio as
1:8. Float derived it from live prices instead and got 1:0.25, a 32x
discrepancy against the document, and the live price relationship was the
correct one. So the rule is explicit: **verify a ratio from prices, never from a
fact sheet, and check it continuously**, because a depositary can change the
ratio on an unsponsored programme without asking anyone.

The custodian reports the units on its statement, whatever those units are, and
the contract converts:

```solidity
setCustodyUnit(assetId, sharesPerUnit, kind)   // 1e18 = one unit is one ordinary share
                                               // 2.5e17 = one unit is a quarter of a share
sharesHeld = unitsHeld * sharesPerUnit / 1e18
```

`custodyKind` is stored as a string, "ordinary" or "ADR" or "GDR", so the
reserve page says plainly what is held rather than implying the ordinary share
everywhere. A ratio change restates the existing position, so the book never
keeps crediting an old conversion against shares it already holds.

Section 5 is the full mechanical account of how one token becomes one share, and
section 6 is the whole of the ratio problem.

### What changed since the essay

| | v1, as published | 2.0, as built |
|---|---|---|
| **opening a market** | waits at $5,000, then opens | opens on the first dollar and thickens with every one after, on a decaying ramp |
| **the launchpad token** | priced and settled in the fSHARE | same, and it now graduates into two real Uniswap v4 pools, USDG to fSHARE to token, with 23.4% of supply into the pool |
| **becoming spot** | a $10,000 milestone flips fSAMSUNG to SAMSUNG | **pairing.** The market stops depending on cash the moment custody covers supply with headroom. The milestone was a guess at when that happens; pairing measures it |
| **liquidity** | provided by the protocol | a two-sided market. Anyone can take the long or the short side of a market's capacity and earn its fee slice |
| **the reserve** | a custodian attests | two custody modes, attested and verified, and a verified market refuses attestation outright |
| **failure** | unspecified | settle-only is the universal failure state, and a breaker puts a market there in one call |

Everything else the essay promised is here and is the same: one real share per
token, held in custody, proven on chain; a dealer quoting continuously against a
live reference so the token trades around the clock; no Korean account, no FX
leg, no treaty forms, no index classification standing between a person and a
company.

Section 5 is the important one. It is the full mechanical account of how one
token comes to be one share, and section 6 explains ADRs, because the ratio
between what custody holds and what the token promises is where this gets
genuinely difficult.

---

# Part I: The problem

## 1. The gap is the head, not the tail

Robinhood Chain carries 193 tokenized stocks. The world's top 2,000 public
companies include 1,880 that are not among them. The missing set is not the long
tail. It is the head: Samsung, Tencent, LVMH, Aramco, Nintendo, SK Hynix.

These are not obscure names. They are the companies whose products fill an
ordinary American day: the phone screen, the game console, the luxury drop, the
memory chips inside the AI boom. People consume them constantly. They just
cannot own them.

Cultural diets went global decades ago. Portfolios stayed national. That gap is
not a demand problem.

## 2. The wall

Try to buy Samsung or SK Hynix from the US and you hit a stack of barriers that
has nothing to do with the company and everything to do with the market it lives
in.

The Korean won is not deliverable outside Korea, so a Korean trade cannot settle
without Korean plumbing. Opening the account means custodian paperwork designed
for institutions. Disclosures are in Korean until 2027. Dividends lose 22% by
default unless you file treaty forms almost nobody has heard of.

SK Hynix, arguably the most important company in the AI supply chain, delisted
its ADR years ago. There is not even a wrapper to buy. And because index
providers still file Korea under emerging markets, trillions of dollars of
developed-market mandates are not allowed to touch it at all.

China is the same wall, taller. Onshore shares require a license retail
investors will never have. The yuan does not move freely across the border. Many
Chinese companies that list abroad do it through structures where foreigners own
a contract rather than the company. And on top of the Chinese wall sits an
American one: sanctions lists, delisting laws, outbound investment rules.

Run every corridor between the US, Korea and China and the pattern repeats.
Capital wants the exposure. The asset wants the capital. A layer of plumbing
sits in between, and the plumbing always wins.

## 3. Why tokenization stopped at 193

Tokenized stocks were supposed to be the answer, and Robinhood Chain proved the
model: real shares, held one for one by a regulated custodian, issued as tokens.

But it proved it for a menu of names it chose, tradeable during US market hours.
Extending the model to a foreign stock means crossing the wall: licensing into
the home market, custodying in its system, settling in its currency, filing its
paperwork. For an individual investor that crossing is impossible. For an
institution it is expensive, slow, and only worth doing name by name.

So nobody did it, and the head of the global market went unlisted. Custody was
never the wrong model. It had simply never been carried across the wall, to
exactly the companies that live behind the most plumbing.

## 4. What Float removes

Float lists them by doing the crossing once, so nobody else has to.

Every fSHARE is backed one for one by a real share of the underlying, held in
custody and attested on chain. Buy fSK-HYNIX and your USDG is what acquires the
real SK Hynix share held against it; sell and that share is released. A dealer,
the Desk, quotes the market continuously against a live price reference, so the
token trades at the real price around the clock, covered by the shares Float
holds.

The wall still exists. You never touch it.

**No Korean account, no custodian paperwork, no registration.** Float holds the
reserve through one institutional pipe and proves one share per token on chain,
so anyone can verify instead of trusting.

**No FX leg on your side.** You buy in USDG. The reserve deals with the won.

**No market hours.** Off hours the reference keeps moving on real information:
the ADR where one exists, index futures, the FX leg, and Float's own order flow.
A band leashes the premium. At the home open it snaps to the real print.

**No treaty forms, no registration certificates, no index classification**
standing between a person and a company.

What is left is what most people wanted all along: a genuine, custodied claim on
a company they believe in, in their own wallet, at any hour.

Float says plainly what a fSHARE is and is not. It is a real, redeemable,
share-backed claim, proven on chain. It confers no voting rights, the same as
any tokenized stock. Nothing about it asks for your trust, because the reserve
is there to be checked. Section 5 is how.

---

# Part II: The backing

## 5. How one token becomes one share, exactly

This is the section that matters. Everything else Float does is a way of
delivering the claim described here, and every design decision elsewhere bends
to keep it true.

### 5.1 The claim, stated precisely

**One fSHARE is one ordinary share of the underlying company, held in custody
and owed to the holder.**

Not one share of a basket. Not a tracker. Not an index. The specific security,
in the specific quantity, in a specific account. Where custody holds a receipt
rather than the ordinary share (an ADR, a GDR), the reserve is converted to
ordinary-share equivalents by a per-market ratio before any of the accounting
below runs, so the promise the token makes stays denominated in the company's
own shares. Section 6 is entirely about that conversion.

The claim is redeemable. Selling an fSHARE to the Desk burns it and returns
USDG at the reference price, and the share behind it is released. The claim
carries no voting rights, which is true of every tokenized equity and should be
stated rather than implied.

### 5.2 The five numbers

Every market's reserve is five numbers, all of them public views on
`ReserveBook.sol`. Nothing about the backing exists off chain except the broker
account itself, and section 5.8 is about what that means.

| number | what it is | how to read it |
|---|---|---|
| `outstanding` | fSHARE in issue, which is the shares owed to holders | `UAsset.totalSupply()`, read through `ReserveBook.outstanding` |
| `sharesHeld` | ordinary-share equivalents settled in custody | attested by the custodian, or read as a token balance |
| `inFlightLive` | ordered and paid for, not yet settled, with a live TTL | expires after 3 days so a stuck order cannot prop up a ceiling |
| `bufferShares` | a deliberate over-hold, absorbing the settlement gap | set per market, publicly |
| `cashBackedShares` | tokens covered by cash committed to buying their share | falls to zero as custody converts, by construction |

And one derived number that is the whole product in a single call:

```
coverageBps = sharesHeld * 10000 / outstanding
```

10000 means exactly one share per token. More is over-reserved. Less is a
shortfall, and it is visible to anyone the moment it happens.

### 5.3 The buy, step by step

A person buys $500 of fSAMSUNG at 3am Korea time. Here is every step, in order,
with what changes on chain at each one.

**1. The order arrives.** They approve USDG and call
`Desk.buy(assetId, quoteIn, minOut, recipient)`.

**2. The Desk prices it.** It reads the mark from `OracleHub`, which is a median
over a poster set with a staleness window. If the price is stale or the poster
set is thin, the quote comes back degraded and the market is in settle-only:
this buy reverts, and the person can still sell. Assuming a good price:

```
effPx  = mark * (1 + spread + impact + txFee)
baseOut = quoteIn / effPx
```

**3. The gate runs, before anything is minted.** `Desk._checkIssuance` computes
what `outstanding` would be after this trade and refuses if it exceeds the
reserve ceiling:

```solidity
if (gated) {
    if (outstandingAfter > book.mintCeilingAt(assetId, px, qScale)) revert ReserveExceeded();
}
```

This is the structural part and it is worth being precise about why. The Desk
cannot create a token the reserve does not already support or does not already
have committed money to support. It is not a policy the operator follows. It is
a condition the transaction fails.

**4. The token is minted and the money lands.** USDG enters the Desk vault,
`UAsset.mint` issues the fSHARE, `netOI` rises. At this instant the market is
**cash backed**: the buyer's $500 is sitting in the vault and it is the money
that will buy the share. This is the only moment of the whole cycle where the
claim is not yet a share, and closing it fast is the reserve keeper's entire
job.

**5. The keeper sees the shortfall.** `services/keepers/reserve-keeper.mjs`
polls each gated market:

```
shortfall = ReserveBook.sharesToBuy(assetId)     // owed, in ordinary shares
units     = shortfall / sharesPerUnit            // what to buy on the actual line
```

`sharesToBuy` counts in-flight the same way the ceiling does, deliberately: an
earlier version used the raw figure, so an expired report stopped counting
toward the ceiling while still counting as owed, and the market deadlocked with
no headroom and a keeper told nothing was owed.

**6. The ratio is checked against the chain.** The keeper reads
`sharesPerUnit(assetId)` from the contract and compares it to its own config. A
mismatch stops the market rather than trading through, because the keeper sizes
the **order** while the contract sizes the **ceiling**, and when they disagree
the market issues against backing it does not have. Shipping 0.25 in the keeper
while the chain still defaults to 1.0 is a 4x fractional reserve on Nintendo
with every on-chain view agreeing with itself.

**7. The order is placed, idempotently.** The broker order id is derived by hash
from the market's on-chain reserve state:

```js
orderId({ assetId, outstanding, held, inFlight })  ->  "float-<sha256[:32]>"
```

A keeper that dies between placing an order and reporting it restarts, computes
the same id from the same on-chain state, and the broker rejects it as a
duplicate. That is what stops a crash loop from buying the same shares five
times.

**8. The fill is reported.** `reportExecuted(assetId, units, ref)` records the
purchase in the units the custody statement literally uses, converts to
ordinary-share equivalents, and stamps the in-flight pile. The fill counts
toward the ceiling immediately, because the purchase is done and the price is
locked. Three guards sit on this call:

- `fillSeen[keccak(assetId, ref)]` makes a fill count exactly once. A keeper
  resubmitting a report it believed had failed used to double the ceiling
  against a single purchase.
- `inFlightSince` is stamped only when the pile **starts**, not on every fill,
  so a steady trickle of new purchases cannot extend the TTL over the whole pile
  indefinitely.
- A ticker that was never listed reverts `NoSuchMarket`.

**9. Settlement.** T+2 in most markets. `reportSettled(assetId, units,
unitsHeldNow, custodyRef)` moves the units out of in-flight and writes the
**absolute** held figure from the statement, along with the statement reference.
Absolute rather than incremental, so a miscount corrects itself on the next
report instead of compounding forever.

From that block onward, `sharesHeld` covers the tokens minted in step 4,
`coverageBps` reads 10000 or better, and the ceiling for the next buyer is
computed off real stock rather than off cash.

### 5.4 The ceiling, in full

```solidity
mintCeilingAt = sharesHeld
              + inFlightLive
              + bufferShares
              + cashBackedSharesAt
```

Four terms, and the fourth is where the care went. `cashBackedSharesAt` is the
cash cover, and it is built to shrink to nothing on its own as custody grows:

```solidity
cap  = min(oiCapQuote, vaultBacking + BackingVault.totalCash)   // real deposits, not the risk dial
allowedQuote = cap * cashBackedBps / 10000
converted    = sharesHeld * price                              // THE RATCHET
if (converted >= allowedQuote) return 0;
allowedQuote -= converted;
return allowedQuote / price;
```

Three properties of that block, each of which was a bug before it was a
property.

**Cash and shares do not add.** The subtraction of `converted` means the sum
above collapses to `max(sharesHeld, cashAllowance) + inFlightLive + buffer`.
Buying a real share does not stack capacity on top of the cash that bought it.
It replaces the cash cover with something better. The reason is that
`vaultBacking` is a deposit counter and does not fall when that cash is
withdrawn and spent on the very shares it was meant to buy, so without the
subtraction the same dollars count twice. An audit measured exactly this: one
$5,000 cushion authorising $10,000 of issuance while the market reported itself
fully compliant at 51.5% real reserve.

**The risk dial cannot be laundered into cash cover.** `oiCapQuote` is real
backing times a multiplier that can be as high as 5x. Multiplying **unbacked**
issuance by a dealer-risk dial is not something anyone intended, so the cash
term takes `min(cap, actual deposits)`.

**It fails closed.** If the funder address is unset, the cash term returns zero
rather than skipping the clamp. The earlier version skipped the block and handed
the market the full risk-multiplied cap.

And one thing that is deliberately permissive: **cash counts in both regimes,
open market and closed.** An earlier version zeroed the cash term the moment the
home exchange opened, on the logic of "go buy the share instead". Two things
went wrong, both reproduced on testnet. A market with no custody yet could not
be started at all during trading hours, ceiling zero and every buy reverting.
And every existing market stopped issuing at each opening bell until a keeper
caught up. The gate's job is to stop supply outrunning the reserve, not to
schedule the keeper. The conversion obligation stays visible in `sharesToBuy`,
`coverageBps` and the reserve page, all of which count **shares only** and so
keep telling the truth about what is still owed.

### 5.5 The sell, and why redemption is never gated

`Desk.sell` burns the fSHARE and pays USDG at `mark * (1 - spread - impact -
txFee)`. `outstanding` falls, so the reserve is now long relative to the claim
and the keeper releases the share back into cash on the next cycle.

The gate runs on **skew-increasing trades only**. Redemption is never blocked,
by any of it: not by a stale oracle, not by a degraded poster set, not by a
tripped breaker, not by a shortfall. Every failure state in Float is
**settle-only**, which means holders can always leave and nobody can enter.
There is no state of the system in which a person is holding a token they cannot
sell back.

### 5.6 Two kinds of custody, and why the difference is stated rather than blurred

`ReserveBook` resolves both behind one view, so `sharesToBuy`, the ceiling and
the Desk's check are identical either way. What differs is the trust assumption,
and blurring that would mean reporting the weaker one as though it were the
stronger.

**Attested.** Shares sit at a broker (IBKR, Alpaca). The chain finds out because
the custodian key says so, and every report carries the statement reference it
came from. The trust point is the custodian and the key. The ring buffer keeps
the attestation history on chain, so the record is a series rather than a
current value, and an `UnderReserved` event fires whenever a report lands with
`sharesHeld` below `outstanding`. A shortfall is published, not hidden.

**Verified.** The backing is itself an on-chain token that is redeemable for the
real share, and `sharesHeld` is read live as `balanceOf(account)` rather than
reported by anyone. The trust point is the token issuer. There is no key to
trust and no step that can lie, and to keep it that way `attest`,
`reportExecuted` and `reportSettled` all revert with `CustodyIsVerified` on
these markets. A key cannot overwrite what the chain can see for itself.

A market can move between the two by changing one setting, and the ratio
machinery applies to both, so a token representing a fraction of a share
converts exactly the way an ADR does.

### 5.7 Every way this could be faked, and what stops it

The claim "one token, one share" is only as good as the list of ways it could be
false. Here is that list, and where each one is closed.

| the attack | what stops it | where |
|---|---|---|
| mint more tokens than the reserve supports | the transaction reverts `ReserveExceeded` before the mint | `Desk._checkIssuance` |
| report the same broker fill twice to double the ceiling | `fillSeen[keccak(assetId, ref)]`, reverts `FillAlreadyReported` | `ReserveBook.reportExecuted` |
| leave a fake order in flight forever to hold up a ceiling | `inFlightTtl`, 3 days, and the stamp only starts a pile | `inFlightLive`, `reportExecuted` |
| trickle new orders to keep extending that TTL | `inFlightSince` is set only when the pile starts, never refreshed | `reportExecuted` |
| count the same dollars as cash cover and as shares | the ratchet subtraction of `converted` | `cashBackedSharesAt` |
| claim the 5x risk-multiplied cap as if it were cash | `min(oiCapQuote, actual deposits)` | `cashBackedSharesAt` |
| unset a registry key so the clamp is skipped | fails closed, returns zero cover | `cashBackedSharesAt` |
| double-count a paired market's converted cushion | a paired market's cash term is zero | `cashBackedSharesAt` |
| write a phantom market that reports full coverage | `NoSuchMarket` on all three write paths | `attest`, `reportExecuted`, `reportSettled` |
| change the ADR ratio and keep crediting the old conversion | `setCustodyUnit` restates held and in-flight | `setCustodyUnit` |
| run a keeper whose ratio differs from the chain's | the keeper refuses to trade and says so | `reserve-keeper.mjs` |
| buy the wrong line (a 144A tranche, a look-alike ADR tier) | the adapter refuses a line with no pinned contract id | `adapters/ibkr.mjs`, `ALPACA-ADR.md` |
| overwrite a verified balance with a custodian key | `CustodyIsVerified` on every attested write | `attest`, `reportExecuted`, `reportSettled` |
| let a shortfall pass quietly | `UnderReserved` fires on the report that causes it | `_record` |

What is **not** on that list, and cannot be: the custodian holding fewer shares
than its statement says on an attested market. That is the irreducible trust
point of attested custody, it is the same one every tokenized equity has, and it
is why verified custody exists as the stronger mode and why the attestation
history is a public series rather than a number.

### 5.8 How to check it yourself

Every figure is a public view. Nothing below needs permission, an API key, or
Float.

```bash
BOOK=0x3A4c63B17292d352879dF8AF662432E8Ed767951
RPC=https://rpc.mainnet.chain.robinhood.com
ID=$(cast keccak "SAMSUNG")

# the whole claim in one number: 10000 = exactly one share per token
cast call $BOOK "coverageBps(bytes32)(uint32)"      $ID --rpc-url $RPC

# the parts
cast call $BOOK "outstanding(bytes32)(uint256)"     $ID --rpc-url $RPC   # tokens owed
cast call $BOOK "sharesHeld(bytes32)(uint256)"      $ID --rpc-url $RPC   # shares held
cast call $BOOK "sharesInFlight(bytes32)(uint256)"  $ID --rpc-url $RPC   # bought, unsettled
cast call $BOOK "shortfall(bytes32)(uint256)"       $ID --rpc-url $RPC   # still owed
cast call $BOOK "isFullyReserved(bytes32)(bool)"    $ID --rpc-url $RPC

# what custody literally holds, and in what
cast call $BOOK "unitsHeld(bytes32)(uint256)"       $ID --rpc-url $RPC
cast call $BOOK "sharesPerUnit(bytes32)(uint256)"   $ID --rpc-url $RPC
cast call $BOOK "custodyKind(bytes32)(string)"      $ID --rpc-url $RPC

# every market at once
cast call $BOOK "allReserves()" --rpc-url $RPC
```

And the history, which is the part that matters for an attested market, because
a single current figure proves less than a series does:

| event | carries |
|---|---|
| `Attested` | shares held, the statement reference, the timestamp |
| `Executed` | shares bought, the new in-flight total, the broker order reference |
| `Settled` | shares settled, the new held total, the remaining in-flight |
| `UnderReserved` | shares held and tokens outstanding, at the moment coverage broke |

`attestationAt(assetId, i)` walks the on-chain ring buffer directly.

---

> ## Current status
>
> **The reserve rail described in section 5 is deployed and enforced on chain.
> The brokerage account behind it is not yet funded.**
>
> Built, deployed on Robinhood Chain 4663, and exercised: the ReserveBook, both
> custody modes, the issuance gate inside the Desk, the ratchet, the TTL, the
> fill-idempotency guard, the ADR ratio machinery, the keeper and its three
> broker adapters, and the ratio-mismatch refusal.
>
> Not yet done: **no real share has been bought.** `sharesHeld` is zero on every
> market, `reserveValue` is $0, and no live market is currently gated. Every
> token in issue today is backed by the cash held against it, which is the
> `cashBackedShares` term in 5.4, not by stock.
>
> So, plainly:
>
> **Today: cash-backed, with the share rail built and idle. Designed and coded:
> share-backed. The distance between them is a funded brokerage account, not a
> contract that has yet to be written.**
>
> Section 14 lists every other gap without softening any of them.

---

## 6. ADRs, ratios, and what custody actually holds

The promise is one token, one ordinary share. The thing sitting in a US
brokerage account is frequently not an ordinary share, and pretending otherwise
is how a reserve quietly becomes fractional. This section is the whole of that
problem.

### 6.1 What an ADR is

An American Depositary Receipt is a US-listed certificate issued by a depositary
bank against home-market shares that bank holds through a local custodian. It
trades in dollars, settles US-style, and clears through US infrastructure. That
is its entire purpose: it is a wrapper that lets American plumbing hold a
foreign asset.

It is a **receipt**, not the share. The depositary is a real counterparty in the
chain, and the receipt can be cancelled, the programme can be terminated, and
the ratio can be changed.

**Sponsored** means the company itself set the programme up with the depositary,
so there is one programme, disclosure obligations, and usually a real exchange
listing. **Unsponsored** means a depositary created it without the company's
involvement, which is why several banks can run competing programmes on the same
company and why the terms are the depositary's to change. Most of Float's target
names trade unsponsored on the US OTC market: Nintendo and Tencent both do.

Level I is OTC and light on disclosure. Level II is exchange-listed. Level III
raises capital. Almost everything in the missing 1,880 that has a wrapper at all
has a Level I one.

### 6.2 The ratio, which is the whole difficulty

**One ADR is almost never one share.** The depositary picks a ratio to put the
receipt in a comfortable dollar price range, and it differs by name. From
Float's own market table:

| company | line | one receipt is | kind |
|---|---|---|---|
| Nintendo | NTDOY | **0.25** ordinary shares | ADR, unsponsored |
| Tencent | TCEHY | 1 | ADR, unsponsored |
| Nestle | NSRGY | 1 | ADR, sponsored |
| LVMH | LVMUY | **0.2** | ADR |
| SoftBank | SFTBY | **0.5** | ADR |
| Hermes | HESAY | **0.1** | ADR, not fractionable |

Get that number wrong and the reserve is wrong by exactly that factor. Ship 1.0
where the truth is 0.2 and the market is running a 5x fractional reserve while
every on-chain view agrees with itself, because every view is derived from the
same wrong constant.

**We learned this the expensive way.** A published fact sheet gave the NTDOY
ratio as 1:8. Float derived it from live prices instead and got 1:0.25, a 32x
discrepancy against the document. The live price relationship was right. So the
rule is now explicit: **verify a ratio from prices, never from a fact sheet, and
check it continuously.** A depositary can change the ratio on an unsponsored
programme without asking anyone.

### 6.3 How Float encodes it

The custodian always reports the **units on its statement**, whatever those
units are, and the contract converts:

```solidity
setCustodyUnit(assetId, sharesPerUnit, kind)   // 1e18 = one unit is one ordinary share
                                               // 2.5e17 = one unit is a quarter of a share
sharesHeld = unitsHeld * sharesPerUnit / 1e18
```

`custodyKind` is stored as a string, "ordinary" or "ADR" or "GDR", so the
reserve page can say plainly what is actually held rather than implying the
ordinary share everywhere.

Two guards make the ratio safe to change:

**A ratio change restates the existing position.** `setCustodyUnit` recomputes
`attestedShares` and `sharesInFlight` from the stored units, so the book never
keeps crediting the old conversion against shares it already holds. On a
verified market it deliberately does not restate, because `sharesHeld` reads a
live balance and rewriting the dormant attested record from stale units produced
a figure no custodian had ever reported.

**The keeper refuses to trade on a mismatch.** The order size comes from the
keeper and the ceiling comes from the contract, so the keeper reads
`sharesPerUnit` off the chain every cycle and halts the market if its own config
disagrees. It prints the two numbers and says to fix it with `setCustodyUnit`
rather than guessing.

### 6.4 The flow, end to end

The ratio is not a footnote in this process, it is the unit conversion sitting
between every step. Here is a purchase from the buyer to settled custody, with
Nintendo as the worked example because its 0.25 makes every conversion visible.

**1. Someone buys.** $500 of fNINTENDO at the Desk. USDG lands in the vault and
the token is minted only if the issuance gate passes. At this instant the
position is **cash backed**: the money is in the vault and no share has been
bought yet.

**2. The keeper sees the shortfall.** `outstanding` now exceeds
`sharesHeld + inFlightLive`, and the difference is what has to be acquired.

**3. The ratio is checked before anything is ordered.** From live prices, never
from a fact sheet, and against the `sharesPerUnit` the chain already holds. This
is the step the NTDOY incident added: a document said 1:8 where the market said
1:0.25.

**4. The order is sized in shares and placed in units.** The obligation is in
ordinary shares; the broker trades ADRs. So

```
units to buy = ordinary shares owed / sharesPerUnit
```

Covering 100 ordinary Nintendo shares at 0.25 means buying **400 NTDOY**, not
100. Getting this backwards is the 32x error, and in the direction that leaves
the reserve short rather than long.

**5. The order id is derived, not generated.** It is a hash of the on-chain
state that justified it, so a keeper that dies between placing and reporting
restarts, computes the same id, and the broker rejects it as a duplicate rather
than buying twice.

**6. The fill is reported in the statement's own units.**
`reportExecuted(assetId, units, ref)` records 400, not 100, along with the
reference it came from. The contract converts on the way in:

```
sharesHeld = unitsHeld * sharesPerUnit / 1e18
```

so 400 units at 2.5e17 becomes 100 ordinary-share equivalents. The chain stores
what custody literally holds and converts to what the token promises, rather
than storing a converted number nobody reported.

**7. Settlement.** T+2 in most markets. `reportSettled` moves the units out of
in-flight and writes the **absolute** held figure from the statement, not a
delta, so a missed report cannot leave the book drifting.

**8. The market becomes share backed.** `sharesHeld` now covers `outstanding`,
and the cash allowance that was standing in for it shrinks to nothing on its
own. Nothing switches modes; the cash term simply stops being the binding one.

**9. If the depositary moves the ratio**, `setCustodyUnit` restates the existing
position from the stored units, so the book never keeps crediting an old
conversion against shares it already holds. On a verified market it deliberately
does not restate, because there `sharesHeld` reads a live balance.

**10. Redemption runs the same path backwards** and is never gated. Selling
burns the fSHARE and releases the share behind it. A market that cannot prove
its cover goes settle-only, which stops issuance and still lets holders leave.

The thing to hold on to: **Float's obligation is denominated in ordinary shares
and its custody is denominated in whatever the broker sells.** Every number on
chain is one of those two, explicitly, and `sharesPerUnit` is the only bridge
between them.

### 6.5 Who holds it, and who prices it

Three different counterparties sit behind an ADR-backed market, and they fail in
different ways, so they are worth naming separately.

**The depositary bank issues the receipt, and Float does not choose it.** Float
buys whatever line already exists. On an unsponsored programme, which is what
most of these names trade on, the depositary set the programme up without the
company and owns its terms: it can change the ratio, and it can terminate the
programme. That is a counterparty Float holds exposure to and cannot negotiate
with, which is the honest reason section 6.8 exists.

**The broker holds the position.** Custody is a real brokerage account, and the
attestation service reads it rather than being told about it:

```
buy fSHARE on the Desk ──gate──▶ ReserveBook.isFullyReserved(asset)
                                        ▲
                                        │ attest(asset, sharesHeld, ref)
                          the attestor ─┘  sharesHeld = adrQty * underlyingPerAdr
                                ▲
                                │ GET /v2/positions
                             the broker (holds the ADRs)
```

`services/attestor` is written against **Alpaca** and reads its positions
endpoint directly. **Interactive Brokers** is the other broker the reserve work
targets, for a cash entity account. The conversion from ADR quantity to
underlying-share equivalent happens on the way in, so what reaches the chain is
already denominated in the company's own shares.

The trust point here is the broker plus the custodian key. That is stated rather
than hidden: an attested market is only as good as the key that signs for it,
which is why the attestation history is kept on chain as a series rather than a
single current figure.

**Verified custody removes the key entirely**, where it is available. If the
backing is itself an on-chain token that is redeemable for the share, the chain
reads a balance instead of believing a signature, and `attest`,
`reportExecuted` and `reportSettled` all revert on that market so nobody can
quietly go back to trusting a key. A **Dinari** adapter for that mode is
prototyped and not deployed.

**The price comes from two vendors, not one.** The oracle is a median hub with
independent posters, so a single vendor being wrong or unreachable does not move
the mark:

| poster | vendor | note |
|---|---|---|
| one | **EODHD**, paid, All World Extended | does not carry Tokyo on this plan |
| two | **Yahoo** | reachable over IPv6, which EODHD is not |

That split is forced rather than chosen. EODHD is unreachable over IPv6 and the
second host is IPv6 only, so it cannot ever be the EODHD poster. And because
EODHD does not carry Tokyo on this plan, Japanese names are priced through their
US line and an FX leg: Nintendo through NTDOY and JPY/USD, with a Nikkei futures
proxy as a further fallback. The same ADR ratio problem therefore appears twice,
once in custody and once in pricing, and it is the same `sharesPerUnit` number
both times.

### 6.6 Picking the line is its own problem

Knowing you want Nintendo is not enough to place an order. Search results for
these names return the ordinary share, several ADR tiers, look-alike tickers,
and restricted tranches that a US account may not be able to hold at all
(Reliance's 144A against its Reg S line is the canonical trap). Float's research
notes record four wrong lines we picked by name before pinning contract ids, and
the broker adapter now **refuses to trade any line without a pinned contract
id**. A name is not an instrument.

### 6.7 Fees and dividends, stated rather than glossed

Depositary programmes charge a service fee, typically one to five cents per
receipt per year, deducted from dividends or billed directly. Home-market
withholding applies before that: 22% on Korean dividends by default, reclaimable
only by filing treaty paperwork.

Float does not currently pass dividends through to holders, and does not claim
to. That is a real gap rather than a design choice, and it is item 6 in
section 14. Where the underlying pays, the economics accrue to the reserve.

### 6.8 Why ADRs are not the answer on their own

They are the easy path, and for many names they are also the only path a US
broker can take today, which is why Float supports them properly rather than
avoiding them. But they are not sufficient for the set Float exists to list:

- **Many head names have no ADR at all.** SK Hynix delisted its programme years
  ago. There is no wrapper to buy.
- **The ones that exist are thin.** An unsponsored Level I OTC line can trade at
  a visible spread to the home print, and its price is not the company's price.
- **The depositary is a counterparty.** Terminate the programme and the receipt
  is unwound.

So the ADR is a supported custody unit, not the plan. The architecture is
deliberately unit-agnostic: `sharesPerUnit` plus `custodyKind` means the same
market can be backed by ordinary shares through a home-market custodian, by an
ADR through a US broker, or by a verified on-chain share token, and every
downstream number keeps meaning ordinary-share equivalents. Crossing the wall
properly means holding the ordinary share. The ADR is how you list the name
while that pipe is being built.

---

# Part III: The machine

## 7. The Desk

`contracts/src/Desk.sol`. One vault of USDG standing on both sides of every
listing Float quotes. It is what makes the token tradeable when the home
exchange is shut and the pool is empty.

### The quote

```
buy  = mark * (1 + spread + impact + txFee)
sell = mark * (1 - spread - impact - txFee)
```

`spread` is 30 bps while the underlying exchange is open and 150 bps when it is
not, because a closed exchange is a stale reference and a stale reference is
worth less. `impact` scales quadratically with how far the trade pushes the book
from balance, reaching 200 bps at the cap:

```solidity
uint256 r = notionalAfter * BPS / l.oiCapQuote;
if (r > BPS) r = BPS;
return uint256(l.maxImpactBps) * r * r / (BPS * BPS);
```

It reads the **post-trade** book rather than the trade, so a trade pays for the
book it leaves behind. And it divides by the **stored** cap, which is what makes
backing a market (section 10) make it cheaper to trade rather than merely
larger.

### The balance sheet

```
equity    = availableLiquidity + reserveValue - liability
liability = sum over markets of |netOI| * oraclePrice
```

`reserveValue` is the custodied shares valued at the oracle, and its presence in
that line is not cosmetic. Before it existed, the Desk's solvency check counted
only on-chain USDG, so shares bought with a buyer's money were an asset that
appeared nowhere: converting cash into real backing drove equity down by exactly
the amount that had been backed. The act of making the product true was what
made the vault look insolvent.

Both sides are marked at the oracle, never at the price the Desk transacted at.
The spread lives in that gap: a buy takes the full USDG and mints fewer tokens
than the mark would give, a sell retires the full position and pays less than
the mark. Neither is booked as a fee, because it is not one. It is retained,
`totalShares` does not move, and NAV per LP share rises.

### What an LP actually keeps

Per dollar of notional, either direction, to first order:

```
LP equity change = spread + impact - protocolFee - stakerFee - launcherFee
```

At live settings, in hours: `30 - 0 - 10 - 10 = +10 bps` of a 30 bps spread.
After hours: `150 - 20 = +130 bps`.

Worth stating flatly, because the parameter table misleads on it: **of the three
things that widen the price, only the txFee is paid out. Of the four things paid
out, only the txFee is funded by a widening.** The protocol, staker and launcher
fees come straight out of the retained spread. Their ceilings sum to 90 bps
against a 30 bps in-hours spread and nothing cross-checks them, so that is a
parameter discipline rather than a guarantee.

## 8. Price, and the 24/7 mark

Every market in Float prices off one reference, and everything else bends
around it. This is where it comes from, who supplies it, and what happens when
they stop.

### 8.1 The hub

`contracts/src/OracleHubMedian.sol`. Posters submit a price, a timestamp and a
`marketOpen` flag per asset. `getQuote` takes the **median of the submissions
that are still fresh**, where fresh means within `posterFreshWindow`, 30 minutes
today, and up to `MAX_POSTERS` of 15 may be registered.

Two details of the median matter more than the median itself.

**The timestamp travels with its price.** The sort is by price and the
timestamp moves with the entry it belongs to, so the age you read is the age of
the median submission, not the newest one. With two posters that is the older of
the two, which means **the quote is only as fresh as the slowest poster**. This
is not theoretical: one poster was installed with a heartbeat six times longer
than intended, and although the other was posting exactly on schedule the whole
board read about 28 minutes stale and was minutes from falling out of its
freshness window. Both services reported healthy and both logs looked fine. The
lesson is in the runbook: check the age `getQuote` returns, not whether the
process is running.

**Losing quorum does not fail loudly, it fails closed.** Below `minPosters`,
`getQuote` hands back the last known price with its age forced to `DEGRADED_AGE`
and `marketOpen` false, so the Desk's own staleness check flips the market to
settle-only. Exits keep working and nothing new opens. An asset that has never
been posted at all reverts `NeverPosted` rather than returning a zero anyone
could mistake for a price.

`minPosters` is 1 today, deliberately. With exactly two posters a quorum of two
means either machine going down puts every market into settle-only, so it is
raised at three posters, not before.

### 8.2 Where the price comes from

Two independent posters, on separate hosts, reading **different vendors**, so
one vendor being wrong or unreachable does not move the mark on its own.

| poster | vendor | address |
|---|---|---|
| val1 | **EODHD**, paid, All World Extended | `0xE7BaDD2e...41eE6` |
| val2 | **Yahoo** | `0x4c40771B...29D05` |

Five assets today: NINTENDO, TENCENT, LVMH, NESTLE, SAMSUNG.

The vendor split is **forced rather than chosen**, and it is worth knowing why,
because it constrains where a third poster can live. EODHD is unreachable over
IPv6, and val2 is IPv6 only, so val2 can never be the EODHD poster. GitHub is
IPv4 only from there as well, which is why tooling has to be copied onto that
box rather than installed.

**Japan does not price directly.** EODHD does not carry Tokyo on the All World
Extended plan. It carries the US lines of the same companies, so a Japanese name
is priced through its ADR and converted back:

```
Nintendo mark  =  NTDOY price  /  0.25 ordinary shares per receipt
```

The ratio there is the same `sharesPerUnit` the reserve uses, and it is verified
from live prices for the same reason. So the ADR ratio appears twice in this
system, once in custody and once in pricing, and an error in it would move both
the backing and the mark in the same direction, which is precisely why it is
checked continuously rather than read from a fact sheet. A Nikkei futures line
sits behind that as a further fallback.

### 8.3 The deadband

A poster that writes every asset on every tick spends a straight product of
assets times cadence. At a 36 name genesis set on a five minute tick that is
roughly $15,000 a month of gas to re-post numbers that did not change.

So a post happens when either is true:

- the price differs from the **last posted price** by `MIN_MOVE_BPS`, 10 today;
- the last post is older than `HEARTBEAT_MS`, which must stay comfortably under
  the smallest `maxStaleness` in use, 3600s today, rather than equal to it.

The first post of an asset always goes through. The record of what was posted is
written **only after** the post returns without throwing: writing it earlier
would mark a failed post as done and suppress its own retry until the next
heartbeat, which is the one failure a deadband can introduce that posting
everything cannot.

### 8.4 The premium, and the 24/7 mark

On top of the reference the Desk carries a **premium** of its own, and that is
what moves the price when the home exchange is shut:

- a buy pushes it up, a sell pushes it down, scaled by trade size over the cap;
- it is clamped to a band, zero in hours and plus or minus 300 bps at night, so
  the token cannot drift away from the company;
- it decays at 100 bps per hour back toward the reference.

So at 2am the price is the last print plus whatever the night's flow has pushed
it to, bounded and decaying. At the home open the band closes to zero and the
reference takes over, which is the snap-to-print the essay describes. That is
the honest version of round-the-clock price discovery for an instrument whose
underlying is not trading: flow moves it, and the movement is bounded by how
wrong the market is willing to let it be.

## 9. The launch: a meme funds a stock

`CurveFunder.sol`, `Graduator.sol`, `RangeSeeder.sol`.

Listing a company needs capital before anyone can trade it, and nobody funds a
market that does not exist yet. So Float lets a meme token do the fundraising.
Somebody launches a meme on a bonding curve, buyers buy it because it is a meme,
and every dollar of that raise splits between the stock's dealer cushion and the
stock's share reserve. The meme is the customer acquisition. The stock is what
gets built.

This is the mechanism the essay describes as the launchpad, and it is the piece
that changed most in 2.0.

### The curve

Constant product against a virtual quote reserve, priced in USDG:

```
sold(x) = V_T * x / (v*R + x)
P(x)    = P0 * (1 + x/(v*R))^2
```

`v = virtualBps/10000`, `R` is the raise to graduation, `V_T` is 1.073 billion
tokens against a 1 billion supply, `x` is cumulative net USDG in the curve. The
1% curve fee is taken outside the curve on both sides, so `k` is exactly
invariant and the price path does not depend on the fee existing.

The shape is one number:

| | formula | at `virtualBps` 4000 |
|---|---|---|
| FDV at open | `R * v / 1.073` | 0.3728 * R |
| FDV at graduation | `R * (1+v)^2 / (1.073 * v)` | 4.5666 * R |
| open to graduation | `((1+v)/v)^2` | **12.25x** |
| supply sold on the curve | `1.073/(1+v)` | 76.64% |
| supply into the pool | `1 - 1.073/(1+v)` | **23.36%** |

`virtualBps` is 4000, matched to PONS's 1.68 ETH phantom against a 4.2 ETH
graduation. Not deference: the ratio is the only thing that sets the multiple,
and 12.25x with 23.4% of supply into the pool is a shape that has worked at
scale.

**The raise is the dial, the multiple is not.** `V_T` is a constant while the
virtual reserve scales with the raise, so the raise sets the price level
linearly and `v` alone sets the shape. To open at $2k and graduate near $25k the
raise has to be about $5,365. Steepening the curve to fake a higher headline
number is how our first launches put 2.45% of supply in the pool and 97.5% in
one wallet, which was measured rather than theorised.

The 7.3% overhang in `V_T` is load-bearing: the LP share is `1 - 1.073/(1+v)`,
which hits zero at `v = 0.073`. Below roughly 730 bps the curve sells past the
supply and there is no pool at the end. That is why `setParams` floors
`virtualBps` at 1000.

### The split, which replaced the milestones

Every dollar into the curve divides between the stock's dealer cushion and its
share reserve, on a ramp that decays as the cushion fills:

```
splitBps = vaultShareBps * (pairTarget - tvl) / pairTarget
```

Early dollars are almost all cushion, because a market with no cushion cannot
open. Later dollars are almost all reserve, because a market with a cushion
needs shares. This is what replaced the $5,000 milestone: **the market does not
wait, it opens on the first dollar and thickens continuously.**

In closed form, with `sigma = vaultShareBps/1e4` and `T = pairTarget`:

```
backing(n) = T * (1 - e^(-sigma*n/T))
```

That is the continuum limit. The contract evaluates the split once per buy at
the pre-buy TVL, so a single lump gets the whole raise at the opening rate while
many small buys converge on the exponential. At live parameters that is 50.0%
against 39.35% of the raise landing as cushion. Not a rounding artefact, and
worth sizing for.

### Graduation

At the target the curve stops and the Graduator opens **two** Uniswap v4 pools:

```
USDG  <->  fSHARE  <->  MEME
```

The meme is quoted in the stock's fSHARE, not in USDG. That is the point of the
whole arrangement: the meme's price is denominated in a claim on a real company,
so every buyer of the token has to buy the stock first, and the explorer shows
the pair that way. Underneath it the fSHARE/USDG pool makes the route priceable
in dollars.

Two things had to be fixed before this worked with real money, both silent
failures:

**The graduation burn.** Leftover one-sided inventory used to be swapped and
burned. One launch burned 124,960,115 tokens, 12.5% of supply, at graduation.
The fix places the leftover as a one-sided tail above or below spot. The next
launch on the fixed code burned **zero** and put 233,396,345 tokens into its
pool, 23.3% of supply against the 23.36% the curve predicts.

**The quote pool was the bottleneck.** A $25 buy arrived as about $12. The meme
pool was fine; the fSHARE/USDG pool under it had been opened full range. That
pool is a pegged pair, because the Desk mints and redeems at the oracle, so
spreading capital from zero to infinity spends nearly all of it on prices that
can never print. `RangeSeeder` puts the same money one tick spacing either side
of the peg, the way a stablecoin pool is built:

| | before | after |
|---|---|---|
| active liquidity | 3.48e12 | 3.61e14 (103.5x) |
| $25 buy impact | 86% | 1.98% |
| price against a $50.00 mark | $243 | $49.66 |

A real $5 buy through the fixed pool filled at $50.8408 against a $50.00 mark:
1.00% pool fee plus 0.68% impact.

### Pairing, which replaced the second milestone

The essay's $10,000 milestone flipped the fSHARE to a spot token. In 2.0 the
market **pairs** instead: when custody covers supply with headroom,
`VaultFunder.pair` switches the cash term off and the market runs on shares
alone. `pair` requires `sharesHeld >= outstanding * (1 + minHeadroomBps)` before
it will do that, because pairing deletes the cash term and pairing at exact
parity would leave a ceiling of zero and a market that could only sell.

The milestone was a guess at when a market stops needing cash. Pairing measures
it.

## 10. Liquidity as a market

A market's capacity to issue is `oiCap = backing * capMultiplierBps / 10000`.
Historically only the protocol could add to that backing, which made liquidity
something Float provided rather than something anyone could take a position in.
In 2.0 it is a market with two sides.

| side | position | earns | bears |
|---|---|---|---|
| **long** | stake fSHARE (`StakeVaults`) | that market's fee slice | the stock falling |
| **short** | deposit USDG as backing (`BackingVault`) | that market's fee slice, plus Desk NAV | the stock rallying |

The Desk pays one per-market slice, `stakerFeeBps` of notional, and
`cashSplitBps` divides it. Both live: 10 bps split 50/50, so each side earns
5 bps of that market's Desk volume.

The two sides do different things, which is the reason to have both. **Staking
expands the effective cap**, so it buys the market headroom. **Backing moves the
stored cap**, and since impact divides by the stored cap, backing makes the
market cheaper to trade. Doubling the stored cap quarters the impact at a given
position. Measured on mainnet with real money:

```
                    oiCap      $5 buy     $20 buy
before            $ 55.04       2.46%       2.70%
after backing $50 $155.04       0.92%       1.06%
after unfunding   $ 55.04       2.46%          -
```

$50.00 in, $50.00 back out, cap and impact both returned exactly.

**The exit gate.** A backer cannot pull capital holding up live open interest.
`requestUnfund` computes the cap the withdrawal would leave and refuses if it
falls below the notional of the market's current book.

**The honest limitation.** A backer's principal becomes ordinary Desk LP shares
priced off global equity, so they are **pari passu with the global LP, not
senior to it**, and their directional exposure is pooled rather than isolated to
the market they backed. Real subordination needs per-market loss attribution,
which needs Desk state, which needs a fresh Desk. `UAsset.minter` is immutable
and bound at listing, so a new Desk could not mint or burn any existing fSHARE
and would orphan every live market and pool. The gate plus the delay gives the
practical effect. It is a lock-in, not a waterfall.

**One formula for the cap.** Two contracts write it. They used to disagree:
`BackingVault` moved it by a delta while `VaultFunder._syncCap` recomputed from
protocol backing alone, and `_syncCap` runs on every curve buy, so a backer's
contribution was erased the next time anyone traded. A test proved a $150,000
cap falling to $101,000 after one $5 buy. Both now use one expression,
`vaultBacking + launchBacking + BackingVault.totalCash`, with the launch-line
half stored explicitly so a recompute reproduces the opening value exactly.

## 11. Fees

Every fee in the system, in one place. Rates are the deployed values.

| fee | parameter | rate | paid by | goes to |
|---|---|---|---|---|
| curve trade | `feeBps` | 1.00% each way | curve buyer | 50% the meme's creator, 50% protocol |
| launch and listing | flat | per launch | the launcher | protocol |
| Desk spread, in hours | `baseSpreadBps` | 0.30% | Desk trader | retained by the vault |
| Desk spread, out of hours | `ahSpreadBps` | 1.50% | Desk trader | retained by the vault |
| Desk size impact | `maxImpactBps` | 0 to 2.00%, quadratic to the cap | Desk trader | retained by the vault |
| Desk transaction fee | `txFeeBps` | 0.40% | Desk trader | paid away, to holders and the launch queue |
| protocol slice | `protocolFeeBps` | 0.00% | the Desk LP | protocol |
| staker slice | `stakerFeeBps` | 0.10% | the Desk LP | cap market stakers |
| launcher slice | `launcherFeeBps` | 0.10% | the Desk LP | the market's launcher |
| pool swap | pool fee | 1.00% per hop | pool swapper | that pool's LPs |

Three things the grid does not say on its own.

**A Desk trade costs the sum of its row group, not one row.** In hours and at
negligible size that is 0.30% plus 0.40%, so 0.70%. Out of hours at the cap it
is 1.50% plus 2.00% plus 0.40%, so 3.90%. Impact is the only part that depends
on the trade.

**A route through the pools pays twice.** USDG to MEME crosses the quote hop and
the meme hop, so a 1.00% pool fee is 2.00% on the round trip in, and the same
again coming out.

**The three slices are subtractions, not widenings.** `protocolFeeBps`,
`stakerFeeBps` and `launcherFeeBps` total 0.20% and come out of what the vault
retained. Nothing in the quote is widened to fund them, so they are paid by the
Desk LP rather than by the trader.

Grouped by who actually pays.

**A curve buyer, on the launch venue.** `feeBps` 1% of every curve buy and sell,
split 50/50 between the meme's creator and the protocol. Flat launch and listing
fees.

**A Desk trader, as a wider price.** `baseSpreadBps` 30 in hours, `ahSpreadBps`
150 outside them, `maxImpactBps` up to 200 at the cap, `txFeeBps` 40. The first
three are retained by the vault. The last is paid away.

**The Desk LP, out of the retained spread.** `protocolFeeBps` 0, `stakerFeeBps`
10, `launcherFeeBps` 10. These are subtractions from LP equity that no widening
funds.

**A pool swapper.** 1.00% per hop, and the USDG to MEME route crosses two pools,
so it is paid twice. The graduated meme pool's position belongs to the Graduator
with no removal path, so those fees accrue to a position nobody can collect,
which is deliberate for a pool that should never be pulled.

The 0.4% `txFeeBps` is the fee the essay describes as funding holders and the
next market in the queue. The routing is designed and the sinks are registry
addresses, so it is one deployment away. Today those sinks resolve to the
deployer key and the `FeeRouter` that would push the protocol's share into the
launch queue is written and not deployed. The flywheel is built and not turning.

## 12. Risk

### Coverage

With `m = capMultiplierBps/1e4`, at the cap:

```
coverage = 1 + 1/m
```

At the live 2x dial that is **1.5x**: for every dollar of claim outstanding at
the limit there are fifty cents of cushion behind it. At 1x it is 2.0x. The
reserve-gated path is tighter, because the cash term clamps at the cushion
before applying the ratio, forcing an effective 1x regardless of the dial.

All of that is arithmetic about a **cash-backed** market. A share-backed market
does not need a cushion at all, because the thing behind the claim is the claim.
That is the single change that lifts the depth ceiling, and it is why every
number in this section is a statement about today rather than about the design.

### The gap

The Desk's exposure is a stock that can move while nobody is trading. The
cushion that absorbs it accrues from spread. Setting them equal:

```
turnover needed / open position = gap / spread
```

A 10% gap against the 10 bps an LP actually retains in hours is **100x
turnover**. Against the 130 bps retained after hours it is 7.7x. The
gross-spread version gives 33x and is the wrong number to plan with, because
20 bps of the 30 is carved out before an LP sees it.

The structural point survives either number: **the buffer scales with volume and
the exposure scales with position.** A token people buy and hold is the
dangerous shape, and it is exactly the shape a successful meme launch produces.
Section 10 is how the buffer gets funded by someone other than the protocol.
Section 5 is how it stops being needed.

Measured on mainnet: a market was moved from $50.00 to $55.00 and Desk equity
fell from $30.82 to $26.14. The loss was $4.6775, exactly `0.9355 shares *
$5.00`. The book behaved precisely as the arithmetic says.

### The breaker, and the universal failure state

`Breaker.sol`, deployed and exercised. `ownerTrip` moves a market from Live to
SettleOnly and `ownerRestore` puts it back, with no external reference needed.
Both were run on a live market.

Every failure state in Float is settle-only rather than halted: a stale oracle, a
thin poster set, a lost cushion, a tripped breaker, a reserve shortfall. In all
of them holders can leave and nobody can enter. That is the design rule, and it
is the one worth remembering because it is the one a holder cares about.

### Isolation, and what is not isolated

Per-market isolation was attempted and reverted, deliberately. **Isolated:** each
market's backing, cap, reserve, fee accruals and gate. **Not isolated:** the USDG
balance and therefore directional P&L, which is pooled across markets through
Desk equity. Booking gross spread per market while directional P&L stays pooled
would let a backer harvest the good leg and leave the bad one with the LP, which
is worse than the pooling it replaces. The fix is a fresh Desk, and a fresh Desk
orphans every live fSHARE.

---

# Part IV: The state of it

## 13. What is deployed

Robinhood Chain 4663. One key owns all of it, which is acceptable for a run of
this size and must not survive past it.

| | |
|---|---|
| Registry | `0x7134d98596490838FC16e8CA16bC2FDd57aD3202` |
| OracleHub (median) | `0x11BeB700b526b0487382071A7910dF81a4cE658c` |
| Desk | `0x09E2643442ce37cBf3Fea57309657e42F82439C9` |
| Listings | `0xC960De8888EaC33Bc4a2Cc2eB0A2DD839cd6Fb42` |
| ReserveBook | `0x3A4c63B17292d352879dF8AF662432E8Ed767951` |
| VaultFunder | `0x462366a80bA1d254d65dD628983E18ad18E29BC3` |
| BackingVault | `0xB95fDb72D7ea79f4528e2C43B3DfD20F115b27CA` |
| StakeVaults | `0xC1049B6e0b4274e246E3AbB0619Fb08D0332d174` |
| Breaker | `0x17a17f81d3FB38386d827DB5052CEF72a3022536` |
| CurveFunder | `0xf7Dee182D0D559597F1F1DEF587466cCA24eADB6` |
| Graduator | `0x8E31761F676E90821C713AAAD4CF9C2D6AfFEAC3` |
| RangeSeeder | `0xDA87e3EBD03Ba51748bF5056A5cc204078083087` |
| TokenLaunchpad | `0xd8DaB083bA537e3DcDF9ebfC8E2e281f57584EB4` |
| TokenMetadata | `0xC81cBf3C2944e194E40df4D1a3A5A8430760CED2` |

External: USDG `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`, v4 PoolManager
`0x8366a39CC670B4001A1121B8F6A443A643e40951`.
Owner and deployer: `0x4C9fE79EcA3B34b95944449EF126fAd3fe5a9061`.

Four launches have run end to end, each a meme quoted in the fSHARE it settles
in, with eight Uniswap v4 pools carrying real two-sided liquidity. The most
recent graduated with zero burn and 23.3% of supply into its pool.

### Live parameters

| | |
|---|---|
| curve | `virtualBps` 4000, `feeBps` 100, `creatorShareBps` 5000, `vaultShareBps` 5000 |
| graduation | `gradMultiplierBps` 6000, pool fee 1.00%, spacing 200, `tailSteps` 20 |
| Desk | spread 30 / 150 bps, impact 200 bps at cap, `txFeeBps` 40 |
| Desk payouts | protocol 0, staker 10, launcher 10 bps |
| premium | band 300 bps at night, push 200 bps at cap, decay 100 bps/hour |
| funding | `pairTarget` $55, `defaultCapMultiplierBps` 20000, `minHeadroomBps` 1000 |
| cap market | `boostBps` 5000, `cashSplitBps` 5000, `unstakeDelay` 3 days |
| reserve | `defaultCashBackedBps` 10000, `inFlightTtl` 3 days |

285 unit and integration tests, plus fork tests against live chain state.

## 14. What is not true yet

No softening. This is the list.

1. **No real share has been bought.** `sharesHeld` is zero on every market,
   `reserveValue` is $0, and no market is currently gated. Section 5 describes a
   built mechanism with nothing in it. This is the one item that changes what
   Float is; everything else here is smaller.
2. **One key owns all of it**, the breaker included, and it is also the sole
   oracle poster and the ReserveBook custodian. Fine for a run of this size,
   unacceptable past it. The oracle half of this is now one step less bad: the
   median hub is deployed and live, so a second and third poster can be added
   without touching any other contract. Until they are, `posterCount` is 1 and
   a median over one poster is that poster.
3. **Nobody outside has taken either side of the cap market.** The mechanism
   works and has been exercised end to end with real money, by the deployer.
4. **Backers are pari passu with the global LP**, and their directional exposure
   is pooled rather than isolated to the market they backed.
5. **The deployed BackingVault predates the single-formula cap fix** in section
   10. Latent right now, because `totalCash` is zero everywhere and every market
   is in settle-only, but it needs a coordinated redeploy of BackingVault and
   VaultFunder together, and the VaultFunder redeploy needs state migration.
   Third-party backing must not open until that lands.
6. **Dividends are not passed through to holders.** Where the underlying pays,
   the economics accrue to the reserve. A real gap, not a design choice.
7. **The FeeRouter is not deployed**, so the 0.4% flywheel resolves to a key
   rather than to holders and the launch queue.
8. **Withdrawal delays are zero** on both the Desk and the BackingVault. The
   only live exit friction is the cap gate and the 3-day unstake delay.
9. **Quote-pool depth is a band, not a hook.** Roughly plus or minus 2%, and a
   larger trade walks out of it. DeskHook is the permanent answer and is on
   another branch.
10. **`_impactBps` has no zero guard.** A zero cap is a division panic rather
    than a named revert. Four separate writers each floor the cap
    independently, so nothing reaches it today, but the invariant is defended
    at four call sites instead of once at the reader.
11. **A launch-line contributor can claim their Desk shares and withdraw them
    without the cap falling.** Their capital counts toward `launchBacking` and
    is not decremented on claim. Same family as the POL ratchet that was fixed.
12. **`DESIGN.md`, `FLOW.md` and `CONTRACTS.md` are stale** on the split ratio,
    the pair target, the cap multiplier and the gap arithmetic. This document is
    the current one.

---

## Reading order for the code

| you want | read |
|---|---|
| the backing, which is the product | `contracts/src/ReserveBook.sol`, then `services/keepers/reserve-keeper.mjs` |
| the dealer | `contracts/src/Desk.sol` |
| what a listing is | `contracts/src/Listings.sol`, `UAsset.sol` |
| price and failure | `contracts/src/OracleHubMedian.sol`, `Breaker.sol` |
| the launch | `contracts/src/CurveFunder.sol`, `Graduator.sol`, `RangeSeeder.sol` |
| funding and the cap market | `contracts/src/VaultFunder.sol`, `BackingVault.sol`, `StakeVaults.sol` |
| everything wired together | `contracts/script/DeployCurve.s.sol` |
