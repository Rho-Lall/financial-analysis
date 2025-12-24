# Understanding Data Vault

The Data Vault structure should definitely be informed by the actual SEC data structure. Let me help you think through this.

**Key principle for Data Vault design:** The structure should reflect the **business keys** and **relationships** in your source data, not just mirror the source schema.

**Questions to explore when you look at the SEC data:**

1. **What are the natural business keys?**
    
    - Ticker symbol (identifies company)
    - CIK number (SEC's company identifier)
    - Fiscal period (year + quarter)
    - Line item identifiers (how SEC structures accounts)
2. **What are the core business entities?**
    
    - Companies
    - Reporting periods
    - Financial statement line items
    - Maybe: Filing types (10-K vs 10-Q)?
3. **What are the relationships?**
    
    - Company files reports for periods
    - Periods contain line items with values
    - Line items belong to statement types (income/balance/cash flow)

**When you're ready to dig deeper, I can help you:**

- Analyze a sample SEC data response to identify the structure
- Map business keys to Hubs
- Identify many-to-many relationships for Links
- Determine what descriptive/changing data goes in Satellites
- Decide on hash key strategies

**For now, would you like me to:**

1. **Search for SEC EDGAR API data structure** to see actual response format?
2. **Create the Design Document** (we can leave Data Vault models as "TBD - refine after data analysis")?
3. **Create the Task List** to get the full picture of implementation steps?

What feels most useful next?