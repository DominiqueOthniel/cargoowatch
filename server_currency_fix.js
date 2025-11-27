// Fix for formatCurrency function - use this replacement
const formatCurrency = (amount, currencyCode) => {
    // FORCE use shipmentCurrency - ignore currencyCode parameter completely
    const currency = shipmentCurrency;
    
    console.log(`💰 Formatting ${amount}: USING shipmentCurrency=${shipmentCurrency} (ignoring currencyCode=${currencyCode})`);
    
    const symbol = getCurrencySymbol(currency);
    console.log(`💰 Symbol for ${currency}: ${symbol}`);
    
    const numAmount = parseFloat(amount || 0);
    const formattedAmount = numAmount.toFixed(2);
    
    // For currencies like JPY, no decimal places
    if (currency === 'JPY') {
        return `${symbol}${Math.round(numAmount)}`;
    }
    
    // For EUR, use European format: €X,XX (comma as decimal separator)
    if (currency === 'EUR') {
        const result = `${symbol}${formattedAmount.replace('.', ',')}`;
        console.log(`💰 EUR formatting result: ${result}`);
        return result;
    }
    
    // Default format: $X.XX
    const result = `${symbol}${formattedAmount}`;
    console.log(`💰 Default formatting result: ${result}`);
    return result;
};




