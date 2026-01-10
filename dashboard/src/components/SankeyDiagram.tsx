import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { FinancialDataPoint } from '../types/financial';

interface SankeyDiagramProps {
  data: FinancialDataPoint[];
  fiscalYear: number;
  fiscalQuarter: number;
  width?: number;
  height?: number;
}

interface SankeyNodeExtended {
  name: string;
}

interface SankeyLinkExtended {
  source: number;
  target: number;
  value: number;
}

export default function SankeyDiagram({
  data,
  fiscalYear,
  fiscalQuarter,
  width = 900,
  height = 167
}: SankeyDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Filter data for the selected period
    const periodData = data.filter(
      d => d.fiscal_year === fiscalYear && d.fiscal_quarter === fiscalQuarter
    );

    if (periodData.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 5, right: 5, bottom: 20, left: 5 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Build nodes and links for Sankey
    // Flow: Revenue -> Gross Profit + Cost of Revenue
    //       Gross Profit -> Operating Profit + Total Operating Expenses
    //       Operating Profit -> Income Before Taxes
    //       Income Before Taxes -> Net Profit + Investment Income + Taxes
    const nodes: SankeyNodeExtended[] = [];
    const links: SankeyLinkExtended[] = [];
    const nodeMap = new Map<string, number>();

    let nodeIndex = 0;
    const getNodeIndex = (name: string): number => {
      if (!nodeMap.has(name)) {
        nodes.push({ name } as SankeyNodeExtended);
        nodeMap.set(name, nodeIndex++);
      }
      return nodeMap.get(name)!;
    };

    // Find key accounts
    const revenue = periodData.find(d => d.gl_account === 'Revenue');
    const costOfRevenue = periodData.find(d => d.gl_account === 'Cost of revenue');
    const opex = periodData.filter(d => d.gl_account === 'Marketing' || d.gl_account === 'Technology and development');
    const investmentIncome = periodData.find(d => d.gl_account === 'Investment income');
    const incomeTax = periodData.find(d => d.gl_account === 'Income tax');
    const netProfit = periodData.find(d => d.gl_account === 'Net profit');

    if (!revenue) return;

    const revenueValue = Math.abs(revenue.amount);

    // Create flow structure
    const revenueIdx = getNodeIndex('Revenue');
    const grossProfitIdx = getNodeIndex('Gross Profit');
    const operatingProfitIdx = getNodeIndex('Operating Profit');
    const incomeBeforeTaxesIdx = getNodeIndex('Income Before Taxes');
    const netProfitIdx = getNodeIndex('Net Profit');

    // Revenue to Gross Profit and Cost of Revenue
    let grossProfitValue = revenueValue;
    if (costOfRevenue) {
      const costOfRevenueIdx = getNodeIndex('Cost of Revenue');
      const costValue = Math.abs(costOfRevenue.amount);
      links.push({
        source: revenueIdx,
        target: costOfRevenueIdx,
        value: costValue
      } as SankeyLinkExtended);
      grossProfitValue = revenueValue - costValue;
    }

    links.push({
      source: revenueIdx,
      target: grossProfitIdx,
      value: grossProfitValue
    } as SankeyLinkExtended);

    // Gross Profit to Operating Profit and Total Operating Expenses
    let opexTotal = 0;
    opex.forEach(expense => {
      opexTotal += Math.abs(expense.amount);
    });

    if (opexTotal > 0) {
      const opexIdx = getNodeIndex('Total Operating Expenses');
      links.push({
        source: grossProfitIdx,
        target: opexIdx,
        value: opexTotal
      } as SankeyLinkExtended);
    }

    const operatingProfitValue = grossProfitValue - opexTotal;
    if (operatingProfitValue > 0) {
      links.push({
        source: grossProfitIdx,
        target: operatingProfitIdx,
        value: operatingProfitValue
      } as SankeyLinkExtended);
    }

    // Operating Profit to Income Before Taxes
    links.push({
      source: operatingProfitIdx,
      target: incomeBeforeTaxesIdx,
      value: operatingProfitValue
    } as SankeyLinkExtended);

    // Income Before Taxes to Net Profit, Investment Income, and Taxes
    let incomeBeforeTaxesValue = operatingProfitValue;

    if (investmentIncome) {
      const investmentIncomeValue = Math.abs(investmentIncome.amount);
      incomeBeforeTaxesValue += investmentIncomeValue;
    }

    if (incomeTax) {
      const taxIdx = getNodeIndex('Taxes');
      const taxValue = Math.abs(incomeTax.amount);
      links.push({
        source: incomeBeforeTaxesIdx,
        target: taxIdx,
        value: taxValue
      } as SankeyLinkExtended);
    }

    if (netProfit) {
      const netProfitValue = Math.abs(netProfit.amount);
      links.push({
        source: incomeBeforeTaxesIdx,
        target: netProfitIdx,
        value: netProfitValue
      } as SankeyLinkExtended);
    }

    // Create sankey generator
    const sankeyGenerator = sankey<SankeyNodeExtended, SankeyLinkExtended>()
      .nodeWidth(5)
      .nodePadding(10)
      .extent([[0, 0], [chartWidth, chartHeight]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

    // Color scale - green for profit/income, red for costs/expenses
    const getNodeColor = (name: string): string => {
      const profitNodes = ['Revenue', 'Gross Profit', 'Operating Profit', 'Income Before Taxes', 'Net Profit', 'Investment Income'];
      const costNodes = ['Cost of Revenue', 'Total Operating Expenses', 'Taxes'];

      if (profitNodes.includes(name)) return '#22c55e'; // green
      if (costNodes.includes(name)) return '#ef4444'; // red
      return '#666'; // fallback gray
    };

    const tooltip = d3.select(tooltipRef.current);

    // Draw links
    g.append('g')
      .selectAll('.link')
      .data(sankeyLinks)
      .join('path')
      .attr('class', 'link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => getNodeColor(d.target.name))
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.4)
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('opacity', 0.7);

        const value = d.value;
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px;">
              ${d.source.name} → ${d.target.name}
            </div>
            <div style="font-weight: 500;">
              ${value >= 1e9 ? `$${(value / 1e9).toFixed(2)}B` :
                value >= 1e6 ? `$${(value / 1e6).toFixed(2)}M` :
                value >= 1e3 ? `$${(value / 1e3).toFixed(2)}K` :
                `$${value.toFixed(2)}`}
            </div>
          `);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.4);
        tooltip.style('opacity', 0);
      });

    // Draw nodes
    const node = g.append('g')
      .selectAll('.node')
      .data(sankeyNodes)
      .join('g')
      .attr('class', 'node');

    node.append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => getNodeColor(d.name))
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('opacity', 1);

        const value = d.value;
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${d.name}</div>
            <div style="font-weight: 500;">
              ${value >= 1e9 ? `$${(value / 1e9).toFixed(2)}B` :
                value >= 1e6 ? `$${(value / 1e6).toFixed(2)}M` :
                value >= 1e3 ? `$${(value / 1e3).toFixed(2)}K` :
                `$${value.toFixed(2)}`}
            </div>
          `);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        tooltip.style('opacity', 0);
      });

    // Add node labels
    node.append('text')
      .attr('x', (d: any) => d.x0 < chartWidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < chartWidth / 2 ? 'start' : 'end')
      .style('font-size', '11px')
      .style('fill', '#333')
      .text((d: any) => d.name);

    // Add title in bottom-right corner
    svg.append('text')
      .attr('x', width - 10)
      .attr('y', height - 5)
      .attr('text-anchor', 'end')
      .style('font-size', '11px')
      .style('fill', '#666')
      .style('font-weight', '600')
      .text(`Income Flow (${fiscalYear} Q${fiscalQuarter})`);

  }, [data, fiscalYear, fiscalQuarter, width, height]);

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg ref={svgRef} />
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          opacity: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          transition: 'opacity 0.2s'
        }}
      />
    </div>
  );
}