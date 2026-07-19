const suits = [
  { name: "spades", symbol: "\u2660", color: "black" },
  { name: "hearts", symbol: "\u2665", color: "red" },
  { name: "clubs", symbol: "\u2663", color: "black" },
  { name: "diamonds", symbol: "\u2666", color: "red" }
];

const ranks = [
  { rank: "A", value: 11, countValue: "A" },
  { rank: "2", value: 2, countValue: "2" },
  { rank: "3", value: 3, countValue: "3" },
  { rank: "4", value: 4, countValue: "4" },
  { rank: "5", value: 5, countValue: "5" },
  { rank: "6", value: 6, countValue: "6" },
  { rank: "7", value: 7, countValue: "7" },
  { rank: "8", value: 8, countValue: "8" },
  { rank: "9", value: 9, countValue: "9" },
  { rank: "10", value: 10, countValue: "10" },
  { rank: "J", value: 10, countValue: "10" },
  { rank: "Q", value: 10, countValue: "10" },
  { rank: "K", value: 10, countValue: "10" }
];

const countKeys = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const rankByKey = new Map(ranks.map((rank) => [rank.countValue, rank]));

const elements = {
  bankroll: document.getElementById("bankroll"),
  betAmount: document.getElementById("bet-amount"),
  shoeCount: document.getElementById("shoe-count"),
  dealerCards: document.getElementById("dealer-cards"),
  playerCards: document.getElementById("player-cards"),
  dealerTotal: document.getElementById("dealer-total"),
  playerTotal: document.getElementById("player-total"),
  roundTitle: document.getElementById("round-title"),
  roundMessage: document.getElementById("round-message"),
  dealButton: document.getElementById("deal-button"),
  hitButton: document.getElementById("hit-button"),
  standButton: document.getElementById("stand-button"),
  doubleButton: document.getElementById("double-button"),
  probabilityFill: document.getElementById("probability-fill"),
  recommendedAction: document.getElementById("recommended-action"),
  standOdds: document.getElementById("stand-odds"),
  hitOdds: document.getElementById("hit-odds"),
  doubleOdds: document.getElementById("double-odds"),
  probabilityReason: document.getElementById("probability-reason")
};

const state = {
  bankroll: 500,
  bet: 25,
  wager: 25,
  shoe: [],
  playerHand: [],
  dealerHand: [],
  phase: "betting",
  dealerRevealed: false
};

function buildDeck() {
  return suits.flatMap((suit) =>
    ranks.map((rank) => ({
      ...rank,
      suit: suit.name,
      symbol: suit.symbol,
      color: suit.color,
      id: `${rank.rank}-${suit.name}`
    }))
  );
}

function shuffle(cards) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function ensureShoe() {
  if (state.shoe.length < 15) {
    state.shoe = shuffle(buildDeck());
  }
}

function drawCard() {
  ensureShoe();
  return state.shoe.pop();
}

