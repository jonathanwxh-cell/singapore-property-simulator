export type ScenarioCategory = 'Market' | 'Personal' | 'Property' | 'Macro' | 'Rare';

export interface ScenarioOption {
  label: string;
  description: string;
  probability: number;
  cashImpact: number;
  propertyValueImpact: number;
  creditImpact: number;
  followUpText: string;
}

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  title: string;
  description: string;
  image: string;
  frequency: 'common' | 'uncommon' | 'rare' | 'very-rare';
  options: ScenarioOption[];
}

export const scenarios: Scenario[] = [
  // MARKET EVENTS
  {
    id: 'market-crash',
    category: 'Market',
    title: 'Property Market Crash!',
    description: 'Global economic uncertainty has triggered a sudden property market correction. Prices are falling across all districts. Panic selling is visible in the market.',
    image: '/scenario-market-crash.jpg',
    frequency: 'rare',
    options: [
      { label: 'Buy the Dip', description: 'Use your cash reserves to purchase undervalued properties', probability: 0.7, cashImpact: -200000, propertyValueImpact: 15, creditImpact: 0, followUpText: 'You acquired properties at bargain prices. When the market recovers, you will profit handsomely.' },
      { label: 'Hold and Wait', description: 'Do nothing and wait for the market to stabilize', probability: 0.9, cashImpact: 0, propertyValueImpact: -10, creditImpact: 0, followUpText: 'Your portfolio lost some value, but you preserved your cash for better opportunities.' },
      { label: 'Panic Sell', description: 'Sell your properties to cut losses', probability: 0.4, cashImpact: 50000, propertyValueImpact: -20, creditImpact: -30, followUpText: 'You sold at the bottom. The market often rewards those who stay calm during crashes.' },
    ],
  },
  {
    id: 'property-boom',
    category: 'Market',
    title: 'Property Boom!',
    description: 'A surge of foreign investment and low interest rates have ignited a property boom. Prices are rising rapidly across Singapore.',
    image: '/scenario-boom.jpg',
    frequency: 'rare',
    options: [
      { label: 'Ride the Wave', description: 'Hold your properties and watch values soar', probability: 0.85, cashImpact: 0, propertyValueImpact: 20, creditImpact: 10, followUpText: 'Your portfolio surged in value as the market reached new heights!' },
      { label: 'Take Profits', description: 'Sell some properties to lock in gains', probability: 0.75, cashImpact: 300000, propertyValueImpact: -5, creditImpact: 5, followUpText: 'You secured solid profits. Cash is king, and you now have ammunition for the next opportunity.' },
      { label: 'Leverage Up', description: 'Take loans to buy more properties at peak', probability: 0.4, cashImpact: -400000, propertyValueImpact: 10, creditImpact: -15, followUpText: 'A risky move at market peak. Let us hope the boom continues...' },
    ],
  },
  {
    id: 'interest-rate-hike',
    category: 'Market',
    title: 'Interest Rate Hike',
    description: 'The central bank has raised interest rates by 1% to combat inflation. Your mortgage payments will increase significantly.',
    image: '/market-trend-bg.jpg',
    frequency: 'common',
    options: [
      { label: 'Refinance', description: 'Seek better rates from other banks', probability: 0.7, cashImpact: -5000, propertyValueImpact: -2, creditImpact: 0, followUpText: 'You found a slightly better rate, but the pain is still there.' },
      { label: 'Pay Down Debt', description: 'Use savings to reduce loan principal', probability: 0.8, cashImpact: -50000, propertyValueImpact: 0, creditImpact: 10, followUpText: 'Your debt burden is lighter, and your credit score improved!' },
      { label: 'Do Nothing', description: 'Absorb the higher payments', probability: 0.9, cashImpact: -12000, propertyValueImpact: -3, creditImpact: -5, followUpText: 'Your cash flow took a hit. Higher rates are the enemy of leveraged investors.' },
    ],
  },
  {
    id: 'cooling-measures',
    category: 'Market',
    title: 'New Cooling Measures',
    description: 'The government has introduced new property cooling measures including higher ABSD and tighter LTV limits.',
    image: '/market-trend-bg.jpg',
    frequency: 'uncommon',
    options: [
      { label: 'Adapt Strategy', description: 'Focus on properties exempt from new measures', probability: 0.75, cashImpact: 0, propertyValueImpact: -3, creditImpact: 0, followUpText: 'Smart pivot. There are always opportunities even with new restrictions.' },
      { label: 'Wait It Out', description: 'Pause purchases and observe market reaction', probability: 0.85, cashImpact: 0, propertyValueImpact: -5, creditImpact: 0, followUpText: 'Markets typically stabilize after initial shock. Patience is a virtue.' },
      { label: 'Buy Before Enforcement', description: 'Rush to buy before measures take effect', probability: 0.5, cashImpact: -300000, propertyValueImpact: 8, creditImpact: 0, followUpText: 'You beat the deadline! The measures have already pushed resale prices higher.' },
    ],
  },
  {
    id: 'foreign-buyer-surge',
    category: 'Market',
    title: 'Foreign Buyer Surge',
    description: ' relaxed foreign ownership rules have attracted a wave of international buyers to Singapore property.',
    image: '/scenario-boom.jpg',
    frequency: 'uncommon',
    options: [
      { label: 'Sell to Foreigners', description: 'List your premium properties at higher prices', probability: 0.7, cashImpact: 200000, propertyValueImpact: 15, creditImpact: 0, followUpText: 'Foreign buyers paid a premium for your properties. Excellent timing!' },
      { label: 'Hold for More Gains', description: 'Prices may rise further with continued foreign demand', probability: 0.6, cashImpact: 0, propertyValueImpact: 10, creditImpact: 0, followUpText: 'The foreign influx continues to drive prices higher in prime districts.' },
      { label: 'Buy in Suburban Areas', description: 'Foreigners focus on CCR, OCR remains undervalued', probability: 0.75, cashImpact: -250000, propertyValueImpact: 8, creditImpact: 0, followUpText: 'Smart contrarian play. The ripple effect is boosting suburban prices too.' },
    ],
  },
  {
    id: 'low-interest-rates',
    category: 'Market',
    title: 'Record Low Interest Rates',
    description: 'A dovish central bank has slashed rates to historic lows. Borrowing has never been cheaper.',
    image: '/scenario-boom.jpg',
    frequency: 'uncommon',
    options: [
      { label: 'Refinance Everything', description: 'Lock in the lowest possible mortgage rates', probability: 0.9, cashImpact: 8000, propertyValueImpact: 0, creditImpact: 5, followUpText: 'Your monthly payments dropped significantly. Cash flow positive!' },
      { label: 'Leverage and Expand', description: 'Take advantage of cheap money to grow portfolio', probability: 0.65, cashImpact: -500000, propertyValueImpact: 12, creditImpact: -10, followUpText: 'You expanded aggressively. Low rates make property investment very attractive.' },
      { label: 'Pay Down Loans', description: 'Use savings to reduce principal while rates are low', probability: 0.8, cashImpact: -80000, propertyValueImpact: 0, creditImpact: 15, followUpText: 'Your debt is shrinking fast. Financial freedom is within reach!' },
    ],
  },
  // PERSONAL EVENTS
  {
    id: 'job-promotion',
    category: 'Personal',
    title: 'Job Promotion!',
    description: 'Your hard work has paid off! You have been promoted to a senior position with a significant pay raise.',
    image: '/scenario-personal.jpg',
    frequency: 'common',
    options: [
      { label: 'Invest the Raise', description: 'Put the extra income into property investment', probability: 0.85, cashImpact: 100000, propertyValueImpact: 0, creditImpact: 10, followUpText: 'Your increased income improves your borrowing power significantly!' },
      { label: 'Upgrade Lifestyle', description: 'Enjoy the fruits of your labor', probability: 0.9, cashImpact: -30000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'You deserved it. But remember, lifestyle inflation is the enemy of wealth building.' },
      { label: 'Save Conservatively', description: 'Build a larger emergency fund', probability: 0.95, cashImpact: 60000, propertyValueImpact: 0, creditImpact: 5, followUpText: 'A solid financial cushion gives you peace of mind for riskier investments.' },
    ],
  },
  {
    id: 'retrenchment',
    category: 'Personal',
    title: 'Retrenchment',
    description: 'Economic restructuring has led to your company downsizing. You have been retrenched with a modest severance package.',
    image: '/scenario-market-crash.jpg',
    frequency: 'uncommon',
    options: [
      { label: 'Use Savings', description: 'Tap into your emergency fund while job hunting', probability: 0.7, cashImpact: -40000, propertyValueImpact: 0, creditImpact: -20, followUpText: 'Tough times, but your savings cushion the blow. You found a new job in 3 months.' },
      { label: 'Rent Out Rooms', description: 'Generate rental income from spare rooms', probability: 0.8, cashImpact: 18000, propertyValueImpact: 0, creditImpact: -5, followUpText: 'Rental income helped you stay afloat until you found new employment.' },
      { label: 'Sell a Property', description: 'Liquidate one property to raise cash', probability: 0.5, cashImpact: 200000, propertyValueImpact: -8, creditImpact: -25, followUpText: 'You survived the crisis but your portfolio took a hit. Sometimes you must do what it takes.' },
    ],
  },
  {
    id: 'marriage',
    category: 'Personal',
    title: 'Getting Married!',
    description: 'You have decided to tie the knot! This is a major life milestone that brings new financial considerations.',
    image: '/scenario-personal.jpg',
    frequency: 'uncommon',
    options: [
      { label: 'Buy Matrimonial Home', description: 'Purchase a home together using combined income', probability: 0.8, cashImpact: -100000, propertyValueImpact: 15, creditImpact: 10, followUpText: 'Combined income means stronger loan eligibility. Welcome to married life!' },
      { label: 'Host Wedding First', description: 'Save for a grand wedding celebration', probability: 0.9, cashImpact: -50000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'Beautiful wedding! Combined income going forward means stronger purchasing power.' },
      { label: 'Invest Before Marriage', description: 'Lock in investments before combining finances', probability: 0.7, cashImpact: -150000, propertyValueImpact: 10, creditImpact: 0, followUpText: 'Smart planning. You now have a stronger foundation as a married couple.' },
    ],
  },
  {
    id: 'inheritance',
    category: 'Personal',
    title: 'Unexpected Inheritance',
    description: 'A distant relative has passed away and left you a significant sum in their will.',
    image: '/scenario-boom.jpg',
    frequency: 'rare',
    options: [
      { label: 'Invest in Property', description: 'Put the windfall into real estate', probability: 0.85, cashImpact: 500000, propertyValueImpact: 20, creditImpact: 0, followUpText: 'A golden opportunity! You acquired a premium property with the inheritance.' },
      { label: 'Diversify Investments', description: 'Split between property, stocks, and bonds', probability: 0.8, cashImpact: 250000, propertyValueImpact: 5, creditImpact: 0, followUpText: 'A balanced approach. Half into property, half into other investments.' },
      { label: 'Clear All Debts', description: 'Become completely debt-free', probability: 0.9, cashImpact: 100000, propertyValueImpact: 0, creditImpact: 50, followUpText: 'Debt-free! Your credit score soared and your monthly cash flow is now massive.' },
    ],
  },
  {
    id: 'medical-emergency',
    category: 'Personal',
    title: 'Medical Emergency',
    description: 'A family member requires urgent medical treatment. The hospital bill is substantial.',
    image: '/scenario-market-crash.jpg',
    frequency: 'common',
    options: [
      { label: 'Use Medisave', description: 'Tap into CPF Medisave to cover costs', probability: 0.9, cashImpact: -20000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'Medisave covered most of it. Thankful for Singapore\'s healthcare system.' },
      { label: 'Pay Cash', description: 'Use your savings to cover the bills', probability: 0.85, cashImpact: -60000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'Health is wealth. The recovery is going well.' },
      { label: 'Take Personal Loan', description: 'Borrow to cover the medical expenses', probability: 0.7, cashImpact: 30000, propertyValueImpact: 0, creditImpact: -15, followUpText: 'The loan covers the bills but adds to your monthly obligations.' },
    ],
  },
  // PROPERTY EVENTS
  {
    id: 'enbloc',
    category: 'Property',
    title: 'En-Bloc Opportunity!',
    description: 'A developer is eyeing your property for collective sale! The offer is significantly above market value.',
    image: '/scenario-boom.jpg',
    frequency: 'rare',
    options: [
      { label: 'Vote to Sell', description: 'Accept the en-bloc offer', probability: 0.8, cashImpact: 800000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'Jackpot! The en-bloc sale netted you a massive profit. Time to reinvest!' },
      { label: 'Hold Out', description: 'Reject the offer and wait for a better price', probability: 0.4, cashImpact: 0, propertyValueImpact: 5, creditImpact: 0, followUpText: 'Risky move. The developer may walk away, or they may come back with a higher offer.' },
      { label: 'Renegotiate', description: 'Counter with a higher asking price', probability: 0.6, cashImpact: 1000000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'Bold negotiation! The developer agreed to a slightly improved offer.' },
    ],
  },
  {
    id: 'tenant-default',
    category: 'Property',
    title: 'Tenant Default',
    description: 'Your tenant has failed to pay rent for 2 months and has disappeared. You need to find a new tenant.',
    image: '/scenario-market-crash.jpg',
    frequency: 'common',
    options: [
      { label: 'Engage Agent', description: 'Pay for a property agent to find new tenant quickly', probability: 0.85, cashImpact: -8000, propertyValueImpact: 0, creditImpact: -5, followUpText: 'New tenant found in 3 weeks. A small price to pay for peace of mind.' },
      { label: 'Self-Market', description: 'Handle the listing yourself to save costs', probability: 0.6, cashImpact: -15000, propertyValueImpact: 0, creditImpact: -10, followUpText: 'It took 2 months to find a tenant. Lost rental income hurt, but you saved on commission.' },
      { label: 'Renovate First', description: 'Upgrade the unit before re-listing', probability: 0.7, cashImpact: -35000, propertyValueImpact: 5, creditImpact: 0, followUpText: 'The renovated unit attracted quality tenants at higher rent!' },
    ],
  },
  {
    id: 'renovation-needed',
    category: 'Property',
    title: 'Major Renovation Required',
    description: 'Your aging property needs significant repairs. The plumbing and electrical systems require complete overhaul.',
    image: '/scenario-market-crash.jpg',
    frequency: 'common',
    options: [
      { label: 'Full Renovation', description: 'Complete overhaul to modern standards', probability: 0.85, cashImpact: -80000, propertyValueImpact: 12, creditImpact: 0, followUpText: 'The renovated property now commands higher rent and increased in value!' },
      { label: 'Patch Repairs', description: 'Do only essential fixes to save money', probability: 0.9, cashImpact: -25000, propertyValueImpact: 2, creditImpact: 0, followUpText: 'The bare minimum keeps things functional, but the property value barely budged.' },
      { label: 'Sell As-Is', description: 'Offload the property without renovating', probability: 0.6, cashImpact: 100000, propertyValueImpact: -10, creditImpact: 0, followUpText: 'You sold at a discount but avoided the renovation hassle.' },
    ],
  },
  {
    id: 'good-tenant',
    category: 'Property',
    title: 'Model Tenant',
    description: 'Your tenant has been exceptional — always on time, maintains the property well, and wants to renew for 3 years.',
    image: '/scenario-boom.jpg',
    frequency: 'common',
    options: [
      { label: 'Small Rent Increase', description: 'Raise rent modestly to keep them happy', probability: 0.9, cashImpact: 12000, propertyValueImpact: 2, creditImpact: 5, followUpText: 'The tenant gladly accepted the small increase. Stable income for 3 years!' },
      { label: 'Maintain Current Rent', description: 'No increase to ensure long-term stability', probability: 0.95, cashImpact: 6000, propertyValueImpact: 0, creditImpact: 10, followUpText: 'The grateful tenant signed the 3-year lease. Zero vacancy risk!' },
      { label: 'Maximize Rental', description: 'Raise rent to current market rate', probability: 0.5, cashImpact: 24000, propertyValueImpact: 3, creditImpact: -5, followUpText: 'The tenant reluctantly agreed. Higher income, but the relationship is strained.' },
    ],
  },
  {
    id: 'lease-top-up',
    category: 'Property',
    title: 'Lease Top-Up Opportunity',
    description: 'The government is offering lease top-up schemes for aging 99-year lease properties at a discounted rate.',
    image: '/scenario-boom.jpg',
    frequency: 'uncommon',
    options: [
      { label: 'Top Up Lease', description: 'Extend the lease by 50 years', probability: 0.8, cashImpact: -150000, propertyValueImpact: 25, creditImpact: 0, followUpText: 'Brilliant move! The lease extension significantly boosted your property value.' },
      { label: 'Sell Before Top-Up', description: 'Sell the property as-is to someone else', probability: 0.6, cashImpact: 200000, propertyValueImpact: -5, creditImpact: 0, followUpText: 'You passed the decision to the buyer. Sometimes the best move is to exit.' },
      { label: 'Do Nothing', description: 'Let the lease continue running down', probability: 0.9, cashImpact: 0, propertyValueImpact: -8, creditImpact: 0, followUpText: 'The property continues to depreciate as the lease shortens. Time is not on your side.' },
    ],
  },
  // MACRO EVENTS
  {
    id: 'new-mrt-line',
    category: 'Macro',
    title: 'New MRT Line Announced',
    description: 'The government has announced a new MRT line that will pass through an area where you own property!',
    image: '/scenario-boom.jpg',
    frequency: 'uncommon',
    options: [
      { label: 'Hold for Capital Gain', description: 'Wait for property values to rise when MRT opens', probability: 0.8, cashImpact: 0, propertyValueImpact: 20, creditImpact: 0, followUpText: 'Property prices in the area surged on the news! Great patience.' },
      { label: 'Buy More Nearby', description: 'Acquire additional properties before prices rise', probability: 0.65, cashImpact: -400000, propertyValueImpact: 30, creditImpact: -5, followUpText: 'You capitalized on the news early. Multiple properties now rising in value!' },
      { label: 'Sell on News', description: 'Take profits now before construction delays', probability: 0.7, cashImpact: 150000, propertyValueImpact: 10, creditImpact: 0, followUpText: 'You locked in gains. Smart move as construction timelines can be unpredictable.' },
    ],
  },
  {
    id: 'covid-pandemic',
    category: 'Macro',
    title: 'Pandemic Outbreak',
    description: 'A global pandemic has struck. Lockdowns are in place and the property market is in turmoil.',
    image: '/scenario-market-crash.jpg',
    frequency: 'very-rare',
    options: [
      { label: 'Buy the Panic', description: 'Invest aggressively during the crisis', probability: 0.6, cashImpact: -300000, propertyValueImpact: 20, creditImpact: 0, followUpText: 'You bought when others were fearful. The recovery was swift and profitable!' },
      { label: 'Hunker Down', description: 'Cut expenses and wait for stability', probability: 0.85, cashImpact: -20000, propertyValueImpact: -8, creditImpact: 0, followUpText: 'You survived the crisis intact. Sometimes surviving is winning.' },
      { label: 'Sell to Raise Cash', description: 'Liquidate assets in uncertain times', probability: 0.5, cashImpact: 100000, propertyValueImpact: -15, creditImpact: -10, followUpText: 'You raised cash but sold at depressed prices. Hindsight is 20/20.' },
    ],
  },
  {
    id: 'economic-recession',
    category: 'Macro',
    title: 'Economic Recession',
    description: 'GDP has contracted for two consecutive quarters. Unemployment is rising and consumer confidence is low.',
    image: '/scenario-market-crash.jpg',
    frequency: 'uncommon',
    options: [
      { label: 'Value Investing', description: 'Find distressed properties at bargain prices', probability: 0.7, cashImpact: -250000, propertyValueImpact: 15, creditImpact: 0, followUpText: 'Recessions create the best opportunities. You acquired quality assets cheaply.' },
      { label: 'Defensive Position', description: 'Build cash reserves and avoid new purchases', probability: 0.85, cashImpact: 30000, propertyValueImpact: -5, creditImpact: 5, followUpText: 'Conservative but wise. Your cash pile grows while waiting for the right moment.' },
      { label: 'Cut Losses', description: 'Sell weaker properties before they fall further', probability: 0.6, cashImpact: 150000, propertyValueImpact: -12, creditImpact: -10, followUpText: 'You trimmed the weak links. A leaner, stronger portfolio remains.' },
    ],
  },
  {
    id: 'new-shopping-mall',
    category: 'Macro',
    title: 'New Regional Mall Opening',
    description: 'A massive new shopping complex is opening near your property, bringing amenities and foot traffic.',
    image: '/scenario-boom.jpg',
    frequency: 'common',
    options: [
      { label: 'Hold and Benefit', description: 'Enjoy the capital appreciation', probability: 0.9, cashImpact: 0, propertyValueImpact: 12, creditImpact: 0, followUpText: 'Property values in the area jumped on the news. Convenience is king!' },
      { label: 'Renovate and Rent', description: 'Upgrade unit to capture higher rents', probability: 0.8, cashImpact: -40000, propertyValueImpact: 15, creditImpact: 0, followUpText: 'The new mall attracted young professionals willing to pay premium rents.' },
      { label: 'Sell at Peak', description: 'Cash out on the positive news', probability: 0.7, cashImpact: 200000, propertyValueImpact: 5, creditImpact: 0, followUpText: 'You captured the mall premium. Time to find the next growth area.' },
    ],
  },
  // RARE EVENTS
  {
    id: 'lottery-win',
    category: 'Rare',
    title: 'TOTO Jackpot Win!',
    description: 'Unbelievable luck! Your lottery numbers came up and you have won a substantial prize!',
    image: '/scenario-boom.jpg',
    frequency: 'very-rare',
    options: [
      { label: 'Property Empire', description: 'Buy multiple investment properties', probability: 0.9, cashImpact: 2000000, propertyValueImpact: 60, creditImpact: 0, followUpText: 'From lottery winner to property mogul! Your empire begins.' },
      { label: 'Dream Home', description: 'Buy one ultra-luxury property', probability: 0.9, cashImpact: -1500000, propertyValueImpact: 30, creditImpact: 0, followUpText: 'You now own a magnificent home in the best district. Life-changing!' },
      { label: 'Diversify', description: 'Split between property and investments', probability: 0.9, cashImpact: 1000000, propertyValueImpact: 20, creditImpact: 0, followUpText: 'A balanced approach to sudden wealth. Property + diversified portfolio.' },
    ],
  },
  {
    id: 'government-grant',
    category: 'Rare',
    title: 'Housing Grant windfall',
    description: 'A new government scheme offers unexpected grants for property owners and first-time buyers!',
    image: '/scenario-boom.jpg',
    frequency: 'rare',
    options: [
      { label: 'Claim and Buy', description: 'Use the grant toward a new property purchase', probability: 0.85, cashImpact: -200000, propertyValueImpact: 15, creditImpact: 0, followUpText: 'The grant significantly reduced your purchase cost. Excellent timing!' },
      { label: 'Claim and Save', description: 'Bank the grant for future opportunities', probability: 0.9, cashImpact: 80000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'Free money from the government! Added to your investment war chest.' },
      { label: 'Upgrade Property', description: 'Use the grant for renovation works', probability: 0.8, cashImpact: -50000, propertyValueImpact: 15, creditImpact: 0, followUpText: 'The renovation transformed your property. Value increased significantly!' },
    ],
  },
  {
    id: 'developer-interest',
    category: 'Rare',
    title: 'Developer Knockout Offer',
    description: 'A major developer has made a direct, unsolicited offer on one of your properties at 40% above valuation.',
    image: '/scenario-boom.jpg',
    frequency: 'very-rare',
    options: [
      { label: 'Accept Immediately', description: 'Take the life-changing offer', probability: 0.95, cashImpact: 2500000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'Life-changing windfall! Time to reinvest strategically.' },
      { label: 'Counter Higher', description: 'Negotiate for an even better price', probability: 0.5, cashImpact: 3200000, propertyValueImpact: 0, creditImpact: 0, followUpText: 'Incredible! The developer agreed to your counter. Fortune favors the bold!' },
      { label: 'Decline Politely', description: 'Keep the property for long-term appreciation', probability: 0.7, cashImpact: 0, propertyValueImpact: 10, creditImpact: 0, followUpText: 'The developer may come back later. Your property is clearly more valuable than you thought.' },
    ],
  },
  {
    id: 'property-scandal',
    category: 'Rare',
    title: 'Neighborhood Property Scandal',
    description: 'A high-profile property scandal has erupted in your district. Values are temporarily depressed.',
    image: '/scenario-market-crash.jpg',
    frequency: 'very-rare',
    options: [
      { label: 'Buy the Fear', description: 'Acquire more properties at discounted prices', probability: 0.6, cashImpact: -400000, propertyValueImpact: 20, creditImpact: 0, followUpText: 'You bought when others panicked. Scandals blow over; property endures.' },
      { label: 'Wait and See', description: 'Monitor the situation before acting', probability: 0.8, cashImpact: 0, propertyValueImpact: -8, creditImpact: 0, followUpText: 'The scandal is fading from headlines. Values should stabilize soon.' },
      { label: 'Sell and Exit', description: 'Leave the district entirely', probability: 0.5, cashImpact: 300000, propertyValueImpact: -15, creditImpact: -5, followUpText: 'You exited at a discount but avoided further uncertainty.' },
    ],
  },
];

export const categoryColors: Record<ScenarioCategory, string> = {
  Market: '#00F0FF',
  Personal: '#7C4DFF',
  Property: '#FF9100',
  Macro: '#00E676',
  Rare: '#FF4081',
};

export const categoryIcons: Record<ScenarioCategory, string> = {
  Market: 'TrendingUp',
  Personal: 'User',
  Property: 'Home',
  Macro: 'Globe',
  Rare: 'Sparkles',
};
