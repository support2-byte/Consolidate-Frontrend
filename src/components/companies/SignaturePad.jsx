import { useRef, useState, useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

export default function SignaturePad({ onChange, existingUrl }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const [empty, setEmpty] = useState(true);

  const getCtx = () => canvasRef.current.getContext("2d");

  useEffect(() => {
    const ctx = getCtx();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (point.clientX - rect.left) * scaleX,
      y: (point.clientY - rect.top) * scaleY,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    hasDrawn.current = true;
    const { x, y } = getPos(e);
    const ctx = getCtx();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = getCtx();
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setEmpty(false);
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    getCtx().clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    setEmpty(true);
    onChange(null);
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Signature
      </Typography>
      <Box
        sx={{
          position: "relative",
          border: "1px solid rgba(0,0,0,0.23)",
          borderRadius: 1,
        }}
      >
        {empty && existingUrl && (
          <Box
            component="img"
            src={existingUrl}
            alt="Current signature"
            sx={{
              position: "absolute",
              inset: 0,
              m: "auto",
              maxHeight: "70%",
              maxWidth: "70%",
              opacity: 0.5,
            }}
          />
        )}
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          style={{
            width: "100%",
            height: 150,
            touchAction: "none",
            cursor: "crosshair",
          }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 0.5 }}
      >
        <Typography variant="caption" color="text.secondary">
          {existingUrl && empty
            ? "Draw to replace the saved signature"
            : "Draw signature above"}
        </Typography>
        <Button size="small" onClick={clear} disabled={empty}>
          Clear
        </Button>
      </Stack>
    </Box>
  );
}