function handValue(hand) {
  let total = hand.reduce((sum, card) => sum + card.value, 0);
  let aces = hand.filter((card) => card.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function isSoft(hand) {
  const rawTotal = hand.reduce((sum, card) => sum + card.value, 0);
  return hand.some((card) => card.rank === "A") && rawTotal <= 21;
}

function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

function isBust(hand) {
  return handValue(hand) > 21;
}

function createCard(card, hidden = false) {
  const node = document.createElement("div");
  node.className = hidden ? "playing-card hidden" : `playing-card ${card.color}`;
  node.setAttribute("aria-label", hidden ? "Hidden dealer card" : `${card.rank} of ${card.suit}`);

  if (hidden) {
    node.textContent = "\u2605";
    return node;
  }

  node.innerHTML = `
    <div class="rank-top"><span>${card.rank}</span><span>${card.symbol}</span></div>
    <div class="suit-center">${card.symbol}</div>
    <div class="rank-bottom"><span>${card.rank}</span><span>${card.symbol}</span></div>
  `;
  return node;
}

function renderHands() {
  elements.playerCards.replaceChildren(...state.playerHand.map((card) => createCard(card)));
  elements.dealerCards.replaceChildren(
    ...state.dealerHand.map((card, index) => createCard(card, index === 1 && !state.dealerRevealed))
  );

  elements.playerTotal.textContent = String(handValue(state.playerHand));
  elements.dealerTotal.textContent = state.dealerRevealed
    ? String(handValue(state.dealerHand))
    : state.dealerHand.length > 0
      ? String(handValue([state.dealerHand[0]]))
      : "?";
}

function setControls() {
  const playing = state.phase === "player";
  elements.dealButton.disabled = state.phase === "player" || state.phase === "dealer";
  elements.hitButton.disabled = !playing;
  elements.standButton.disabled = !playing;
  elements.doubleButton.disabled = !playing || state.playerHand.length !== 2 || state.bankroll < state.bet * 2;

  document.querySelectorAll(".chip").forEach((button) => {
    const chipBet = Number(button.dataset.bet);
    button.classList.toggle("is-selected", chipBet === state.bet);
    button.disabled = state.phase !== "betting" && state.phase !== "complete";
  });
}

function renderBankroll() {
  elements.bankroll.textContent = `$${state.bankroll}`;
  elements.betAmount.textContent = `$${state.phase === "betting" ? state.bet : state.wager}`;
  elements.shoeCount.textContent = `${state.shoe.length} cards`;
}

function render() {
  renderHands();
  renderBankroll();
  setControls();
  updateProbabilityPanel();
}

function setStatus(title, message) {
  elements.roundTitle.textContent = title;
  elements.roundMessage.textContent = message;
}

function startRound() {
  if (state.bet > state.bankroll) {
    setStatus("Lower your bet", "Your selected chip is larger than your bankroll.");
    return;
  }

  ensureShoe();
  state.phase = "player";
  state.dealerRevealed = false;
  state.wager = state.bet;
  state.playerHand = [drawCard(), drawCard()];
  state.dealerHand = [drawCard(), drawCard()];

  if (isBlackjack(state.playerHand) || isBlackjack(state.dealerHand)) {
    finishRound();
    return;
  }

  setStatus("Your move", "Choose hit, stand, or double based on the live odds.");
  render();
}

function hit() {
  if (state.phase !== "player") return;
  state.playerHand.push(drawCard());

  if (isBust(state.playerHand)) {
    finishRound();
    return;
  }

  setStatus("Your move", "The probability panel now includes the new card.");
  render();
}

function stand() {
  if (state.phase !== "player") return;
  state.phase = "dealer";
  state.dealerRevealed = true;
  dealerPlay();
  finishRound();
}

function doubleDown() {
  if (state.phase !== "player" || state.playerHand.length !== 2 || state.bankroll < state.bet * 2) return;
  state.wager = state.bet * 2;
  state.playerHand.push(drawCard());

  if (isBust(state.playerHand)) {
    finishRound();
    return;
  }

  state.phase = "dealer";
  state.dealerRevealed = true;
  dealerPlay();
  finishRound();
}

function dealerPlay() {
  while (handValue(state.dealerHand) < 17) {
    state.dealerHand.push(drawCard());
  }
}

function finishRound() {
  state.phase = "complete";
  state.dealerRevealed = true;

  const playerTotal = handValue(state.playerHand);
  const dealerTotal = handValue(state.dealerHand);
  const playerBlackjack = isBlackjack(state.playerHand);
  const dealerBlackjack = isBlackjack(state.dealerHand);
  let title = "";
  let message = "";
  let payout = 0;

  if (isBust(state.playerHand)) {
    title = "Player busts";
    message = `You went over 21 and lost $${state.wager}.`;
    payout = -state.wager;
  } else if (dealerBlackjack && playerBlackjack) {
    title = "Push";
    message = "Both hands have blackjack. Your bet is returned.";
  } else if (playerBlackjack) {
    title = "Blackjack";
    message = `Natural blackjack pays 3:2. You won $${Math.round(state.wager * 1.5)}.`;
    payout = Math.round(state.wager * 1.5);
  } else if (dealerBlackjack) {
    title = "Dealer blackjack";
    message = `Dealer has blackjack. You lost $${state.wager}.`;
    payout = -state.wager;
  } else if (isBust(state.dealerHand)) {
    title = "Dealer busts";
    message = `Dealer went over 21. You won $${state.wager}.`;
    payout = state.wager;
  } else if (playerTotal > dealerTotal) {
    title = "You win";
    message = `${playerTotal} beats dealer ${dealerTotal}. You won $${state.wager}.`;
    payout = state.wager;
  } else if (playerTotal < dealerTotal) {
    title = "Dealer wins";
    message = `Dealer ${dealerTotal} beats your ${playerTotal}. You lost $${state.wager}.`;
    payout = -state.wager;
  } else {
    title = "Push";
    message = `Both hands have ${playerTotal}. Your bet is returned.`;
  }

  state.bankroll += payout;
  if (state.bankroll <= 0) {
    state.bankroll = 500;
    message += " Bankroll reset to $500 for a fresh table session.";
  }

  if (state.bet > state.bankroll) {
    state.bet = Math.max(10, Math.min(25, state.bankroll));
  }

  setStatus(title, `${message} Deal again when ready.`);
  render();
}

function fullDeckCounts() {
  return {
    A: 4,
    2: 4,
    3: 4,
    4: 4,
    5: 4,
    6: 4,
    7: 4,
    8: 4,
    9: 4,
    10: 16
  };
}

function visibleCounts() {
  const counts = fullDeckCounts();
  const visibleCards = [...state.playerHand];

  if (state.dealerHand[0]) {
    visibleCards.push(state.dealerHand[0]);
  }

  if (state.dealerRevealed) {
    visibleCards.push(...state.dealerHand.slice(1));
  }

  visibleCards.forEach((card) => {
    counts[card.countValue] -= 1;
  });

  return counts;
}

function totalCount(counts) {
  return countKeys.reduce((sum, key) => sum + counts[key], 0);
}

function countsKey(counts) {
  return countKeys.map((key) => counts[key]).join(",");
}

function cardFromCountKey(key) {
  const rank = rankByKey.get(key);
  return {
    rank: rank.rank,
    value: rank.value,
    countValue: key,
    suit: "probability",
    symbol: "",
    color: "black",
    id: key
  };
}

function subtractCount(counts, key) {
  return { ...counts, [key]: counts[key] - 1 };
}

function probabilityHandValue(keys) {
  let total = 0;
  let aces = 0;

  keys.forEach((key) => {
    if (key === "A") {
      total += 11;
      aces += 1;
    } else {
      total += Number(key);
    }
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function probabilityIsSoft(keys) {
  const rawTotal = keys.reduce((sum, key) => sum + (key === "A" ? 11 : Number(key)), 0);
  return keys.includes("A") && rawTotal <= 21;
}

function dealerFinalDistribution(dealerKeys, counts, memo) {
  const total = probabilityHandValue(dealerKeys);
  const soft = probabilityIsSoft(dealerKeys);

  if (total > 21) return { bust: 1 };
  if (total >= 17) return { [String(total)]: 1 };

  const memoKey = `${dealerKeys.join("-")}|${countsKey(counts)}`;
  if (memo.has(memoKey)) return memo.get(memoKey);

  const remaining = totalCount(counts);
  const distribution = {};

  countKeys.forEach((key) => {
    if (counts[key] <= 0) return;
    const chance = counts[key] / remaining;
    const nextCounts = subtractCount(counts, key);
    const nextDistribution = dealerFinalDistribution([...dealerKeys, key], nextCounts, memo);

    Object.entries(nextDistribution).forEach(([outcome, value]) => {
      distribution[outcome] = (distribution[outcome] || 0) + chance * value;
    });
  });

  memo.set(memoKey, distribution);
  return distribution;
}

function dealerDistributionFromUpcard(upcardKey, counts) {
  const remaining = totalCount(counts);
  const distribution = {};
  const memo = new Map();

  countKeys.forEach((holeKey) => {
    if (counts[holeKey] <= 0) return;
    const chance = counts[holeKey] / remaining;
    const nextCounts = subtractCount(counts, holeKey);
    const finalDistribution = dealerFinalDistribution([upcardKey, holeKey], nextCounts, memo);

    Object.entries(finalDistribution).forEach(([outcome, value]) => {
      distribution[outcome] = (distribution[outcome] || 0) + chance * value;
    });
  });

  return distribution;
}

const outcomeEV = (outcome) => outcome.win - outcome.loss;

// Full win/push/loss split for standing on a hand. EV (in bet units) is
// win - loss, since a push returns the wager. Double compares on EV because
// it stakes twice the bet for a single card, so raw win % can't rank it.
function standOutcome(playerKeys, counts, dealerUpcardKey) {
  const playerTotal = probabilityHandValue(playerKeys);
  if (playerTotal > 21) return { win: 0, push: 0, loss: 1 };

  const dealerDistribution = dealerDistributionFromUpcard(dealerUpcardKey, counts);
  return Object.entries(dealerDistribution).reduce(
    (outcome, [result, chance]) => {
      if (result === "bust" || playerTotal > Number(result)) {
        outcome.win += chance;
      } else if (playerTotal < Number(result)) {
        outcome.loss += chance;
      } else {
        outcome.push += chance;
      }
      return outcome;
    },
    { win: 0, push: 0, loss: 0 }
  );
}

// Take exactly one card, then stand (the double-down rule).
function doubleOutcome(playerKeys, counts, dealerUpcardKey) {
  const remaining = totalCount(counts);
  if (remaining === 0) return standOutcome(playerKeys, counts, dealerUpcardKey);

  return countKeys.reduce(
    (outcome, key) => {
      if (counts[key] <= 0) return outcome;
      const chance = counts[key] / remaining;
      const nextKeys = [...playerKeys, key];

      if (probabilityHandValue(nextKeys) > 21) {
        outcome.loss += chance;
        return outcome;
      }

      const next = standOutcome(nextKeys, subtractCount(counts, key), dealerUpcardKey);
      outcome.win += chance * next.win;
      outcome.push += chance * next.push;
      outcome.loss += chance * next.loss;
      return outcome;
    },
    { win: 0, push: 0, loss: 0 }
  );
}

// Best win/push/loss split from hitting, optimising hit-vs-stand at each
// future card by expected value. Returns the full split so the panel can
// show pushes rather than folding them into losses.
function bestHitOutcome(playerKeys, counts, dealerUpcardKey, memo) {
  if (probabilityHandValue(playerKeys) > 21) return { win: 0, push: 0, loss: 1 };

  const memoKey = `${playerKeys.join("-")}|${countsKey(counts)}|${dealerUpcardKey}`;
  if (memo.has(memoKey)) return memo.get(memoKey);

  const remaining = totalCount(counts);
  if (remaining === 0) return standOutcome(playerKeys, counts, dealerUpcardKey);

  const outcome = { win: 0, push: 0, loss: 0 };

  countKeys.forEach((key) => {
    if (counts[key] <= 0) return;
    const chance = counts[key] / remaining;
    const nextKeys = [...playerKeys, key];

    if (probabilityHandValue(nextKeys) > 21) {
      outcome.loss += chance;
      return;
    }

    const nextCounts = subtractCount(counts, key);
    const standAfterHit = standOutcome(nextKeys, nextCounts, dealerUpcardKey);
    const hitAgain = bestHitOutcome(nextKeys, nextCounts, dealerUpcardKey, memo);
    // Choose whichever branch has the higher EV, then carry its full split.
    const chosen = outcomeEV(hitAgain) > outcomeEV(standAfterHit) ? hitAgain : standAfterHit;
    outcome.win += chance * chosen.win;
    outcome.push += chance * chosen.push;
    outcome.loss += chance * chosen.loss;
  });

  memo.set(memoKey, outcome);
  return outcome;
}

function oddsForCurrentHand() {
  if (state.playerHand.length === 0 || !state.dealerHand[0] || state.dealerRevealed) return null;

  const counts = visibleCounts();
  const playerKeys = state.playerHand.map((card) => card.countValue);
  const dealerUpcardKey = state.dealerHand[0].countValue;
  const remaining = totalCount(counts);
  const bustCards = countKeys.reduce((sum, key) => {
    if (probabilityHandValue([...playerKeys, key]) > 21) {
      return sum + counts[key];
    }
    return sum;
  }, 0);

  // Every action carries a full win/push/loss split; EV (win - loss, in bet
  // units) ranks them so pushes stay neutral and the doubled stake is fair.
  const standResult = standOutcome(playerKeys, counts, dealerUpcardKey);
  const hitResult = bestHitOutcome(playerKeys, counts, dealerUpcardKey, new Map());
  const doubleAvailable = playerKeys.length === 2 && state.bankroll >= state.bet * 2;
  const doubleResult = doubleAvailable ? doubleOutcome(playerKeys, counts, dealerUpcardKey) : null;

  const options = [
    { action: "Stand", ev: outcomeEV(standResult) },
    { action: "Hit", ev: outcomeEV(hitResult) },
    { action: "Double", ev: doubleResult ? 2 * outcomeEV(doubleResult) : -Infinity }
  ];
  const recommendation = options.reduce((best, option) => (option.ev > best.ev ? option : best)).action;
  const resultByAction = { Stand: standResult, Hit: hitResult, Double: doubleResult };
  const recommendedWin = resultByAction[recommendation].win;

  return {
    standResult,
    hitResult,
    doubleResult,
    recommendedWin,
    doubleAvailable,
    remaining,
    bustChance: remaining > 0 ? bustCards / remaining : 0,
    playerTotal: handValue(state.playerHand),
    dealerUpcard: state.dealerHand[0].rank,
    recommendation
  };
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

// Win% as the headline, with a smaller push line only when a push is possible.
function outcomeMarkup(outcome) {
  const push = Math.round(outcome.push * 100);
  const win = `${Math.round(outcome.win * 100)}%`;
  return push > 0 ? `${win}<small>${push}% push</small>` : win;
}

function updateProbabilityPanel() {
  if (state.phase !== "player") {
    elements.probabilityFill.style.width = "0%";
    elements.recommendedAction.textContent = state.phase === "complete" ? "Round complete" : "Deal first";
    elements.standOdds.textContent = "--";
    elements.hitOdds.textContent = "--";
    elements.doubleOdds.textContent = "--";
    elements.probabilityReason.textContent = state.phase === "complete"
      ? "Start another round to see fresh odds from the visible cards."
      : "Odds update after the first cards are dealt.";
    return;
  }

  const odds = oddsForCurrentHand();
  if (!odds) return;

  elements.probabilityFill.style.width = `${Math.round(odds.recommendedWin * 100)}%`;
  elements.recommendedAction.textContent = `Best play: ${odds.recommendation}`;
  elements.standOdds.innerHTML = outcomeMarkup(odds.standResult);
  elements.hitOdds.innerHTML = outcomeMarkup(odds.hitResult);
  elements.doubleOdds.innerHTML = odds.doubleAvailable ? outcomeMarkup(odds.doubleResult) : "--";
  const doubleNote = odds.doubleAvailable
    ? ` Double is compared on expected value since it stakes twice the bet for one card.`
    : "";
  elements.probabilityReason.textContent =
    `${odds.recommendation} is favored because your ${odds.playerTotal} faces a dealer ${odds.dealerUpcard}. ` +
    `Percentages show win chance (pushes shown separately, since a tie returns your bet). ` +
    `The model removes visible cards, estimates dealer outcomes, and counts a hit bust risk of ${formatPercent(odds.bustChance)}.` +
    doubleNote;
}

document.querySelectorAll(".chip").forEach((button) => {
  button.addEventListener("click", () => {
    state.bet = Number(button.dataset.bet);
    render();
  });
});

elements.dealButton.addEventListener("click", startRound);
elements.hitButton.addEventListener("click", hit);
elements.standButton.addEventListener("click", stand);
elements.doubleButton.addEventListener("click", doubleDown);

state.shoe = shuffle(buildDeck());
render();
