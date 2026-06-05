// Light "life moments" — frequent, low-stakes, SG-flavoured micro-decisions that
// fill the quiet months between big scenario events so most turns pose a choice.
// Effects are small and only touch soft stats (cash / stress), never the
// financial RULES (CPF, loans, duties stay engine-owned).
import type { Player } from '@/game/types';

export interface MomentChoice {
  label: string;
  cashDelta: number;
  stressDelta?: number;
  note: string;
}

export interface Moment {
  id: string;
  emoji: string;
  title: string;
  text: string;
  choices: MomentChoice[];
}

const MOMENTS: Moment[] = [
  { id: 'angbao', emoji: '🧧', title: 'Angbao season', text: "It's Chinese New Year and the relatives are sizing up how well you're “doing”.", choices: [
    { label: 'Give generously', cashDelta: -700, stressDelta: -3, note: 'Fat angbao all round — reputation intact, wallet lighter.' },
    { label: 'Keep it sensible', cashDelta: -200, note: 'You kept the angbao modest. Auntie raised an eyebrow.' },
  ] },
  { id: 'aircon', emoji: '❄️', title: 'Aircon dripping', text: 'Your bedroom aircon is leaking. Servicing now is cheap; ignoring it could cost more later.', choices: [
    { label: 'Service it ($180)', cashDelta: -180, note: 'Serviced — cool and trouble-free.' },
    { label: 'Tahan first', cashDelta: 0, stressDelta: 3, note: 'You toughed it out. Fingers crossed it holds.' },
  ] },
  { id: 'bonus', emoji: '💵', title: 'Surprise bonus', text: 'Your company had a good quarter and slipped you a small bonus.', choices: [
    { label: 'Bank it', cashDelta: 1500, note: 'Straight into savings — disciplined.' },
    { label: 'Treat yourself a bit', cashDelta: 900, stressDelta: -4, note: 'A nice dinner, then bank the rest. Worth it.' },
  ] },
  { id: 'sidegig', emoji: '🛵', title: 'Weekend side-gig', text: 'A friend needs help moonlighting this weekend. Easy cash, but you lose your rest.', choices: [
    { label: 'Take the gig', cashDelta: 600, stressDelta: 5, note: 'Extra cash earned — but you’re shagged.' },
    { label: 'Rest instead', cashDelta: 0, stressDelta: -5, note: 'You recharged. Monday-you says thanks.' },
  ] },
  { id: 'gstvoucher', emoji: '🪙', title: 'GST voucher', text: 'A government support payout just landed in your account.', choices: [
    { label: 'Nice — save it', cashDelta: 500, note: 'Every little bit helps the war chest.' },
  ] },
  { id: 'wedding', emoji: '💒', title: 'Wedding invite', text: "Your JC friend is getting married at a hotel ballroom. The angbao “market rate” is no joke.", choices: [
    { label: 'Pay the going rate', cashDelta: -350, stressDelta: -2, note: 'You covered your seat and then some. Friendship preserved.' },
    { label: 'Give what you can', cashDelta: -150, note: 'A heartfelt-but-lean angbao. They’ll understand.' },
  ] },
  { id: 'kopitip', emoji: '☕', title: 'Kopi-shop tip', text: 'An old uncle at the kopitiam swears a certain estate is about to “chiong”. Worth a look?', choices: [
    { label: 'Note it down', cashDelta: 0, stressDelta: -1, note: 'You filed the “hot tip” away with a pinch of salt.' },
    { label: 'Buy him kopi', cashDelta: -20, stressDelta: -2, note: 'A $1.40 kopi for some neighbourhood gossip. Cheap entertainment.' },
  ] },
  { id: 'phonebreak', emoji: '📱', title: 'Cracked phone', text: 'You dropped your phone and the screen shattered.', choices: [
    { label: 'Repair it ($200)', cashDelta: -200, note: 'Good as new.' },
    { label: 'Live with the crack', cashDelta: 0, stressDelta: 2, note: 'You’re reading through a spiderweb. Classy.' },
  ] },
  { id: 'parents', emoji: '👵', title: 'Family ask', text: 'Your parents mention the fridge is dying. They didn’t ask outright… but.', choices: [
    { label: 'Buy them one', cashDelta: -900, stressDelta: -5, note: 'A new fridge for home. Filial points maxed.' },
    { label: 'Split the cost', cashDelta: -450, note: 'You chipped in half. Fair and warm.' },
  ] },
  { id: 'staycation', emoji: '🏝️', title: 'Burnt out', text: 'You’re running on fumes. A cheap staycation could reset you.', choices: [
    { label: 'Book it ($300)', cashDelta: -300, stressDelta: -10, note: 'Two nights away — you came back human again.' },
    { label: 'Push through', cashDelta: 0, stressDelta: 4, note: 'You kept grinding. The tank’s low.' },
  ] },
  { id: 'grabsurge', emoji: '🚕', title: 'Late night, surge pricing', text: 'You’re out late and it’s pouring. Grab is surging hard.', choices: [
    { label: 'Just book it', cashDelta: -45, stressDelta: -2, note: 'Dry and home. Worth every cent.' },
    { label: 'Wait for the bus', cashDelta: 0, stressDelta: 2, note: 'You saved the fare, lost the hour.' },
  ] },
  { id: 'coursetip', emoji: '🎓', title: 'SkillsFuture nudge', text: 'A short course could sharpen your edge at work. Subsidised, but still your time.', choices: [
    { label: 'Sign up', cashDelta: -120, stressDelta: 3, note: 'Invested in yourself. Future-you approves.' },
    { label: 'Maybe later', cashDelta: 0, note: 'Filed under “someday”.' },
  ] },
  // Recurring cast — Wei Liang (your kiasu classmate) and the kopitiam uncle keep showing up.
  { id: 'weiliang-flex', emoji: '🤓', title: 'Wei Liang humble-brags', text: 'Wei Liang “casually” mentions his condo might go en-bloc. He wants you to be impressed.', choices: [
    { label: 'Congratulate him', cashDelta: 0, stressDelta: 1, note: 'You smiled and filed away which estate he meant. Intel is intel.' },
    { label: 'Change the subject', cashDelta: 0, stressDelta: -2, note: 'You steered the chat to football. Petty? Maybe. Satisfying? Yes.' },
  ] },
  { id: 'uncle-again', emoji: '☕', title: 'The uncle is back', text: 'Your kopitiam uncle has ANOTHER “confirm sure-win” estate tip. Same energy as last time.', choices: [
    { label: 'Buy him kopi, hear him out', cashDelta: -20, stressDelta: -2, note: 'Another $1.40 well spent on neighbourhood theatre.' },
    { label: 'Nod and finish your toast', cashDelta: 0, note: 'You let the “hot tip” cool with your kaya toast.' },
  ] },
  { id: 'weiliang-help', emoji: '🤝', title: "Wei Liang's favour", text: 'Wei Liang asks to borrow a little to cover a “temporary cashflow thing”. Classic.', choices: [
    { label: 'Lend him a bit', cashDelta: -400, stressDelta: 2, note: 'You spotted him $400. He swears he’ll pay back. He’s Wei Liang, so… maybe.' },
    { label: 'Politely decline', cashDelta: 0, stressDelta: 1, note: 'You kept your money and a clear conscience. Mostly.' },
  ] },
];

/**
 * A light moment for (almost) every quiet month — so most turns pose a quick
 * choice rather than an empty "Next Month" tap. `seed` (the run's RNG seed)
 * varies the sequence between playthroughs so run 2 differs from run 1.
 */
export function getMoment(player: Player, seed = 0): Moment | null {
  if (player.turnCount <= 1) return null;
  const idx = (player.turnCount * 7 + player.month * 3 + (player.name?.length ?? 0) + Math.abs(seed)) % MOMENTS.length;
  return MOMENTS[idx];
}
