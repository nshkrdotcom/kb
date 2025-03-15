<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ContextNexus Pro</title>
  
  <!-- React and ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- Babel for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }
    
    body {
      background-color: #1a1a1a;
      color: #e0e0e0;
      overflow: hidden;
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    
    ::-webkit-scrollbar-track {
      background: #2a2a2a;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #3d3d3d;
      border-radius: 5px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    
    /* Interactive elements */
    .interactive {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .interactive:hover {
      filter: brightness(1.2);
    }
    
    /* Transport controls */
    .transport-button {
      cursor: pointer;
      transition: all 0.1s ease;
    }
    
    .transport-button:hover {
      fill: #0084ff;
    }
    
    /* Timeline clips */
    .clip {
      cursor: pointer;
      transition: all 0.1s ease;
    }
    
    .clip:hover {
      filter: brightness(1.1);
    }
    
    .clip.selected {
      stroke: #0084ff;
      stroke-width: 2px;
    }
    
    /* Track styles */
    .track {
      transition: background-color 0.2s ease;
    }
    
    .track:hover {
      background-color: #333;
    }
    
    /* Button styles */
    .button {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .button:hover {
      filter: brightness(1.2);
    }
    
    .button.active {
      background-color: #0084ff;
      color: white;
    }
    
    /* Selection info panel */
    .info-panel {
      position: absolute;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    
    .info-panel.visible {
      opacity: 1;
      pointer-events: auto;
    }
    
    /* Timeline position indicator */
    .position-indicator {
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    // Destructure React hooks
    const { useState, useEffect, useRef } = React;
    
    // ========================
    // Component: App
    // ========================
    const App = () => {
      // State
      const [selectedTrack, setSelectedTrack] = useState('all');
      const [selectedClips, setSelectedClips] = useState(['churn-indicators', 'churn-analysis', 'predict-churn', 'chart-svg']);
      const [activeTool, setActiveTool] = useState('select');
      const [timelinePosition, setTimelinePosition] = useState(420); // X position
      const [timelineCompletion, setTimelineCompletion] = useState(38); // Percentage
      const [contextView, setContextView] = useState('timeline');
      const [showSelectionInfo, setShowSelectionInfo] = useState(true);
      const [tokenUsage, setTokenUsage] = useState({
        current: 7125,
        max: 10000,
        distribution: {
          demographics: 30,
          purchaseHistory: 50,
          churnAnalysis: 90,
          code: 40,
          attachments: 20,
          available: 110
        }
      });
      
      // Handle clip selection
      const handleClipSelect = (clipId) => {
        if (selectedClips.includes(clipId)) {
          setSelectedClips(selectedClips.filter(id => id !== clipId));
        } else {
          setSelectedClips([...selectedClips, clipId]);
        }
      };
      
      // Handle tool selection
      const handleToolSelect = (tool) => {
        setActiveTool(tool);
      };
      
      // Handle context view selection
      const handleContextViewSelect = (view) => {
        setContextView(view);
      };
      
      // Update timeline position
      const handleTimelineClick = (e) => {
        const timeline = e.currentTarget;
        const rect = timeline.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        
        setTimelinePosition(x + 200); // Add 200 for the left panel width
        setTimelineCompletion(Math.round((x / width) * 100));
      };
      
      return (
        <svg width="1200" height="800" viewBox="0 0 1200 800">
          {/* Main background */}
          <rect width="1200" height="800" fill="#1a1a1a"/>
          
          {/* Header Bar */}
          <HeaderBar />
          
          {/* Transport Controls */}
          <TransportControls 
            position={timelinePosition} 
            completion={timelineCompletion}
            onPositionChange={handleTimelineClick}
            activeTool={activeTool}
            onToolSelect={handleToolSelect}
          />
          
          {/* Left Panel - Track List */}
          <TrackList 
            selectedTrack={selectedTrack} 
            onTrackSelect={setSelectedTrack} 
          />
          
          {/* Time Ruler */}
          <TimeRuler />
          
          {/* Timeline Area */}
          <ContentTracks 
            selectedClips={selectedClips} 
            onClipSelect={handleClipSelect}
            position={timelinePosition}
          />
          
          {/* Context Composition Area */}
          <ContextComposition 
            activeView={contextView}
            onViewSelect={handleContextViewSelect}
            tokenUsage={tokenUsage}
            selectedClips={selectedClips}
          />
          
          {/* Selection Info Panel - only shown when clip is selected */}
          {showSelectionInfo && (
            <SelectionInfoPanel />
          )}
        </svg>
      );
    };
    
    // ========================
    // Component: HeaderBar
    // ========================
    const HeaderBar = () => {
      return (
        <g>
          <rect x="0" y="0" width="1200" height="40" fill="#2d2d2d"/>
          <text x="20" y="25" fontSize="16" fill="#e0e0e0" fontWeight="bold">ContextNexus Pro</text>
          
          <rect x="200" y="5" width="800" height="30" rx="5" fill="#3d3d3d" className="interactive"/>
          <text x="215" y="25" fontSize="14" fill="#e0e0e0">Project: Customer Behavior Analysis</text>
          
          <rect x="1100" y="5" width="80" height="30" rx="15" fill="#0084ff" className="interactive"/>
          <text x="1140" y="25" fontSize="14" fill="white" textAnchor="middle">Export</text>
        </g>
      );
    };
    
    // ========================
    // Component: TransportControls
    // ========================
    const TransportControls = ({ position, completion, onPositionChange, activeTool, onToolSelect }) => {
      return (
        <g>
          <rect x="0" y="40" width="1200" height="40" fill="#2d2d2d"/>
          
          {/* Transport Buttons */}
          <circle cx="30" cy="60" r="15" fill="#3d3d3d" stroke="#555" strokeWidth="1" className="transport-button"/>
          <text x="30" y="65" fontSize="14" fill="#e0e0e0" textAnchor="middle">⏮</text>
          
          <circle cx="70" cy="60" r="15" fill="#3d3d3d" stroke="#555" strokeWidth="1" className="transport-button"/>
          <text x="70" y="65" fontSize="14" fill="#e0e0e0" textAnchor="middle">⏹</text>
          
          <circle cx="110" cy="60" r="15" fill="#3d3d3d" stroke="#555" strokeWidth="1" className="transport-button"/>
          <text x="110" y="65" fontSize="14" fill="#e0e0e0" textAnchor="middle">⏵</text>
          
          <circle cx="150" cy="60" r="15" fill="#3d3d3d" stroke="#555" strokeWidth="1" className="transport-button"/>
          <text x="150" y="65" fontSize="14" fill="#e0e0e0" textAnchor="middle">⏭</text>
          
          {/* Timeline Position */}
          <g onClick={onPositionChange} className="interactive">
            <rect x="190" y="52" width="600" height="16" rx="8" fill="#3d3d3d"/>
            <rect x="190" y="52" width={`${completion * 6}`} height="16" rx="8" fill="#0084ff"/>
            <text x="500" y="65" fontSize="12" fill="white" textAnchor="middle">{completion}% Complete</text>
          </g>
          
          {/* Tools */}
          <rect x="830" y="45" width="350" height="30" rx="5" fill="#3d3d3d"/>
          
          <rect 
            x="840" y="50" width="65" height="20" rx="3" 
            fill={activeTool === 'select' ? "#0084ff" : "#333"}
            onClick={() => onToolSelect('select')}
            className="interactive"
          />
          <text 
            x="872" y="65" fontSize="12" 
            fill={activeTool === 'select' ? "white" : "#ccc"} 
            textAnchor="middle"
          >
            Select
          </text>
          
          <rect 
            x="915" y="50" width="65" height="20" rx="3" 
            fill={activeTool === 'cut' ? "#0084ff" : "#333"}
            onClick={() => onToolSelect('cut')}
            className="interactive"
          />
          <text 
            x="947" y="65" fontSize="12" 
            fill={activeTool === 'cut' ? "white" : "#ccc"} 
            textAnchor="middle"
          >
            Cut
          </text>
          
          <rect 
            x="990" y="50" width="65" height="20" rx="3" 
            fill={activeTool === 'split' ? "#0084ff" : "#333"}
            onClick={() => onToolSelect('split')}
            className="interactive"
          />
          <text 
            x="1022" y="65" fontSize="12" 
            fill={activeTool === 'split' ? "white" : "#ccc"} 
            textAnchor="middle"
          >
            Split
          </text>
          
          <rect 
            x="1065" y="50" width="65" height="20" rx="3" 
            fill={activeTool === 'merge' ? "#0084ff" : "#333"}
            onClick={() => onToolSelect('merge')}
            className="interactive"
          />
          <text 
            x="1097" y="65" fontSize="12" 
            fill={activeTool === 'merge' ? "white" : "#ccc"} 
            textAnchor="middle"
          >
            Merge
          </text>
        </g>
      );
    };
    
    // ========================
    // Component: TrackList
    // ========================
    const TrackList = ({ selectedTrack, onTrackSelect }) => {
      // Track data
      const tracks = [
        { id: 'user', name: 'User Input', description: 'Questions, prompts, commands' },
        { id: 'ai', name: 'AI Response', description: 'Generated content, answers' },
        { id: 'code', name: 'Code Blocks', description: 'Snippets, examples, scripts' },
        { id: 'attachments', name: 'Attachments', description: 'Files, images, data' }
      ];
      
      // Context collections data
      const collections = [
        { id: 'demographics', name: 'Customer Demographics' },
        { id: 'purchase', name: 'Purchase History' },
        { id: 'product', name: 'Product Features' },
        { id: 'churn', name: 'Churn Analysis', active: true },
        { id: 'new', name: '+ New Collection' }
      ];
      
      return (
        <g>
          <rect x="0" y="80" width="200" height="720" fill="#2a2a2a"/>
          
          {/* Track Headers */}
          <rect x="0" y="80" width="200" height="40" fill="#333"/>
          <text x="100" y="105" fontSize="14" fill="#e0e0e0" fontWeight="bold" textAnchor="middle">Tracks</text>
          
          {/* Track List */}
          {tracks.map((track, index) => (
            <g 
              key={track.id} 
              className="track interactive"
              onClick={() => onTrackSelect(track.id)}
            >
              <rect 
                x="5" 
                y={130 + index * 70} 
                width="190" 
                height="60" 
                rx="4" 
                fill="#3d3d3d"
              />
              <text 
                x="15" 
                y={150 + index * 70} 
                fontSize="14" 
                fill="#e0e0e0" 
                fontWeight="bold"
              >
                {track.name}
              </text>
              <text 
                x="15" 
                y={170 + index * 70} 
                fontSize="12" 
                fill="#aaa"
              >
                {track.description}
              </text>
              <rect 
                x="170" 
                y={140 + index * 70} 
                width="15" 
                height="15" 
                fill="#0084ff"
              />
              <text 
                x="177" 
                y={152 + index * 70} 
                fontSize="12" 
                fill="white" 
                textAnchor="middle"
              >
                V
              </text>
            </g>
          ))}
          
          {/* Lower Track List (Context Collections) */}
          <rect x="0" y="430" width="200" height="40" fill="#333"/>
          <text 
            x="100" 
            y="455" 
            fontSize="14" 
            fill="#e0e0e0" 
            fontWeight="bold" 
            textAnchor="middle"
          >
            Context Collections
          </text>
          
          {/* Collections */}
          {collections.map((collection, index) => (
            <rect 
              key={collection.id}
              x="5" 
              y={480 + index * 50} 
              width="190" 
              height="40" 
              rx="4" 
              fill={collection.active ? "#0066cc" : "#444"}
              className="interactive"
            />
          ))}
          
          {/* Collection Labels */}
          {collections.map((collection, index) => (
            <text 
              key={`text-${collection.id}`}
              x="15" 
              y={505 + index * 50} 
              fontSize="14" 
              fill="#e0e0e0"
            >
              {collection.name}
            </text>
          ))}
          
          {/* Keyboard shortcut legend */}
          <rect x="10" y="735" width="180" height="55" rx="4" fill="#333"/>
          <text x="20" y="750" fontSize="10" fill="#aaa">Shortcuts:</text>
          <text x="20" y="765" fontSize="10" fill="#aaa">Ctrl+S: Select Region</text>
          <text x="20" y="780" fontSize="10" fill="#aaa">Alt+C: Copy to Context</text>
          <text x="100" y="765" fontSize="10" fill="#aaa">Shift+→: Extend Select</text>
          <text x="100" y="780" fontSize="10" fill="#aaa">F2: Rename Selection</text>
        </g>
      );
    };
    
    // ========================
    // Component: TimeRuler
    // ========================
    const TimeRuler = () => {
      // Time marker positions and labels
      const timeMarkers = [
        { x: 300, label: '10:15' },
        { x: 400, label: '10:20' },
        { x: 500, label: '10:25' },
        { x: 600, label: '10:30' },
        { x: 700, label: '10:35' },
        { x: 800, label: '10:40' },
        { x: 900, label: '10:45' },
        { x: 1000, label: '10:50' },
        { x: 1100, label: '10:55' },
        { x: 1200, label: '11:00' }
      ];
      
      return (
        <g>
          <rect x="200" y="80" width="1000" height="30" fill="#333"/>
          
          {/* Main horizontal line */}
          <line x1="200" y1="95" x2="1200" y2="95" stroke="#555" strokeWidth="1"/>
          
          {/* Time markers */}
          {timeMarkers.map((marker, index) => (
            <g key={index}>
              <line 
                x1={marker.x} 
                y1="85" 
                x2={marker.x} 
                y2="105" 
                stroke="#555" 
                strokeWidth="1"
              />
              <text 
                x={marker.x} 
                y="75" 
                fontSize="10" 
                fill="#aaa" 
                textAnchor="middle"
              >
                {marker.label}
              </text>
            </g>
          ))}
        </g>
      );
    };
    
    // ========================
    // Component: ContentTracks
    // ========================
    const ContentTracks = ({ selectedClips, onClipSelect, position }) => {
      // Define clips for each track
      const userClips = [
        { id: 'initial-query', x: 220, width: 100, label: 'Initial Query' },
        { id: 'customer-patterns', x: 340, width: 140, label: 'Customer Patterns?' },
        { id: 'churn-indicators', x: 500, width: 160, label: 'Churn Indicators' },
        { id: 'follow-up', x: 680, width: 120, label: 'Follow-up' },
        { id: 'specific-questions', x: 820, width: 160, label: 'Specific Questions' }
      ];
      
      const aiClips = [
        { id: 'welcome-response', x: 220, width: 160, label: 'Welcome Response' },
        { id: 'pattern-analysis', x: 400, width: 220, label: 'Pattern Analysis' },
        { id: 'churn-analysis', x: 640, width: 260, label: 'Churn Analysis', hasSegments: true },
        { id: 'clarification', x: 920, width: 180, label: 'Clarification' }
      ];
      
      const codeClips = [
        { id: 'import-pandas', x: 400, width: 190, label: 'import pandas...', type: 'code' },
        { id: 'predict-churn', x: 640, width: 260, label: 'def predict_churn(data):', type: 'code' },
        { id: 'visualization', x: 920, width: 160, label: 'visualization.py', type: 'code' }
      ];
      
      const attachmentClips = [
        { id: 'csv-data', x: 350, width: 100, label: 'CSV Data', type: 'attachment' },
        { id: 'image-png', x: 620, width: 100, label: 'Image.png', type: 'attachment' },
        { id: 'chart-svg', x: 740, width: 100, label: 'Chart.svg', type: 'attachment' }
      ];
      
      // Timeline grid lines
      const gridLines = [300, 400, 500, 600, 700, 800, 900, 1000, 1100];
      
      return (
        <g>
          {/* Timeline Area */}
          <rect x="200" y="110" width="1000" height="420" fill="#1e1e1e"/>
          
          {/* Vertical Grid Lines */}
          {gridLines.map((x, index) => (
            <line 
              key={index}
              x1={x} 
              y1="110" 
              x2={x} 
              y2="530" 
              stroke="#333" 
              strokeWidth="1"
            />
          ))}
          
          {/* Current Position Marker */}
          <line 
            x1={position} 
            y1="80" 
            x2={position} 
            y2="530" 
            stroke="#0084ff" 
            strokeWidth="2"
            className="position-indicator"
          />
          <circle 
            cx={position} 
            cy="60" 
            r="8" 
            fill="#0084ff"
            className="position-indicator"
          />
          
          {/* Track Backgrounds */}
          <rect x="200" y="130" width="1000" height="60" fill="#2a2a2a"/> {/* User Input */}
          <rect x="200" y="200" width="1000" height="60" fill="#2a2a2a"/> {/* AI Response */}
          <rect x="200" y="270" width="1000" height="60" fill="#2a2a2a"/> {/* Code Blocks */}
          <rect x="200" y="340" width="1000" height="60" fill="#2a2a2a"/> {/* Attachments */}
          
          {/* User Clips */}
          {userClips.map((clip) => (
            <g 
              key={clip.id} 
              onClick={() => onClipSelect(clip.id)}
              className={`clip ${selectedClips.includes(clip.id) ? 'selected' : ''}`}
            >
              <rect 
                x={clip.x} 
                y="140" 
                width={clip.width} 
                height="40" 
                rx="4" 
                fill={selectedClips.includes(clip.id) ? '#0066cc' : '#333'} 
                stroke={selectedClips.includes(clip.id) ? '#0084ff' : '#555'} 
                strokeWidth={selectedClips.includes(clip.id) ? '2' : '1'}
              />
              <text 
                x={clip.x + clip.width/2} 
                y="165" 
                fontSize="12" 
                fill={selectedClips.includes(clip.id) ? 'white' : '#e0e0e0'} 
                textAnchor="middle"
              >
                {clip.label}
              </text>
            </g>
          ))}
          
          {/* AI Response Clips */}
          {aiClips.map((clip) => (
            <g 
              key={clip.id} 
              onClick={() => onClipSelect(clip.id)}
              className={`clip ${selectedClips.includes(clip.id) ? 'selected' : ''}`}
            >
              <rect 
                x={clip.x} 
                y="210" 
                width={clip.width} 
                height="40" 
                rx="4" 
                fill={selectedClips.includes(clip.id) ? '#0066cc' : '#444'} 
                stroke={selectedClips.includes(clip.id) ? '#0084ff' : '#666'} 
                strokeWidth={selectedClips.includes(clip.id) ? '2' : '1'}
              />
              <rect 
                x={clip.x} 
                y="210" 
                width={clip.width} 
                height="10" 
                fill={selectedClips.includes(clip.id) ? '#0077dd' : '#555'}
              />
              
              {/* For churn analysis clip, add segments */}
              {clip.id === 'churn-analysis' && (
                <>
                  <line x1="700" y1="210" x2="700" y2="250" stroke="#0099ff" strokeWidth="1"/>
                  <line x1="760" y1="210" x2="760" y2="250" stroke="#0099ff" strokeWidth="1"/>
                  <line x1="820" y1="210" x2="820" y2="250" stroke="#0099ff" strokeWidth="1"/>
                  
                  <text x="670" y="235" fontSize="11" fill="white">Introduction</text>
                  <text x="720" y="235" fontSize="11" fill="white">Key Factors</text>
                  <text x="780" y="235" fontSize="11" fill="white">Recommendations</text>
                </>
              )}
              
              {!clip.hasSegments && (
                <text 
                  x={clip.x + clip.width/2} 
                  y="235" 
                  fontSize="12" 
                  fill={selectedClips.includes(clip.id) ? 'white' : '#e0e0e0'} 
                  textAnchor="middle"
                >
                  {clip.label}
                </text>
              )}
            </g>
          ))}
          
          {/* Code Clips */}
          {codeClips.map((clip) => (
            <g 
              key={clip.id} 
              onClick={() => onClipSelect(clip.id)}
              className={`clip ${selectedClips.includes(clip.id) ? 'selected' : ''}`}
            >
              <rect 
                x={clip.x} 
                y="280" 
                width={clip.width} 
                height="40" 
                rx="4" 
                fill={selectedClips.includes(clip.id) ? '#0066cc' : '#2d4a22'} 
                stroke={selectedClips.includes(clip.id) ? '#0084ff' : '#3a6130'} 
                strokeWidth={selectedClips.includes(clip.id) ? '2' : '1'}
              />
              <text 
                x={clip.x + 30} 
                y="305" 
                fontSize="12" 
                fontFamily="Consolas, monospace" 
                fill={selectedClips.includes(clip.id) ? 'white' : '#a5d6a7'}
              >
                {clip.label}
              </text>
            </g>
          ))}
          
          {/* Attachment Clips */}
          {attachmentClips.map((clip) => (
            <g 
              key={clip.id} 
              onClick={() => onClipSelect(clip.id)}
              className={`clip ${selectedClips.includes(clip.id) ? 'selected' : ''}`}
            >
              <rect 
                x={clip.x} 
                y="350" 
                width={clip.width} 
                height="40" 
                rx="4" 
                fill={selectedClips.includes(clip.id) ? '#0066cc' : '#4a3c29'} 
                stroke={selectedClips.includes(clip.id) ? '#0084ff' : '#5d4d35'} 
                strokeWidth={selectedClips.includes(clip.id) ? '2' : '1'}
              />
              <text 
                x={clip.x + clip.width/2} 
                y="375" 
                fontSize="12" 
                fill={selectedClips.includes(clip.id) ? 'white' : '#e0e0e0'} 
                textAnchor="middle"
              >
                {clip.label}
              </text>
            </g>
          ))}
        </g>
      );
    };
    
    // ========================
    // Component: ContextComposition
    // ========================
    const ContextComposition = ({ activeView, onViewSelect, tokenUsage, selectedClips }) => {
      // Define selected context regions
      const contextRegions = [
        { id: 'demographics', x: 240, y: 610, width: 160, height: 30, label: 'Customer Demographics' },
        { id: 'purchase', x: 410, y: 610, width: 180, height: 30, label: 'Purchase History (75%)' },
        { id: 'churn-analysis', x: 240, y: 650, width: 350, height: 40, label: 'Churn Analysis Response', hasSegments: true },
        { id: 'code', x: 240, y: 700, width: 200, height: 30, label: 'Prediction Code' },
        { id: 'chart', x: 450, y: 700, width: 140, height: 30, label: 'Chart.svg' }
      ];
      
      // Token distribution data
      const tokenBars = [
        { id: 'demographics', x: 650, width: 40, height: 30, label: 'Demographics' },
        { id: 'purchase', x: 740, width: 40, height: 50, label: 'Purchase History' },
        { id: 'churn', x: 830, width: 40, height: 90, label: 'Churn Analysis' },
        { id: 'code', x: 920, width: 40, height: 40, label: 'Code' },
        { id: 'attachments', x: 1010, width: 40, height: 20, label: 'Attachments' },
        { id: 'available', x: 1100, width: 40, height: 110, label: 'Available', color: '#333' }
      ];
      
      return (
        <g>
          <rect x="200" y="530" width="1000" height="270" fill="#242424"/>
          
          {/* Context Builder Header */}
          <rect x="200" y="530" width="1000" height="40" fill="#333"/>
          <text x="220" y="555" fontSize="14" fill="#e0e0e0" fontWeight="bold">Context Composition</text>
          <text x="1150" y="555" fontSize="14" fill="#0084ff" textAnchor="end">
            {tokenUsage.current.toLocaleString()} / {tokenUsage.max.toLocaleString()} tokens
          </text>
          
          {/* View Tabs */}
          <rect 
            x="400" y="535" width="80" height="30" rx="4" 
            fill={activeView === 'timeline' ? '#0066cc' : '#333'}
            onClick={() => onViewSelect('timeline')}
            className="interactive"
          />
          <text 
            x="440" y="555" fontSize="12" 
            fill={activeView === 'timeline' ? 'white' : '#aaa'} 
            textAnchor="middle"
          >
            Timeline
          </text>
          
          <rect 
            x="490" y="535" width="80" height="30" rx="4" 
            fill={activeView === 'graph' ? '#0066cc' : '#333'}
            onClick={() => onViewSelect('graph')}
            className="interactive"
          />
          <text 
            x="530" y="555" fontSize="12" 
            fill={activeView === 'graph' ? 'white' : '#aaa'} 
            textAnchor="middle"
          >
            Graph
          </text>
          
          <rect 
            x="580" y="535" width="80" height="30" rx="4" 
            fill={activeView === 'blocks' ? '#0066cc' : '#333'}
            onClick={() => onViewSelect('blocks')}
            className="interactive"
          />
          <text 
            x="620" y="555" fontSize="12" 
            fill={activeView === 'blocks' ? 'white' : '#aaa'} 
            textAnchor="middle"
          >
            Blocks
          </text>
          
          {/* Context Timeline View */}
          <rect x="220" y="590" width="960" height="190" rx="4" fill="#1e1e1e"/>
          
          {/* Context Regions */}
          {contextRegions.map((region) => (
            <g key={region.id}>
              <rect 
                x={region.x} 
                y={region.y} 
                width={region.width} 
                height={region.height} 
                rx="4" 
                fill="#0066cc"
                className="interactive"
              />
              
              {region.hasSegments && (
                <>
                  <rect x="330" y="650" width="2" height="40" fill="white"/>
                  <rect x="390" y="650" width="2" height="40" fill="white"/>
                  <rect x="450" y="650" width="2" height="40" fill="white"/>
                  <rect x="510" y="650" width="2" height="40" fill="white"/>
                  
                  {/* Selected segment */}
                  <rect x="390" y="650" width="60" height="40" rx="0" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1"/>
                  <text x="420" y="690" fontSize="10" fill="white" textAnchor="middle">Segment 3</text>
                </>
              )}
              
              <text 
                x={region.x + (region.width / 2)} 
                y={region.y + (region.height / 2) + 5} 
                fontSize="12" 
                fill="white" 
                textAnchor="middle"
              >
                {region.label}
              </text>
            </g>
          ))}
          
          {/* Token Distribution Graph */}
          <rect x="620" y="605" width="540" height="165" rx="4" fill="#242424"/>
          <text x="640" y="625" fontSize="12" fill="#e0e0e0">Token Distribution</text>
          
          {/* Bar Chart Area */}
          <rect x="640" y="635" width="500" height="125" fill="#1e1e1e" rx="2"/>
          
          {/* X-Axis Labels */}
          {tokenBars.map((bar) => (
            <text 
              key={`label-${bar.id}`}
              x={bar.x + 20} 
              y="775" 
              fontSize="10" 
              fill="#aaa"
            >
              {bar.label}
            </text>
          ))}
          
          {/* Data Bars */}
          {tokenBars.map((bar) => (
            <rect 
              key={`bar-${bar.id}`}
              x={bar.x} 
              y={760 - bar.height} 
              width={bar.width} 
              height={bar.height} 
              fill={bar.color || '#0066cc'}
              className="interactive"
            />
          ))}
        </g>
      );
    };
    
    // ========================
    // Component: SelectionInfoPanel
    // ========================
    const SelectionInfoPanel = () => {
      return (
        <g>
          <rect x="1000" y="110" width="200" height="190" rx="5" fill="#2d2d2d" opacity="0.9"/>
          <text x="1020" y="130" fontSize="12" fill="#e0e0e0" fontWeight="bold">Selection Info</text>
          
          <text x="1020" y="155" fontSize="11" fill="#aaa">Content:</text>
          <text x="1020" y="170" fontSize="11" fill="#e0e0e0">Churn prediction code</text>
          
          <text x="1020" y="195" fontSize="11" fill="#aaa">Type:</text>
          <text x="1020" y="210" fontSize="11" fill="#e0e0e0">Python code</text>
          
          <text x="1020" y="235" fontSize="11" fill="#aaa">Tokens:</text>
          <text x="1020" y="250" fontSize="11" fill="#e0e0e0">325 tokens</text>
          
          <text x="1020" y="275" fontSize="11" fill="#aaa">Actions:</text>
          <rect x="1070" y="265" width="60" height="20" rx="3" fill="#0084ff" className="interactive"/>
          <text x="1100" y="280" fontSize="10" fill="white" textAnchor="middle">Add</text>
          
          <rect x="1135" y="265" width="60" height="20" rx="3" fill="#444" className="interactive"/>
          <text x="1165" y="280" fontSize="10" fill="#e0e0e0" textAnchor="middle">Skip</text>
        </g>
      );
    };
    
    // Render the application
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>