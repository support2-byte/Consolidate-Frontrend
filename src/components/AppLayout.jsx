import { useEffect, useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { keyframes } from "@mui/system";
import { alpha } from "@mui/material/styles";
import {
  LocalShippingOutlined,
  Inventory2Outlined,
  InsightsOutlined,
} from "@mui/icons-material";
import logo from "../assets/logo.png";

const HIGHLIGHTS = [
  {
    icon: <LocalShippingOutlined />,
    title: "Shipments and containers",
    text: "Track every consignment from booking to delivery.",
  },
  {
    icon: <Inventory2Outlined />,
    title: "Orders and documents",
    text: "Manage orders, invoices and shipping documents in one place.",
  },
  {
    icon: <InsightsOutlined />,
    title: "One platform, every brand",
    text: "RGSL, Messiah Freight and Cargo Aviation System.",
  },
];

const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

const SLIDES = [
  { src: px(20821680), caption: "Global ocean freight" },
  { src: px(1427541), caption: "Containers, stacked and tracked" },
  { src: px(38726116), caption: "Port operations, every day" },
  { src: px(4103156), caption: "Fleets moving world trade" },
  { src: px(29822715), caption: "Loading cargo, on schedule" },
];

const SLIDE_INTERVAL_MS = 6000;

const kenBurns = keyframes`
  from { transform: scale(1); }
  to   { transform: scale(1.12); }
`;

function Slideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    SLIDES.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      SLIDE_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {SLIDES.map((slide, i) => (
        <Box
          key={slide.src}
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${slide.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === active ? 1 : 0,
            transition: "opacity 1.4s ease-in-out",
            animation:
              i === active
                ? `${kenBurns} ${SLIDE_INTERVAL_MS + 1500}ms ease-out forwards`
                : "none",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />
      ))}

      <Box
        sx={{
          position: "absolute",
          left: { md: 40, lg: 56 },
          bottom: { md: 28, lg: 36 },
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {SLIDES.map((slide, i) => (
          <Box
            key={slide.src}
            component="button"
            type="button"
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setActive(i)}
            sx={{
              p: 0,
              border: 0,
              cursor: "pointer",
              height: 6,
              width: i === active ? 28 : 8,
              borderRadius: 3,
              bgcolor: i === active ? "#fff" : "rgba(255,255,255,0.45)",
              transition: "all .35s ease",
            }}
          />
        ))}
        <Typography
          variant="caption"
          sx={{ ml: 1.5, color: "rgba(255,255,255,0.9)" }}
        >
          {SLIDES[active].caption}
        </Typography>
      </Box>
    </>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(380px, 5fr) 7fr" },
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 5, lg: 7 },
          color: "primary.contrastText",
          position: "relative",
          overflow: "hidden",
          bgcolor: "primary.dark",
        }}
      >
        <Slideshow />

        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: (theme) =>
              `linear-gradient(160deg, ${alpha("#0000", 0.25)} 0%, ${alpha("#0000", 0.45)} 100%)`,
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ height: { md: 60, lg: 80 }, display: "block" }}
          />
          <Typography sx={{ mt: 3, opacity: 0.8, maxWidth: 380 }}>
            The admin workspace for shipping and logistics operations.
          </Typography>
        </Box>

        <Stack spacing={3.5} sx={{ position: "relative", zIndex: 1 }}>
          {HIGHLIGHTS.map((item) => (
            <Stack
              key={item.title}
              direction="row"
              spacing={2}
              alignItems="flex-start"
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  bgcolor: "rgba(255,255,255,0.14)",
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography fontWeight={600}>{item.title}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {item.text}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>

        <Typography
          variant="caption"
          sx={{ opacity: 0.7, position: "relative", zIndex: 1, mb: 4 }}
        >
          © {new Date().getFullYear()} Royal Gulf Shipping & Logistics
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          <Typography
            variant="h3"
            fontWeight={700}
            color="primary.main"
            letterSpacing={-0.5}
            sx={{ mb: 2 }}
          >
            Consolidate
          </Typography>

          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: 26, sm: 32 } }}
          >
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            {subtitle}
          </Typography>

          {children}

          {footer && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 4, display: "block" }}
            >
              {footer}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
