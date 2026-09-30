import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Printer, Menu, ImagePlus, Trash2, Save, FolderOpen } from 'lucide-react';

interface Shot {
  id: string;
  image: string | null;
  shotType: string;
  durationMin: string;
  durationSec: string;
  content: string;
  sound: string;
  notes: string;
}

const shotTypeOptions = [
  { group: "靜態景別", options: [
    { value: "ELS", label: "大遠景 (ELS)" },
    { value: "LS", label: "遠景 (LS)" },
    { value: "FS", label: "全景 (FS)" },
    { value: "MLS", label: "中遠景 (MLS)" },
    { value: "MS", label: "中景 (MS)" },
    { value: "MCU", label: "中特寫 (MCU)" },
    { value: "CU", label: "特寫 (CU)" },
    { value: "ECU", label: "大特寫 (ECU)" }
  ]},
  { group: "動態景別/運鏡", options: [
    { value: "Pan", label: "橫搖 (Pan)" },
    { value: "Tilt", label: "直搖 (Tilt)" },
    { value: "Dolly", label: "推軌 (Dolly)" },
    { value: "Truck", label: "平移 (Truck)" },
    { value: "Pedestal", label: "升降 (Pedestal)" },
    { value: "Crane", label: "搖臂 (Crane)" },
    { value: "Steadicam", label: "跟鏡 (Steadicam)" },
    { value: "Arc", label: "環繞 (Arc Shot)" },
    { value: "Handheld", label: "手持 (Handheld)" },
    { value: "Zoom", label: "變焦 (Zoom)" },
    { value: "DollyZoom", label: "滑動變焦 (Dolly Zoom)" }
  ]},
  { group: "攝影角度", options: [
    { value: "EyeLevel", label: "平視角 (Eye Level)" },
    { value: "HighAngle", label: "俯角 (High Angle)" },
    { value: "LowAngle", label: "仰角 (Low Angle)" },
    { value: "TopShot", label: "鳥瞰角 (Top Shot)" },
    { value: "DutchAngle", label: "傾斜角 (Dutch Angle)" }
  ]}
];

