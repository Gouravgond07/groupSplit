// Data structure to represent expenses
// const expenses = [
//     {
//         description: "Indore to Jaipur",
//         amount: 5040.00,
//         whoPaid: "Gourav",
//         participants: ["Gourav", "Kapil"]
//     },
//     {
//         description: "Bhopal to Indore",
//         amount: 890.00,
//         whoPaid: "Gourav",
//         participants: ["Gourav"]
//     },
//     {
//         description: "Hotel",
//         amount: 20000.00,
//         whoPaid: "Mayank",
//         participants: ["Mayank", "Gourav", "Kapil", "Swatantra"]
//     },
//     // Add more expenses here...
// ];
const expenses = [
    { description: "Indore to Jaipur", amount: 90.00, whoPaid: "Gourav", participants: ["Gourav", "Kapil", "Mintoo"] },
    { description: "dkdkd", amount: 90.00, whoPaid: "Gourav", participants: ["Gourav", "Kapil", "Mintoo"] },
    { description: "lkddk", amount: 90.00, whoPaid: "Kapil", participants: ["Gourav", "Kapil", "Mintoo"] },
    { description: "lkdk", amount: 90.00, whoPaid: "Mintoo", participants: ["Gourav", "Kapil", "Mintoo"] }
];



// Function to calculate settlements
function calculateSettlements(expenses) {   
    const participantBalances = {};

    // Initialize participant balances
    expenses.forEach(expense => {
        expense.participants.forEach(participant => {
            participantBalances[participant] = participantBalances[participant] || 0;
        });
    });
    
    // Calculate total expenses and individual contributions
    expenses.forEach(expense => {
        const contribution = expense.amount / expense.participants.length;
        participantBalances[expense.whoPaid] -= expense.amount; // Deduct the expense from the payer's balance
        expense.participants.forEach(participant => {
            participantBalances[participant] += contribution; // Add the contribution to each participant's balance
        });
    });

    return participantBalances;
}

// Function to generate settlement instructions
function generateSettlementInstructions(settlements) {
    const instructions = [];
    for (const payer in settlements) {
        for (const receiver in settlements) {
            
            if (payer !== receiver) {
                const amount = Math.min(-settlements[payer], settlements[receiver]);
                
                if (amount > 0) {
                    instructions.push(`${receiver} pays ${payer} ${amount}`);
                    
                    settlements[payer] += amount;
                    settlements[receiver] -= amount;
                    
                }
            }
        }
    }
    console.log('instructions', instructions)
    return instructions;
}

// Calculate settlements
const settlements = calculateSettlements(expenses);
console.log('settlements');
console.log(settlements)
// Generate settlement instructions
const settlementInstructions = generateSettlementInstructions(settlements);

// Print settlement instructions
settlementInstructions.forEach(instruction => console.log(instruction));
