import React from 'react';
import ColorPicker from './ColorPicker';
import BrushWidth from './BrushWidth';
import Eraser from './Eraser';
import TextTool from './TextTool';
import { FaTrash } from 'react-icons/fa';

const Controls = ({ 
  color, setColor, 
  showPicker, setShowPicker, 
  brushWidth, setBrushWidth, 
  showBrushWidth, setShowBrushWidth, 
  isErasing, setIsErasing, 
  eraserWidth, setEraserWidth, 
  isTextToolActive, setIsTextToolActive, 
  currentText, setCurrentText, 
  textSize, setTextSize, 
  fontStyle, setFontStyle, 
  clearBoard 
}) => {
  return (
    <div className="absolute left-4 top-16 p-4 bg-white shadow-lg rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Room Controls</h3>

      <ColorPicker
        color={color}
        setColor={setColor}
        showPicker={showPicker}
        setShowPicker={setShowPicker}
        />

      <BrushWidth brushWidth={brushWidth} setBrushWidth={setBrushWidth} showBrushWidth={showBrushWidth} setShowBrushWidth={setShowBrushWidth} />
      <Eraser isErasing={isErasing} setIsErasing={setIsErasing} eraserWidth={eraserWidth} setEraserWidth={setEraserWidth} />
      <TextTool 
        isTextToolActive={isTextToolActive} 
        setIsTextToolActive={setIsTextToolActive} 
        currentText={currentText} 
        setCurrentText={setCurrentText} 
        textSize={textSize} 
        setTextSize={setTextSize} 
        fontStyle={fontStyle} 
        setFontStyle={setFontStyle} 
      />

      <FaTrash
        className="text-3xl text-red-500 cursor-pointer hover:scale-110 transition"
        onClick={clearBoard}
      />
    </div>
  );
};

export default Controls;