function App() {
  const [title, setTitle] = useState("未命名電影");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    size: 'A4',
    orientation: 'landscape',
    color: 'color'
  });
  const [shots, setShots] = useState<Shot[]>([{
    id: "shot-1",
    image: null,
    shotType: "MS",
    durationMin: "0",
    durationSec: "00",
    content: "",
    sound: "",
    notes: ""
  }]);

  const addShot = () => {
    setShots([...shots, {
      id: `shot-${Date.now()}`,
      image: null,
      shotType: "MS",
      durationMin: "0",
      durationSec: "00",
      content: "",
      sound: "",
      notes: ""
    }]);
  };

  const removeShot = (id: string) => {
    setShots(shots.filter(s => s.id !== id));
  };

  const updateShot = (id: string, field: keyof Shot, value: string) => {
    setShots(shots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateShot(id, 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newShots = Array.from(shots);
    const [reorderedItem] = newShots.splice(result.source.index, 1);
    newShots.splice(result.destination.index, 0, reorderedItem);
    setShots(newShots);
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const executePrint = () => {
    const styleId = 'dynamic-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
      @page {
        size: ${printSettings.size} ${printSettings.orientation};
        margin: 10mm;
      }
      @media print {
        body {
          filter: ${printSettings.color === 'bw' ? 'grayscale(100%)' : 'none'};
        }
      }
    `;

    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSave = () => {
    const data = { title, shots };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || '未命名'}.sf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (data.shots && Array.isArray(data.shots)) {
          setShots(data.shots);
          if (data.title) setTitle(data.title);
        } else {
          alert('檔案格式不正確！無法辨識這份分鏡表。');
        }
      } catch (error) {
        alert('讀取檔案失敗！');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset for consecutive imports
  };

  return (
    <div className="window-layout">
      <div className="window-top-bar">
        StoryFlow - 專業影視分鏡
      </div>
      
      <div className="window-content">
        <div className="app-container">
          <div className="header glass-panel">
            <input 
              type="text" 
              className="title-input" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="輸入電影名稱..."
            />
            <div className="actions">
              <button className="btn btn-primary" onClick={addShot}>
                <Plus size={20} /> 新增鏡頭
              </button>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <FolderOpen size={20} /> 匯入 (.sf)
                <input type="file" accept=".sf" style={{ display: 'none' }} onChange={handleImport} />
              </label>
              <button className="btn btn-secondary" onClick={handleSave}>
                <Save size={20} /> 儲存 (.sf)
              </button>
              <button className="btn btn-secondary" onClick={handlePrint}>
                <Printer size={20} /> 列印 (A4/A3)
              </button>
            </div>
          </div>

          <div className="table-header">
            <div>排序</div>
            <div>鏡號</div>
            <div>畫面</div>
            <div>景別</div>
            <div>時長 (分:秒)</div>
            <div>內容</div>
            <div>聲音</div>
            <div>備註</div>
            <div></div>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="shots">
              {(provided) => (
                <div className="storyboard-table" {...provided.droppableProps} ref={provided.innerRef}>
                  {shots.map((shot, index) => (
                    <Draggable key={shot.id} draggableId={shot.id} index={index}>
                      {(provided) => (
                        <div 
                          className="table-row"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div className="drag-handle" {...provided.dragHandleProps}>
                            <Menu size={24} />
                          </div>
                          
                          <div className="shot-number">{index + 1}</div>
                          
                          <div>
                            <label className="image-cell">
                              {shot.image ? (
                                <img src={shot.image} alt="Shot" />
                              ) : (
                                <ImagePlus size={32} color="#ff7e33" />
                              )}
                              <input 
                                type="file" 
                                className="image-upload" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(shot.id, e)}
                              />
                            </label>
                          </div>

                          <div>
                            <select 
                              className="select-input"
                              value={shot.shotType}
                              onChange={(e) => updateShot(shot.id, 'shotType', e.target.value)}
                            >
                              {shotTypeOptions.map(group => (
                                <optgroup label={group.group} key={group.group}>
                                  {group.options.map(opt => (
                                    <option value={opt.value} key={opt.value}>{opt.label}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          <div className="duration-input">
                            <input 
                              type="text" 
                              value={shot.durationMin}
                              onChange={(e) => updateShot(shot.id, 'durationMin', e.target.value.replace(/[^0-9]/g, ''))}
                              maxLength={2}
                            /> : 
                            <input 
                              type="text" 
                              value={shot.durationSec}
                              onChange={(e) => updateShot(shot.id, 'durationSec', e.target.value.replace(/[^0-9]/g, ''))}
                              maxLength={2}
                            />
                          </div>

                          <div>
                            <textarea 
                              className="text-input" 
                              value={shot.content}
                              onChange={(e) => updateShot(shot.id, 'content', e.target.value)}
                              placeholder="輸入畫面內容..."
                            />
                          </div>

                          <div>
                            <textarea 
                              className="text-input" 
                              value={shot.sound}
                              onChange={(e) => updateShot(shot.id, 'sound', e.target.value)}
                              placeholder="對白、音效、音樂..."
                            />
                          </div>

                          <div>
                            <textarea 
                              className="text-input" 
                              value={shot.notes}
                              onChange={(e) => updateShot(shot.id, 'notes', e.target.value)}
                              placeholder="特效、道具等備註..."
                            />
                          </div>

                          <div>
                            <button className="delete-btn" onClick={() => removeShot(shot.id)}>
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
      
      <div className="window-bottom-bar">
        蘇廷融製作，2026
      </div>

      {showPrintModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>列印設定</h3>
            
            <div className="print-warning">
              ⚠️ 電腦系統列印時，請手動將方向改為「橫向」
            </div>
            
            <div className="form-group">
              <label>紙張大小</label>
              <select 
                value={printSettings.size} 
                onChange={e => setPrintSettings({...printSettings, size: e.target.value})}
                className="select-input"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
              </select>
            </div>



            <div className="form-group">
              <label>色彩</label>
              <select 
                value={printSettings.color} 
                onChange={e => setPrintSettings({...printSettings, color: e.target.value})}
                className="select-input"
              >
                <option value="color">彩色</option>
                <option value="bw">黑白</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={executePrint}>確認列印</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
