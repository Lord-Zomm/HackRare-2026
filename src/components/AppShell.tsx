import type { PropsWithChildren } from "react";
import { AppBar, Box, Container, Toolbar, Typography, Button } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

export function AppShell({ children }: PropsWithChildren) {
  const loc = useLocation();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "white", borderBottom: "1px solid #eee" }}>
        <Toolbar sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
          <Typography variant="h6" sx={{ color: "#202124", fontWeight: 600, flexGrow: 1 }}>
            Genomic Diagnostic Copilot
          </Typography>

          <Button
            component={RouterLink}
            to="/"
            variant={loc.pathname === "/" ? "contained" : "text"}
            sx={{ textTransform: "none" }}
            >
            Case
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3, maxWidth: "1100px !important" }}>{children}</Container>

      <Box sx={{ py: 3, textAlign: "center", color: "#5f6368", fontSize: 12 }}>
        HackRare 2026
      </Box>
    </Box>
  );
}