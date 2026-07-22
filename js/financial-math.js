// Logic for Working Capital Gap analysis
export const calculateGap = (receivables, inventory, payables) => {
    // Formula: (Receivables + Inventory) - Payables
    const gap = parseFloat(receivables) + parseFloat(inventory) - parseFloat(payables);
    
    // Recommendation logic based on gap
    const recommendation = gap > 0 
        ? "You have a funding gap. We recommend a Working Capital Loan to stabilize cash flow." 
        : "Your cash cycle is optimized. Maintain this balance.";

    return { gap, recommendation };
};
