import { useId, useMemo, useState } from 'react';
import { hatchRect, seededRandom, wobblyCircle, bakeStrokes } from '../engraving/geometry';
import { palette, shadow } from '../engraving/palette';
import { timing } from '../engraving/timing';

/** dbt mark (16x16), taken from the icon sheet bundled with the generated dbt docs. */
const DBT_MARK =
  'M12.6,9.265l0,0L10.9,6.325a3.31,3.31,0,0,0-.529-.7h0a3.264,3.264,0,0,0-3.184-.867,4.022,4.022,0,0,1,4.194.938,3.977,3.977,0,0,1,.635.833l.38.657a2.488,2.488,0,0,1,.2-.465l2.226-3.851a1.2,1.2,0,0,0-.2-1.5,1.2,1.2,0,0,0-1.5-.2h0L9.27,3.4a2.539,2.539,0,0,1-2.54,0L2.877,1.178A1.253,1.253,0,0,0,2.247,1a1.247,1.247,0,0,0-.871.375,1.2,1.2,0,0,0-.2,1.5L3.4,6.726a2.542,2.542,0,0,1,0,2.539l-2.226,3.85a1.2,1.2,0,0,0,.2,1.5,1.2,1.2,0,0,0,1.5.2L6.73,12.588a2.455,2.455,0,0,1,.465-.2l-.657-.379a3.857,3.857,0,0,1-1.462-1.467,4.118,4.118,0,0,1-.288-3.368,3.453,3.453,0,0,0,.33,2.507A3.141,3.141,0,0,0,6.329,10.89l2.94,1.7h0l3.853,2.224a1.243,1.243,0,0,0,1.7-1.7Zm.814-7.353a.478.478,0,1,1,0,.676A.48.48,0,0,1,13.41,1.912ZM2.59,2.588a.478.478,0,1,1,0-.676A.479.479,0,0,1,2.59,2.588Zm0,11.49a.478.478,0,1,1,0-.676A.479.479,0,0,1,2.59,14.078Zm6.827-5.9a1.022,1.022,0,1,0-1.231,1.23,1.433,1.433,0,1,1,1.231-1.23Zm4.67,5.9a.478.478,0,1,1,0-.676A.479.479,0,0,1,14.087,14.078Z';
const DBT_ORANGE = '#FF694B';
const MARK = 30; // rendered size of the mark in px

const SIZE = 60;
const C = SIZE / 2;
const R = 25;

/**
 * Floating hand-drawn button (bottom-right, fixed while scrolling) that opens the
 * dbt docs lineage graph, mirroring the graph button on the docs site. Shows a
 * hand-drawn take on the dbt mark.
 */
export default function LineageButton() {
  const [hover, setHover] = useState(false);
  const uid = useId().replace(/:/g, '');
  const clipId = `${uid}-shadow`;
  const markClipId = `${uid}-mark`;
  const roughId = `${uid}-rough`;
  const href = `${import.meta.env.BASE_URL}dbtdocs/index.html#!/overview?g_v=1`;

  const g = useMemo(() => {
    const rand = seededRandom(4242);
    return {
      border: wobblyCircle(C, C, R, rand),
      shadowHatch: bakeStrokes(hatchRect(C - R + 5, C - R + 5, R * 2, R * 2, { angle: 45, gap: 2.6, weight: 0.6, rand, endJitter: 0.4 })),
      // Hatching inside the mark, in the mark's own 16-unit space.
      markHatch: bakeStrokes(
        hatchRect(0, 0, 16, 16, { angle: 48, gap: 0.95, weight: 0.26, rand, endJitter: 0.15, bow: 0.06, angleJitter: 2.5 }),
      ),
    };
  }, []);

  return (
    <a
      className="lineage-button"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open the dbt lineage graph"
      title="dbt lineage graph"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <svg width={SIZE + 8} height={SIZE + 8} viewBox={`-2 -2 ${SIZE + 8} ${SIZE + 8}`} aria-hidden>
        <defs>
          <clipPath id={clipId}>
            <circle cx={C + 5} cy={C + 5} r={R} />
          </clipPath>
          <clipPath id={markClipId}>
            <path d={DBT_MARK} />
          </clipPath>
          {/* Same ink-bleed roughness as the charts */}
          <filter id={roughId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Teal hatched cast shadow */}
        <g className="eg-fade" style={timing(1400, 500)}>
          <circle cx={C + 5} cy={C + 5} r={R} fill={shadow.wash} opacity={shadow.washOpacity} />
          <path d={g.shadowHatch} fill={shadow.ink} opacity={shadow.inkOpacity} clipPath={`url(#${clipId})`} />
        </g>

        {/* Paper disc + violet wash on hover */}
        <circle cx={C} cy={C} r={R} fill="#ffffff" />
        <circle cx={C} cy={C} r={R} fill={palette.violet} opacity={hover ? 0.22 : 0} style={{ transition: 'opacity 180ms ease' }} />

        {/* Hand-inked border */}
        <path
          d={g.border}
          fill="none"
          stroke={palette.inkSoft}
          strokeWidth={1.6}
          strokeLinecap="round"
          pathLength={1}
          className="eg-ink"
          style={timing(1200, 500)}
        />

        {/* Hand-drawn dbt mark: orange wash, hatching, inked outline */}
        <g filter={`url(#${roughId})`}>
          <g transform={`translate(${C - MARK / 2} ${C - MARK / 2}) scale(${MARK / 16})`}>
            <path d={DBT_MARK} fill={DBT_ORANGE} className="eg-fade" style={timing(1450, 400, 0.4)} />
            <g clipPath={`url(#${markClipId})`} className="eg-fade" style={timing(1650, 450, 0.75)}>
              <path d={g.markHatch} fill="#B8391F" />
            </g>
            <path
              d={DBT_MARK}
              fill="none"
              stroke={palette.ink}
              strokeWidth={0.5}
              strokeLinejoin="round"
              pathLength={1}
              className="eg-ink"
              style={timing(1350, 900)}
            />
          </g>
        </g>
      </svg>
    </a>
  );
}
