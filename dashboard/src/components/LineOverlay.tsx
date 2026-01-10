import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  period: string;
  value: number;
}

interface LineOverlayProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
}

export default function LineOverlay({
  data,
  width = 800,
  height = 300,
  color = '#667eea',
  label = 'Metric',
  yAxisLabel = 'Value',
  formatValue = (v: number) => v.toFixed(2)
}: LineOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 60, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.period))
      .range([0, chartWidth])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .nice()
      .range([chartHeight, 0]);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => formatValue(d as number)))
      .style('font-size', '11px');

    // Add Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text(yAxisLabel);

    // Create line generator
    const line = d3.line<DataPoint>()
      .x(d => (x(d.period) || 0) + x.bandwidth() / 2)
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Add line path
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('d', line);

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current);

    // Add circles for data points
    g.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => (x(d.period) || 0) + x.bandwidth() / 2)
      .attr('cy', d => y(d.value))
      .attr('r', 5)
      .attr('fill', color)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8);

        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${label}</div>
            <div style="color: #666; font-size: 11px; margin-bottom: 4px;">${d.period}</div>
            <div style="font-weight: 500; color: ${color};">
              ${formatValue(d.value)}
            </div>
          `);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5);

        tooltip.style('opacity', 0);
      });

    // Add area under the line (optional, subtle fill)
    const area = d3.area<DataPoint>()
      .x(d => (x(d.period) || 0) + x.bandwidth() / 2)
      .y0(chartHeight)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', color)
      .attr('opacity', 0.1)
      .attr('d', area);

  }, [data, width, height, color, label, yAxisLabel, formatValue]);

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