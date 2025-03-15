<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evolutionary Knowledge Garden</title>
  
  <!-- React and ReactDOM from CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- Babel for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Font -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', sans-serif;
    }
    
    body {
      background-color: #052e16;
      color: #ecfdf5;
      overflow: hidden;
    }
    
    /* Soil textures */
    .soil-texture {
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(41, 37, 36, 0.5) 2px, transparent 2px),
        radial-gradient(circle at 70% 65%, rgba(41, 37, 36, 0.5) 2px, transparent 2px),
        radial-gradient(circle at 40% 50%, rgba(41, 37, 36, 0.5) 2px, transparent 2px);
      background-size: 20px 20px;
    }
    
    .rich-soil {
      background-color: #7c2d12;
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(41, 37, 36, 0.5) 2px, transparent 2px),
        radial-gradient(circle at 70% 65%, rgba(41, 37, 36, 0.5) 2px, transparent 2px),
        radial-gradient(circle at 40% 50%, rgba(41, 37, 36, 0.5) 2px, transparent 2px);
      background-size: 20px 20px;
    }
    
    .poor-soil {
      background-color: #44403c;
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(41, 37, 36, 0.5) 1px, transparent 1px),
        radial-gradient(circle at 70% 65%, rgba(41, 37, 36, 0.5) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    
    /* Tooltips */
    .tooltip {
      pointer-events: none;
      transition: opacity 0.2s ease-in-out;
    }
    
    /* Glow effects */
    .plant-glow {
      filter: drop-shadow(0 0 3px rgba(94, 234, 212, 0.3));
    }
    
    .flourishing-glow {
      filter: drop-shadow(0 0 6px rgba(94, 234, 212, 0.4));
    }
    
    /* Weather effects */
    .weather-particle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.4;
      pointer-events: none;
    }
    
    /* Water droplets */
    .water-droplet {
      position: absolute;
      width: 6px;
      height: 6px;
      background-color: #22d3ee;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0.8;
      transition: transform 1s ease-in-out, opacity 1s ease-in-out;
    }
    
    /* Button hover effects */
    .tool-button:hover {
      filter: brightness(1.2);
    }
    
    .tool-button.active {
      background: linear-gradient(to bottom, #10b981, #059669);
      box-shadow: 0 0 5px rgba(94, 234, 212, 0.5);
    }
    
    /* Pulsating animation for active elements */
    @keyframes pulse {
      0% { opacity: 0.7; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
    }
    
    .pulse {
      animation: pulse 2s infinite;
    }
    
    /* Connection roots animation */
    @keyframes dash {
      to {
        stroke-dashoffset: -20;
      }
    }
    
    .connection-root {
      stroke-dasharray: 5, 3;
      animation: dash 20s linear infinite;
    }
    
    /* Seasonal indicator */
    .season-indicator {
      transition: transform 0.5s ease-in-out;
    }
    
    /* Slider thumb */
    .slider-thumb {
      transition: transform 0.2s ease-in-out;
    }
    
    .slider-thumb:hover {
      transform: scale(1.2);
    }
    
    /* Garden bed labels */
    .garden-label {
      pointer-events: none;
    }
    
    /* Plant labels */
    .plant-label {
      pointer-events: none;
      transition: opacity 0.2s ease-in-out;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    // Destructure React hooks
    const { useState, useEffect, useRef } = React;
    
    // =============================================
    // SVG Path Generators
    // =============================================
    
    // Generate paths for plant stems
    const generateStem = (x, y, height, width = 3) => {
      return `M${x},${y} L${x},${y - height}`;
    };
    
    // Generate paths for plant leaves
    const generateLeaf = (x, y, size, direction = 'right') => {
      const offset = direction === 'right' ? size : -size;
      return `M${x},${y} Q${x + offset},${y - size/2} ${x + offset * 1.2},${y - size/4} Q${x + offset},${y + size/4} ${x},${y}`;
    };
    
    // Generate paths for plant roots
    const generateRoot = (x, y, length, direction = 'right') => {
      const xEnd = direction === 'right' ? x + length : x - length;
      const controlX = direction === 'right' ? x + length/2 : x - length/2;
      return `M${x},${y} Q${controlX},${y + length/2} ${xEnd},${y + length}`;
    };
    
    // Generate a connection path between two plants
    const generateConnection = (x1, y1, x2, y2) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 + 20; // Add a curve to the connection
      return `M${x1},${y1} Q${midX},${midY} ${x2},${y2}`;
    };
    
    // =============================================
    // Plant Components
    // =============================================
    
    // Base Plant Component
    const Plant = ({ type, x, y, size, growth, selected, onClick, label }) => {
      // Define colors based on plant type
      const colors = {
        concept: {
          stem: 'url(#stemGradient)',
          leaf: 'url(#leafGradient)',
          flower: 'url(#flowerGradient)',
          flowerCenter: '#fdba74'
        },
        document: {
          stem: 'url(#documentStemGradient)',
          leaf: 'url(#documentLeafGradient)',
          flower: 'url(#documentFlowerGradient)',
          flowerCenter: '#93c5fd'
        },
        code: {
          stem: 'url(#codeStemGradient)',
          leaf: 'url(#codeLeafGradient)',
          flower: 'url(#codeFlowerGradient)',
          flowerCenter: '#c084fc'
        },
        user: {
          stem: 'url(#userStemGradient)',
          leaf: 'url(#userLeafGradient)',
          flower: 'url(#userFlowerGradient)',
          flowerCenter: '#fdba74'
        }
      };
      
      // Calculate plant properties based on growth
      const stemHeight = 25 + growth * 30;
      const leafSize = 5 + growth * 10;
      const rootLength = 10 + growth * 15;
      const flowerSize = growth > 0.6 ? 4 + (growth - 0.6) * 20 : 0;
      
      // Determine filter based on growth and selection
      let filter = '';
      if (selected) {
        filter = 'url(#plantGlow)';
      } else if (growth > 0.9) {
        filter = 'url(#flourishingGlow)';
      } else if (growth > 0.7) {
        filter = 'url(#plantGlow)';
      }
      
      return (
        <g onClick={onClick} style={{ cursor: 'pointer' }} filter={filter}>
          {/* Roots */}
          {growth > 0.3 && (
            <>
              <path 
                d={generateRoot(x, y, rootLength, 'right')} 
                stroke="url(#rootGradient)" 
                strokeWidth={growth * 2} 
                fill="none" 
              />
              <path 
                d={generateRoot(x, y, rootLength * 0.8, 'left')} 
                stroke="url(#rootGradient)" 
                strokeWidth={growth * 1.5} 
                fill="none" 
              />
              {growth > 0.7 && (
                <path 
                  d={generateRoot(x, y, rootLength * 0.6, Math.random() > 0.5 ? 'right' : 'left')} 
                  stroke="url(#rootGradient)" 
                  strokeWidth={growth} 
                  fill="none" 
                />
              )}
            </>
          )}
          
          {/* Stem */}
          <path 
            d={generateStem(x, y, stemHeight, 1 + growth * 3)} 
            stroke={colors[type].stem} 
            strokeWidth={1 + growth * 3} 
            fill="none" 
          />
          
          {/* Leaves */}
          {growth > 0.2 && (
            <>
              <path 
                d={generateLeaf(x, y - stemHeight * 0.3, leafSize, 'right')} 
                fill={colors[type].leaf} 
              />
              {growth > 0.4 && (
                <path 
                  d={generateLeaf(x, y - stemHeight * 0.5, leafSize * 0.8, 'left')} 
                  fill={colors[type].leaf} 
                />
              )}
              {growth > 0.6 && (
                <path 
                  d={generateLeaf(x, y - stemHeight * 0.7, leafSize * 0.9, 'right')} 
                  fill={colors[type].leaf} 
                />
              )}
            </>
          )}
          
          {/* Flower/Fruit */}
          {flowerSize > 0 && (
            <>
              <circle 
                cx={x} 
                cy={y - stemHeight - flowerSize/2} 
                r={flowerSize} 
                fill={colors[type].flower} 
              />
              <circle 
                cx={x} 
                cy={y - stemHeight - flowerSize/2} 
                r={flowerSize * 0.4} 
                fill={colors[type].flowerCenter} 
              />
            </>
          )}
          
          {/* Selection indicator */}
          {selected && (
            <circle 
              cx={x} 
              cy={y} 
              r={8} 
              fill="none" 
              stroke="#5eead4" 
              strokeWidth={1.5} 
              strokeDasharray="2,2" 
              className="pulse" 
            />
          )}
          
          {/* Plant label */}
          <text 
            x={x} 
            y={y + 20} 
            textAnchor="middle" 
            fill="#ecfdf5" 
            fontSize={10} 
            className="plant-label"
          >
            {label}
          </text>
          <text 
            x={x} 
            y={y + 35} 
            textAnchor="middle" 
            fill="#d1fae5" 
            fontSize={8} 
            className="plant-label"
          >
            Growth: {Math.round(growth * 100)}%
          </text>
        </g>
      );
    };
    
    // Plant Connection Component
    const PlantConnection = ({ x1, y1, x2, y2, label, isActive }) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 + 10;
      
      return (
        <g>
          <path 
            d={generateConnection(x1, y1, x2, y2)} 
            stroke="#a16207" 
            strokeWidth={1.5} 
            strokeDasharray="5,3" 
            fill="none" 
            className={isActive ? "connection-root" : ""}
          />
          {label && (
            <text 
              x={midX} 
              y={midY - 10} 
              textAnchor="middle" 
              fill="#fdba74" 
              fontSize={8}
            >
              {label}
            </text>
          )}
          {isActive && (
            <circle 
              cx={midX} 
              cy={midY} 
              r={6} 
              fill="#facc15" 
              opacity={0.8} 
              className="pulse"
            />
          )}
        </g>
      );
    };
    
    // =============================================
    // Tool Components
    // =============================================
    
    // Tool Button Component
    const ToolButton = ({ x, y, isActive, onClick, children }) => {
      return (
        <g onClick={onClick} style={{ cursor: 'pointer' }}>
          <rect 
            x={x} 
            y={y} 
            width={30} 
            height={40} 
            rx={5} 
            fill={isActive ? "url(#activeButtonGradient)" : "url(#buttonGradient)"} 
            stroke="#5eead4" 
            strokeWidth={1} 
            className={`tool-button ${isActive ? 'active' : ''}`}
          />
          {children}
        </g>
      );
    };
    
    // Water Tool
    const WaterTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <path 
            d="M30,70 C35,75 40,85 30,90 C20,85 25,75 30,70" 
            fill="#22d3ee" 
            transform={`translate(${x-15}, ${y-60})`}
          />
          <path 
            d="M30,90 L30,95" 
            stroke="#22d3ee" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-60})`}
          />
        </ToolButton>
      );
    };
    
    // Pruning Tool
    const PruningTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <path 
            d="M23,120 L35,140 M35,120 L23,140" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-100})`}
          />
          <path 
            d="M20,140 C20,135 25,135 25,140" 
            fill="none" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-100})`}
          />
          <path 
            d="M40,140 C40,135 35,135 35,140" 
            fill="none" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-100})`}
          />
        </ToolButton>
      );
    };
    
    // Fertilizer Tool
    const FertilizerTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <rect 
            x={x+7} 
            y={y+10} 
            width={16} 
            height={20} 
            fill="#a16207" 
          />
          <path 
            d="M25,170 L25,165 L35,165 L35,170" 
            stroke="#a16207" 
            strokeWidth={1.5} 
            fill="none" 
            transform={`translate(${x-15}, ${y-150})`}
          />
        </ToolButton>
      );
    };
    
    // Cross-Pollination Tool
    const CrossPollinationTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <circle 
            cx={x+10} 
            cy={y+15} 
            r={5} 
            fill="#facc15" 
          />
          <circle 
            cx={x+20} 
            cy={y+25} 
            r={5} 
            fill="#facc15" 
          />
          <path 
            d="M26,222 L34,232" 
            stroke="#fef08a" 
            strokeWidth={1} 
            transform={`translate(${x-15}, ${y-210})`}
          />
        </ToolButton>
      );
    };
    
    // Transplanting Tool
    const TransplantingTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <path 
            d="M30,270 L30,290 M25,275 L35,275" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-250})`}
          />
          <path 
            d="M25,280 C20,285 25,295 30,295 C35,295 40,285 35,280" 
            fill="none" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-250})`}
          />
        </ToolButton>
      );
    };
    
    // Soil Analysis Tool
    const SoilAnalysisTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <circle 
            cx={x+15} 
            cy={y+15} 
            r={10} 
            fill="none" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
          />
          <path 
            d="M27,322 L33,328 M33,322 L27,328" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-310})`}
          />
        </ToolButton>
      );
    };
    
    // Weather Control Tool
    const WeatherControlTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <circle 
            cx={x+15} 
            cy={y+15} 
            r={8} 
            fill="#0ea5e9" 
            opacity={0.7} 
          />
          <path 
            d="M25,370 L35,380 M35,370 L25,380" 
            stroke="#ecfdf5" 
            strokeWidth={0.5} 
            transform={`translate(${x-15}, ${y-360})`}
          />
        </ToolButton>
      );
    };
    
    // Time-Lapse Tool
    const TimeLapseTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <path 
            d="M30,420 L30,440 M25,425 L30,420 L35,425" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-400})`}
          />
          <path 
            d="M25,435 L30,440 L35,435" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-400})`}
          />
        </ToolButton>
      );
    };
    
    // Harvest Tool
    const HarvestTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <path 
            d="M25,470 C20,480 30,490 35,480" 
            fill="none" 
            stroke="#ecfdf5" 
            strokeWidth={1.5} 
            transform={`translate(${x-15}, ${y-450})`}
          />
          <path 
            d="M30,475 L34,473" 
            stroke="#ecfdf5" 
            strokeWidth={1} 
            transform={`translate(${x-15}, ${y-450})`}
          />
        </ToolButton>
      );
    };
    
    // Seed Library Tool
    const SeedLibraryTool = ({ x, y, isActive, onClick }) => {
      return (
        <ToolButton x={x} y={y} isActive={isActive} onClick={onClick}>
          <circle 
            cx={x+10} 
            cy={y+15} 
            r={5} 
            fill="#a3e635" 
          />
          <circle 
            cx={x+20} 
            cy={y+15} 
            r={3} 
            fill="#84cc16" 
          />
          <circle 
            cx={x+15} 
            cy={y+25} 
            r={4} 
            fill="#65a30d" 
          />
        </ToolButton>
      );
    };
    
    // =============================================
    // Panel Components
    // =============================================
    
    // Garden Bed Component
    const GardenBed = ({ x, y, width, height, label, type, children }) => {
      let soilClass = 'soil-texture';
      let borderColor = '#facc15';
      
      switch (type) {
        case 'concept':
          soilClass = 'rich-soil';
          borderColor = '#facc15';
          break;
        case 'document':
          soilClass = 'soil-texture';
          borderColor = '#3b82f6';
          break;
        case 'code':
          soilClass = 'soil-texture';
          borderColor = '#a855f7';
          break;
        case 'user':
          soilClass = 'soil-texture';
          borderColor = '#f97316';
          break;
        default:
          soilClass = 'poor-soil';
          borderColor = '#a1a1aa';
      }
      
      return (
        <g>
          <rect 
            x={x} 
            y={y} 
            width={width} 
            height={height} 
            rx={10} 
            className={soilClass}
            stroke={borderColor} 
            strokeWidth={1} 
            strokeDasharray="5,2" 
          />
          <text 
            x={x + 20} 
            y={y + 20} 
            fill={type === 'concept' ? '#d9f99d' : 
                 type === 'document' ? '#bfdbfe' : 
                 type === 'code' ? '#e9d5ff' : 
                 type === 'user' ? '#ffedd5' : '#d4d4d8'} 
            fontSize={14} 
            fontWeight="bold"
            className="garden-label"
          >
            {label}
          </text>
          {children}
        </g>
      );
    };
    
    // Environmental Control Slider
    const Slider = ({ x, y, width, label, value, onChange, min = 0, max = 100, leftLabel, rightLabel }) => {
      const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / width;
        const newValue = min + percentage * (max - min);
        onChange(Math.max(min, Math.min(max, newValue)));
      };
      
      const percentage = ((value - min) / (max - min)) * 100;
      
      return (
        <g>
          <text 
            x={x} 
            y={y} 
            fill="#ecfdf5" 
            fontSize={12}
          >
            {label}:
          </text>
          <g onClick={handleClick} style={{ cursor: 'pointer' }}>
            <rect 
              x={x + 90} 
              y={y - 10} 
              width={width} 
              height={10} 
              rx={5} 
              fill="#0f766e" 
              stroke="#5eead4" 
              strokeWidth={1} 
            />
            <rect 
              x={x + 90} 
              y={y - 10} 
              width={width * percentage / 100} 
              height={10} 
              rx={5} 
              fill="#10b981" 
            />
            <circle 
              cx={x + 90 + (width * percentage / 100)} 
              cy={y - 5} 
              r={6} 
              fill="#ecfdf5" 
              stroke="#047857" 
              strokeWidth={1} 
              className="slider-thumb"
            />
          </g>
          {leftLabel && (
            <text 
              x={x + 90} 
              y={y + 15} 
              fill="#ecfdf5" 
              fontSize={10}
            >
              {leftLabel}
            </text>
          )}
          {rightLabel && (
            <text 
              x={x + 90 + width} 
              y={y + 15} 
              fill="#ecfdf5" 
              fontSize={10} 
              textAnchor="end"
            >
              {rightLabel}
            </text>
          )}
        </g>
      );
    };
    
    // Season Control
    const SeasonControl = ({ x, y, season, onChange }) => {
      const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
      const seasonIndex = seasons.indexOf(season);
      
      const handleClick = () => {
        const nextIndex = (seasonIndex + 1) % seasons.length;
        onChange(seasons[nextIndex]);
      };
      
      return (
        <g onClick={handleClick} style={{ cursor: 'pointer' }}>
          <circle 
            cx={x} 
            cy={y} 
            r={15} 
            fill="#0f766e" 
            stroke="#5eead4" 
            strokeWidth={1} 
          />
          <path 
            d={`M${x},${y-15} A15,15 0 0,1 ${x+15},${y} L${x},${y} Z`} 
            fill={seasonIndex === 0 ? "#6ee7b7" : "#0f766e"} 
            opacity={seasonIndex === 0 ? 0.9 : 0.3} 
            className="season-indicator"
          />
          <path 
            d={`M${x},${y-15} A15,15 0 0,0 ${x-15},${y} L${x},${y} Z`} 
            fill={seasonIndex === 1 ? "#10b981" : "#0f766e"} 
            opacity={seasonIndex === 1 ? 0.9 : 0.3} 
            className="season-indicator"
          />
          <path 
            d={`M${x},${y+15} A15,15 0 0,0 ${x-15},${y} L${x},${y} Z`} 
            fill={seasonIndex === 2 ? "#f59e0b" : "#0f766e"} 
            opacity={seasonIndex === 2 ? 0.9 : 0.3} 
            className="season-indicator"
          />
          <path 
            d={`M${x},${y+15} A15,15 0 0,1 ${x+15},${y} L${x},${y} Z`} 
            fill={seasonIndex === 3 ? "#d97706" : "#0f766e"} 
            opacity={seasonIndex === 3 ? 0.9 : 0.3} 
            className="season-indicator"
          />
          <text 
            x={x} 
            y={y+3} 
            textAnchor="middle" 
            fill="#ecfdf5" 
            fontSize={7}
          >
            {season}
          </text>
          <text 
            x={x} 
            y={y+25} 
            textAnchor="middle" 
            fill="#ecfdf5" 
            fontSize={10}
          >
            Season
          </text>
        </g>
      );
    };
    
    // Metrics Chart
    const MetricsChart = ({ x, y, width, height, title, data }) => {
      const maxValue = Math.max(...data);
      const points = data.map((value, index) => {
        const pointX = x + 10 + (index * (width - 20)) / (data.length - 1);
        const pointY = y + height - 10 - ((value / maxValue) * (height - 20));
        return `${pointX},${pointY}`;
      }).join(' ');
      
      return (
        <g>
          <rect 
            x={x} 
            y={y} 
            width={width} 
            height={height} 
            rx={5} 
            fill="#065f46" 
            stroke="#5eead4" 
            strokeWidth={1} 
          />
          <text 
            x={x} 
            y={y + 15} 
            fill="#ecfdf5" 
            fontSize={10}
          >
            {title}
          </text>
          <line 
            x1={x + 10} 
            y1={y + height - 10} 
            x2={x + width - 10} 
            y2={y + height - 10} 
            stroke="#0d9488" 
            strokeWidth={1} 
          />
          <line 
            x1={x + 10} 
            y1={y + height - 10} 
            x2={x + 10} 
            y2={y + 20} 
            stroke="#0d9488" 
            strokeWidth={1} 
          />
          <polyline 
            points={points} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth={2} 
          />
          <text 
            x={x + 5} 
            y={y + 30} 
            fill="#ecfdf5" 
            fontSize={8}
          >
            100%
          </text>
          <text 
            x={x + 5} 
            y={y + height - 30} 
            fill="#ecfdf5" 
            fontSize={8}
          >
            50%
          </text>
          <text 
            x={x + 5} 
            y={y + height - 10} 
            fill="#ecfdf5" 
            fontSize={8}
          >
            0%
          </text>
          <text 
            x={x + 10} 
            y={y + height} 
            fill="#ecfdf5" 
            fontSize={8}
          >
            1d
          </text>
          <text 
            x={x + (width / 2)} 
            y={y + height} 
            fill="#ecfdf5" 
            fontSize={8}
          >
            3d
          </text>
          <text 
            x={x + width - 10} 
            y={y + height} 
            fill="#ecfdf5" 
            fontSize={8}
          >
            5d
          </text>
        </g>
      );
    };
    
    // Progress Bar (for diversity index, etc.)
    const ProgressBar = ({ x, y, width, height, value, label, max = 100 }) => {
      const percentage = (value / max) * 100;
      
      return (
        <g>
          <rect 
            x={x} 
            y={y} 
            width={width} 
            height={height} 
            rx={height / 2} 
            fill="#0d9488" 
          />
          <rect 
            x={x} 
            y={y} 
            width={(width * percentage) / 100} 
            height={height} 
            rx={height / 2} 
            fill="#10b981" 
          />
          <text 
            x={x + width / 2} 
            y={y + height / 2 + 3} 
            textAnchor="middle" 
            fill="#ecfdf5" 
            fontSize={10}
          >
            {label || `${Math.round(percentage)}%`}
          </text>
        </g>
      );
    };
    
    // Seed Item Component
    const SeedItem = ({ x, y, color, label, onClick }) => {
      return (
        <g onClick={onClick} style={{ cursor: 'pointer' }}>
          <circle 
            cx={x} 
            cy={y} 
            r={10} 
            fill={color} 
          />
          <text 
            x={x + 25} 
            y={y + 3} 
            fill="#ecfdf5" 
            fontSize={9}
          >
            {label}
          </text>
          <text 
            x={x + 80} 
            y={y + 3} 
            fill="#ecfdf5" 
            fontSize={9}
            textAnchor="end"
          >
            Plant
          </text>
        </g>
      );
    };
    
    // Harvested Item Component
    const HarvestedItem = ({ x, y, width, height, title, type, content, maturity, sources, crossRefs }) => {
      // Define flower colors based on type
      const colors = {
        concept: 'url(#flowerGradient)',
        document: 'url(#documentFlowerGradient)',
        code: 'url(#codeFlowerGradient)',
        user: 'url(#userFlowerGradient)'
      };
      
      const centerColors = {
        concept: '#fdba74',
        document: '#93c5fd',
        code: '#c084fc',
        user: '#fdba74'
      };
      
      return (
        <g>
          <rect 
            x={x} 
            y={y} 
            width={width} 
            height={height} 
            rx={5} 
            fill="#065f46" 
            stroke="#5eead4" 
            strokeWidth={1} 
          />
          <circle 
            cx={x + 20} 
            cy={y + 20} 
            r={12} 
            fill={colors[type]} 
          />
          <circle 
            cx={x + 20} 
            cy={y + 20} 
            r={5} 
            fill={centerColors[type]} 
          />
          <text 
            x={x + 40} 
            y={y + 15} 
            fill="#ecfdf5" 
            fontSize={10} 
            fontWeight="bold"
          >
            {title}
          </text>
          {content.map((line, index) => (
            <text 
              key={index}
              x={x + 40} 
              y={y + 30 + index * 12} 
              fill="#d1fae5" 
              fontSize={8}
            >
              {line}
            </text>
          ))}
          <text 
            x={x + 40} 
            y={y + height - 10} 
            fill="#a7f3d0" 
            fontSize={8}
          >
            Maturity: {maturity}% • Sources: {sources} • Cross-refs: {crossRefs}
          </text>
        </g>
      );
    };
    
    // =============================================
    // Tooltip Component
    // =============================================
    
    const Tooltip = ({ x, y, width, height, title, content, visible }) => {
      return (
        <g className="tooltip" style={{ opacity: visible ? 1 : 0 }}>
          <rect 
            x={x} 
            y={y} 
            width={width} 
            height={height} 
            rx={5} 
            fill="#064e3b" 
            stroke="#10b981" 
            strokeWidth={1} 
            opacity={0.9} 
          />
          <text 
            x={x + 10} 
            y={y + 20} 
            fill="#ecfdf5" 
            fontSize={10} 
            fontWeight="bold"
          >
            {title}
          </text>
          {content.map((line, index) => (
            <text 
              key={index}
              x={x + 10} 
              y={y + 35 + index * 15} 
              fill="#d1fae5" 
              fontSize={8}
            >
              {line}
            </text>
          ))}
        </g>
      );
    };
    
    // =============================================
    // Main App Component
    // =============================================
    
    const EvolutionaryKnowledgeGarden = () => {
      // State management
      const [plants, setPlants] = useState([
        { id: 1, type: 'concept', x: 220, y: 200, growth: 0.98, label: 'Machine Learning', connections: [2, 3] },
        { id: 2, type: 'concept', x: 150, y: 180, growth: 0.75, label: 'Neural Networks', connections: [] },
        { id: 3, type: 'concept', x: 310, y: 190, growth: 0.3, label: 'Large Language Models', connections: [] },
        { id: 4, type: 'document', x: 600, y: 180, growth: 0.85, label: 'Research Paper', connections: [] },
        { id: 5, type: 'document', x: 680, y: 190, growth: 0.42, label: 'Dataset Metadata', connections: [] },
        { id: 6, type: 'code', x: 250, y: 420, growth: 0.8, label: 'Optimization Algorithm', connections: [8] },
        { id: 7, type: 'code', x: 330, y: 430, growth: 0.35, label: 'Test Functions', connections: [] },
        { id: 8, type: 'user', x: 600, y: 430, growth: 0.72, label: 'Project Notes', connections: [] }
      ]);
      
      const [connections, setConnections] = useState([
        { from: 1, to: 4, label: 'Supports', isActive: false },
        { from: 1, to: 6, label: 'Implements', isActive: false },
        { from: 6, to: 8, label: 'Explains', isActive: false },
        { from: 2, to: 5, label: 'Cross-pollinating', isActive: true }
      ]);
      
      const [selectedPlantId, setSelectedPlantId] = useState(1);
      const [activeTool, setActiveTool] = useState('water');
      const [season, setSeason] = useState('Spring');
      const [environmentSettings, setEnvironmentSettings] = useState({
        growthRate: 70,
        soilFertility: 85,
        waterLevel: 60
      });
      
      const [waterDroplets, setWaterDroplets] = useState([]);
      const [tooltipInfo, setTooltipInfo] = useState({
        visible: false,
        x: 0,
        y: 0,
        title: '',
        content: []
      });
      
      const [harvestedItems] = useState([
        {
          id: 1,
          title: 'ML Performance Insight',
          type: 'concept',
          content: [
            'The optimization algorithm shows 15% better',
            'performance on large language model tasks.'
          ],
          maturity: 95,
          sources: 3,
          crossRefs: 2
        },
        {
          id: 2,
          title: 'Research Summary',
          type: 'document',
          content: [
            'Comprehensive overview of current LLM',
            'approaches with benchmark results.'
          ],
          maturity: 85,
          sources: 5,
          crossRefs: 4
        },
        {
          id: 3,
          title: 'Code Implementation',
          type: 'code',
          content: [
            'Refined optimization algorithm with',
            'documentation and test cases.'
          ],
          maturity: 80,
          sources: 2,
          crossRefs: 3
        }
      ]);
      
      const [seedLibrary] = useState([
        { id: 1, type: 'document', color: '#93c5fd', label: 'Technical Report' },
        { id: 2, type: 'document', color: '#60a5fa', label: 'Dataset Description' },
        { id: 3, type: 'concept', color: '#a3e635', label: 'New Algorithm' },
        { id: 4, type: 'code', color: '#c084fc', label: 'Demo Implementation' },
        { id: 5, type: 'user', color: '#fdba74', label: 'Personal Notes' },
        { id: 6, type: 'media', color: '#f9a8d4', label: 'Visualization' }
      ]);
      
      // Metrics data
      const gardenHealth = [50, 55, 60, 65, 75, 70, 90];
      
      // Effect to handle keyboard shortcuts
      useEffect(() => {
        const handleKeyDown = (e) => {
          switch(e.key.toLowerCase()) {
            case 'w': setActiveTool('water'); break;
            case 'p': setActiveTool('prune'); break;
            case 'f': setActiveTool('fertilize'); break;
            case 'x': setActiveTool('crossPollinate'); break;
            case 's': setActiveTool('soilAnalysis'); break;
            case 't': setActiveTool('timeLapse'); break;
            case 'h': setActiveTool('harvest'); break;
            default: break;
          }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, []);
      
      // Handle plant selection
      const handlePlantClick = (id) => {
        setSelectedPlantId(id);
        
        // Show tooltip for the selected plant
        const plant = plants.find(p => p.id === id);
        if (plant) {
          setTooltipInfo({
            visible: true,
            x: plant.x - 90,
            y: plant.y - 60,
            title: plant.label,
            content: [
              `Growth: ${Math.round(plant.growth * 100)}% • Age: 15 days`,
              `Connections: ${plant.connections.length} • Knowledge yield: ${plant.growth > 0.8 ? 'High' : plant.growth > 0.5 ? 'Medium' : 'Low'}`
            ]
          });
          
          // Hide tooltip after a delay
          setTimeout(() => {
            setTooltipInfo(prev => ({ ...prev, visible: false }));
          }, 3000);
        }
      };
      
      // Handle tool activation
      const handleToolClick = (tool) => {
        setActiveTool(tool);
        
        if (tool === 'water') {
          // Create water droplets animation effect
          const selectedPlant = plants.find(p => p.id === selectedPlantId);
          if (selectedPlant) {
            const newDroplets = [];
            for (let i = 0; i < 5; i++) {
              newDroplets.push({
                id: Date.now() + i,
                x: selectedPlant.x + (Math.random() * 20 - 10),
                y: selectedPlant.y - 20 - (Math.random() * 20),
                opacity: 0.8
              });
            }
            setWaterDroplets([...waterDroplets, ...newDroplets]);
            
            // Remove droplets after animation
            setTimeout(() => {
              setWaterDroplets(prev => prev.filter(d => !newDroplets.some(nd => nd.id === d.id)));
            }, 1500);
            
            // Increase plant growth
            setPlants(prev => prev.map(p => 
              p.id === selectedPlantId ? { ...p, growth: Math.min(1, p.growth + 0.05) } : p
            ));
            
            // Show watering tooltip
            setTooltipInfo({
              visible: true,
              x: selectedPlant.x - 70,
              y: selectedPlant.y + 230,
              title: `Watering ${selectedPlant.label}...`,
              content: [
                `Attention +15% • Growth +8%`
              ]
            });
            
            // Hide tooltip after a delay
            setTimeout(() => {
              setTooltipInfo(prev => ({ ...prev, visible: false }));
            }, 2000);
          }
        }
      };
      
      // Handle environmental control changes
      const handleEnvironmentChange = (setting, value) => {
        setEnvironmentSettings(prev => ({
          ...prev,
          [setting]: value
        }));
      };
      
      return (
        <svg viewBox="0 0 1200 800" width="1200" height="800">
          {/* Definitions */}
          <defs>
            {/* Main background gradient */}
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#052e16" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            
            {/* Soil gradients */}
            <linearGradient id="soilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#422006" />
              <stop offset="100%" stopColor="#292524" />
            </linearGradient>
            
            <linearGradient id="richSoilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c2d12" />
              <stop offset="100%" stopColor="#422006" />
            </linearGradient>
            
            <linearGradient id="poorSoilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#44403c" />
              <stop offset="100%" stopColor="#292524" />
            </linearGradient>
            
            {/* Plant gradients */}
            <linearGradient id="stemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#65a30d" />
              <stop offset="100%" stopColor="#4d7c0f" />
            </linearGradient>
            
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#65a30d" />
            </linearGradient>
            
            <linearGradient id="flowerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
            
            <linearGradient id="rootGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            
            {/* Document/fact plants */}
            <linearGradient id="documentStemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            
            <linearGradient id="documentLeafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            
            <linearGradient id="documentFlowerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            
            {/* Code plants */}
            <linearGradient id="codeStemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
            
            <linearGradient id="codeLeafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
            
            <linearGradient id="codeFlowerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            
            {/* User content plants */}
            <linearGradient id="userStemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
            
            <linearGradient id="userLeafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            
            <linearGradient id="userFlowerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fdba74" />
            </linearGradient>
            
            {/* Panel gradients */}
            <linearGradient id="panelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.9" />
            </linearGradient>
            
            <linearGradient id="toolPanelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#115e59" />
            </linearGradient>
            
            <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            
            <linearGradient id="activeButtonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            
            {/* Filters */}
            <filter id="plantGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="flourishingGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="blurFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          
          {/* Main background */}
          <rect width="1200" height="800" fill="url(#bgGradient)" />
          
          {/* Header bar */}
          <rect x="0" y="0" width="1200" height="40" fill="#052e16" />
          <text x="20" y="25" fontFamily="Inter, sans-serif" fontSize="16" fill="#ecfdf5" fontWeight="bold">
            Evolutionary Knowledge Garden
          </text>
          <text x="1180" y="25" fontFamily="Inter, sans-serif" fontSize="14" fill="#ecfdf5" textAnchor="end">
            Garden Health: 87%
          </text>
          
          {/* Main garden view area */}
          <rect x="60" y="50" width="880" height="560" rx="5" fill="#064e3b" stroke="#0d9488" strokeWidth="1" />
          
          {/* Garden beds */}
          <GardenBed 
            x={80} 
            y={70} 
            width={400} 
            height={250} 
            label="Core Concepts" 
            type="concept"
          />
          
          <GardenBed 
            x={520} 
            y={70} 
            width={400} 
            height={250} 
            label="Documents and Facts" 
            type="document"
          />
          
          <GardenBed 
            x={80} 
            y={340} 
            width={400} 
            height={250} 
            label="Code and Implementations" 
            type="code"
          />
          
          <GardenBed 
            x={520} 
            y={340} 
            width={400} 
            height={250} 
            label="User Notes and Insights" 
            type="user"
          />
          
          {/* Plant connections */}
          {connections.map((connection) => {
            const fromPlant = plants.find(p => p.id === connection.from);
            const toPlant = plants.find(p => p.id === connection.to);
            
            if (fromPlant && toPlant) {
              return (
                <PlantConnection 
                  key={`connection-${connection.from}-${connection.to}`}
                  x1={fromPlant.x}
                  y1={fromPlant.y}
                  x2={toPlant.x}
                  y2={toPlant.y}
                  label={connection.label}
                  isActive={connection.isActive}
                />
              );
            }
            
            return null;
          })}
          
          {/* Plants */}
          {plants.map((plant) => (
            <Plant 
              key={plant.id}
              type={plant.type}
              x={plant.x}
              y={plant.y}
              size={50}
              growth={plant.growth}
              selected={plant.id === selectedPlantId}
              onClick={() => handlePlantClick(plant.id)}
              label={plant.label}
            />
          ))}
          
          {/* Water droplets animation */}
          {waterDroplets.map((droplet) => (
            <circle 
              key={droplet.id}
              cx={droplet.x}
              cy={droplet.y}
              r={3}
              fill="#22d3ee"
              opacity={droplet.opacity}
              className="water-droplet"
            />
          ))}
          
          {/* Weather effects */}
          <g opacity="0.3" filter="url(#blurFilter)">
            <circle cx="200" cy="180" r="40" fill="#d9f99d" opacity="0.1" />
            <circle cx="600" cy="200" r="50" fill="#bae6fd" opacity="0.1" />
            <circle cx="350" cy="450" r="35" fill="#c084fc" opacity="0.1" />
          </g>
          
          {/* Environmental controls panel */}
          <rect x="60" y="620" width="880" height="40" rx="5" fill="url(#panelGradient)" stroke="#0d9488" strokeWidth="1" />
          
          {/* Season cycle */}
          <SeasonControl 
            x={140} 
            y={640} 
            season={season} 
            onChange={setSeason} 
          />
          
          {/* Growth rate slider */}
          <Slider 
            x={210} 
            y={635} 
            width={100} 
            label="Growth Rate" 
            value={environmentSettings.growthRate} 
            onChange={(value) => handleEnvironmentChange('growthRate', value)} 
            leftLabel="Normal" 
            rightLabel="Accelerated" 
          />
          
          {/* Soil fertility slider */}
          <Slider 
            x={450} 
            y={635} 
            width={100} 
            label="Soil Fertility" 
            value={environmentSettings.soilFertility} 
            onChange={(value) => handleEnvironmentChange('soilFertility', value)} 
            leftLabel="Low" 
            rightLabel="High" 
          />
          
          {/* Water level slider */}
          <Slider 
            x={690} 
            y={635} 
            width={100} 
            label="Water Level" 
            value={environmentSettings.waterLevel} 
            onChange={(value) => handleEnvironmentChange('waterLevel', value)} 
            leftLabel="Dry" 
            rightLabel="Moist" 
          />
          
          {/* Gardening tools panel */}
          <rect x="10" y="50" width="40" height="560" rx="5" fill="url(#toolPanelGradient)" stroke="#0d9488" strokeWidth="1" />
          
          {/* Tools */}
          <WaterTool 
            x={15} 
            y={60} 
            isActive={activeTool === 'water'} 
            onClick={() => handleToolClick('water')} 
          />
          
          <PruningTool 
            x={15} 
            y={110} 
            isActive={activeTool === 'prune'} 
            onClick={() => handleToolClick('prune')} 
          />
          
          <FertilizerTool 
            x={15} 
            y={160} 
            isActive={activeTool === 'fertilize'} 
            onClick={() => handleToolClick('fertilize')} 
          />
          
          <CrossPollinationTool 
            x={15} 
            y={210} 
            isActive={activeTool === 'crossPollinate'} 
            onClick={() => handleToolClick('crossPollinate')} 
          />
          
          <TransplantingTool 
            x={15} 
            y={260} 
            isActive={activeTool === 'transplant'} 
            onClick={() => handleToolClick('transplant')} 
          />
          
          <SoilAnalysisTool 
            x={15} 
            y={310} 
            isActive={activeTool === 'soilAnalysis'} 
            onClick={() => handleToolClick('soilAnalysis')} 
          />
          
          <WeatherControlTool 
            x={15} 
            y={360} 
            isActive={activeTool === 'weather'} 
            onClick={() => handleToolClick('weather')} 
          />
          
          <TimeLapseTool 
            x={15} 
            y={410} 
            isActive={activeTool === 'timeLapse'} 
            onClick={() => handleToolClick('timeLapse')} 
          />
          
          <HarvestTool 
            x={15} 
            y={460} 
            isActive={activeTool === 'harvest'} 
            onClick={() => handleToolClick('harvest')} 
          />
          
          <SeedLibraryTool 
            x={15} 
            y={510} 
            isActive={activeTool === 'seedLibrary'} 
            onClick={() => handleToolClick('seedLibrary')} 
          />
          
          {/* Right panel - Metrics */}
          <rect x="950" y="50" width="240" height="330" rx="5" fill="url(#panelGradient)" stroke="#0d9488" strokeWidth="1" />
          <text x="970" y="70" fontFamily="Inter, sans-serif" fontSize="14" fill="#ecfdf5" fontWeight="bold">
            Growth Metrics
          </text>
          
          {/* Garden Health Chart */}
          <MetricsChart 
            x={970} 
            y={80} 
            width={200} 
            height={100} 
            title="Garden Health Over Time" 
            data={gardenHealth} 
          />
          
          {/* Diversity Index */}
          <rect x="970" y="190" width="200" height="70" rx="5" fill="#065f46" stroke="#5eead4" strokeWidth="1" />
          <text x="970" y="205" fontFamily="Inter, sans-serif" fontSize="10" fill="#ecfdf5">
            Knowledge Diversity
          </text>
          
          <ProgressBar 
            x={980} 
            y={215} 
            width={180} 
            height={15} 
            value={80} 
          />
          
          <text x="980" y="245" fontFamily="Inter, sans-serif" fontSize="8" fill="#ecfdf5">
            Topic Breadth: High
          </text>
          <text x="1100" y="245" fontFamily="Inter, sans-serif" fontSize="8" fill="#ecfdf5">
            Depth: Medium
          </text>
          
          {/* Top Yielding Plants */}
          <rect x="970" y="270" width="200" height="100" rx="5" fill="#065f46" stroke="#5eead4" strokeWidth="1" />
          <text x="970" y="285" fontFamily="Inter, sans-serif" fontSize="10" fill="#ecfdf5">
            Top Yielding Plants
          </text>
          
          <text x="980" y="305" fontFamily="Inter, sans-serif" fontSize="9" fill="#ecfdf5">
            1. Machine Learning
          </text>
          <ProgressBar 
            x={1070} 
            y={298} 
            width={90} 
            height={8} 
            value={90} 
            max={100} 
            label="" 
          />
          
          <text x="980" y="325" fontFamily="Inter, sans-serif" fontSize="9" fill="#ecfdf5">
            2. Research Paper
          </text>
          <ProgressBar 
            x={1070} 
            y={318} 
            width={90} 
            height={8} 
            value={85} 
            max={100} 
            label="" 
          />
          
          <text x="980" y="345" fontFamily="Inter, sans-serif" fontSize="9" fill="#ecfdf5">
            3. Optimization Algorithm
          </text>
          <ProgressBar 
            x={1070} 
            y={338} 
            width={90} 
            height={8} 
            value={80} 
            max={100} 
            label="" 
          />
          
          {/* Seed Library Panel */}
          <rect x="950" y="390" width="240" height="270" rx="5" fill="url(#panelGradient)" stroke="#0d9488" strokeWidth="1" />
          <text x="970" y="410" fontFamily="Inter, sans-serif" fontSize="14" fill="#ecfdf5" fontWeight="bold">
            Seed Library
          </text>
          
          {/* Seed category tabs */}
          <rect x="970" y="420" width="60" height="25" rx="5" fill="url(#activeButtonGradient)" stroke="#5eead4" strokeWidth="1" />
          <text x="1000" y="437" fontFamily="Inter, sans-serif" fontSize="10" fill="#ecfdf5" textAnchor="middle">
            All
          </text>
          
          <rect x="1040" y="420" width="60" height="25" rx="5" fill="url(#buttonGradient)" stroke="#5eead4" strokeWidth="1" />
          <text x="1070" y="437" fontFamily="Inter, sans-serif" fontSize="10" fill="#ecfdf5" textAnchor="middle">
            Docs
          </text>
          
          <rect x="1110" y="420" width="60" height="25" rx="5" fill="url(#buttonGradient)" stroke="#5eead4" strokeWidth="1" />
          <text x="1140" y="437" fontFamily="Inter, sans-serif" fontSize="10" fill="#ecfdf5" textAnchor="middle">
            Code
          </text>
          
          {/* Seed container */}
          <rect x="970" y="455" width="200" height="195" rx="5" fill="#065f46" stroke="#5eead4" strokeWidth="1" />
          
          {/* Seed items */}
          {seedLibrary.map((seed, index) => (
            <SeedItem 
              key={seed.id}
              x={995}
              y={480 + index * 30}
              color={seed.color}
              label={seed.label}
              onClick={() => {}}
            />
          ))}
          
          {/* Harvest Basket */}
          <rect x="60" y="670" width="1130" height="120" rx="5" fill="url(#panelGradient)" stroke="#0d9488" strokeWidth="1" />
          <text x="80" y="690" fontFamily="Inter, sans-serif" fontSize="14" fill="#ecfdf5" fontWeight="bold">
            Harvest Basket
          </text>
          
          {/* Harvested items */}
          {harvestedItems.map((item, index) => (
            <HarvestedItem 
              key={item.id}
              x={80 + index * 230}
              y={700}
              width={220}
              height={80}
              title={item.title}
              type={item.type}
              content={item.content}
              maturity={item.maturity}
              sources={item.sources}
              crossRefs={item.crossRefs}
            />
          ))}
          
          {/* Growing insight (placeholder) */}
          <rect x="770" y="700" width="220" height="80" rx="5" fill="#0f766e" stroke="#5eead4" strokeWidth="1" opacity="0.7" />
          <g opacity="0.7">
            <circle cx="790" cy="720" r="12" fill="url(#flowerGradient)" opacity="0.7" />
            <circle cx="790" cy="720" r="5" fill="#fdba74" opacity="0.7" />
          </g>
          <text x="810" y="715" fontFamily="Inter, sans-serif" fontSize="10" fill="#ecfdf5" fontWeight="bold" opacity="0.7">
            Growing Insight
          </text>
          <text x="810" y="730" fontFamily="Inter, sans-serif" fontSize="8" fill="#d1fae5" opacity="0.7">
            Connection between LLMs and traditional
          </text>
          <text x="810" y="742" fontFamily="Inter, sans-serif" fontSize="8" fill="#d1fae5" opacity="0.7">
            optimization approaches...
          </text>
          <text x="810" y="760" fontFamily="Inter, sans-serif" fontSize="8" fill="#a7f3d0" opacity="0.7">
            Maturity: 45% • Sources: 2 • Cross-refs: 1
          </text>
          
          {/* Export button */}
          <rect x="1000" y="700" width="170" height="80" rx="5" fill="#059669" stroke="#5eead4" strokeWidth="1" />
          <text x="1085" y="730" fontFamily="Inter, sans-serif" fontSize="14" fill="#ecfdf5" fontWeight="bold" textAnchor="middle">
            Export
          </text>
          <text x="1085" y="750" fontFamily="Inter, sans-serif" fontSize="10" fill="#d1fae5" textAnchor="middle">
            Create knowledge bundle
          </text>
          
          {/* Tooltip */}
          <Tooltip 
            x={tooltipInfo.x}
            y={tooltipInfo.y}
            width={180}
            height={60}
            title={tooltipInfo.title}
            content={tooltipInfo.content}
            visible={tooltipInfo.visible}
          />
          
          {/* Keyboard shortcut guide */}
          <text x="600" y="785" fontFamily="Inter, sans-serif" fontSize="10" fill="#d1fae5" textAnchor="middle">
            SHORTCUTS: [W] Water • [P] Prune • [F] Fertilize • [X] Cross-pollinate • [S] Soil Analysis • [T] Time-lapse • [H] Harvest
          </text>
        </svg>
      );
    };
    
    // Render the application
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<EvolutionaryKnowledgeGarden />);
  </script>
</body>
</html>