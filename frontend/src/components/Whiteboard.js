import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import Controls from '../WhiteboardComponents/Controls';

const socket = io('https://paletteconnect.onrender.com');

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const { roomId } = useParams();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [textItems, setTextItems] = useState([]); // Store text items
  const [brushWidth, setBrushWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(10);
  const [isErasing, setIsErasing] = useState(false);
  const [startCoords, setStartCoords] = useState(null); // For shape drawing
  const [showBrushWidth, setShowBrushWidth] = useState(false);
  const [isTextToolActive, setIsTextToolActive] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textSize, setTextSize] = useState(16);
  const [fontStyle, setFontStyle] = useState('Arial');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    socket.emit('joinRoom', roomId);
    socket.on('loadDrawing', (drawings) => drawings.forEach((draw) => drawLine(ctx, draw.prevX, draw.prevY, draw.offsetX, draw.offsetY, draw.color, draw.brushWidth)));
    socket.on('drawing', ({ offsetX, offsetY, prevX, prevY, color, brushWidth }) =>
      drawLine(ctx, prevX, prevY, offsetX, offsetY, color, brushWidth)
    );
    socket.on('addText', (textData) => {
      const { text, x, y, font, color } = textData;
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    });
    socket.on('clearBoard', () => clearCanvas(ctx));
    return () => {
      socket.off('loadDrawing');
      socket.off('drawing');
      socket.off('addText');
      socket.off('clearBoard');
    };
  }, [roomId]);

  const startDrawing = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    ctx.prevPos = { offsetX, offsetY };
    setStartCoords({ x: offsetX, y: offsetY });
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current.getContext('2d');
    ctx.prevPos = null;
    setStartCoords(null); // Reset start coordinates
  };

  const drawLine = (ctx, x1, y1, x2, y2, color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const clearCanvas = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const clearBoard = () => {
    const ctx = canvasRef.current.getContext('2d');
    clearCanvas(ctx); // Clear the local canvas
    socket.emit('clearBoard', roomId); // Emit event to the server
  };

  const addText = (event) => {
    if (!isTextToolActive || !currentText.trim()) return;
  
    const canvas = canvasRef.current; // Access the canvas via the reference
    const ctx = canvas.getContext('2d'); // Get the 2D context of the canvas
    const { offsetX, offsetY } = event.nativeEvent;
  
    ctx.font = `${textSize}px ${fontStyle}`;
    ctx.fillStyle = color;
    ctx.fillText(currentText, offsetX, offsetY);
  
    // Save the text's details
    const newText = {
      text: currentText,
      x: offsetX,
      y: offsetY,
      font: `${textSize}px ${fontStyle}`,
      width: ctx.measureText(currentText).width,
      height: textSize,
    };
  
    setTextItems((prev) => [...prev, newText]);
    setCurrentText('');
    socket.emit('addText', { roomId, ...newText });
  };
  

  const draw = (event) => {
    const ctx = canvasRef.current.getContext('2d');
    if (!isDrawing) return;

    const { offsetX, offsetY } = event.nativeEvent;
    const prevPos = ctx.prevPos;

    if (prevPos) {
      const width = isErasing ? eraserWidth : brushWidth;
      const colorToUse = isErasing ? '#FFFFFF' : color;
      drawLine(ctx, prevPos.offsetX, prevPos.offsetY, offsetX, offsetY, colorToUse, width);
      ctx.prevPos = { offsetX, offsetY };

      socket.emit('drawing', {
        roomId,
        offsetX,
        offsetY,
        prevX: prevPos.offsetX,
        prevY: prevPos.offsetY,
        color: colorToUse,
        brushWidth: width,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 relative">
    <Controls
      color={color}
      setColor={setColor}
      showPicker={showPicker}
      setShowPicker={setShowPicker}
      brushWidth={brushWidth}
      setBrushWidth={setBrushWidth}
      showBrushWidth={showBrushWidth}
      setShowBrushWidth={setShowBrushWidth}
      isErasing={isErasing}
      setIsErasing={setIsErasing}
      eraserWidth={eraserWidth}
      setEraserWidth={setEraserWidth}
      isTextToolActive={isTextToolActive}
      setIsTextToolActive={setIsTextToolActive}
      currentText={currentText}
      setCurrentText={setCurrentText}
      textSize={textSize}
      setTextSize={setTextSize}
      fontStyle={fontStyle}
      setFontStyle={setFontStyle}
      clearBoard={clearBoard}
    />


      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={isTextToolActive ? addText : startDrawing}
        onMouseUp={isTextToolActive ? null : finishDrawing}
        onMouseMove={isTextToolActive ? null : draw}
        className="border border-gray-300"
      >
        {textItems.map((text, index) => (
          <text
            key={index}
            x={text.x}
            y={text.y}
            font={text.font}
            fill="black"
          >
            {text.text}
          </text>
        ))}
      </canvas>
    </div>
  );
};

export default Whiteboard;
