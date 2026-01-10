import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { FinancialDataPoint } from '../types/financial';

interface LineOverlayData {
  period: string;
  value: number;
}

interface StackedBarChartProps {
  data: FinancialDataPoint[];
  width?: number;
  height?: number;
  colors?: string[];
  onPeriodHover?: (period: string | null) => void;
  lineOverlay?: {
    data: LineOverlayData[];
    color?: string;
    label?: string;
  };
}

export default function StackedBarChart({
  data,
  width = 800,
  height = 400,
  colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'],
  onPeriodHover,
  lineOverlay
}: StackedBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 5, right: lineOverlay ? 50 : 5, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group data by period (fiscal_year + fiscal_quarter)
    const periods = Array.from(new Set(data.map(d => `${d.fiscal_year} Q${d.fiscal_quarter}`))).sort();
    const accounts = Array.from(new Set(data.map(d => d.gl_account)));

    // Create nested data structure for stacking
    const stackData = periods.map(period => {
      const [year, quarter] = period.split(' ');
      const periodData = data.filter(d =>
        d.fiscal_year === parseInt(year) &&
        d.fiscal_quarter === parseInt(quarter.substring(1))
      );

      const obj: any = { period };
      accounts.forEach(account => {
        const point = periodData.find(d => d.gl_account === account);
        obj[account] = point ? Math.abs(point.amount) : 0;
      });
      return obj;
    });

    // Create stack generator
    const stack = d3.stack<any>()
      .keys(accounts)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(stackData);

    // Scales
    const x = d3.scaleBand()
      .domain(periods)
      .range([0, chartWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(series, s => d3.max(s, d => d[1])) || 0])
      .nice()
      .range([chartHeight, 0]);

    const color = d3.scaleOrdinal<string>()
      .domain(accounts)
      .range(colors);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px');

    // Add Y axis (left)
    g.append('g')
      .call(d3.axisLeft(y)
        .ticks(8)
        .tickFormat(d => {
          const val = d as number;
          if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
          if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
          if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
          return `${val}`;
        }))
      .style('font-size', '11px');

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current);

    // Add bars
    g.selectAll('.series')
      .data(series)
      .join('g')
      .attr('class', 'series')
      .attr('fill', d => color(d.key))
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', (d: any) => x(d.data.period) || 0)
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .on('mouseover', function(event, d: any) {
        const element = this as SVGRectElement;
        const account = d3.select(element.parentNode as Element).datum() as any;
        const value = d[1] - d[0];

        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke', '#333')
          .style('stroke-width', '2px');

        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${account.key}</div>
            <div>${d.data.period}</div>
            <div style="margin-top: 4px; font-weight: 500;">
              ${value >= 1e9 ? `${(value / 1e9).toFixed(2)}B` :
                value >= 1e6 ? `${(value / 1e6).toFixed(2)}M` :
                value >= 1e3 ? `${(value / 1e3).toFixed(2)}K` :
                `${value.toFixed(2)}`}
            </div>
          `);

        if (onPeriodHover) {
          onPeriodHover(d.data.period);
        }
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', 1)
          .style('stroke', 'none');

        tooltip.style('opacity', 0);

        if (onPeriodHover) {
          onPeriodHover(null);
        }
      });

    // Add line overlay if provided
    if (lineOverlay && lineOverlay.data.length > 0) {
      const lineColor = lineOverlay.color || '#764ba2';
      
      // Filter line data to only include periods that exist in bar chart
      const filteredLineData = lineOverlay.data.filter(d => periods.includes(d.period));
      
      // Create secondary Y scale for line
      const y2 = d3.scaleLinear()
        .domain([0, d3.max(filteredLineData, d => d.value) || 1])
        .nice()
        .range([chartHeight, 0]);

      // Add right Y axis
      g.append('g')
        .attr('transform', `translate(${chartWidth}, 0)`)
        .call(d3.axisRight(y2).ticks(5).tickFormat(d => (d as number).toFixed(2)))
        .style('font-size', '11px')
        .selectAll('text')
        .style('fill', lineColor);

      // Create line generator
      const line = d3.line<LineOverlayData>()
        .x(d => (x(d.period) || 0) + x.bandwidth() / 2)
        .y(d => y2(d.value));

      // Add line path
      g.append('path')
        .datum(filteredLineData)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 2.5)
        .attr('d', line);

      // Add dots on line
      g.selectAll('.line-dot')
        .data(filteredLineData)
        .join('circle')
        .attr('class', 'line-dot')
        .attr('cx', d => (x(d.period) || 0) + x.bandwidth() / 2)
        .attr('cy', d => y2(d.value))
        .attr('r', 4)
        .attr('fill', lineColor)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Add line label to legend
      if (lineOverlay.label) {
        const legendOffset = accounts.length * 20 + 10;
        const lineLegend = g.append('g')
          .attr('transform', `translate(5, ${legendOffset})`);

        lineLegend.append('line')
          .attr('x1', 0)
          .attr('y1', 6)
          .attr('x2', 12)
          .attr('y2', 6)
          .attr('stroke', lineColor)
          .attr('stroke-width', 2.5);

        lineLegend.append('text')
          .attr('x', 18)
          .attr('y', 10)
          .style('font-size', '10px')
          .style('fill', '#333')
          .style('font-weight', '500')
          .text(lineOverlay.label);
      }
    }

    // Add legend in upper left, offset from axis
    const legend = g.append('g')
      .attr('transform', `translate(5, 5)`);

    [...accounts].reverse().forEach((account, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', color(account));

      legendRow.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '10px')
        .style('fill', '#333')
        .style('font-weight', '500')
        .text(account.length > 20 ? account.substring(0, 20) + '...' : account);
    });

  }, [data, width, height, colors, onPeriodHover, lineOverlay]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
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
